# GhostCommit V1 Objective Progress

**Started:** 2026-07-01  
**Branch:** `codex/ghostcommit-v1-completion`  
**Baseline:** `origin/main` at `7770ac2` (`[codex] validate Phase 1A with PostgreSQL CI (#4)`)

## Scope guard

GhostCommit V1 is being completed phase by phase from the existing repository. The architecture remains:

- `backend/`: NestJS, Prisma, PostgreSQL, future BullMQ/Redis workers.
- `dashboard/`: React, TypeScript, Vite, React Router, TanStack Query.
- `agent/`: Electron desktop agent.
- `shared/`: dependency-light shared contracts.

Privacy-first invariants remain non-negotiable: no keylogging, screenshots, browser monitoring, file contents, code diffs, absolute paths, raw hostnames, stable machine identifiers, secrets, productivity scoring, developer ranking, or automatic report sharing.

## Phase status

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 - Foundations and technical contract | Complete | Documentation, workspace commands, CI, dashboard health page and shared package are present. |
| Phase 1A - Authentication and data foundations | Complete | GitHub OAuth, refresh rotation, personal workspace, consent foundations and PostgreSQL 16 CI validation are merged in `main`. |
| Phase 1B-A - Public interface and login | Complete | Public landing, GitHub login start, callback refresh, safe errors and route guards implemented, verified locally and committed. |
| Phase 1B-B - Privacy-first onboarding UI | Complete | Five-step onboarding, consent confirmations, status API integration and app consent guard implemented, verified locally and committed. |
| Phase 1B-C - App shell | Complete | Responsive shell, navigation, workspace header, profile/notifications, permanent agent status and useful empty routes implemented, verified locally and committed. |
| Phase 2 - Today dashboard | Complete | Read-only privacy-safe `/dashboard/today` contract and `/app` Today dashboard implemented, verified locally and committed. |
| Phase 3 - Projects and agent linking | In progress | Phase 3A backend foundations are validated in GitHub Actions PostgreSQL 16. Phase 3B dashboard project/agent screens are complete. Phase 3C local agent/project selection foundations are validated locally and in GitHub Actions PostgreSQL CI. Phase 3D dashboard project authorization flow is complete locally. Phase 3E dashboard project/agent controls are complete locally. Phase 3F agent heartbeat/offline backend is implemented and CI-validated. Phase 3G dashboard agent link request flow is complete and CI-validated. Phase 3H agent link confirmation foundations are complete and CI-validated. Phase 3I secure token storage and explicit heartbeat is complete and CI-validated. Phase 3J Electron protocol and confirmation flow is complete and CI-validated. Phase 3K local agent disconnect control is complete locally and awaiting CI validation after push. |
| Phase 4 - Sessions and timeline | Not started | |
| Phase 5 - Daily draft and explain work | Not started | |
| Phase 6 - Work items and evidence | Not started | |
| Phase 7 - Weekly reports and export | Not started | |
| Phase 8 - Privacy, robustness and release | Not started | |

## Completed features

- Phase 0 repository foundations.
- Phase 1A backend authentication and consent foundations.
- Real PostgreSQL 16 CI gate for Phase 1A.
- Phase 1B-A dashboard public/login foundation.
- Phase 1B-B privacy-first onboarding UI.
- Phase 1B-C consent-gated app shell.
- Phase 2 Today dashboard:
  - authenticated read-only `GET /api/v1/dashboard/today`;
  - `/app` and `/app/today` render the Today dashboard after consent;
  - session card, daily draft card, neutral day counts, recent sessions and checklist;
  - no productivity score, ranking, file content, absolute path, hostname, token, collection activation, agent mutation, report generation, export or sharing.
- Phase 3A backend foundations:
  - authenticated `POST /api/v1/agent/link-request`;
  - authenticated `POST /api/v1/agent/link/confirm`;
  - authenticated `GET /api/v1/agent/installations`;
  - authenticated `POST /api/v1/agent/installations/:id/revoke`;
  - authenticated project create/list/detail/update/pause/resume/archive under `/api/v1/projects`;
  - Prisma models for `AgentLinkRequest` and `AgentInstallation`;
  - project tracking status and privacy settings on `Repo`;
  - PostgreSQL e2e coverage added for ownership, absolute path rejection and agent revocation.
