# Security Policy

Report vulnerabilities privately to the project owner. Do not open public issues for exploitable security defects.

## Sensitive Data

Never log passwords, PINs, raw tokens, cookies, service-role keys, full authorization headers, or production connection strings.

Child data must be minimized. Do not collect child email, phone number, exact school, exact location, government ID, or unnecessary personal photos.

## Authentication

Authentication uses Better Auth with PostgreSQL. Supabase Auth is prohibited. Cookies must be HTTP-only, `SameSite=Lax`, and `Secure` in production.

Password reset and verification tokens must be single-use and stored as hashes.

## Authorization

Authorization is database-driven RBAC and is separate from authentication. Child data access must validate both permission and ownership. Prefer scoped repository methods such as `findChildByIdAndParentId`.

## Secrets

Only `NEXT_PUBLIC_` variables may be exposed to browser bundles. `SUPABASE_SERVICE_ROLE_KEY` is server-only.

## Dependencies

Run `npm audit` regularly. Do not force major upgrades without validating build, tests, and runtime compatibility.
