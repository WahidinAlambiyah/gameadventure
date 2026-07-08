# Screen-Time Heartbeat Plan

Daily play usage uses server timestamps and the `Asia/Jakarta` default timezone.

Planned heartbeat flow:

1. Server starts a game session after validating ownership, limits, and energy settings.
2. Client sends periodic active-play heartbeat facts.
3. Server increments active play seconds and updates `lastHeartbeatAt`.
4. Server ignores client device time.
5. Parent overrides are evaluated server-side.

Implemented in Phase 1B:

- `GET /api/v1/children/:childId/play-status` verifies server-side child ownership.
- Daily limit evaluation uses the configured parent timezone.
- The next reset is calculated as the UTC instant for the next local midnight.
- Parent overrides are represented in policy output when `parentOverrideUntil` is active.

Deferred:

- Heartbeat writes that increment active-play seconds.
- Runtime game-session start/stop enforcement.
- Parent override mutation UI.
