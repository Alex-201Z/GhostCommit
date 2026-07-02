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

## Phase 3A projects and local agent backend foundations

### Agent routes

All Phase 3A agent management routes require the authenticated user Bearer token. The caller is always derived from the JWT.

#### `POST /agent/link-request`

Creates a short-lived local agent link request and returns `{ linkCode, deepLink, expiresAt }`. Accepted request fields are limited to `deviceLabel`, `osFamily` (`windows`, `macos`, `linux`) and `agentVersion`. Raw hostname, machine identifier, absolute paths, tokens and secrets are rejected by DTO validation.

#### `POST /agent/link/confirm`

Consumes a valid, unexpired link code for the authenticated user and creates an `AgentInstallation`. Returns the public installation and a one-time `agentToken`. The token is hash-only at rest and is never returned by list/revoke endpoints.

#### `GET /agent/installations`

Lists only the authenticated user’s devices. The response excludes `tokenHash`, raw tokens, hostnames and machine identifiers.

#### `POST /agent/installations/:id/revoke`

Revokes only an installation owned by the authenticated user. Revocation sets status `REVOKED`, records `revokedAt`, and clears the stored token hash/expiry so new agent calls can no longer authenticate once agent-token guarded sync endpoints are introduced.

### Project routes

All Phase 3A project routes require the authenticated user Bearer token. The API derives the personal workspace from the JWT user and never accepts `teamId`, `userId` or owner fields from the client.

#### `POST /projects`

Creates a project only after explicit user action. Request:

```json
{
  "displayName": "GhostCommit",
  "gitProvider": "LOCAL",
  "localAlias": "ghostcommit-dev",
  "branch": "main",
  "ignoredPatterns": ["dist/**", ".env*"]
}
```

The API stores a safe local alias, not an absolute local path. `localAlias` rejects drive roots, slashes, backslashes and traversal-like path values. New projects default to `ACTIVE` because creation itself is the explicit authorization action.

#### `GET /projects`

Lists projects for the authenticated user’s personal workspace. Optional `status` may be `ACTIVE`, `PAUSED` or `ARCHIVED`.

#### `GET /projects/:id`

Returns a project only if it belongs to the authenticated user.

#### `PATCH /projects/:id`

Updates privacy settings such as `ignoredPatterns`, `includeFilePathsInReports` and `excludedFromReports`, plus safe display fields.

#### `POST /projects/:id/pause`

Sets `trackingStatus` to `PAUSED` and prevents active tracking for that project.

#### `POST /projects/:id/resume`

Sets `trackingStatus` back to `ACTIVE`.

#### `POST /projects/:id/archive`

Sets `trackingStatus` to `ARCHIVED`, disables active tracking and records `archivedAt`.

### Phase 3A backend invariants

- No project is created without an authenticated `POST /projects`.
- No absolute path is accepted or returned.
- User A cannot read, update, pause, resume, archive or revoke User B resources.
- Ignored patterns are stored as project privacy configuration for later agent filtering.
- Existing legacy `/repos/*` prototype routes remain documented as legacy and must not be used by the dashboard V1 flow.

## Phase 3B dashboard project and agent screens

Phase 3B adds dashboard client routes for the Phase 3A backend surfaces. These routes are consent-gated, require the in-memory Bearer access token, and do not start collection by themselves.

### `/app/projects`

Reads `GET /projects` and renders the user's explicitly authorized projects.

UI guarantees:

- shows only project display name, provider, safe local alias, tracking status and neutral recent-activity wording;
- never renders absolute paths, file contents, code diffs, hostnames, machine identifiers, tokens or secrets;
- keeps project creation as a user-initiated button placeholder until the owning project-selection flow is implemented;
- empty state links to `/app/settings/agent` and clearly states that no folder is tracked before authorization.

### `/app/projects/:id`

Reads `GET /projects/:id` and renders privacy controls for one owned project.

UI guarantees:

- displays safe project metadata and privacy settings only;
- exposes pause/report controls as UI-only placeholders in this subphase;
- does not call session, activity, report-generation, export or sharing APIs.

### `/app/settings/agent`

Reads `GET /agent/installations` and renders linked local agent installations.

UI guarantees:

- displays user-facing device label, OS family, agent version, status and neutral last-contact wording;
- never displays token material, secrets, raw hostnames or stable machine identifiers;
- download/relaunch and revoke controls are UI-only placeholders until their mutation flows are implemented.

### Phase 3B invariants

- No Electron watcher, file watching, session sync, report generation, export or sharing is enabled.
- The dashboard uses `/projects/*` and `/agent/installations`, not legacy `/repos/*`.
- The short-lived access token remains in React memory only.

## Phase 3C local agent/project selection foundations

Phase 3C adds local-only agent foundations for preparing a project authorization request. It does not introduce a new backend endpoint and does not activate activity collection.

