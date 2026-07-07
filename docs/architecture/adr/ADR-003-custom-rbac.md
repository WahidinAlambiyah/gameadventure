# ADR-003: Use Custom Database RBAC

## Status

Accepted

## Decision

Use database-driven roles and permissions instead of hard-coded UI-only authorization.

## Consequences

Authorization can be audited and evolved, but every protected server path must call role, permission, and ownership helpers explicitly.
