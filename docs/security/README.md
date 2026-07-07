# Security Architecture

Security controls prepared in the boilerplate:

- Strict TypeScript.
- Zod environment and request validation.
- Better Auth lifecycle foundation.
- Server-side RBAC helpers.
- Server-side ownership checks.
- HTTP security headers and CSP foundation.
- Structured logger with redaction.
- Argon2id password/PIN hashing utility.
- Rate-limit abstraction.
- Turnstile adapter abstraction.
- Audit and security event schema.
- Public-only service worker caching.

Unresolved production tasks:

- Select transactional email provider.
- Validate Better Auth schema against the final production migration.
- Add persistent rate-limit storage.
- Add production observability.
