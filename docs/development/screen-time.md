# Screen Time dan Adventure Heartbeat

Status: **Implemented** untuk adventure-session flow; generic `PlaceholderScreenTimeService` tetap bukan flow aktif.

## Current behavior

- Parent settings menyimpan `dailyLimitSeconds`, timezone, `energyEnabled`, dan optional `parentOverrideUntil`.
- `GET /api/v1/children/:childId/play-status` mengembalikan usage/play status untuk owned child.
- Adventure session start memeriksa ownership, content availability, dan play policy.
- Heartbeat operational berada di `POST /api/v1/children/:childId/game-sessions/:sessionId/heartbeat`.
- Terminal session state menghentikan heartbeat client dan end operation bersifat idempotent.
- Daily usage persistence dan parent override diproses server-side.

## Evidence dan limitasi

Unit tests mencakup policy. Integration tests mencakup start, heartbeat, override, terminal cleanup, dan session end. Dokumentasi ini tidak mengklaim browser background throttling atau multi-device production behavior sudah tervalidasi penuh.
