# Phase 1B — Parent Gate dan Parental Controls

Status: **Implemented** melalui PR #4.

## Parent PIN dan gate

- PIN tepat empat digit dan dihash dengan Argon2id.
- Set/change PIN berjalan melalui `PUT /api/v1/parent/security/pin`.
- Verifikasi berjalan melalui `POST /api/v1/auth/parent-gate/verify`.
- Gate cookie ditandatangani, `httpOnly`, `sameSite=strict`, berumur 15 menit, dan terikat current PIN fingerprint.
- Lima failed attempts mengunci gate selama 15 menit.
- PIN reset tetap **Placeholder** sampai reauthentication policy disetujui.

## Protected controls

Parent settings dan parent progress memerlukan authenticated parent, permission yang sesuai, parent gate, serta parent ownership. Settings mencakup daily limit, timezone, dan `energyEnabled`.

`energyEnabled` adalah configuration flag; Phase 1B tidak membuktikan operational energy economy.

## Screen time

Screen-time policy menghitung availability, daily limit, dan temporary parent override. Phase lanjutan menambahkan persisted heartbeat melalui adventure-session flow.

## Evidence

Unit, integration, security, dan opt-in database tests mencakup PIN, signed token, lockout, transaction behavior, settings, gate enforcement, dan policy. Manual browser validation harus dilaporkan terpisah bila benar-benar dijalankan.
