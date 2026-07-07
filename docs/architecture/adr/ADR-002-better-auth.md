# ADR-002: Use Better Auth Instead of Supabase Auth

## Status

Accepted

## Decision

Use Better Auth for authentication lifecycle with PostgreSQL persistence.

## Consequences

Supabase remains PostgreSQL and Storage only. Auth schema compatibility must be validated before production migration.

The current Prisma schema keeps the auth tables in `gameadventure_auth`. Better Auth field mapping is used for the existing column names:

- `session.token` -> `tokenHash`
- `verification.value` -> `valueHash`

Future migrations must preserve this mapping or intentionally migrate both schema and Better Auth configuration together.
