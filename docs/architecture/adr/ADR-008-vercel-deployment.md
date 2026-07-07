# ADR-008: Deploy Web Application to Vercel

## Status

Accepted

## Decision

Deploy the Next.js application to Vercel.

## Consequences

Use pooled `DATABASE_URL` at runtime and direct `DIRECT_URL` for migrations. Cloudflare should initially manage DNS without automatic account changes.
