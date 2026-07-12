# Architecture Drift

Dokumen ini membandingkan keputusan ADR dengan implementation evidence saat ini. ADR tidak diubah untuk menyamarkan gap implementasi.

| ADR                                   | Status                             | Evidence dan drift                                                                                                                                                |
| ------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-001 Next.js modular monolith      | Accepted and implemented           | Boundaries tersedia di `src/app`, `src/features`, `src/server`, dan `src/game`.                                                                                   |
| ADR-002 Better Auth                   | Accepted and implemented           | Better Auth handler, session loading, Prisma adapter, dan field mapping tersedia; Supabase Auth tidak digunakan.                                                  |
| ADR-003 custom RBAC                   | Accepted but partially implemented | Persisted roles, permissions, hydration, dan server guards tersedia. Beberapa privileged role flow belum operational.                                             |
| ADR-004 children are profiles         | Accepted and implemented           | `ChildProfile` dimiliki `ParentProfile`; tidak ada child authentication identity.                                                                                 |
| ADR-005 Phaser gameplay only          | Accepted and implemented           | Phaser berada di `src/game`; Next.js mengelola application UI dan route flow.                                                                                     |
| ADR-006 server-authoritative gameplay | Accepted but partially implemented | Attempts, progression, completion, dan unlock dihitung server. Rewards dan operational energy economy belum lengkap; generic game-session APIs masih placeholder. |
| ADR-007 non-public PostgreSQL schemas | Accepted and implemented           | Prisma mendeklarasikan `gameadventure_auth`, `gameadventure`, dan `gameadventure_audit`.                                                                          |
| ADR-008 Vercel deployment             | Accepted but partially implemented | Build target tersedia, tetapi active production deployment tidak dapat diverifikasi dari source tree.                                                             |

Tidak ada ADR yang teridentifikasi sebagai Superseded atau Stale or conflicting dengan current code.
