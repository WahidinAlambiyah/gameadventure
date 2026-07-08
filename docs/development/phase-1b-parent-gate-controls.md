# Phase 1B Parent Gate Controls

Phase 1B adds a server-enforced parent gate for sensitive parent controls.

## Parent PIN

- Parent PINs must be exactly four digits.
- PINs are hashed with Argon2id through the shared password/PIN hashing utility.
- PIN plaintext and PIN hashes must never be returned from APIs or written to logs, audit metadata, or security-event metadata.
- Initial PIN setup is available from `/parent/security/set-parent-pin`.
- PIN changes require the current PIN.
- Password-based PIN reset is deferred until a reviewed Better Auth reauthentication API is selected.

## Gate Cookie

- Successful PIN setup or verification issues an httpOnly, sameSite strict parent-gate cookie named `bacangaji_parent_gate`.
- The cookie is HMAC-SHA256 signed with the server auth secret.
- The signed payload is bound to the user id, parent profile id, expiry, and a fixed-length HMAC fingerprint derived from the current `pinHash`.
- The PIN fingerprint uses a separate HMAC domain string from the gate-token signature.
- Gate tokens expire after 15 minutes.
- Changing the parent PIN invalidates previously issued gate cookies.
- Failed PIN attempts, lockout updates, and successful verification timestamps do not invalidate existing valid gate cookies.
- `DELETE /api/v1/auth/parent-gate` clears only the parent-gate cookie.

## Lockout

- Five invalid PIN attempts lock the parent gate for 15 minutes.
- Locked responses return HTTP `429`, code `PARENT_GATE_LOCKED`, and `Retry-After`.
- A locked PIN is not rechecked until the lockout expires.
- Once a lockout expires, the next invalid PIN starts a fresh failure cycle at attempt 1.
- Invalid and locked outcomes are returned from the parent-scoped transaction first, then converted to API errors after failed-attempt state and security events are committed.
- PIN changes verify the current PIN and update the new PIN hash in one parent-scoped advisory-lock transaction.

## Server Enforcement

- Parent pages use server-side gate checks before rendering sensitive parent routes.
- Set PIN and verify PIN pages remain reachable without an active gate.
- Parent settings APIs require parent settings permission and a valid parent-gate cookie.
- Admin, super-admin, and unrelated non-parent roles are not bootstrapped into parent gate flows.

## Screen-Time Policy

- `GET /api/v1/children/:childId/play-status` derives child ownership from the server session.
- The policy evaluates daily limits against the configured parent timezone.
- Next reset is returned as the UTC instant for the next local midnight.
- Active-play accumulation and heartbeat writes remain future work.

## Test Coverage

- Unit tests cover signed gate-token validation, expiry, tampering, cross-user and cross-parent rejection, and PIN-version invalidation.
- Unit tests cover screen-time limit boundaries, parent override, timezone usage date, and local-midnight reset.
- Integration tests cover PIN setup/change/verify, duplicate setup rejection, lockout, safe status responses, gate-protected settings, non-parent rejection, play-status ownership, and gate-cookie clearing.
- Set `TEST_DATABASE_URL` to enable the opt-in database-backed simultaneous PIN lockout test.
