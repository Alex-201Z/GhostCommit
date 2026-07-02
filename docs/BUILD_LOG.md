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

## 2026-07-02 — Phase 1A PostgreSQL CI gate re-audit

### Scope

Re-verify the already merged Phase 1A validation gate against the current repository state and the historical GitHub Actions evidence. No Phase 1B UI, public page, onboarding UI, app shell, repository connection, agent, reporting or product-scope code was added.

### CI contract re-verified

- `.github/workflows/ci.yml` starts PostgreSQL with `postgres:16-alpine`.
- `DATABASE_URL` targets `postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`.
- Dependencies install with `npm ci --ignore-scripts`.
- Prisma Client generation runs before `prisma migrate deploy`.
- `prisma migrate deploy` runs before `npm run test:e2e --workspace @ghostcommit/backend`.
- `RUN_DATABASE_TESTS=true` is defined in CI.
- `backend/test/auth.e2e-spec.ts` throws when `CI=true` and `RUN_DATABASE_TESTS=true` is missing, so PostgreSQL e2e cannot be silently skipped in CI.

### Phase 1A scenario coverage

The original merged Phase 1A test file at commit `7770ac2` contains exactly six PostgreSQL scenarios:

1. invalid, expired and consumed OAuth state, with no secret echoing;
2. user creation/reconnection and single personal workspace creation;
3. refresh token rotation, replay rejection and family revocation;
4. versioned consent, personal workspace idempotence and no collection activation;
5. user A/B ownership protection through strict DTO validation;
6. logout revocation, cookie clearing and no secret echoing in refresh errors.

The current `backend/test/auth.e2e-spec.ts` still contains those six scenarios; later Phase 3 PostgreSQL scenarios are additional coverage and are not part of the Phase 1A gate.

### Evidence

- Historical passing GitHub Actions run: https://github.com/Alex-201Z/GhostCommit/actions/runs/27988421002
- Job: `quality`
- Head SHA: `18a92465d4f10abe58f4a8fbcb064e3d6da0661a`
- Result: `SUCCESS`
- Passing steps included container initialization, dependency installation, Prisma generation, migration deploy, lint, typecheck, unit tests, PostgreSQL integration tests and build.

Fresh local checks on 2026-07-02:

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `CI=true` without `RUN_DATABASE_TESTS=true` plus `npm run test:e2e --workspace @ghostcommit/backend`: failed with the expected hard error preventing silent skips.
- `npm test`: passed; backend 10/10, agent 22/22, dashboard 24/24, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF conversion warnings only.

### Gate decision

Phase 1A can be considered validated against real PostgreSQL via GitHub Actions CI. No Phase 1B work was started during this re-audit.

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

## 2026-07-01 — Phase 1B-B privacy-first onboarding UI

### Scope

Onboarding dashboard UI only. No app shell, repository connection, agent linking, collection, activity sessions, timeline, reports or exports were started.

### Implementation

- Added `/onboarding` as a protected dashboard route.
- Added a five-step flow:
  1. welcome and product goal;
  2. personal workspace confirmation;
  3. how GhostCommit works;
  4. data never collected;
  5. consent and user control.
- Added the required two-column transparency screen:
  - `GhostCommit peut utiliser`;
  - `GhostCommit ne peut jamais utiliser`.
- Required both confirmations before consent can be submitted:
  - the user has read the collection notice;
  - the user understands they keep control of data and reports.
- Connected onboarding to `GET /api/v1/onboarding/status` and `PATCH /api/v1/onboarding/status`.
- Added loading, error, refresh/resume, back navigation and non-sensitive step persistence.
- Updated `/login`, `/auth/callback` and `/app/*` flow so authenticated users without consent are routed through onboarding first.
- Explicitly avoided activating collection: no agent call, repository call, activity/session call, report call, or local tracking behavior was added.

### TDD and validation results

- RED: dashboard tests failed because `/onboarding` was absent and `/app/*` did not enforce consent.
- GREEN: `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000` passed with 9/9 tests.
- `npm run lint --workspace @ghostcommit/dashboard`: passed.
- `npm run typecheck --workspace @ghostcommit/dashboard`: passed.
- `npm run build --workspace @ghostcommit/dashboard`: passed.

### Full verification

Executed with `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`:

