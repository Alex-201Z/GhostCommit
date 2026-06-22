# GhostCommit Agent Guide

## Architecture

GhostCommit is an npm-workspaces monorepo. Preserve the existing boundaries:

- `backend/`: NestJS API, Prisma ORM, PostgreSQL, and future BullMQ/Redis workers.
- `agent/`: Electron local agent. It observes only explicitly authorized Git projects and queues minimal metadata locally.
- `dashboard/`: React, TypeScript, and Vite web application.
- `shared/`: dependency-light TypeScript contracts and safe constants shared by applications.
- `docs/`: product contract, privacy model, API contracts, audit, and build log.

Do not replace this architecture, introduce microservices, or rename Prisma domain concepts unless the active phase explicitly requires it. `Team` may remain the persistence name while the product displays “Workspace/Espace”.

## Privacy-first rules

These rules are absolute:

- Never read, store, log, or transmit file contents or code diffs.
- Never implement keylogging, screenshots, clipboard capture, microphone/webcam capture, browser monitoring, presence monitoring, productivity scoring, rankings, or inferred employee performance.
- Never send absolute local paths, raw hostnames, machine identifiers, secrets, `.env` values, OAuth tokens, Git tokens, or API keys to the backend or an LLM.
- Track only repositories and directories explicitly selected by the user.
- Filter sensitive paths locally before synchronization and validate the same boundary again in the API.
- Reports remain private drafts until the user edits and explicitly approves them. Never auto-share or auto-publish.
- The user must be able to pause collection and remove sessions, reports, devices, projects, local cache, and account data as each owning phase is implemented.
- Logs must contain identifiers and safe error summaries, never raw session payloads or prompts.

When a requested change conflicts with these rules, stop and document the conflict instead of implementing it.

## TypeScript conventions

- Keep TypeScript strict in new packages. Do not add new `any` types; prefer `unknown` plus narrowing.
- Use explicit DTOs at process and network boundaries and `class-validator` for NestJS request bodies.
- Keep controllers thin, business rules in services, and persistence behind `PrismaService`.
- Prefer small modules with one responsibility and named exports for shared contracts.
- Use `async`/`await`, handle rejected promises, and avoid floating promises during shutdown.
- Use relative project paths in activity data. Normalize and validate them before use.
- Run Prettier and ESLint; do not hide failures with blanket disables.
- Add tests before changing behavior. A regression fix starts with a failing test.

## Commands

Requirements: Node.js 18 or newer, npm 9 or newer, Docker, and Docker Compose.

```powershell
npm install
Copy-Item .env.example .env
npm run docker:up
npm run db:generate
```

Development:

```powershell
npm run dev:backend
npm run dev:dashboard
npm run dev:agent
```

Quality gates:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Useful database commands:

```powershell
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:studio
```

## Completion rules

- Read `docs/GHOSTCOMMIT_DEVELOPMENT_SPEC.md` and the files related to the active phase before editing.
- Work on exactly one specification phase at a time. Never mix Phase 1 work into Phase 0 or anticipate later phases with unused schemas or endpoints.
- Before finishing any task, run lint, typecheck, tests, and build. Report every failure honestly.
- Update `docs/BUILD_LOG.md` with the phase, decisions, modified files, verification commands, and remaining risks.
- Do not commit secrets or generated local environment files.

