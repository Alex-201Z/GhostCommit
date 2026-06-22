# Phase 0 Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabiliser GhostCommit et rendre la Phase 0 documentée, exécutable et vérifiable sans commencer les fonctionnalités de la Phase 1.

**Architecture:** Conserver le monorepo npm existant et ses applications NestJS/Electron, ajouter le package React/Vite minimal prévu par la spécification et créer un package `shared` vide mais compilable. Centraliser les commandes de qualité à la racine, sans modifier les contrats métier ni le schéma Prisma.

**Tech Stack:** TypeScript, npm workspaces, NestJS, Electron, React, Vite, Vitest, ESLint, Prettier, Prisma.

---

### Task 1: Documentation and repository contract

**Files:**
- Move: `GhostCommit_Development_Spec.md` to `docs/GHOSTCOMMIT_DEVELOPMENT_SPEC.md`
- Create: `docs/IMPLEMENTATION_AUDIT.md`
- Create: `docs/API_CONTRACTS.md`
- Create: `docs/PRIVACY_MODEL.md`
- Create: `docs/BUILD_LOG.md`
- Create: `AGENTS.md`

- [ ] **Step 1:** Document the existing architecture, privacy violations, specification gaps, technical decisions, risks, and Phase 1 prerequisites.
- [ ] **Step 2:** Record the current API as legacy behavior and mark target contracts by phase so the documentation does not imply unsafe endpoints are approved.
- [ ] **Step 3:** Record the mandatory privacy boundary and contributor commands in `AGENTS.md`.
- [ ] **Step 4:** Review all documents for contradictions, placeholders, and accidental Phase 1 scope.

### Task 2: Monorepo quality commands

**Files:**
- Modify: `package.json`
- Modify: `backend/package.json`
- Modify: `agent/package.json`
- Create: `.eslintrc.cjs`
- Create: `.prettierrc.json`
- Create: `agent/.eslintrc.cjs`
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/src/index.ts`

- [ ] **Step 1:** Add root `lint`, `typecheck`, `test`, `build`, and `format:check` scripts that invoke each workspace explicitly.
- [ ] **Step 2:** Separate the agent TypeScript build from distributable packaging so `npm run build` remains deterministic in CI.
- [ ] **Step 3:** Add a compilable `shared` package without inventing Phase 1 domain contracts.
- [ ] **Step 4:** Run the commands and fix only configuration or compile blockers.

### Task 3: Minimal dashboard health page

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/tsconfig.json`
- Create: `dashboard/vite.config.ts`
- Create: `dashboard/vitest.config.ts`
- Create: `dashboard/index.html`
- Create: `dashboard/src/main.tsx`
- Create: `dashboard/src/App.tsx`
- Create: `dashboard/src/App.test.tsx`
- Create: `dashboard/src/index.css`
- Create: `dashboard/.env.example`

- [ ] **Step 1: Write the failing health-page test**

```tsx
it('shows the Phase 0 health message', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'GhostCommit is running' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @ghostcommit/dashboard`
Expected: FAIL because `App` does not exist yet.

- [ ] **Step 3: Implement the minimal app**

Create a single accessible health page, React Router root route, and TanStack Query provider. Do not add Phase 1 public, login, onboarding, or app-shell screens.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @ghostcommit/dashboard`
Expected: PASS for the health-page test.

### Task 4: CI and final verification

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `docs/BUILD_LOG.md`
- Modify: `docs/IMPLEMENTATION_AUDIT.md`

- [ ] **Step 1:** Add a minimal GitHub Actions job for install, Prisma generation, lint, typecheck, test, and build.
- [ ] **Step 2:** Run `npm install` and preserve the generated lockfile for reproducible installs.
- [ ] **Step 3:** Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- [ ] **Step 4:** Run `npx prisma validate` and `npm audit --omit=dev` as supplemental checks.
- [ ] **Step 5:** Record exact results and unresolved blockers in the audit and build log.
