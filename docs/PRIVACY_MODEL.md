# GhostCommit Privacy Model

## Product boundary

GhostCommit creates user-controlled proof-of-work reports from minimal development metadata. It is not monitoring software. The developer owns the data and explicitly chooses projects, report contents, approval, export, and sharing.

## Allowed signals

- Session start/end and neutral end reason.
- User-authorized project identifier and display name.
- Filtered paths relative to the authorized project root.
- Aggregate Git statistics and explicitly selected commit references/messages.
- User-written notes, blockers, and deliverables.
- Non-identifying OS family and agent version when needed for support.

## Forbidden data

- File contents, code diffs, binary contents, clipboard contents.
- Absolute paths or files outside explicitly authorized projects.
- Raw hostname, stable hardware/machine identifier, username, or home-directory path.
- Keystrokes, screenshots, browser activity, microphone, webcam, or presence data.
- Passwords, `.env` values, secrets, private keys, certificates, tokens, and API keys.
- Productivity scores, rankings, motivation inference, or evaluative use of time/lines changed.

## Mandatory filtering

The agent filters before persistence or transmission. The API independently rejects forbidden data. Minimum exclusions include `.git`, `node_modules`, `dist`, `build`, `.next`, `coverage`, `.env*`, key/certificate formats, `secrets`, `private`, and binary files.

Paths crossing the API boundary are normalized project-relative POSIX-style strings. Values containing a drive root, UNC prefix, leading slash, traversal segment, or sensitive pattern are rejected.

## Human control

- Tracking is off until the user selects a project.
- Pause/resume state must be visible and effective locally.
- Generated reports start as private drafts.
- Generated text and evidence can be edited or removed.
- Export and sharing require preview and explicit approval.
- Deletion and revocation must be effective and auditable in their owning phases.

## AI boundary

LLMs receive only filtered, previewable snapshots constructed for an explicit generation request. Prompts never contain file contents, absolute paths, hostnames, identifiers, secrets, excluded sessions, or raw provider payloads. Failures log a request identifier and safe error category only.

## Current prototype warning

The audited MVP does not yet enforce this model. In particular, the agent currently sends absolute paths and hostname metadata and stores its token/queue in plaintext. Those flows are development-only until replaced and covered by privacy regression tests.

## Phase 1A identity and consent controls

- OAuth state is random, hash-only in PostgreSQL, expiring and single-use.
- GitHub provider access tokens exist only transiently during the server-side profile request; they are not persisted, logged, returned or placed in URLs.
- Access tokens are short-lived. Refresh tokens are opaque, hash-only at rest, rotated on use and revocable by family.
- The refresh cookie is HttpOnly and SameSite=Lax, limited to `/api/v1/auth`, and Secure in production.
- Consent records contain the policy version, UTC acceptance timestamp and explicit source.
- Consent and personal workspace creation do not authorize or activate activity collection. Tracking remains off until later explicit project authorization.

## Phase 1B-A dashboard identity boundary

- The public dashboard explains GhostCommit as proof-of-work software, not surveillance software.
- The dashboard starts OAuth through the backend and never handles provider tokens directly.
- The dashboard callback removes OAuth query parameters before completing the browser-side session refresh.
- The short-lived access token exists only in React memory. It is not stored in `localStorage`, `sessionStorage`, query parameters, hash fragments, logs or rendered errors.
- Login and callback errors use generic safe language and never echo OAuth `code`, `state`, provider payloads, access tokens or refresh tokens.

## Phase 1B-B onboarding boundary

- Onboarding explains what GhostCommit may use and what it must never use before the user reaches the protected app area.
- Both transparency confirmations are mandatory before consent is recorded.
- The onboarding UI uses the Phase 1A consent endpoint and does not activate collection, agent linking, repository tracking, session creation, reporting, sharing or export.
- Local persistence is limited to a non-sensitive onboarding step/completion marker. It must never contain tokens, OAuth parameters, file paths, project identifiers, secrets or activity payloads.
- `/app/*` remains blocked for authenticated users until consent is present.

## Phase 1B-C app shell boundary

- The shell shows the agent as not installed by default: no activity is collected.
- Empty states explain future capabilities without connecting repositories, starting the agent, creating sessions, generating reports or exporting data.
- Navigation and profile controls are UI placeholders only until their owning phases implement real behavior.

## Phase 2 Today dashboard boundary

- `GET /dashboard/today` is authenticated and owner-derived from the access token; clients cannot request another user’s day by ID.
- The initial implementation is read-only and returns an empty/not-installed overview until future phases create real agent, project, session and draft data.
- The dashboard displays only neutral counts and status labels. It does not compute or render productivity scores, rankings, performance judgments or motivation inference.
- The response and UI must not include file contents, code diffs, absolute paths, hostnames, stable machine identifiers, secrets, provider payloads or tokens.
- Demo data is local UI sample data only. It does not start collection, connect repositories, contact the agent, pause/resume tracking, stop sessions, generate reports, export or share anything.

## Phase 3A project and agent backend boundary

- Agent link requests accept only a user-facing device label, OS family and agent version. Raw hostname, machine identifiers, paths and secrets are rejected.
- Agent tokens are generated server-side, returned only once during confirmation, and stored hash-only. Installation list/revoke responses never expose token material.
- Revocation clears token material immediately and marks the installation `REVOKED`.
- Projects are created only through authenticated explicit user action. The backend derives the personal workspace from the JWT and rejects client-provided ownership fields.
- The project API stores a safe local alias rather than an absolute folder path. Drive roots, slashes, backslashes and absolute path-shaped values are rejected before persistence.
- Project privacy settings include ignored patterns, optional exclusion from reports, and an option to omit file paths from future reports.
- Phase 3A does not yet start the Electron agent watcher, sync activity sessions, read file contents, transmit file paths, generate reports, export data or share anything.
