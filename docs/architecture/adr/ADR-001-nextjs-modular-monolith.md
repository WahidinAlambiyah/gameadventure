# ADR-001: Use Next.js Modular Monolith

## Status

Accepted

## Decision

Use a Next.js App Router modular monolith for web UI, APIs, PWA shell, and gameplay mounting.

## Consequences

This keeps deployment simple on Vercel and avoids premature microservices. Domain boundaries must remain explicit in `src/features`, `src/server`, and `src/game`.
