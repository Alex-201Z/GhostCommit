# GhostCommit Build Log

## 2026-06-22 â€” Phase 0 audit and foundations

### Scope

Repository audit, contributor contract, foundational workspace configuration, minimal dashboard health page, CI, and validation only. No Phase 1 authentication, onboarding, workspace, or app-shell feature is included.

### Baseline

- Commit: `63a3ea0`
- Node: `v24.17.0`
- npm: `11.13.0`
- Root `lint`, `typecheck`, `test`, and `build`: failed because scripts were missing.

### Decisions

- Preserve NestJS, Electron, Prisma/PostgreSQL, Redis/BullMQ, and TypeScript architecture.
- Keep unsafe prototype features documented but do not expand them during Phase 0.
- Track a lockfile and separate deterministic agent compilation from installer packaging.
- Add only a dashboard health route; Phase 1 pages remain out of scope.

### Validation results

- `npm install` with `NODE_USE_SYSTEM_CA=1`: passed; 1,361 packages installed and `package-lock.json` generated. Postinstall scripts were disabled for deterministic Phase 0 validation.
- Dashboard TDD: RED failed on missing `./App`; GREEN passed with 1/1 test.
- `npm run db:generate`: passed (Prisma Client 5.22.0).
- `npm run db:validate`: passed.
- `npm run lint`: passed across four workspaces.
- `npm run typecheck`: passed across four workspaces.
- `npm test`: passed; dashboard 1/1, backend/agent/shared contain no tests yet.
- `npm run build`: passed across four workspaces.
- `npm audit --omit=dev`: failed security gate with 16 advisories (11 moderate, 5 high); safe fix attempt did not reduce them and breaking `--force` was refused.
- `docker compose config --quiet`: blocked because Docker CLI is unavailable in the terminal.
- Secret signature scan outside examples/docs: no matches.

### Remaining blockers

- Remote CI and clean-checkout installation are not yet verified.
- Initial Prisma migration is absent and cannot be generated/tested without PostgreSQL/Docker access.
- Five high production dependency advisories require a coordinated NestJS upgrade or explicit security decision.
- Existing prototype privacy and authorization gaps remain documented in `IMPLEMENTATION_AUDIT.md`; no Phase 1 work was started.

## 2026-06-22 — Phase 1A authentication and data foundations

### Scope

GitHub OAuth, anti-CSRF state, rotating sessions, versioned consent, personal workspace, onboarding status, PostgreSQL migration, Swagger/API contracts and PostgreSQL CI tests only. No landing page, login UI, onboarding UI, app shell, agent linking, repository connection, activity collection or report work was started.

### Security decisions

- OAuth state is random, SHA-256 hash-only, ten-minute, single-use.
- GitHub code exchange and verified-primary-email lookup are server-side; provider tokens are never persisted or returned.
- Callback sets only the HttpOnly refresh cookie and redirects to a fixed URL without tokens.
- Access JWT defaults to 15 minutes; refresh tokens are opaque, hash-only, rotated atomically and revocable by family.
- Personal workspace uniqueness is enforced by PostgreSQL on `Team.personalOwnerId`.
- Consent requires the two transparency acknowledgements and stores version, UTC acceptance time and source without activating collection.
- GitLab Passport routes were removed from the registered controller/module and remain out of scope.

### TDD and validation results

- RED: auth contract test failed because `POST /auth/github/start` did not exist.
- GREEN: backend contract suite passes 2/2, including mandatory dual transparency acknowledgement.
- Prisma schema formatting and validation: passed with a test `DATABASE_URL`.
- Prisma Client generation: passed (5.22.0).
- Initial migration generated at `backend/prisma/migrations/20260622_phase_1a_auth_foundations/migration.sql`.
- Root `npm run lint`: passed across all four workspaces.
- Root `npm run typecheck`: passed across all four workspaces.
- Root `npm test`: passed; backend 2/2 and dashboard 1/1. Backend no longer uses `--passWithNoTests`.
- Root `npm run build`: passed across all four workspaces.
- PostgreSQL HTTP suite: compiles; 6 scenarios are present but skipped locally because `RUN_DATABASE_TESTS` is not enabled without a database.
- Local `prisma migrate deploy`: blocked because no PostgreSQL/Docker service exists on localhost:5432 and WSL is not installed.
- CI now provisions PostgreSQL 16, deploys migrations, sets `RUN_DATABASE_TESTS=true`, then runs the 6 HTTP integration scenarios.
- Production dependency audit remains 16 advisories (11 moderate, 5 high). Non-forced `npm audit fix --omit=dev` did not reduce them; forced breaking upgrades were refused and risks are documented in `DEPENDENCY_RISK_ASSESSMENT.md`.

