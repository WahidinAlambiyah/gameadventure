# Security Architecture

Security controls prepared in the boilerplate:

- Strict TypeScript.
- Zod environment and request validation.
- Better Auth lifecycle foundation.
- Parent email/password registration and login through Better Auth.
- Server-side RBAC helpers hydrated from persisted roles and permissions.
- Server-side ownership checks for child profile APIs.
- HTTP security headers and CSP foundation.
- Structured logger with redaction.
- Argon2id password/PIN hashing utility.
- Rate-limit abstraction.
- Turnstile adapter abstraction.
- Audit and security event schema.
- Public-only service worker caching.

Auth schema compatibility:

- Better Auth is configured to map `session.token` to the existing `tokenHash` column.
- Better Auth is configured to map `verification.value` to the existing `valueHash` column.
- Do not rename those fields or edit the applied initial migration without a reviewed migration plan.

Unresolved production tasks:

- Select transactional email provider.
- Add persistent rate-limit storage.
- Add production observability.
