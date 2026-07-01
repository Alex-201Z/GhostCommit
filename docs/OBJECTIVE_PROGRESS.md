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
| Phase 3 - Projects and agent linking | In progress | Phase 3A backend foundations are complete and validated in GitHub Actions PostgreSQL 16. Next: Phase 3B dashboard project/agent screens. |
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

## Current technical decisions

- The dashboard starts OAuth with `POST /api/v1/auth/github/start` and obtains an access token only through `POST /api/v1/auth/refresh`.
- The dashboard must not store tokens in `localStorage`, `sessionStorage`, or URLs.
- Phase 2 demo data is local UI sample data only and must not contact future product APIs.
- Phase 3A keeps the existing prototype `/repos/*` routes untouched for compatibility but introduces `/projects/*` as the V1 privacy-safe surface.
- Local project authorization stores a safe alias, not a local absolute path. The Electron agent must keep the absolute path local-only in later subphases.
- Agent link requests accept only non-identifying metadata. Agent tokens are one-time response values and hash-only at rest.

## Important files modified in the current Phase 3A subphase

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260701_phase_3a_projects_agent_foundations/migration.sql`
- `backend/src/app.module.ts`
- `backend/src/agent/*`
- `backend/src/projects/*`
- `backend/test/auth.e2e-spec.ts`
- `docs/API_CONTRACTS.md`
- `docs/PRIVACY_MODEL.md`
- `docs/BUILD_LOG.md`
- `docs/OBJECTIVE_PROGRESS.md`
- `README.md`

## Migrations

- `20260701_phase_3a_projects_agent_foundations`: adds agent link/install tables, agent/project status enums, local project provider, and project privacy fields.

## Risks

- GitHub OAuth cannot be fully exercised locally without a configured provider app.
- Real Today activity remains empty until later phases implement project authorization, agent linking, sessions and report generation.
- Local PostgreSQL validation was blocked by unavailable Docker/PostgreSQL, so Phase 3A was validated in GitHub Actions PostgreSQL 16 instead.
- The Electron agent still contains prototype flows that can expose absolute paths/legacy token handling; they were not expanded in Phase 3A and must be replaced in later Phase 3 subphases before real collection is allowed.

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

## External blockers

- Real OAuth provider credentials are external.
- Docker Desktop/PostgreSQL local service is unavailable in this environment; use GitHub Actions PostgreSQL 16 or a local PostgreSQL 16 service for future migration/e2e validation.

## Next exact task

Start Phase 3B dashboard project/agent screens with TDD, without enabling Electron collection yet.