### Open gate

Phase 1A code and CI foundations are implemented, but the migration and six integration tests have not been executed against a live PostgreSQL instance in this local environment. Phase 1B must not start until that PostgreSQL gate passes locally or in CI.

## 2026-06-23 — Phase 1A PostgreSQL CI gate closure

### Scope

Validation only. No Phase 1B UI, repository connection, agent, collection or reporting work was started.

### CI contract verified

- GitHub Actions service: `postgres:16-alpine`, database `ghostcommit_test`, health-checked with `pg_isready`.
- `DATABASE_URL` targets `postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`.
- Dependencies install with `npm ci --ignore-scripts`; no `npm install` or forced audit upgrade is used.
- Prisma Client generation runs before `prisma migrate deploy`.
- `prisma migrate deploy` runs before the PostgreSQL integration suite.
- `RUN_DATABASE_TESTS=true` is defined for the job.
- The e2e bootstrap throws when `CI=true` without `RUN_DATABASE_TESTS=true`, preventing silent skips.

### Real PostgreSQL evidence

- Pull request: https://github.com/Alex-201Z/GhostCommit/pull/4
- First run: https://github.com/Alex-201Z/GhostCommit/actions/runs/27988259608 — migration succeeded; e2e failed because the Supertest default import was not CommonJS-compatible on Linux.
- Minimal correction: use `import request = require('supertest')`; no product or dependency change.
- Passing run: https://github.com/Alex-201Z/GhostCommit/actions/runs/27988421002
- Migration `20260622_phase_1a_auth_foundations` applied successfully to PostgreSQL 16.
- PostgreSQL e2e: 6/6 passed, covering invalid/expired/consumed OAuth state, user creation/reconnection, unique personal workspace, versioned consent without collection, A/B ownership, refresh rotation/replay, logout, and absence of credentials in redirects/errors.
- Lint, typecheck, unit tests and build also passed in the same run.

### Gate decision

The Phase 1A PostgreSQL validation gate is closed on the PR branch. Phase 1A can be considered validated once the final documentation-only run remains green and the PR is merged into `main`. Phase 1B remains unstarted.

## 2026-07-01 — Phase 1B-A public interface and login

### Scope

Public dashboard/login foundation only. No onboarding UI, app shell, repository connection, agent linking, activity collection, timeline, reporting or export work was started.

### Implementation

- Replaced the Phase 0 health page with real dashboard routes:
  - `/` public landing page;
  - `/login`;
  - `/auth/callback`;
  - `/app/*` protected route guard placeholder.
- Added privacy-first product copy: proof-of-work positioning, three benefits, confidentiality section and a static private report example.
- Connected the login page to the Phase 1A backend contract through `POST /api/v1/auth/github/start`.
- Added dashboard-side session bootstrap through `POST /api/v1/auth/refresh` with credentials included.
- Kept the short-lived access token in React memory only; no token is written to `localStorage`, `sessionStorage` or URL fragments.
- The callback page removes query parameters before refreshing the browser session and uses a generic safe error message.
- Added route guard behavior: anonymous `/app/*` users redirect to `/login`; connected `/login` users redirect to `/app`.
- Added `vite/client` types to the dashboard TypeScript config for `import.meta.env`.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/dashboard` failed with 5/5 missing Phase 1B-A route expectations against the old Phase 0 health page.
- GREEN: `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000` passed with 6/6 tests.
- `npm run lint --workspace @ghostcommit/dashboard`: passed.
- `npm run typecheck --workspace @ghostcommit/dashboard`: initially failed because `ImportMeta.env` was not typed; passed after adding `vite/client`.
- `npm run build --workspace @ghostcommit/dashboard`: passed after the same type fix.
- Full verification with `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`:
  - `npm run db:generate`: passed.
  - `npm run db:validate`: passed.
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm test`: passed; backend 2/2 and dashboard 6/6.
  - `npm run build`: passed.
  - `git diff --check`: passed.

### Remaining risks

- Real GitHub OAuth still requires external OAuth app credentials and callback configuration.
- The protected `/app/*` target is intentionally only a guard placeholder; the real app shell belongs to Phase 1B-C.
- The first `npm run db:validate` attempt without `DATABASE_URL` failed as expected in this shell; validation passes when the test database URL is provided, matching CI behavior.