- Phase 3B dashboard project/agent screens:
  - `/app/projects` reads `GET /api/v1/projects` and shows safe aliases/status only;
  - `/app/projects/:id` reads `GET /api/v1/projects/:id` and shows privacy settings without file contents or absolute paths;
  - `/app/settings/agent` reads `GET /api/v1/agent/installations` without exposing token material, raw hostnames or stable machine identifiers.
- Phase 3C local agent/project selection foundations:
  - local project authorization drafts can be prepared only from Git repository folders;
  - absolute local paths remain local-only and are never included in the backend project payload;
  - default ignored patterns and safe user patterns are normalized before project creation;
  - project payload creation requires explicit confirmation;
  - agent startup no longer auto-watches previously configured paths;
  - `ActivityTracker` no longer syncs pending sessions on construction.
- Phase 3D dashboard project authorization flow:
  - `/app/projects` opens an explicit add-project form;
  - the form collects only display name, safe local alias, optional branch and ignored patterns;
  - user confirmation is required before `POST /api/v1/projects`;
  - the created project is added to the visible list without activity/session/report/agent sync calls.
- Phase 3E dashboard project/agent controls:
  - project pause/resume/archive actions call existing owner-scoped endpoints from project detail;
  - agent revocation calls the existing owner-scoped revoke endpoint from settings;
  - visible statuses update from API responses without activity/session/report/sync calls.
- Phase 3F agent heartbeat/offline backend:
  - `POST /api/v1/agent/heartbeat` accepts only the linked device token in the Authorization header;
  - heartbeat updates `lastSeenAt` and public status only;
  - stale connected installations become `OFFLINE` during listing;
  - missing, invalid and revoked tokens are rejected.
- Phase 3G dashboard agent link request flow:
  - `/app/settings/agent` can create a short-lived link request through `POST /api/v1/agent/link-request`;
  - the form sends only device label, OS family and agent version;
  - the UI displays only the temporary link code, deep link and expiry;
  - no device token, token hash, raw hostname, machine identifier, local path, file content, code diff, session or report data is rendered.
- Phase 3H agent link confirmation foundations:
  - the agent can parse `ghostcommit://agent/link?code=GC-XXXXXX` links and return only the validated pairing code;
  - invalid links and codes are rejected with a generic error;
  - confirmation requires explicit user confirmation before calling the backend;
  - the confirmation payload contains only link code, device label, OS family and agent version;
  - confirmation foundations do not start watchers, heartbeat, project scanning, session sync, reporting, export or sharing.
- Phase 3I secure token storage and explicit heartbeat:
  - device tokens are stored through an injectable secure vault boundary rather than `config.json`;
  - `keytar` is lazy-loaded by the default vault implementation;
  - credential clearing removes the stored device token through the same vault;
  - heartbeat is an explicit call using the stored device token and has no request body;
  - heartbeat does not start watchers, project scanning, session sync, reporting, export or sharing.
- Phase 3J Electron protocol and confirmation flow:
  - the agent extracts only `ghostcommit://agent/link?...` links from startup and second-instance arguments;
  - links are queued until the agent is initialized;
  - a user confirmation prompt is required before backend confirmation;
  - cancellation and invalid links do not persist credentials or heartbeat;
  - successful linking sends one explicit heartbeat and still does not start watchers, scans, sync, reporting, export or sharing.

## Current technical decisions

- The dashboard starts OAuth with `POST /api/v1/auth/github/start` and obtains an access token only through `POST /api/v1/auth/refresh`.
- The dashboard must not store tokens in `localStorage`, `sessionStorage`, or URLs.
- Phase 2 demo data is local UI sample data only and must not contact future product APIs.
- Phase 3A keeps the existing prototype `/repos/*` routes untouched for compatibility but introduces `/projects/*` as the V1 privacy-safe surface.
- Local project authorization stores a safe alias, not a local absolute path. The Electron agent must keep the absolute path local-only in later subphases.
- Agent link requests accept only non-identifying metadata. Agent tokens are one-time response values and hash-only at rest.
- Phase 3B dashboard controls are read-only or UI-only affordances. Add-project, pause and revoke mutations remain deferred to their owning subphases.
- Phase 3C keeps agent-side absolute paths local-only and treats `POST /projects` payloads as explicit-confirmation artifacts.
- Existing agent session collection remains disabled by default; future sync must opt in only after payload redaction, relative path validation and agent-token authorization are implemented.
- Phase 3D keeps local folder selection out of the dashboard; the dashboard sends safe metadata only and does not activate collection.
- Phase 3E treats pause/archive/revoke as control-plane mutations only; no collection-plane endpoints are called.
- Phase 3F treats heartbeat/offline as device connectivity only, not user presence or productivity. Heartbeat has no body and accepts no activity payload.
- Phase 3G keeps device confirmation and token issuance in the existing backend confirm endpoint; the dashboard only starts the pairing request and never sees the future agent token.
- Phase 3H keeps user-session handoff injectable because the existing backend confirm endpoint is JWT-guarded; the agent does not persist that user token in this foundation.
- Phase 3I treats heartbeat as a user/device control-plane signal only; it must not be used as presence, productivity or performance evidence.
- Phase 3J keeps the Electron prompt minimal and non-sensitive; a richer rendered confirmation UI can replace the dialog later without changing the service boundary.

