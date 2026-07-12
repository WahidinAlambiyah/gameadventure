# Phase 1A — Parent Onboarding

Status: **Implemented** melalui PR #3.

## Flow

1. User register/login melalui Better Auth.
2. `POST /api/v1/auth/bootstrap-parent` memerlukan authenticated session.
3. Privileged atau incompatible existing roles ditolak.
4. Server membuat atau menemukan `ParentProfile`, default `ParentalSetting`, dan assignment role `PARENT` secara idempotent.
5. Parent dapat membuat satu active MVP child profile; parent id tidak diterima dari request body.

## Security dan persistence

- Children tetap profiles, bukan auth users.
- Child queries selalu parent-scoped.
- Child creation menggunakan advisory transaction lock untuk menjaga invariant concurrent creation.
- Better Auth password/session data berada di `gameadventure_auth`.

## Evidence

Unit tests mencakup onboarding behavior. Integration/security tests mencakup bootstrap, permission, ownership, dan child concurrency; DB-backed concurrency test bersifat opt-in melalui test database.

Production email verification dan provider bukan bagian Phase 1A yang selesai.