### Local authorization draft

The Electron agent can create a local authorization draft from a user-selected Git repository folder. The draft keeps the absolute `localRootPath` inside the agent process only and exposes a safe `apiPayload` compatible with `POST /projects`:

```json
{
  "displayName": "ghostcommit",
  "gitProvider": "LOCAL",
  "localAlias": "ghostcommit",
  "ignoredPatterns": [".git/**", "node_modules/**", "dist/**", "build/**", ".next/**", "coverage/**", ".env*"]
}
```

The agent must call `toCreateProjectPayload(..., { confirmed: true })` after explicit user confirmation before sending the payload to the backend.

### Phase 3C invariants

- Previously configured local paths are not watched automatically at agent startup.
- Pending sessions are not synchronized automatically when `ActivityTracker` is constructed.
- Non-Git folders cannot become project authorization drafts.
- The API payload never includes absolute paths, parent directory paths, file contents, code diffs, hostnames, machine identifiers, tokens or secrets.
- User-provided ignored patterns are filtered locally before they can enter the project payload.

## Phase 3D explicit dashboard project authorization flow

Phase 3D wires the `/app/projects` add-project control to the existing `POST /projects` endpoint. This is still a user-controlled metadata authorization flow; it does not start the Electron watcher, heartbeat, file scanning or session synchronization.

### `/app/projects` create form

The dashboard renders an explicit authorization form after the user clicks `Ajouter un projet`. Submitted request:

```json
{
  "displayName": "Client Portal",
  "gitProvider": "LOCAL",
  "localAlias": "client-portal",
  "branch": "main",
  "ignoredPatterns": ["dist/**", ".env*"]
}
```

Client guarantees:

- requires an explicit confirmation checkbox before submission;
- sends the authenticated request to `POST /projects` with the in-memory Bearer token;
- never asks for or renders absolute local paths, file contents, code diffs, token material, raw hostnames or machine identifiers;
- adds the returned project to the visible list without calling activity, session, report or agent sync endpoints.

## Phase 3E dashboard project and agent control mutations

Phase 3E wires existing Phase 3A control endpoints into the dashboard. These are user-control mutations only and do not activate collection.

### `/app/projects/:id`

User actions:

- `POST /projects/:id/pause` from `Mettre le suivi en pause`;
- `POST /projects/:id/resume` from `Reprendre le suivi` when the project is paused;
- `POST /projects/:id/archive` from `Archiver ce projet`.

Client guarantees:

- updates the visible project status from the API response;
- sends only the in-memory Bearer token and no local path/activity payload;
- does not call activity, session, report, export or agent sync endpoints.

### `/app/settings/agent`

User action:

- `POST /agent/installations/:id/revoke` from `Révoquer cet appareil`.

Client guarantees:

- updates the visible installation status from the API response;
- never renders token material, raw hostnames or stable machine identifiers;
- does not start heartbeat, session synchronization, file watching or project scanning.

## Phase 3F agent heartbeat and offline status

Phase 3F adds a privacy-safe device-token heartbeat endpoint. It is control-plane only and does not accept activity, path or host metadata.

### `POST /agent/heartbeat`

Authentication:

```http
Authorization: Bearer <agent-token>
```

Behavior:

- validates the one-time-issued device token by hash;
- rejects missing, invalid, expired or revoked tokens with `401`;
- sets the installation `status` to `CONNECTED`;
- updates `lastSeenAt`;
- returns the public installation shape only.

The endpoint does not accept or require a request body.

### Offline transition

`GET /agent/installations` marks stale `CONNECTED` installations as `OFFLINE` when `lastSeenAt` is older than `AGENT_OFFLINE_AFTER_MS` or the development default. Revoked installations remain `REVOKED`.

### Phase 3F invariants

- Agent tokens are never returned by heartbeat or list responses.
- Heartbeat responses never include `tokenHash`, raw hostname, stable machine identifier, local path, file content, code diff, secret, session payload or report data.
- Revoked tokens cannot heartbeat.

## Phase 3G dashboard agent link request flow

Phase 3G wires the dashboard `/app/settings/agent` page to the existing `POST /agent/link-request` endpoint. This is a user-initiated control-plane flow only; it creates a short-lived pairing code and does not confirm the device, issue an agent token, start heartbeat or collect activity.

### `/app/settings/agent` link request form

Submitted request:

```json
{
  "deviceLabel": "Laptop dev",
  "osFamily": "windows",
  "agentVersion": "0.1.0"
}
```

Client guarantees:

- sends the authenticated request to `POST /agent/link-request` with the in-memory Bearer token;
- displays only the short-lived link code, deep link and expiry returned by the backend;
- never asks for or renders token material, token hashes, raw hostnames, stable machine identifiers, local paths, file contents, code diffs, sessions, reports or exports;
- does not call heartbeat, activity, session, report, export or agent sync endpoints.
