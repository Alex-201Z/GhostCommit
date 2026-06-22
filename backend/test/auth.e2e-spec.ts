import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHash } from 'crypto';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { GithubOAuthClient, GithubProfile } from '../src/auth/github-oauth.client';
import { PrismaService } from '../src/prisma/prisma.service';

const databaseTestsEnabled = process.env.RUN_DATABASE_TESTS === 'true';

if (process.env.CI === 'true' && !databaseTestsEnabled) {
  throw new Error(
    'RUN_DATABASE_TESTS=true is required in CI; PostgreSQL tests must not be skipped',
  );
}

const databaseDescribe = databaseTestsEnabled ? describe : describe.skip;
const cookieHeaders = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
const cookieValue = (value: string | string[] | undefined) =>
  cookieHeaders(value)
    .find((header) => header.startsWith('ghostcommit_refresh='))
    ?.split(';')[0];

databaseDescribe('Phase 1A authentication (PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let profile: GithubProfile;

  const github = {
    authorizationUrl: (state: string) =>
      `https://github.test/authorize?state=${encodeURIComponent(state)}`,
    exchange: async () => profile,
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'integration-test-secret-with-sufficient-entropy';
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GithubOAuthClient)
      .useValue(github)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.authSession.deleteMany();
    await prisma.oAuthState.deleteMany();
    await prisma.privacyConsent.deleteMany();
    await prisma.onboardingStatus.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();
    profile = { githubId: 'github-a', email: 'a@example.test', username: 'alice', name: 'Alice' };
  });

  afterAll(async () => {
    await app.close();
  });

  async function login() {
    const start = await request(app.getHttpServer()).post('/api/v1/auth/github/start').expect(200);
    const state = new URL(start.body.authorizationUrl).searchParams.get('state') as string;
    const callback = await request(app.getHttpServer())
      .get('/api/v1/auth/github/callback')
      .query({ code: 'single-use-code', state })
      .expect(302);
    expect(callback.headers.location).not.toMatch(/token|code|state/i);
    return cookieValue(callback.headers['set-cookie']);
  }

  it('rejects invalid and reused OAuth state without echoing secrets', async () => {
    const secretState = 'attacker-controlled-state';
    const invalid = await request(app.getHttpServer())
      .get('/api/v1/auth/github/callback')
      .query({ code: 'secret-code', state: secretState })
      .expect(401);
    expect(JSON.stringify(invalid.body)).not.toContain(secretState);
    expect(JSON.stringify(invalid.body)).not.toContain('secret-code');
    const expiredState = 'expired-oauth-state';
    await prisma.oAuthState.create({
      data: {
        stateHash: createHash('sha256').update(expiredState).digest('hex'),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    await request(app.getHttpServer())
      .get('/api/v1/auth/github/callback')
      .query({ code: 'expired-code', state: expiredState })
      .expect(401);

    const start = await request(app.getHttpServer()).post('/api/v1/auth/github/start').expect(200);
    const state = new URL(start.body.authorizationUrl).searchParams.get('state') as string;
    await request(app.getHttpServer())
      .get('/api/v1/auth/github/callback')
      .query({ code: 'first', state })
      .expect(302);
    await request(app.getHttpServer())
      .get('/api/v1/auth/github/callback')
      .query({ code: 'second', state })
      .expect(401);
  });
  it('creates one user and one personal workspace, then reconnects idempotently', async () => {
    await login();
    await login();
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.team.count()).toBe(1);
    expect(await prisma.teamMember.count()).toBe(1);
    const session = await prisma.authSession.findFirstOrThrow();
    expect(session.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(session)).not.toContain('ghostcommit_refresh=');
  });

  it('rotates refresh tokens, rejects the old token and revokes the family on replay', async () => {
    const first = await login();
    const rotated = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', first as string)
      .expect(200);
    const second = cookieValue(rotated.headers['set-cookie']);
    expect(rotated.body.accessToken).toBeTruthy();
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', first as string)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', second as string)
      .expect(401);
  });

  it('records versioned consent for the authenticated owner without activating collection', async () => {
    const refreshCookie = await login();
    const auth = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie as string)
      .expect(200);
    const bearer = `Bearer ${auth.body.accessToken}`;
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    await request(app.getHttpServer()).get('/api/v1/onboarding/status').expect(401);
    await request(app.getHttpServer())
      .patch('/api/v1/onboarding/status')
      .set('Authorization', bearer)
      .send({
        privacyPolicyAccepted: true,
        hasReadCollectionNotice: true,
        understandsDataControl: true,
        policyVersion: '2026-06-22',
        source: 'ONBOARDING',
      })
      .expect(200);
    const consent = await prisma.privacyConsent.findFirstOrThrow();
    expect(consent.acceptedAt.toISOString()).toMatch(/Z$/);
    expect(consent.source).toBe('ONBOARDING');
    expect(await prisma.activitySession.count()).toBe(0);
    const first = await request(app.getHttpServer())
      .post('/api/v1/workspaces/personal')
      .set('Authorization', bearer)
      .expect(200);
    const second = await request(app.getHttpServer())
      .post('/api/v1/workspaces/personal')
      .set('Authorization', bearer)
      .expect(200);
    expect(first.body.id).toBe(second.body.id);
  });

  it('prevents user A from targeting user B through strict DTO validation', async () => {
    const cookieA = await login();
    const authA = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieA as string)
      .expect(200);
    profile = { githubId: 'github-b', email: 'b@example.test', username: 'bob', name: 'Bob' };
    await login();
    const userB = await prisma.user.findUniqueOrThrow({ where: { email: 'b@example.test' } });
    await request(app.getHttpServer())
      .patch('/api/v1/onboarding/status')
      .set('Authorization', `Bearer ${authA.body.accessToken}`)
      .send({
        userId: userB.id,
        privacyPolicyAccepted: true,
        hasReadCollectionNotice: true,
        understandsDataControl: true,
        policyVersion: '2026-06-22',
        source: 'API',
      })
      .expect(400);
    expect(await prisma.privacyConsent.count({ where: { userId: userB.id } })).toBe(0);
  });

  it('revokes logout sessions, clears the cookie and never echoes secret input in errors', async () => {
    const first = await login();
    const rotated = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', first as string)
      .expect(200);
    const current = cookieValue(rotated.headers['set-cookie']) as string;
    const logout = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', current)
      .expect(204);
    expect(cookieHeaders(logout.headers['set-cookie']).join(';')).toContain(
      'ghostcommit_refresh=;',
    );
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', current)
      .expect(401);
    const secret = 'do-not-echo-this-refresh-secret';
    const error = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `ghostcommit_refresh=${secret}`)
      .expect(401);
    expect(JSON.stringify(error.body)).not.toContain(secret);
  });
});
