# Security BacaNgaji Adventure

## Implemented controls

- Better Auth dengan persisted sessions; Supabase Auth tidak digunakan.
- Strict TypeScript serta Zod untuk environment dan request validation.
- Database-driven RBAC dengan server-side permission guards.
- Parent ownership checks untuk child, gameplay, dan progress resources.
- Update dan soft-delete child memerlukan permission khusus, parent gate valid, active ownership, serta response not-found generik untuk missing/foreign/deleted ID.
- Anak adalah `ChildProfile`, bukan auth user.
- Parent PIN dihash dengan Argon2id; PIN plaintext/hash tidak dikembalikan ke client.
- Parent-gate cookie `httpOnly`, `sameSite=strict`, ditandatangani HMAC, terikat user/parent/PIN fingerprint, dan berumur 15 menit.
- Lima kegagalan PIN memicu lockout 15 menit dan `Retry-After`.
- Server-authoritative attempts, progression, completion, dan unlock.
- Structured logging dengan redaction serta audit/security event persistence.
- Security headers, CSP foundation, public-only service-worker caching.
- PostgreSQL advisory transaction locks pada child creation dan parent PIN critical sections yang memiliki concurrency risk.
- Child lifecycle mutation memakai child-scoped lock; delete mengambil parent-scoped lock lebih dahulu untuk menjaga one-active-child invariant.
- Application tables berada di non-public schemas.

## Partial controls

- Rate-limit abstraction tersedia tetapi persistent/distributed production storage belum dipasang.
- Turnstile adapter/configuration tersedia tetapi deployment coverage bergantung environment.
- PWA security foundation tersedia; production offline validation belum lengkap.
- Admin/RBAC foundation ada, tetapi tidak semua privileged workflows operational.
- `energyEnabled` dan ledger schema tersedia, tetapi energy economy belum operational.

## Placeholder adapters dan flows

- Transactional email provider.
- Supabase Storage upload URL flow melalui `PlaceholderStorageAdapter`.
- Parent PIN reset/reauthentication flow.
- Generic game-session reward/energy completion APIs.
- Content administration dan audit UI tertentu.

## Deferred production concerns

- Production email/verification dan endpoint-level account enumeration policy.
- Distributed rate limiting, observability, alerting, dan incident operations.
- Production CSP hardening bila third-party services diaktifkan.
- Review deployment secrets dan database access profile.

## Invariants

- Jangan mengekspos `SUPABASE_SERVICE_ROLE_KEY` atau secret lain ke browser.
- Jangan percaya correctness, score, reward, energy, progress, atau unlock dari client.
- Jangan membuat application business tables di `public`.
- Authorization wajib ditegakkan server-side; hidden UI bukan security control.
- Child query harus memvalidasi permission sekaligus parent ownership.
