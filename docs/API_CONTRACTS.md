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
