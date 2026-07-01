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
| Phase 2 - Today dashboard | Complete locally | Read-only privacy-safe `/dashboard/today` contract and `/app` Today dashboard implemented. Full local gate passed; commit pending. |
| Phase 3 - Projects and agent linking | Not started | |
| Phase 4 - Sessions and timeline | Not started | |
| Phase 5 - Daily draft and explain work | Not started | |
| Phase 6 - Work items and evidence | Not started | |
| Phase 7 - Weekly reports and export | Not started | |
| Phase 8 - Privacy, robustness and release | Not started | |

## Completed features

- Phase 0 repository foundations.
- Phase 1A backend authentication and consent foundations.
- Real PostgreSQL 16 CI gate for Phase 1A.
- Phase 1B-A dashboard public/login foundation:
  - public `/` landing page with privacy-first proof-of-work positioning;
  - static private report example;
  - `/login` route using `POST /api/v1/auth/github/start`;
  - `/auth/callback` route that strips query parameters and refreshes via HttpOnly cookie;
  - `/app/*` protected route guard that redirects anonymous users to `/login`;
  - connected users on `/login` redirect into the authenticated flow;
  - access token retained only in React memory.
- Phase 1B-B onboarding UI:
  - five-step privacy-first onboarding at `/onboarding`;
  - two-column transparency screen: `GhostCommit peut utiliser` and `GhostCommit ne peut jamais utiliser`;
  - mandatory collection notice and data-control confirmations;
  - `GET /api/v1/onboarding/status` loading/error/resume handling;
  - `PATCH /api/v1/onboarding/status` consent submission with Phase 1A DTO;
  - `/app/*` guard redirects authenticated users without consent to onboarding;
  - no collection, repository connection, agent linking, session creation or reporting activated.
- Phase 1B-C app shell:
  - protected `/app/*` shell after consent;
  - responsive sidebar and keyboard-focusable navigation;
  - header with current personal workspace;
  - profile button and notifications area;
  - permanent `Agent non installé — aucune activité collectée` status;
  - useful empty states for `/app/projects`, `/app/activity`, `/app/reports`, `/app/settings`;
  - no future product API calls for repositories, activity, reports or agent.
- Phase 2 Today dashboard:
  - authenticated read-only `GET /api/v1/dashboard/today`;
  - `/app` and `/app/today` render the Today dashboard after consent;
  - header with current date and neutral day message;
  - session card, daily draft card, neutral day activity counts, recent sessions and getting-started checklist;
  - UI/demo coverage for active, paused, no-session, finished and agent-missing states;
  - no productivity score, ranking, file content, absolute path, hostname, token, collection activation, agent mutation, report generation, export or sharing.

## Current technical decisions

- The dashboard starts OAuth with `POST /api/v1/auth/github/start` and obtains an access token only through `POST /api/v1/auth/refresh`.
- The dashboard must not store tokens in `localStorage`, `sessionStorage`, or URLs.
- OAuth callback UI handles loading and safe error states without echoing provider `code`, `state`, tokens, secrets, or raw backend errors.
- Phase 2 exposes a read-only Today summary before real activity exists. Real pause/resume, stop-session and report-generation mutations remain deferred to their owning phases.
- Phase 2 demo data is local UI sample data only and must not contact future product APIs.

## Important files modified in the current Phase 2 subphase

- `backend/src/app.module.ts`
- `backend/src/dashboard/dashboard.controller.ts`
- `backend/src/dashboard/dashboard.module.ts`
- `backend/src/dashboard/dashboard.service.ts`
- `backend/src/dashboard/dashboard.contract.spec.ts`
- `dashboard/src/App.tsx`
- `dashboard/src/App.test.tsx`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Migrations

No new migration planned for Phase 2.

## Risks

- GitHub OAuth cannot be fully exercised locally without a configured provider app; dashboard tests mock backend HTTP contracts and CI validates backend behavior.
- Real Today activity remains empty until later phases implement project authorization, agent linking, sessions and report generation.
- The README still contains older prototype sections and should continue to be corrected progressively as each phase replaces unsafe flows.

## Tests executed

Phase 1B-A, Phase 1B-B and Phase 1B-C were each verified locally before their commits. Detailed results are preserved in `docs/BUILD_LOG.md`.

Phase 2 targeted checks on 2026-07-01:

- RED: backend dashboard contract failed because `dashboard.controller` and `dashboard.service` did not exist.
- RED: dashboard tests failed because `/app` still rendered the Phase 1B-C welcome/empty state instead of the Today dashboard.
- `npm run test --workspace @ghostcommit/backend -- dashboard.contract.spec.ts --runInBand`: passed, 2/2 backend dashboard contract tests.
- `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000`: passed, 16/16 dashboard tests.
- `npm run lint`: passed across all four workspaces.
- `npm run typecheck`: passed across all four workspaces.

Phase 2 full gate on 2026-07-01 with `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`:

- `npm run db:generate`: passed.
- `npm run db:validate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed; backend 4/4, dashboard 16/16, agent/shared no test files.
- `npm run build`: passed.
- `git diff --check`: passed.

## External blockers

- Real OAuth provider credentials are external.
- Real Today activity depends on later phases and must not be simulated as production data.

## Next exact task

Commit Phase 2, then inspect Phase 3 without starting out-of-order work.
