# ADR-007: Use Non-Public PostgreSQL Schemas

## Status

Accepted

## Decision

Use `auth`, `bacangaji`, and `bacangaji_audit` schemas.

## Consequences

No application business table belongs in `public`. Prisma must be configured for multi-schema PostgreSQL.
