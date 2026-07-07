# ADR-006: Use Server-Authoritative Gameplay

## Status

Accepted

## Decision

The server calculates correctness, rewards, energy, progress, and unlocks.

## Consequences

Client submissions are treated as facts, not decisions. Completion and reward writes require idempotency keys.
