# Status Fitur dan Role

Status yang digunakan: **Implemented**, **Partial**, **Placeholder**, **Planned**, **Deprecated**, dan **Archived**. Model, enum, permission, seed, route shell, atau ADR saja tidak cukup untuk status Implemented.

## Capability status

| Capability                                 | Status      | Evidence                                                                                                               | Limitasi                                                    |
| ------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Parent authentication/onboarding           | Implemented | Better Auth UI/handler, bootstrap route/service, `ParentProfile`, settings, role assignment, tests                     | Production email policy belum selesai                       |
| Child Profile core flow                    | Implemented | Create/list/read UI dan APIs, parent ownership checks, permission/security/concurrency tests                           | Update/delete belum operational                             |
| Child update/delete                        | Placeholder | `PATCH` dan `DELETE /api/v1/children/:childId` adalah placeholder                                                      | Belum ada persistence flow                                  |
| Parent PIN/gate                            | Implemented | Security pages, PIN service, signed cookie, lockout, events, unit/integration tests                                    | PIN reset placeholder                                       |
| Parent settings                            | Implemented | Page/form, gated API, `ParentalSetting`, permissions, integration tests                                                | Energy toggle bukan energy economy                          |
| Adventure map                              | Implemented | Map page, child-scoped API/service, ownership, published content/progress query, tests                                 | Bergantung pada content tersedia                            |
| Adventure game-session start/heartbeat/end | Implemented | Child-scoped APIs, `adventurePlay`, `GameSession`, usage persistence, ownership, tests                                 | Tidak menulis reward/energy ledger                          |
| Question attempt flow                      | Implemented | Attempt API, sequence validation, server correctness, `QuestionAttempt`, tests                                         | Terbatas pada supported content                             |
| Multi-question progression                 | Implemented | Server-confirmed correctness/completion dengan client progression atas ordered session questions, integration coverage | Manual Phaser/browser validation diperlukan untuk UX canvas |
| Level completion                           | Implemented | Server completion dan persisted `LevelProgress`, tests                                                                 | Rewards tidak diproses                                      |
| Next-level unlock                          | Implemented | Unlock dihitung dari persisted progress oleh adventure service, tests                                                  | Content catalogue terbatas                                  |
| Parent progress                            | Implemented | `/parent/progress`, gated API/service, ownership, `LevelProgress`, tests                                               | Sesuai content tersedia                                     |
| Legacy generic game-session APIs           | Placeholder | `/api/v1/game-sessions*` mengembalikan placeholder                                                                     | Bukan adventure APIs operational                            |
| Rewards operational flow                   | Placeholder | `RewardLedger` dan enum tersedia                                                                                       | Tidak ada reward write flow                                 |
| Energy configuration/schema foundation     | Partial     | `energyEnabled`, `EnergyLedger`, settings persistence/tests                                                            | Configuration/schema only                                   |
| Operational gameplay energy economy        | Planned     | ADR dan placeholder menyebut energy                                                                                    | Tidak ada consume/grant flow                                |
| Parent dashboard summary API               | Placeholder | Route mengembalikan placeholder                                                                                        | Endpoint belum operational                                  |
| Content catalogue/public APIs              | Placeholder | Track/level routes placeholder                                                                                         | Adventure service membaca content server-side               |
| Content admin workflow                     | Placeholder | Models, permissions, pages, route shells                                                                               | Create/update/publish belum operational                     |
| PWA production readiness                   | Partial     | Manifest, public-only service-worker foundation, tests                                                                 | Production browser readiness belum penuh                    |
| Storage upload                             | Placeholder | `PlaceholderStorageAdapter`                                                                                            | Upload URL belum diimplementasikan                          |
| Transactional email                        | Placeholder | Adapter foundation                                                                                                     | Provider belum dipilih                                      |

## Role dan actor status

| Role/actor          | Authorization definition                    | Operational flow                                           | Status      |
| ------------------- | ------------------------------------------- | ---------------------------------------------------------- | ----------- |
| Parent              | `PARENT` dan own-resource permissions       | Auth, onboarding, child, PIN, settings, gameplay, progress | Implemented |
| Child Profile actor | Bukan auth role; owned oleh parent          | Selection, map, play, progress                             | Partial     |
| Admin               | `ADMIN` dan admin/read permissions          | Routing dan role-list API; banyak pages placeholder        | Partial     |
| Content Editor      | `CONTENT_EDITOR` dan draft permissions      | Tidak ada editor operational                               | Placeholder |
| Content Reviewer    | `CONTENT_REVIEWER` dan review permission    | Tidak ada review flow                                      | Planned     |
| Publisher           | `PUBLISHER` dan publish/archive permissions | Publish route placeholder                                  | Placeholder |
| Support             | `SUPPORT` dan user/progress permissions     | Tidak ada support flow                                     | Planned     |
| Auditor             | `AUDITOR` dan audit/security permissions    | Audit page placeholder                                     | Placeholder |
| Super Admin         | `SUPER_ADMIN` menerima seluruh permissions  | Authorization foundation; operations belum lengkap         | Partial     |

Tidak ada active capability berstatus Deprecated. Legacy Kamsiber/Security Dashboard documentation berstatus Archived.