## Important files modified in the current Phase 3B subphase

- `dashboard/src/App.tsx`
- `dashboard/src/App.test.tsx`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Important files modified in the current Phase 3C subphase

- `agent/src/services/projectSelection.ts`
- `agent/src/services/projectSelection.test.ts`
- `agent/src/services/startupPolicy.ts`
- `agent/src/services/startupPolicy.test.ts`
- `agent/src/services/activityTracker.ts`
- `agent/src/services/activityTracker.test.ts`
- `agent/src/main.ts`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`

## Important files modified in the current Phase 3D subphase

- `dashboard/src/App.tsx`
- `dashboard/src/App.test.tsx`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Important files modified in the current Phase 3E subphase

- `dashboard/src/App.tsx`
- `dashboard/src/App.test.tsx`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Important files modified in the current Phase 3F subphase

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260702_phase_3f_agent_heartbeat/migration.sql`
- `backend/src/agent/agent-token.guard.ts`
- `backend/src/agent/agent.controller.ts`
- `backend/src/agent/agent.service.ts`
- `backend/src/agent/agent.module.ts`
- `backend/src/agent/agent.contract.spec.ts`
- `backend/test/auth.e2e-spec.ts`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Important files modified in the current Phase 3G subphase

- `dashboard/src/App.tsx`
- `dashboard/src/App.test.tsx`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Important files modified in the current Phase 3H subphase

- `agent/src/services/agentLinking.ts`
- `agent/src/services/agentLinking.test.ts`
- `agent/src/services/apiClient.ts`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Important files modified in the current Phase 3I subphase

- `agent/src/services/agentCredentials.ts`
- `agent/src/services/agentCredentials.test.ts`
- `agent/src/services/agentHeartbeat.ts`
- `agent/src/services/agentHeartbeat.test.ts`
- `agent/src/services/agentLinking.ts`
- `agent/src/services/agentLinking.test.ts`
- `agent/src/services/apiClient.ts`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Important files modified in the current Phase 3J subphase

- `agent/src/main.ts`
- `agent/src/services/agentProtocol.ts`
- `agent/src/services/agentProtocol.test.ts`
- `agent/src/services/agentLinkFlow.ts`
- `agent/src/services/agentLinkFlow.test.ts`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Migrations

- `20260701_phase_3a_projects_agent_foundations`: adds agent link/install tables, agent/project status enums, local project provider, and project privacy fields.
- `20260702_phase_3f_agent_heartbeat`: adds `OFFLINE` to `AgentStatus`.

## Risks

- GitHub OAuth cannot be fully exercised locally without a configured provider app.
- Real Today activity remains empty until later phases implement project authorization, agent linking, sessions and report generation.
- Local PostgreSQL validation was blocked by unavailable Docker/PostgreSQL, so Phase 3A was validated in GitHub Actions PostgreSQL 16 instead.
- The Electron agent still contains prototype flows that can expose absolute paths/legacy token handling; they were not expanded in Phase 3A and must be replaced in later Phase 3 subphases before real collection is allowed.
- Phase 3B dashboard buttons for add-project, pause and revoke are not wired to mutations yet; this is intentional until the next owning subphase defines safe local/user-control flows.
- Phase 3C does not yet connect the project authorization draft to a rendered Electron UI or backend mutation; that remains a follow-up inside Phase 3 after the local privacy primitives are verified.
- `ActivityTracker` can still build unsafe legacy session payloads if future code opts into it before the Phase 4 filtering rewrite; keep sync disabled until that work lands.
- Phase 3D does not yet wire a native Electron folder picker or import a real local project draft into the dashboard form.
- Phase 3E does not yet implement heartbeat/offline status transitions; `AgentStatus.OFFLINE` still needs an owning backend subphase if required before Phase 4.
- Local PostgreSQL/Docker remains unavailable in this environment; backend migration/e2e validation depends on GitHub Actions PostgreSQL 16 when backend schema or database behavior changes.
- Phase 3G does not yet implement the Electron-side deep link handler or confirmation screen; that remains inside Phase 3 before real local pairing is usable.
- Phase 3I does not yet implement the rendered Electron confirmation UI, protocol registration, or automatic heartbeat scheduling after confirmation.
- Phase 3J uses Electron dialogs for confirmation rather than a custom rendered window; this is acceptable for the current linking gate but can be replaced in a later polish subphase.