- `npm run db:generate`: passed.
- `npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 2/2 and dashboard 9/9.
- `npm run build`: passed.
- `git diff --check`: passed.

## 2026-07-01 — Phase 2 Today dashboard

### Scope

Today dashboard only. No repository connection, agent installation/linking, project authorization, real activity collection, session mutation, report generation, export, sharing or settings mutation was started.

### Implementation

- Added authenticated read-only `GET /api/v1/dashboard/today`.
- Registered a new backend `DashboardModule`.
- Returned the privacy-safe empty/not-installed Today summary until later phases create real data.
- Added `/app` and `/app/today` Today dashboard rendering after consent.
- Added the neutral day header: `Voici votre activité de développement du jour`.
- Added session, daily draft, neutral activity counters, recent sessions and checklist cards.
- Added local-only demonstration data for active, paused, no-session, finished and agent-missing session states.
- Kept pause confirmation and demo controls local; no future agent/session/report APIs are called.
- Preserved the permanent `Agent non installé — aucune activité collectée` shell status.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/backend -- dashboard.contract.spec.ts --runInBand` failed because `dashboard.controller` and `dashboard.service` did not exist.
- RED: `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000` failed because `/app` still rendered the Phase 1B-C welcome/empty state and no demo button existed.
- GREEN: `npm run test --workspace @ghostcommit/backend -- dashboard.contract.spec.ts --runInBand` passed with 2/2 tests.
- GREEN: `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000` passed with 16/16 tests.
- `npm run lint`: passed across all four workspaces.
- `npm run typecheck`: passed across all four workspaces.

### Full verification

Pending for this subphase:

