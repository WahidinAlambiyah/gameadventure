# ADR-004: Children Are Profiles, Not Authenticated Users

## Status

Accepted

## Decision

Children are modeled as `ChildProfile` records under a parent profile.

## Consequences

Child mode must remain scoped to the authenticated parent session and parent gate. The app must not collect child login identifiers.