## Tests executed

Phase 2 full gate on 2026-07-01 with `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`:

- `npm run db:generate`: passed.
- `npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 4/4, dashboard 16/16, agent/shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed.

Phase 3A checks on 2026-07-01:

- RED: backend contract tests failed because agent/project controllers and DTOs did not exist.
- `npm run test --workspace @ghostcommit/backend -- agent.contract.spec.ts projects.contract.spec.ts --runInBand`: passed, 6/6.
- `npm run db:generate`: passed.
- `npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, dashboard 16/16, agent/shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed.
- Local `prisma migrate deploy` and `test:e2e` with `RUN_DATABASE_TESTS=true`: blocked because PostgreSQL was not reachable and Docker Desktop was not running.
- GitHub Actions CI on PR #5: passed on run `28539045218`.
  - PostgreSQL 16 service initialized.
  - `npm ci --ignore-scripts`: passed.
  - `npm run db:generate`: passed.
  - `prisma migrate deploy`: passed.
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm test`: passed.
  - `npm run test:e2e --workspace @ghostcommit/backend`: passed with `RUN_DATABASE_TESTS=true`.
  - `npm run build`: passed.

Phase 3B checks on 2026-07-01:

- RED: dashboard tests for project list, project empty state, project detail privacy controls and agent settings failed against the placeholder shell before implementation.
- `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000`: passed, 20/20.
- `npm run db:generate`: passed.
- `npm run db:validate`: initially failed because `DATABASE_URL` was not set.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, dashboard 20/20, agent/shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.

Phase 3C targeted checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/agent -- projectSelection.test.ts` failed because `projectSelection` did not exist.
- GREEN: `npm run test --workspace @ghostcommit/agent -- projectSelection.test.ts`: passed, 4/4.
- RED: `npm run test --workspace @ghostcommit/agent -- activityTracker.test.ts` failed because `ActivityTracker` synchronized one pending session on construction.
- GREEN: `npm run test --workspace @ghostcommit/agent -- activityTracker.test.ts projectSelection.test.ts`: passed, 5/5.
- RED: `npm run test --workspace @ghostcommit/agent -- startupPolicy.test.ts` failed because `startupPolicy` did not exist.
- GREEN: `npm run test --workspace @ghostcommit/agent -- startupPolicy.test.ts activityTracker.test.ts projectSelection.test.ts`: passed, 7/7.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 20/20, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.
- GitHub Actions CI run `28553173127` on PR #5: passed with PostgreSQL 16, `npm ci --ignore-scripts`, migration deploy, lint, typecheck, unit tests, PostgreSQL e2e and build.

Phase 3D targeted checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/dashboard -- App.test.tsx --reporter=verbose --testNamePattern="creates a local project"` failed because the add-project button was still a placeholder.
- GREEN: the same targeted test passed after implementing the explicit authorization form and `POST /projects` mutation.
- `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000`: passed, 21/21.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 21/21, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.

Phase 3E targeted checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/dashboard -- App.test.tsx --reporter=verbose --testNamePattern="pause and archive|revoke an agent"` failed because archive and revoke controls were still placeholders.
- GREEN: the same targeted test passed after wiring project pause/archive and agent revocation mutations.
- `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000`: passed, 23/23.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 23/23, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.