- `npm run db:generate`
- `npm run db:validate`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`

## 2026-07-01 — Phase 1B-C app shell

### Scope

Protected dashboard shell and useful empty app routes only. No repository connection, agent installation/linking, project authorization, collection, sessions, reports, exports or settings mutations were started.

### Implementation

- Added the consent-gated `/app/*` shell after onboarding.
- Added responsive sidebar navigation with keyboard-focusable links.
- Added header with the current personal workspace name from onboarding status when available.
- Added profile button placeholder and non-intrusive notification area.
- Added permanent status badge: `Agent non installé — aucune activité collectée`.
- Prepared useful empty states for:
  - `/app`;
  - `/app/projects`;
  - `/app/activity`;
  - `/app/reports`;
  - `/app/settings`.
- Verified the shell does not call future repository, activity, report or agent APIs.

### TDD and validation results

- RED: dashboard tests failed because the protected app area still rendered the Phase 1B-C placeholder and lacked shell roles/routes.
- GREEN: `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000` passed with 14/14 tests.
- `npm run lint --workspace @ghostcommit/dashboard`: passed.
- `npm run typecheck --workspace @ghostcommit/dashboard`: passed.
- `npm run build --workspace @ghostcommit/dashboard`: passed.

### Full verification

Executed with `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`:

- `npm run db:generate`: passed.
- `npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 2/2 and dashboard 14/14.
- `npm run build`: passed.
- `git diff --check`: passed.

## 2026-07-01 — Phase 2 final verification

Executed with `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`:

- `npm run db:generate`: passed.
- `npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 4/4, dashboard 16/16, agent/shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed.

### Gate decision

Phase 2 is complete locally. The Today dashboard is privacy-safe, read-only for real API data, and uses only local demo data for non-empty UI states. Phase 3 has not been started.

## 2026-07-01 — Phase 3A backend projects and agent foundations

### Scope

Backend foundations for Phase 3 only:

- local agent link request, confirmation, installation listing and revocation;
- explicitly authorized project creation/list/detail/update/pause/resume/archive;
- Prisma schema and migration for agent installations, agent link requests and project tracking settings.

No dashboard project UI, agent Electron watcher rewrite, file watching activation, session synchronization, activity timeline, report generation, export or sharing was started.

### Privacy decisions

- Agent link requests accept only `deviceLabel`, `osFamily` and `agentVersion`.
- DTO validation rejects raw hostnames, machine IDs, absolute paths and client-provided owner fields.
- Agent tokens are returned only once on link confirmation and stored hash-only.
- Revocation clears token hash/expiry and marks the installation `REVOKED`.
- Project creation derives the personal workspace from the JWT user; clients cannot pass `teamId` or `userId`.
- Projects store a safe `localAlias`, not an absolute local folder path.
- Project privacy settings include ignored patterns, report path inclusion and report exclusion flags.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/backend -- agent.contract.spec.ts projects.contract.spec.ts --runInBand` failed because `agent.controller`, `projects.controller` and DTOs did not exist.
- GREEN: `npm run test --workspace @ghostcommit/backend -- agent.contract.spec.ts projects.contract.spec.ts --runInBand` passed with 6/6 tests.
- PostgreSQL e2e scenarios were added to `backend/test/auth.e2e-spec.ts` for project ownership, absolute path rejection, agent linking, consumed-code replay, A/B revocation isolation and token hash clearing.

### Verification

- `npm run db:generate`: passed.
- `npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, dashboard 16/16, agent/shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed.

### Blocked local PostgreSQL verification

Local `prisma migrate deploy` and `npm run test:e2e --workspace @ghostcommit/backend` could not run because PostgreSQL was not reachable and Docker Desktop was not running:

- Prisma/Node connection check: `Can't reach database server at localhost:5432`.
- `docker compose up -d postgres redis`: failed to connect to `dockerDesktopLinuxEngine`.

### GitHub Actions PostgreSQL validation

Phase 3A was validated through draft PR #5:

- PR: https://github.com/Alex-201Z/GhostCommit/pull/5
- Run: https://github.com/Alex-201Z/GhostCommit/actions/runs/28539045218
- Job: https://github.com/Alex-201Z/GhostCommit/actions/runs/28539045218/job/84607764912
- Head SHA: `7d9fd42b311dd6bd9704f56df4d5487ede74c042`
- Result: `SUCCESS`.

Passing CI steps:

- PostgreSQL 16 service initialized.
- `npm ci --ignore-scripts`.
- `npm run db:generate`.
- `prisma migrate deploy`.
- `npm run lint`.
- `npm run typecheck`.
- `npm test`.
- `npm run test:e2e --workspace @ghostcommit/backend` with `RUN_DATABASE_TESTS=true`.
- `npm run build`.

### Gate decision

Phase 3A backend foundations are validated. Phase 3B may start next, limited to dashboard project/agent screens and still without activating Electron collection.

## 2026-07-01 — Phase 3B dashboard project and agent screens

### Scope

Dashboard screens for existing Phase 3A backend contracts only:

- `/app/projects` lists explicitly authorized projects from `GET /api/v1/projects`;
- `/app/projects/:id` shows safe project detail and privacy settings from `GET /api/v1/projects/:id`;
- `/app/settings/agent` lists linked local agent installations from `GET /api/v1/agent/installations`.

No Electron watcher, file watching, folder selection implementation, session sync, activity timeline, report generation, export, sharing or public-page work was started.

### Privacy decisions

- Project UI renders only display name, provider, safe local alias, status, neutral recent-activity wording and privacy settings.
- Agent UI renders only user-facing device label, OS family, agent version, status and neutral last-contact wording.
- The UI does not render absolute paths, file contents, code diffs, token material, raw hostnames or stable machine identifiers.
- Add-project, pause and revoke controls are visible affordances only in this subphase; mutation wiring remains deferred.
- Legacy `/repos/*` flows are not used by the dashboard V1 project screens.

### TDD and validation results

- RED: dashboard tests were added first for project list, project empty state, project detail privacy controls and agent installation listing; they failed against the previous placeholder shell.
- GREEN: `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000` passed with 20/20 tests after implementing the screens.

### Verification

- `npm run db:generate`: passed.
- `npm run db:validate`: initially failed because `DATABASE_URL` was not set in the shell.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, dashboard 20/20, agent/shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### Gate decision

Phase 3B dashboard screens are complete locally and must remain green in the PR CI before merge. Phase 3C may start next, limited to user-controlled local agent/project selection foundations, and must still preserve the privacy model before any real collection is enabled.

## 2026-07-02 — Phase 3C local agent/project selection foundations

### Scope

Agent-side foundations for explicit local project selection only:

- prepare a local authorization draft from a user-selected Git repository folder;
- keep the absolute local root path local-only;
- produce a backend-compatible safe `POST /projects` payload only after explicit confirmation;
- normalize default and user-provided ignored patterns before project creation;
- prevent automatic watching of previously configured paths at agent startup;
- prevent automatic pending-session sync when `ActivityTracker` is constructed.

No Electron onboarding UI, backend mutation wiring, heartbeat, session synchronization, activity timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- Non-Git folders are rejected so arbitrary personal directories cannot become project drafts.
- The project payload includes display name, `LOCAL` provider, safe alias, optional branch and ignored patterns only.
- Absolute paths, parent directory paths, file contents, code diffs, raw hostnames, stable machine identifiers, token material and secrets are not included in the payload.
- Legacy `ActivityTracker` sync is opt-in only after this phase; future code must not enable it until session payload filtering and API revalidation are implemented.
- Existing configured local paths are not auto-watched on startup; user action remains required before any future collection activation.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/agent -- projectSelection.test.ts` failed because `projectSelection` did not exist.
- GREEN: `npm run test --workspace @ghostcommit/agent -- projectSelection.test.ts` passed with 4/4 tests.
- RED: `npm run test --workspace @ghostcommit/agent -- activityTracker.test.ts` failed because constructing `ActivityTracker` synchronized one pending session.
- GREEN: `npm run test --workspace @ghostcommit/agent -- activityTracker.test.ts projectSelection.test.ts` passed with 5/5 tests.
- RED: `npm run test --workspace @ghostcommit/agent -- startupPolicy.test.ts` failed because `startupPolicy` did not exist.
- GREEN: `npm run test --workspace @ghostcommit/agent -- startupPolicy.test.ts activityTracker.test.ts projectSelection.test.ts` passed with 7/7 tests.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 20/20, shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### GitHub Actions validation

Phase 3C was validated through PR #5:

- PR: https://github.com/Alex-201Z/GhostCommit/pull/5
- Run: https://github.com/Alex-201Z/GhostCommit/actions/runs/28553173127
- Job: https://github.com/Alex-201Z/GhostCommit/actions/runs/28553173127/job/84654798264
- Head SHA before documentation amend: `2f1bb77`.
- Result: `SUCCESS`.

Passing CI steps:

- PostgreSQL 16 service initialized.
- `npm ci --ignore-scripts`.
- `npm run db:generate`.
- `prisma migrate deploy`.
- `npm run lint`.
- `npm run typecheck`.
- `npm test`.
- `npm run test:e2e --workspace @ghostcommit/backend` with `RUN_DATABASE_TESTS=true`.
- `npm run build`.

### Gate decision

Phase 3C local foundations are validated locally and in GitHub Actions PostgreSQL CI. The next Phase 3 subphase may wire the explicit user-controlled project authorization flow, but Phase 4 must not start from this state.

## 2026-07-02 — Phase 3D dashboard project authorization flow

### Scope

Dashboard project authorization flow using the existing Phase 3A backend endpoint:

- `/app/projects` opens an explicit add-project form from the `Ajouter un projet` control;
- the form collects safe metadata only: display name, safe local alias, optional branch and ignored patterns;
- an explicit confirmation checkbox is required before submitting;
- submission calls authenticated `POST /api/v1/projects`;
- the returned project is added to the visible list.

No Electron folder picker, file watcher activation, heartbeat, activity session sync, timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- The dashboard form does not request or render absolute local paths.
- The create-project payload never includes file contents, code diffs, token material, raw hostnames, machine identifiers or secrets.
- The flow calls only the project API; it does not call activity, session, report or agent sync endpoints.
- The access token remains in memory and is used only as the Authorization header.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/dashboard -- App.test.tsx --reporter=verbose --testNamePattern="creates a local project"` failed because the add-project button was still a placeholder and no labeled form fields existed.
- GREEN: the same targeted test passed after implementing the explicit form and project mutation.
- `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000`: passed with 21/21 tests.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 21/21, shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### Gate decision

Phase 3D dashboard project authorization flow is complete locally. Phase 4 must not start from this state.

## 2026-07-02 — Phase 3E dashboard project and agent controls

### Scope

Dashboard control mutations for existing Phase 3A endpoints:

- pause, resume and archive owned projects from `/app/projects/:id`;
- revoke owned agent installations from `/app/settings/agent`;
- update visible statuses from API responses.

No Electron watcher activation, heartbeat, activity session sync, timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- Mutations send only authenticated control requests to existing owner-scoped endpoints.
- No local path, file content, code diff, token material, raw hostname, machine identifier, secret or activity payload is sent or rendered.
- Agent revocation updates visible status only; it does not start heartbeat or sync.
- Project pause/archive controls do not contact activity, session, report, export or agent sync endpoints.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/dashboard -- App.test.tsx --reporter=verbose --testNamePattern="pause and archive|revoke an agent"` failed because archive and revoke controls were placeholders.
- GREEN: the same targeted test passed after wiring the project and agent control mutations.
- `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000`: passed with 23/23 tests.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 23/23, shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### Gate decision

Phase 3E dashboard project and agent controls are complete locally. Phase 4 must not start from this state.

## 2026-07-02 — Phase 3F agent heartbeat and offline status

### Scope

Backend control-plane heartbeat for linked agents:

- `POST /api/v1/agent/heartbeat` authenticated with the device `gca_*` token;
- hash-only token lookup;
- `lastSeenAt` refresh and `CONNECTED` status update;
- stale `CONNECTED` installations become `OFFLINE` during installation listing;
- revoked/invalid/missing tokens are rejected.

No file watching, local scanning, activity session sync, timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- Heartbeat has no request body and accepts no hostname, machine identifier, path, file content, code diff, secret, activity event or session payload.
- Heartbeat/list responses return only the public installation shape and never return token material or token hashes.
- Offline is treated as device connectivity only; it must not be displayed or used as productivity, presence or performance inference.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/backend -- agent.contract.spec.ts --runInBand` failed because `heartbeat` was not exposed by `AgentController`.
- GREEN: `npm run test --workspace @ghostcommit/backend -- agent.contract.spec.ts --runInBand` passed with 3/3 tests.
- PostgreSQL e2e coverage was added for valid heartbeat, invalid token rejection, stale offline transition, reconnect heartbeat and revoked-token rejection. Local execution remains dependent on PostgreSQL availability and is expected to be validated in GitHub Actions.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 23/23, shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### Gate decision

Phase 3F is validated locally and in GitHub Actions PostgreSQL CI run `28554286795` for head SHA `216f466`. Phase 4 must not start from this state.

## 2026-07-02 — Phase 3G dashboard agent link request flow

### Scope

Dashboard control-plane pairing request for the existing Phase 3A backend endpoint:

- `/app/settings/agent` renders a user-initiated link-request form;
- the form collects only device label, OS family and agent version;
- submission calls authenticated `POST /api/v1/agent/link-request`;
- the dashboard displays the temporary link code, deep link and expiry returned by the backend.

No Electron deep-link handling, device confirmation, token issuance in the dashboard, heartbeat activation, local scanning, file watching, activity session sync, timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- The dashboard never asks for or renders raw hostname, stable machine identifier, local path, file content, code diff, token material, token hash, session payload or report data.
- The short-lived access token remains in memory and is used only as the Authorization header.
- The link request does not confirm an installation and does not start any collection-plane endpoint.
- UI copy avoids displaying forbidden sensitive-data terms as if they were captured values.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/dashboard -- App.test.tsx --reporter=verbose --testNamePattern="agent link request"` failed before the link-request form existed.
- GREEN: `npm run test --workspace @ghostcommit/dashboard -- App.test.tsx --reporter=verbose --testNamePattern="agent link request|agent settings"` passed with 2/2 targeted tests after adding the form and correcting the asynchronous installation-list assertion.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 24/24, shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### GitHub Actions validation

Phase 3G was validated through PR #5:

- PR: https://github.com/Alex-201Z/GhostCommit/pull/5
- Run: https://github.com/Alex-201Z/GhostCommit/actions/runs/28609390636
- Job: `quality`
- Head SHA: `1960330`
- Result: `SUCCESS`.

Passing CI steps:

- PostgreSQL 16 service initialized.
- `npm ci --ignore-scripts`.
- `npm run db:generate`.
- `prisma migrate deploy`.
- `npm run lint`.
- `npm run typecheck`.
- `npm test`.
- `npm run test:e2e --workspace @ghostcommit/backend` with `RUN_DATABASE_TESTS=true`.
- `npm run build`.

### Gate decision

Phase 3G dashboard agent link request flow is complete locally and validated in GitHub Actions PostgreSQL CI. Phase 4 must not start from this state.

## 2026-07-02 — Phase 3H agent link confirmation foundations

### Scope

Agent-local foundations for consuming dashboard pairing links:

- parse `ghostcommit://agent/link?code=GC-XXXXXX`;
- reject invalid schemes, paths and codes with generic errors;
- require explicit user confirmation before confirming a link;
- call the existing `POST /api/v1/agent/link/confirm` contract through an injectable API boundary;
- keep watcher, heartbeat, local project scanning and session sync inactive.

No rendered Electron confirmation UI, protocol registration, secure device-token persistence, heartbeat activation, file watching, local scanning, activity session sync, timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- The parser returns only a validated pairing code and never exposes extra query parameters.
- The confirmation payload contains only link code, device label, OS family and agent version.
- The user-session token required by the current backend JWT guard is passed only to the confirmation call and is not persisted by this foundation.
- The returned device token is left to a later secure persistence subphase; it is not logged, rendered, or used to start heartbeat here.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/agent -- agentLinking.test.ts` failed because `agentLinking` did not exist.
- GREEN: `npm run test --workspace @ghostcommit/agent -- agentLinking.test.ts` passed with 4/4 tests after adding `AgentLinkingService` and the API client confirmation method.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, agent 11/11, dashboard 24/24, shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### Gate decision

Phase 3H agent link confirmation foundations are complete locally and ready for commit/push/CI validation. Phase 4 must not start from this state.

### GitHub Actions validation

Phase 3H was validated through PR #5:

- PR: https://github.com/Alex-201Z/GhostCommit/pull/5
- Run: https://github.com/Alex-201Z/GhostCommit/actions/runs/28610029884
- Job: `quality`
- Head SHA: `9b9b337`
- Result: `SUCCESS`.

Passing CI steps:

- PostgreSQL 16 service initialized.
- `npm ci --ignore-scripts`.
- `npm run db:generate`.
- `prisma migrate deploy`.
- `npm run lint`.
- `npm run typecheck`.
- `npm test`.
- `npm run test:e2e --workspace @ghostcommit/backend` with `RUN_DATABASE_TESTS=true`.
- `npm run build`.

## 2026-07-02 — Phase 3I secure token storage and explicit heartbeat

### Scope

Agent-local credential and heartbeat primitives:

- store the one-time device token through an injectable secure vault;
- keep the token out of `config.json`;
- clear the device token through the same vault boundary;
- persist the returned device token after confirmed link success;
- expose an explicit heartbeat service that uses the stored device token;
- add an API client method for bodyless `POST /agent/heartbeat`.

No rendered Electron confirmation UI, protocol registration, heartbeat scheduler, watcher activation, local project scanning, activity session sync, timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- The default vault lazy-loads `keytar` so native secret storage is not imported during tests or CI module loading.
- Device token persistence is behind an injectable interface and is test-covered without touching real OS keychains.
- The user-session token used for link confirmation remains transient and is not persisted by the agent.
- Heartbeat sends only the device token in the Authorization header and no request body.
- Heartbeat does not start or imply collection; it is device connectivity only, not presence or productivity.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/agent -- agentCredentials.test.ts agentHeartbeat.test.ts agentLinking.test.ts` failed because `agentCredentials` and `agentHeartbeat` did not exist, and `AgentLinkingService` did not persist the returned device token.
- GREEN: the same targeted command passed with 9/9 tests after adding secure credential storage, explicit heartbeat and token persistence after link confirmation.
- `npm run lint --workspace @ghostcommit/agent`: passed.
- `npm run typecheck --workspace @ghostcommit/agent`: passed.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, agent 16/16, dashboard 24/24, shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### Gate decision

Phase 3I secure token storage and explicit heartbeat is complete locally and ready for commit/push/CI validation. Phase 4 must not start from this state.

### GitHub Actions validation

Phase 3I was validated through PR #5:

- PR: https://github.com/Alex-201Z/GhostCommit/pull/5
- Run: https://github.com/Alex-201Z/GhostCommit/actions/runs/28610478740
- Job: `quality`
- Head SHA: `611739c`
- Result: `SUCCESS`.

Passing CI steps:

- PostgreSQL 16 service initialized.
- `npm ci --ignore-scripts`.
- `npm run db:generate`.
- `prisma migrate deploy`.
- `npm run lint`.
- `npm run typecheck`.
- `npm test`.
- `npm run test:e2e --workspace @ghostcommit/backend` with `RUN_DATABASE_TESTS=true`.
- `npm run build`.

### CI gate decision

Phase 3I secure token storage and explicit heartbeat is validated in GitHub Actions PostgreSQL CI. Phase 4 must not start from this state.

## 2026-07-02 — Phase 3J Electron protocol and confirmation flow

### Scope

Electron-level agent linking flow:

- extracts `ghostcommit://agent/link?code=GC-XXXXXX` links from process arguments;
- queues protocol links until the agent is initialized;
- registers the `ghostcommit` protocol with Electron;
- handles macOS `open-url` and second-instance startup arguments;
- prompts the user before confirming an agent link;
- confirms the link through the existing link service;
- sends one explicit heartbeat after successful confirmation.

No custom rendered Electron window, watcher activation, local project scan, activity session sync, timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- Only `ghostcommit://agent/link?...` arguments are handled; unrelated URLs or arguments are ignored.
- Invalid links return a generic message without echoing unsafe query values.
- User cancellation performs no backend call, credential persistence or heartbeat.
- The confirmation prompt displays only the pairing code and privacy-safe explanatory text.
- Successful linking still does not start file watching, local scanning, session sync, reporting, export or sharing.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/agent -- agentProtocol.test.ts agentLinkFlow.test.ts` failed because `agentProtocol` and `agentLinkFlow` did not exist.
- GREEN: the same targeted command passed with 6/6 tests after adding protocol extraction/queueing and the confirmation orchestration flow.
- `npm run test --workspace @ghostcommit/agent -- agentProtocol.test.ts agentLinkFlow.test.ts agentLinking.test.ts agentHeartbeat.test.ts agentCredentials.test.ts`: passed with 15/15 targeted tests.
- `npm run lint --workspace @ghostcommit/agent`: passed.
- `npm run typecheck --workspace @ghostcommit/agent`: passed.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed across backend, agent, dashboard and shared workspaces.
- `npm run typecheck`: passed across backend, agent, dashboard and shared workspaces.
- `npm test`: passed; backend 10/10, agent 22/22, dashboard 24/24, shared no test files.
- `npm run build`: passed across backend, agent, dashboard and shared workspaces.
- `git diff --check`: passed; only CRLF conversion warnings were emitted by Git on Windows.

### Gate decision

Phase 3J Electron protocol and confirmation flow is complete locally and ready for commit/push/CI validation. Phase 4 must not start from this state.

### GitHub Actions validation

Phase 3J was validated through PR #5:

- PR: https://github.com/Alex-201Z/GhostCommit/pull/5
- Run: https://github.com/Alex-201Z/GhostCommit/actions/runs/28611092637
- Job: `quality`
- Head SHA: `12adf33`
- Result: `SUCCESS`.

Passing CI steps:

- PostgreSQL 16 service initialized.
- `npm ci --ignore-scripts`.
- `npm run db:generate`.
- `prisma migrate deploy`.
- `npm run lint`.
- `npm run typecheck`.
- `npm test`.
- `npm run test:e2e --workspace @ghostcommit/backend` with `RUN_DATABASE_TESTS=true`.
- `npm run build`.

### CI gate decision

Phase 3J Electron protocol and confirmation flow is validated in GitHub Actions PostgreSQL CI. Phase 4 must not start from this state.

## 2026-07-02 — Phase 3K local agent disconnect control

### Scope

Agent-local user control for disconnecting the local agent:

- clear the stored device token from the secure credential store;
- clear the legacy user token from local config;
- stop active watchers and activity tracking;
- expose the action from the Electron tray menu.

No backend endpoint, remote revocation, heartbeat scheduler, file scanning, session synchronization, timeline, report generation, export, sharing or Phase 4 work was started.

### Privacy decisions

- Disconnect is local and explicit.
- It removes heartbeat credentials locally without sending token material anywhere.
- It stops existing local collection loops instead of starting new ones.
- It does not call heartbeat, sync sessions or remote revocation as hidden side effects.
- Remote revocation remains the existing dashboard-owned control.

### TDD and validation results

- RED: `npm run test --workspace @ghostcommit/agent -- agentConnectionControl.test.ts` failed because `agentConnectionControl` did not exist.
- GREEN: the same targeted command passed after adding `AgentConnectionControlService`.
- `npm run test --workspace @ghostcommit/agent`: passed with 23/23 tests.
- `npm run lint --workspace @ghostcommit/agent`: passed.
- `npm run typecheck --workspace @ghostcommit/agent`: passed.

### Verification

- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 23/23, dashboard 24/24, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.

### Gate decision

Phase 3K local agent disconnect control is complete locally and ready for commit/push/CI validation. Phase 4 must not start from this state.
