# Screen-Time Heartbeat Plan

Daily play usage uses server timestamps and the `Asia/Jakarta` default timezone.

Planned heartbeat flow:

1. Server starts a game session after validating ownership, limits, and energy settings.
2. Client sends periodic active-play heartbeat facts.
3. Server increments active play seconds and updates `lastHeartbeatAt`.
4. Server ignores client device time.
5. Parent overrides are evaluated server-side.

This boilerplate includes schema and service interfaces only.
