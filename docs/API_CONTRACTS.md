# GhostCommit API Contracts

## Global conventions

- Base prefix: `/api/v1`.
- JSON bodies and ISO 8601 UTC timestamps.
- Unknown DTO fields are rejected.
- User-owned operations derive the owner from the authenticated JWT, never from a client-provided user ID.
- Errors never echo OAuth codes, states, provider tokens, access tokens or refresh tokens.

## Phase 1A routes

### `POST /auth/github/start`

Creates a cryptographically random OAuth state. Only its SHA-256 hash is stored, with a ten-minute expiry and single-use consumption. Returns `{ "authorizationUrl": "https://github.com/..." }`.

### `GET /auth/github/callback?code=...&state=...`

Validates and consumes the state, exchanges the code server-side, upserts the GitHub user and personal workspace, then sets `ghostcommit_refresh` as an HttpOnly, SameSite=Lax cookie (`Secure` in production). Redirects to the fixed configured dashboard callback URL with no token, code or state appended.

### `POST /auth/refresh`

Reads the refresh cookie, atomically revokes it, creates a replacement and returns `{ accessToken, expiresAt, user }`. Refresh tokens are never returned in JSON. Reuse of a revoked refresh token revokes its entire token family.

### `POST /auth/logout`

Revokes the presented refresh session and clears its cookie. Returns 204. The operation is idempotent.

### `GET /auth/me`

Requires a Bearer access token and returns the authenticated public user profile.

### `POST /workspaces/personal`

Requires a Bearer access token. Idempotently returns the caller's personal `Team`. PostgreSQL uniqueness on `personalOwnerId` guarantees one personal workspace per user.

### `GET /onboarding/status`

Requires a Bearer access token. Returns only the caller's onboarding state, privacy consents and personal workspace state.

### `PATCH /onboarding/status`

Requires `{ privacyPolicyAccepted: true, hasReadCollectionNotice: true, understandsDataControl: true, policyVersion: "YYYY-MM-DD", source: "ONBOARDING" | "API" }`. Persists a versioned UTC consent and advances only the caller's status. It does not start collection.

## Legacy prototype routes

GitHub/GitLab Passport initiation and token-in-query callbacks are disabled. Other prototype users, teams, repository, activity and summary routes remain development-only and retain the ownership warnings recorded by the audit; they were not expanded in Phase 1A.

## Phase 1B-A dashboard routes

These are dashboard client routes, not new backend endpoints.

### `/`

Public landing page explaining GhostCommit as a privacy-first proof-of-work tool. It includes the product promise, three benefits, privacy positioning, a static report example, and a CTA to `/login`.

### `/login`

Public authentication page. It checks for an existing refresh cookie with `POST /auth/refresh`; an already authenticated user is redirected to `/app`. Anonymous users can start GitHub OAuth through `POST /auth/github/start`. The dashboard renders the returned authorization URL as an explicit GitHub authorization link.

### `/auth/callback`

Dashboard callback landing page after the backend OAuth callback redirects back to the fixed dashboard URL. The page immediately removes query parameters from the browser URL, then calls `POST /auth/refresh` with credentials included. On success, it keeps the access token in memory only and redirects to `/app`. On failure, it shows a safe, generic error.

### `/app/*`

Protected client route guard only in Phase 1B-A. It attempts `POST /auth/refresh` and redirects anonymous users to `/login`. The full app shell is intentionally deferred to Phase 1B-C.

## Dashboard token handling

- Refresh tokens are transported only by the existing HttpOnly cookie.
- Access tokens are not written to `localStorage`, `sessionStorage`, URL query parameters, or hash fragments.
- OAuth `code`, `state`, provider errors and tokens are never echoed in UI errors.

## Phase 1B-B dashboard onboarding

### `/onboarding`

Protected dashboard route. It refreshes the existing HttpOnly-cookie session if needed, then reads `GET /onboarding/status` with the in-memory Bearer access token.

The UI is a five-step privacy-first journey:

1. welcome and product goal;
2. personal workspace confirmation;
3. how GhostCommit works;
4. data never collected;
5. consent and user control.

The final step shows two columns:

- `GhostCommit peut utiliser`;
- `GhostCommit ne peut jamais utiliser`.

The user cannot finish until both required confirmations are checked. Completion sends:

```json
{
  "privacyPolicyAccepted": true,
  "hasReadCollectionNotice": true,
  "understandsDataControl": true,
  "policyVersion": "2026-06-22",
  "source": "ONBOARDING"
}
```

to `PATCH /onboarding/status`.

### Onboarding guard behavior

- Authenticated users without consent are redirected from `/app/*` to `/onboarding`.
- Authenticated users on `/login` are redirected to `/onboarding`; completed onboarding can then route onward to `/app`.
- `/onboarding` redirects anonymous users to `/login`.
- Intermediate onboarding step progress may be stored locally as a non-sensitive step index. Tokens, OAuth parameters, file paths, project data, secrets and activity data are never stored there.
- Finishing onboarding does not start the agent, connect repositories, create sessions, or activate collection.

## Phase 1B-C dashboard app shell

### `/app/*`

Protected, consent-gated dashboard shell. It includes:

- responsive sidebar navigation;
- keyboard-focusable links;
- header with current personal workspace name;
- profile menu button placeholder;
- non-intrusive notification area;
- permanent agent status badge: `Agent non installé — aucune activité collectée`.

Prepared routes:

- `/app`
- `/app/projects`
- `/app/activity`
- `/app/reports`
- `/app/settings`

The pages intentionally render useful empty states only. They do not call future repository, agent, activity, reporting, settings mutation, export or sharing APIs.

## Phase 2 Today dashboard

### `GET /dashboard/today`

Requires a Bearer access token. Returns a privacy-safe overview for the authenticated user’s current day.

Current Phase 2 implementation is read-only and returns the empty/not-installed state until later phases create real agent, project, session and report data:

```json
{
  "date": "YYYY-MM-DD",
  "agentStatus": "NOT_INSTALLED",
  "session": { "state": "AGENT_NOT_CONNECTED" },
  "draft": { "status": "NOT_GENERATED", "preview": [] },
  "activity": {
    "totalSessions": 0,
    "projectsTouched": 0,
    "commitsDetected": 0,
    "workItemsOrBlockers": 0
  },
  "recentSessions": [],
  "checklist": {
    "accountCreated": true,
    "agentLinked": false,
    "firstProjectTracked": false,
    "firstSessionSynced": false,
    "firstDraftGenerated": false
  },
  "canGenerateDraft": false
}
```

The response must not contain productivity scores, rankings, absolute paths, hostnames, stable machine identifiers, file contents, tokens or secrets.

### `/app` and `/app/today`

Consent-gated dashboard routes rendering the Today overview:

- header with current date and the neutral message `Voici votre activité de développement du jour`;
- permanent agent-not-installed status remains visible in the shell;
- session card supports the five Phase 2 states in UI/demo mode;
- daily draft card supports `NOT_GENERATED`, `NEEDS_REVIEW` and `VALIDATED`;
- day activity counters are neutral counts only, never evaluative scores;
- recent sessions list is limited to five items;
- getting-started checklist shows what still needs to be enabled.

The demo button uses local sample data only. It does not call repository, agent, pause/resume, stop-session, report-generation, export or sharing APIs. Real mutation endpoints listed in the product specification remain deferred to their owning phases.
