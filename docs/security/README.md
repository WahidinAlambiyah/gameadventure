# Security Architecture

Security controls prepared in the boilerplate:

- Strict TypeScript.
- Zod environment and request validation.
- Better Auth lifecycle foundation.
- Parent email/password registration and login through Better Auth.
- Server-side RBAC helpers hydrated from persisted roles and permissions.
- Server-side ownership checks for child profile APIs.
- Generic registration errors in the custom UI to avoid revealing whether an email exists.
- HTTP security headers and CSP foundation.
- Structured logger with redaction.
- Argon2id password/PIN hashing utility.
- Rate-limit abstraction.
- Turnstile adapter abstraction.
- Audit and security event schema.
- Public-only service worker caching.
- Server-enforced parent gate for sensitive parent controls.

Auth schema compatibility:

- Better Auth is configured to map `session.token` to the existing `tokenHash` column.
- Better Auth is configured to map `verification.value` to the existing `valueHash` column.
- Do not rename those fields or edit the applied initial migration without a reviewed migration plan.

Enumeration note:

- With `requireEmailVerification=false` and Better Auth auto sign-in behavior, the raw Better Auth signup endpoint may still return a distinguishable existing-account error.
- The custom registration UI intentionally displays a generic failure message and does not expose whether an email already exists.
- Full endpoint-level enumeration mitigation is deferred until a reviewed email-verification or account-creation policy is added.

Concurrency note:

- `POST /api/v1/children` uses a PostgreSQL advisory transaction lock scoped to `parentProfileId` before checking and creating the active child profile.
- The default test suite includes an in-memory simultaneous-request regression test.
- A database-backed concurrency test is available when `TEST_DATABASE_URL` is configured; it creates and removes only exact temporary records and never resets or truncates the database.

Parent gate note:

- Parent PINs are exactly four digits and are hashed with Argon2id.
- The parent-gate cookie is httpOnly, sameSite strict, HMAC-SHA256 signed, and expires after 15 minutes.
- The token is bound to the authenticated user, parent profile, and a separate-domain HMAC fingerprint of the current PIN hash.
- Raw PIN hashes are never placed in the token payload.
- Five failed PIN attempts lock the gate for 15 minutes and return `Retry-After`.
- Parent PIN reset remains deferred until a reviewed reauthentication path is selected.

Unresolved production tasks:

- Select transactional email provider.
- Add persistent rate-limit storage.
- Add production observability.
