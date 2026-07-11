# Roadmap dan Riwayat Phase 1

Dokumen ini mencatat delivery history, bukan janji production readiness. Manual validation hanya dianggap selesai bila ada evidence eksplisit.

| Phase           | Delivery                   | PR  | Catatan                                                        |
| --------------- | -------------------------- | --- | -------------------------------------------------------------- |
| Phase 1A        | Parent onboarding          | #3  | Bootstrap parent, settings, role, dan ownership foundation     |
| Phase 1B        | Parent gate dan controls   | #4  | PIN, lockout, gate cookie, settings, dan screen-time policy    |
| Phase 1C        | Adventure map dan sessions | #5  | Map, start/heartbeat/end, dan ownership enforcement            |
| Phase 1C Hotfix | Auth/runtime stability     | #6  | Better Auth password hashing dan session stability             |
| Phase 1D        | Question attempt engine    | #7  | Server-authoritative attempt dan completion foundation         |
| Phase 1E        | Child play UX              | #8  | Progress/correctness feedback; canvas validation dapat partial |
| Phase 1F        | Parent progress            | #9  | Read-only progress summary dari `LevelProgress`                |
| Phase 1G        | Multi-question flow        | #10 | Progression, completion, dan next-level unlock                 |

## Arah lanjutan

- Production content catalogue dan authoring/review/publish workflow.
- Rewards dan operational energy economy yang idempotent.
- Child profile mutation dan PIN reset policy.
- Production email, storage, rate limiting, observability, dan PWA validation.
- Operational privileged-role flows.

Current status tetap mengikuti [`feature-status.md`](feature-status.md).
