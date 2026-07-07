# BacaNgaji Adventure

BacaNgaji Adventure is a production-oriented boilerplate for a child-friendly learning platform for ages 4-8. It prepares foundations for two learning adventures:

- SastraNusantara: Bahasa Indonesia reading with direct syllable and phonics methods.
- HijaiyahIsland: Hijaiyah letters, basic harakat, and early Quran-reading concepts.

This repository is foundation only. It intentionally does not include full curriculum, paid subscriptions, production assets, advanced analytics, or complete games.

## Architecture Summary

The app is a Next.js modular monolith deployed to Vercel behind a custom domain managed in Cloudflare. Supabase is used only for PostgreSQL and Storage. Supabase Auth is not used.

Business tables use PostgreSQL schemas:

- `gameadventure_auth`: Better Auth user/account/session/verification data.
- `gameadventure`: parent, child, RBAC, content, progress, rewards, energy, and screen-time data.
- `gameadventure_audit`: audit logs and security events.

No application business table belongs in PostgreSQL `public`.

## Stack

Next.js App Router, React, TypeScript strict mode, Tailwind CSS, Phaser, Prisma, Better Auth, PostgreSQL, Zod, React Hook Form, Vitest, Playwright, ESLint, Prettier, Husky, lint-staged, GitHub Actions, and a PWA manifest/service worker foundation.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

Use placeholder values locally. Do not commit `.env`.

## Database Setup

Configure:

- `DATABASE_URL`: pooled runtime connection.
- `DIRECT_URL`: direct migration connection.

Commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed is development-only and creates roles, permissions, demo users, one demo child, and two placeholder tracks.

## Development Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Testing commands:

```bash
npm run test:unit
npm run test:integration
npm run test:security
npm run test:e2e
```

Tests do not require a production database. Database-backed integration should use a disposable test database.

## Deployment Notes

Vercel build command:

```bash
npm run build
```

Ensure Prisma client generation runs before build when needed:

```bash
npm run db:generate
```

Run production migrations manually with reviewed SQL:

```bash
npm run db:deploy
```

Do not run production migrations automatically from pull requests.

For Cloudflare, use DNS-only records for the Vercel custom domain unless a reviewed proxy configuration is added.

## Security Warnings

- Do not use Supabase Auth.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Do not collect child email, phone, exact school, exact location, ID numbers, or unnecessary photos.
- Do not trust gameplay results sent by the browser.
- Do not cache authenticated API responses in the service worker.

## Current Scope

Implemented foundations:

- App shell and route placeholders.
- Better Auth route mounting.
- Custom RBAC helpers.
- Ownership-scoped child endpoint.
- Prisma schema and initial migration.
- Ledger-based reward and energy schema.
- Parent PIN hashing utility.
- PWA manifest and public-only service worker.
- Lazy-loaded Phaser demo.
- CI, docs, ADRs, and initial tests.

Out of scope:

- Complete curriculum.
- Complete admin CMS.
- Production email provider.
- Production game assets.
- Payment, subscription, analytics, AI tutor, native apps, social features, leaderboard, multiplayer, loot boxes, or real-money game currency.