Phase 3F checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/backend -- agent.contract.spec.ts --runInBand` failed because `AgentController.heartbeat` did not exist.
- GREEN: `npm run test --workspace @ghostcommit/backend -- agent.contract.spec.ts --runInBand`: passed, 3/3.
- PostgreSQL e2e scenarios were added to `backend/test/auth.e2e-spec.ts` for heartbeat token auth, stale offline transition, reconnect and revoked-token rejection.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 23/23, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.
- GitHub Actions CI run `28554286795` on PR #5: passed with PostgreSQL 16, `npm ci --ignore-scripts`, migration deploy, lint, typecheck, unit tests, PostgreSQL e2e and build for head SHA `216f466`.

Phase 3G targeted checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/dashboard -- App.test.tsx --reporter=verbose --testNamePattern="agent link request"` failed before the dashboard link-request form existed.
- GREEN: `npm run test --workspace @ghostcommit/dashboard -- App.test.tsx --reporter=verbose --testNamePattern="agent link request|agent settings"` passed with 2/2 targeted tests after adding the form and fixing the asynchronous installation-list assertion.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 7/7, dashboard 24/24, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.
- GitHub Actions CI run `28609390636` on PR #5: passed with PostgreSQL 16, `npm ci --ignore-scripts`, migration deploy, lint, typecheck, unit tests, PostgreSQL e2e and build for head SHA `1960330`.

Phase 3H targeted checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/agent -- agentLinking.test.ts` failed because `agentLinking` did not exist.
- GREEN: `npm run test --workspace @ghostcommit/agent -- agentLinking.test.ts` passed with 4/4 tests after adding the parser and confirmation service.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 11/11, dashboard 24/24, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.
- GitHub Actions CI run `28610029884` on PR #5: passed with PostgreSQL 16, `npm ci --ignore-scripts`, migration deploy, lint, typecheck, unit tests, PostgreSQL e2e and build for head SHA `9b9b337`.

Phase 3I targeted checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/agent -- agentCredentials.test.ts agentHeartbeat.test.ts agentLinking.test.ts` failed because `agentCredentials` and `agentHeartbeat` did not exist, and `AgentLinkingService` did not persist the returned device token.
- GREEN: the same targeted command passed with 9/9 tests after adding secure credential storage, explicit heartbeat and token persistence after link confirmation.
- `npm run lint --workspace @ghostcommit/agent`: passed.
- `npm run typecheck --workspace @ghostcommit/agent`: passed.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 16/16, dashboard 24/24, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.
- GitHub Actions CI run `28610478740` on PR #5: passed with PostgreSQL 16, `npm ci --ignore-scripts`, migration deploy, lint, typecheck, unit tests, PostgreSQL e2e and build for head SHA `611739c`.

Phase 3J targeted checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/agent -- agentProtocol.test.ts agentLinkFlow.test.ts` failed because `agentProtocol` and `agentLinkFlow` did not exist.
- GREEN: the same targeted command passed with 6/6 tests after adding protocol extraction/queueing and the confirmation orchestration flow.
- `npm run test --workspace @ghostcommit/agent -- agentProtocol.test.ts agentLinkFlow.test.ts agentLinking.test.ts agentHeartbeat.test.ts agentCredentials.test.ts`: passed with 15/15 targeted tests.
- `npm run lint --workspace @ghostcommit/agent`: passed.
- `npm run typecheck --workspace @ghostcommit/agent`: passed.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 22/22, dashboard 24/24, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.
- GitHub Actions CI run `28611092637` on PR #5: passed with PostgreSQL 16, `npm ci --ignore-scripts`, migration deploy, lint, typecheck, unit tests, PostgreSQL e2e and build for head SHA `12adf33`.

Phase 3K targeted checks on 2026-07-02:

- RED: `npm run test --workspace @ghostcommit/agent -- agentConnectionControl.test.ts` failed because `agentConnectionControl` did not exist.
- GREEN: the same targeted command passed after adding local disconnect credential clearing.
- `npm run test --workspace @ghostcommit/agent`: passed with 23/23 tests.
- `npm run lint --workspace @ghostcommit/agent`: passed.
- `npm run typecheck --workspace @ghostcommit/agent`: passed.
- `npm run db:generate`: passed.
- `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 10/10, agent 23/23, dashboard 24/24, shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed with CRLF warnings only.

## External blockers

- Real OAuth provider credentials are external.
- Docker Desktop/PostgreSQL local service is unavailable in this environment; use GitHub Actions PostgreSQL 16 or a local PostgreSQL 16 service for future migration/e2e validation.

## Next exact task

Commit Phase 3K atomically, push the branch, verify GitHub Actions, then continue within Phase 3 without starting Phase 4.
