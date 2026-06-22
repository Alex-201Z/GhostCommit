# GhostCommit Implementation Audit

**Audit date:** 2026-06-22  
**Audited baseline:** commit `63a3ea0` on `main`  
**Scope:** Phase 0 only

## Executive summary

GhostCommit is an early MVP, not an empty repository. The NestJS modules, Prisma models, Electron tracking loop, local retry file, OAuth strategies, summary generation, and exports already outline a usable prototype. The prototype does not yet satisfy the new privacy-first contract: it transmits absolute file paths and the raw hostname, stores the user JWT in plaintext, trusts user-supplied ownership identifiers, and exposes several records by ID without verifying ownership.

The correct direction is incremental. Keep the existing NestJS/Electron/Prisma structure, establish reproducible workspace commands and documentation in Phase 0, then replace unsafe contracts in their owning phases. No existing activity or report endpoint should be treated as production-safe until those changes land.

## What already exists

### Repository and infrastructure

- npm workspace root with `backend` and `agent` packages.
- Docker Compose services for PostgreSQL 16 and Redis 7 with health checks and named volumes.
- Root `.env.example` covering database, JWT, OAuth, LLM, Redis, agent, and CORS settings.
- Git ignore rules for environment files, build output, test coverage, local databases, and Electron releases.

### Backend

- NestJS bootstrap with `/api/v1` prefix, Swagger, explicit validation pipe, and CORS setup.
- Prisma models: `User`, `Team`, `TeamMember`, `Repo`, `ActivitySession`, and `DailySummary`.
- Authentication modules for JWT, GitHub OAuth, and GitLab OAuth.
- CRUD-oriented modules for users, teams, repositories, activity sessions, and daily summaries.
- Markdown and PDF export services.
- OpenAI summary integration with a fallback path.
- BullMQ, Redis, and related dependencies are declared but no queue or worker is wired.

### Agent

- Electron tray process and folder-selection dialog.
- Chokidar file watcher with basic build/dependency exclusions.
- Git root, branch, remote, commit-count, and diff-stat detection.
- Fifteen-minute inactivity session grouping.
- JSON-backed offline queue with periodic retry.
- Configuration persistence and API client.

## Broken or incomplete

### Phase 0 blockers found at baseline

- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` do not exist at the root.
- No dependency lockfile is tracked; `.gitignore` explicitly ignores lockfiles, preventing reproducible CI installs.
- No root or agent ESLint configuration exists; the backend lint script mutates files through `--fix`.
- There are no committed tests and the backend Jest command fails when no tests are found.
- `dashboard/` and `shared/` are absent even though the README and specification describe them.
- The development specification was at the repository root rather than `docs/GHOSTCOMMIT_DEVELOPMENT_SPEC.md`.
- `docs/API_CONTRACTS.md`, `docs/PRIVACY_MODEL.md`, `docs/BUILD_LOG.md`, and CI are absent.
- The agent `build` script also invokes platform packaging; missing assets and packaging configuration make it unsuitable as the common CI build gate.
- README OAuth callback examples omit the global `/api/v1` prefix and the frontend/dashboard URL is conflated with `API_URL`.

### Functional incompleteness

- OAuth login has no complete dashboard callback flow; the access token is placed in a redirect query string.
- No refresh-token model, secure rotation, revocation, device token, or onboarding state exists.
- GitLab is implemented despite being outside V1 scope, while the personal-first workspace flow is absent.
- The agent login dialog is a placeholder and cannot capture a token.
- `GET /repos` is called by the agent but no matching backend route exists.
- BullMQ/Redis is not used for generation, export, or retries.
- Prisma migrations contain only `.gitkeep`; there is no initial migration to validate.
- Anthropic support is advertised but returns a fallback message.
- Agent shutdown starts asynchronous session persistence without awaiting completion.
- Local queue/config writes are synchronous, plaintext, and not crash-safe.

## Privacy and security gaps

These are release blockers, but most belong to Phases 1, 3, 4, 5, and 8 rather than this audit-only task.

- `FileWatcher` emits absolute paths and `ActivityTracker` sends them as `filesModified`.
- `ActivityTracker` sends `os.hostname()` and a Git remote label in session metadata.
- Git remote URLs can contain credentials; the detector reads them and the current types permit accidental transmission.
- Agent JWTs are stored in plaintext `config.json` even though `keytar` is installed.
- Pending session data is stored as plaintext JSON, not encrypted or integrity-protected.
- Sensitive ignore coverage is incomplete (`.env*`, keys, certificates, `.next`, `secrets`, `private`, and binaries are not comprehensively filtered).
- The API accepts arbitrary arrays/JSON for file and metadata fields and does not reject absolute or sensitive paths.
- Activity, summary, repository, team, and user read/update/delete operations do not consistently verify that the authenticated user owns the target resource.
- Repository creation trusts a client-provided `teamId` without membership verification.
- OAuth callbacks redirect access tokens through the URL, exposing them to browser history and potentially logs/referrers.
- GitHub/GitLab strategies return provider access tokens in the in-memory profile object; this is unnecessary for current behavior.
- JWT lifetime defaults to seven days, contrary to the target short access-token design.
- CORS falls back to wildcard while `credentials` is enabled; production startup does not fail closed on missing origin configuration.
- LLM errors log the entire SDK error object and existing prompts may contain unsafe absolute paths inherited from sessions.
- Existing export endpoints do not require preview/approval and may export raw path-derived highlights.

## Differences from the specification

| Area                | Existing code                                | Target contract                                                |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Product model       | Team/B2B-first CRUD                          | Personal-first workspace, no invitations in V1                 |
| Dashboard           | Missing                                      | React/Vite foundation in Phase 0; shell in Phase 1             |
| Shared contracts    | Missing directory                            | Dedicated dependency-light shared package                      |
| Agent authorization | Any configured folder starts watching        | Explicit project selection and device-scoped link token        |
| Session identity    | Server-generated only                        | Client UUID and per-device idempotency                         |
| File paths          | Absolute paths                               | Filtered project-relative paths only                           |
| Device metadata     | Raw hostname                                 | User-selected device label and non-identifying installation ID |
| Local security      | Plaintext token and queue                    | OS credential storage plus protected, robust queue             |
| Reports             | Immediate generation/export                  | Private `DRAFT`, editable, previewed, explicitly approved      |
| AI execution        | Inline HTTP request                          | Constrained payload and BullMQ worker                          |
| Authorization       | JWT guard with inconsistent object ownership | Workspace/owner authorization on every user resource           |
| Quality             | Package-local partial scripts                | Root lint, typecheck, test, build, and CI                      |

## Proposed technical decisions

1. Keep the current monorepo and models; do not rewrite the backend or agent.
2. Keep Prisma `Team` temporarily but expose it as a personal workspace in product/API language starting in Phase 1.
3. Treat current activity/summary contracts as prototype-only. Replace them phase-by-phase instead of expanding unsafe DTOs in Phase 0.
4. Make the npm lockfile tracked and use `npm ci` in CI.
5. Make root scripts orchestration-only and deterministic. Packaging installers remains a separate agent command.
6. Add only a health-page dashboard in Phase 0. Public, login, onboarding, and app-shell routes remain Phase 1.
7. Add an initially minimal `shared` package; introduce domain contracts only in the phase that owns them.
8. Use short user access tokens plus rotating, hashed refresh tokens in Phase 1; introduce a separate device token in Phase 3.
9. Use `keytar` for agent secrets and a crash-safe local queue. Never derive identity from hostname or `node-machine-id`.
10. Enforce privacy twice: normalization/redaction in the agent and rejection in NestJS DTO/domain validation.
11. Require owner/workspace scoping in service queries, not only controller guards.
12. Disable LLM generation by default until constrained input snapshots, explicit user action, and safe logging exist in Phase 5.

## Technical risks

- There is no migration history, so evolving the schema safely requires creating and testing a trusted baseline before feature migrations.
- Current data may already contain absolute paths and hostnames; a future migration/cleanup policy is required before production use.
- OAuth behavior cannot be validated without provider credentials and correctly registered callback URLs.
- Electron native dependencies (`keytar`) can complicate Windows/Linux/macOS CI and packaging.
- A JSON queue can be corrupted by crashes or concurrent writes; choosing SQLite versus an encrypted file needs a Phase 3 spike.
- Existing APIs have horizontal-authorization risks; they must not be exposed publicly before ownership tests exist.
- LLM and export code predates approval/evidence rules and should remain disabled from the user journey until Phase 5/7.
- Node 24 is installed locally while the project claims Node 18 support; CI must test the declared baseline or the engine range must be narrowed.

## Prerequisites before Phase 1

- [ ] Root install, lint, typecheck, test, and build commands pass from a clean checkout.
- [ ] Lockfile and minimal CI are committed.
- [x] Dashboard health page builds and has a passing test.
- [x] Shared package compiles without premature business contracts.
- [x] Development spec, API contract, privacy model, audit, and build log are present under `docs/`.
- [x] Environment variables distinguish backend URL, dashboard URL, and OAuth callback URL.
- [x] No real secret signature was found outside examples/documentation by the Phase 0 scan.
- [x] Prisma schema validates and Prisma Client generates.
- [x] Known unsafe prototype endpoints are documented and are not described as production-ready.
- [x] The Phase 1 task list includes authentication threat boundaries and ownership tests before UI polish.

## Phase 0 validation and remaining blockers

Local results on 2026-06-22:

- `npm run db:generate`: passed with Prisma Client 5.22.0.
- `npm run db:validate`: passed; schema valid.
- `npm run lint`: passed for backend, agent, dashboard, and shared.
- `npm run typecheck`: passed for all four workspaces.
- `npm test`: passed; one dashboard test passed. Backend, agent, and shared currently report no test files, which remains test debt rather than coverage.
- `npm run build`: passed for all four workspaces.
- Secret-signature scan: no match outside examples/documentation.
- `docker compose config --quiet`: not run because the Docker CLI is unavailable in this terminal.
- `npm audit --omit=dev`: 16 production dependency advisories remain (11 moderate, 5 high). Non-breaking `npm audit fix` could not reduce them; suggested fixes require breaking NestJS upgrades, so `--force` was intentionally not used.

Phase 1 must remain unopened until:

1. a clean-checkout `npm ci --ignore-scripts` run and the GitHub Actions workflow pass;
2. Docker Compose is validated in an environment with Docker CLI and an initial Prisma migration is created/tested against PostgreSQL;
3. the NestJS dependency upgrade/remediation is planned and the five high advisories are removed or explicitly risk-accepted with compensating controls;
4. the prototype activity/summary routes remain unavailable to untrusted users until owner scoping and privacy validation are implemented in their owning phases.

## Precise Phase 1 task list

Do not start these tasks until all prerequisites above are satisfied.

1. Define Phase 1 shared contracts for authenticated user, personal workspace, onboarding status, and agent-status placeholder.
2. Add Prisma fields/models for personal-workspace creation, onboarding consent timestamps/version, and hashed rotating refresh tokens; create and test the migration.
3. Replace the prototype OAuth callback token-in-query flow with a short-lived authorization handoff and secure refresh-token cookie.
4. Restrict Phase 1 authentication to GitHub; remove GitLab from the user journey without deleting unrelated prototype code prematurely.
5. Create the personal workspace atomically on first successful login and make the operation idempotent.
6. Implement `GET /auth/me`, `POST /workspaces/personal`, `GET /onboarding/status`, and `PATCH /onboarding/status` with DTO validation and owner scoping.
7. Add unit/integration tests for first login, repeated login, workspace ownership, consent requirements, token rotation, revocation, and redacted OAuth errors.
8. Build the public `/` page with product promise, three benefits, privacy section, start action, and static example report.
9. Build `/login` with GitHub-only authentication, clear privacy copy, safe errors, and authenticated redirect.
10. Build the five-step `/onboarding` flow, including the exact two-column transparency copy and mandatory consent checkboxes.
11. Build the accessible responsive `/app/*` shell with sidebar, current workspace, profile menu, non-intrusive notifications, and `Not installed` agent placeholder.
12. Add route guards and loading/empty/error states, then run accessibility keyboard checks.
13. Update Swagger, API contracts, README, and build log; run lint, typecheck, unit/integration tests, dashboard tests, and builds.
