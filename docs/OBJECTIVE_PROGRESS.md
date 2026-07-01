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
| Phase 0 — Foundations and technical contract | Complete | Documentation, workspace commands, CI, dashboard health page and shared package are present. |
| Phase 1A — Authentication and data foundations | Complete | GitHub OAuth, refresh rotation, personal workspace, consent foundations and PostgreSQL 16 CI validation are merged in `main`. |
| Phase 1B-A — Public interface and login | Complete locally | Public landing, GitHub login start, callback refresh, safe errors and route guards implemented and verified locally. Commit pending. |
| Phase 1B-B — Privacy-first onboarding UI | Not started | Must wait for 1B-A verification and commit. |
| Phase 1B-C — App shell | Not started | Must wait for onboarding UI verification and commit. |
| Phase 2 — Today dashboard | Not started | |
| Phase 3 — Projects and agent linking | Not started | |
| Phase 4 — Sessions and timeline | Not started | |
| Phase 5 — Daily draft and explain work | Not started | |
| Phase 6 — Work items and evidence | Not started | |
| Phase 7 — Weekly reports and export | Not started | |
| Phase 8 — Privacy, robustness and release | Not started | |

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
  - connected users on `/login` redirect to `/app`;
  - access token retained only in React memory.

## Current technical decisions

- Phase 1B-A uses the existing Phase 1A backend contract: the dashboard starts OAuth with `POST /api/v1/auth/github/start` and obtains an access token only through `POST /api/v1/auth/refresh`.
- The dashboard must not store tokens in `localStorage`, `sessionStorage`, or URLs.
- The protected `/app/*` route guard may exist for redirects, but the app shell UI itself remains Phase 1B-C.
- OAuth callback UI handles loading and safe error states without echoing provider `code`, `state`, tokens, secrets, or raw backend errors.

## Important files modified

- `dashboard/src/App.tsx`
- `dashboard/src/App.test.tsx`
- `dashboard/tsconfig.json`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `README.md`
- `docs/OBJECTIVE_PROGRESS.md`

## Migrations

No new migration planned for Phase 1B-A.

## Risks

- GitHub OAuth cannot be fully exercised locally without a configured provider app; dashboard tests will mock backend HTTP contracts and CI will continue validating backend behavior.
- The dashboard currently has only a Phase 0 health page; Phase 1B-A replaces it with real routes and must preserve build/test simplicity.
- The README still describes prototype behavior and will need progressive correction as phases replace unsafe flows.

## Tests executed

Phase 1B-A local checks on 2026-07-01:

- `npm run test --workspace @ghostcommit/dashboard -- --reporter=verbose --testTimeout=10000`: passed, 6/6 dashboard tests.
- `npm run lint --workspace @ghostcommit/dashboard`: passed.
- `npm run typecheck --workspace @ghostcommit/dashboard`: passed after adding `vite/client` types.
- `npm run build --workspace @ghostcommit/dashboard`: passed.
- Full gate with `DATABASE_URL=postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit_test?schema=public`:
  - `npm run db:generate`: passed.
  - `npm run db:validate`: passed.
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm test`: passed; backend 2/2, dashboard 6/6, agent/shared no test files.
  - `npm run build`: passed.
  - `git diff --check`: passed.

## External blockers

- Real OAuth provider credentials are external. Development uses injectable API URLs and mocked frontend tests until provider configuration is supplied.

## Next exact task

Commit Phase 1B-A, then start Phase 1B-B privacy-first onboarding UI with failing tests for the five-step consent journey.
