# API BacaNgaji Adventure

Product APIs menggunakan prefix `/api/v1`. Better Auth memakai `/api/auth/*`; health endpoints berada di root `/api`.

Success envelope berbentuk `{ "success": true, "data": {}, "meta": {} }`. Error envelope berbentuk `{ "success": false, "error": { "code": "...", "message": "..." } }`. Validation error menggunakan HTTP `422` dan `VALIDATION_ERROR`.

Keterangan: **Auth** berarti authenticated session. **Gate** berarti parent-gate cookie valid. Ownership selalu diverifikasi server-side.

| Method    | Path                                                           | Authentication/permission           | Gate  | Ownership                             | Status      | Tujuan response                                   |
| --------- | -------------------------------------------------------------- | ----------------------------------- | ----- | ------------------------------------- | ----------- | ------------------------------------------------- |
| GET, POST | `/api/auth/*`                                                  | Better Auth lifecycle               | Tidak | Tidak                                 | Implemented | Auth handler Better Auth                          |
| GET       | `/api/health`                                                  | Public                              | Tidak | Tidak                                 | Implemented | Process health dan timestamp                      |
| GET       | `/api/ready`                                                   | Public                              | Tidak | Tidak                                 | Implemented | Database readiness                                |
| GET       | `/api/v1/me`                                                   | Auth                                | Tidak | Parent scope bila tersedia            | Implemented | User, roles, permissions, onboarding, child count |
| POST      | `/api/v1/auth/bootstrap-parent`                                | Auth; privileged users ditolak      | Tidak | User sendiri                          | Implemented | Membuat/menemukan parent profile dan role         |
| DELETE    | `/api/v1/auth/parent-gate`                                     | Parent                              | Tidak | Parent sendiri                        | Implemented | Menghapus gate cookie                             |
| POST      | `/api/v1/auth/parent-gate/verify`                              | Parent                              | Tidak | Optional `childId` harus milik parent | Implemented | Verifikasi PIN dan set gate cookie                |
| GET       | `/api/v1/children`                                             | `child:read-own`                    | Tidak | Parent profile                        | Implemented | Daftar child profiles                             |
| POST      | `/api/v1/children`                                             | `child:create`                      | Tidak | Parent id dari session                | Implemented | Membuat child profile                             |
| GET       | `/api/v1/children/:childId`                                    | `child:read-own`                    | Tidak | Child-parent query                    | Implemented | Detail child profile                              |
| PATCH     | `/api/v1/children/:childId`                                    | `child:update-own`                  | Ya    | Active child-parent query             | Implemented | Partial child profile update                      |
| DELETE    | `/api/v1/children/:childId`                                    | `child:delete-own`                  | Ya    | Active child-parent query             | Implemented | Soft-delete child dan retain learning history     |
| GET       | `/api/v1/children/:childId/play-status`                        | Parent                              | Tidak | Child-parent query                    | Implemented | Daily usage/play availability                     |
| GET       | `/api/v1/children/:childId/adventure-map`                      | `child:read-own`                    | Tidak | Service scopes parent dan child       | Implemented | Tracks, levels, progress, unlock state            |
| POST      | `/api/v1/children/:childId/game-sessions`                      | `child:read-own`                    | Tidak | Service scopes parent, child, level   | Implemented | Start session dan first question                  |
| POST      | `/api/v1/children/:childId/game-sessions/:sessionId/heartbeat` | `child:read-own`                    | Tidak | Parent, child, session                | Implemented | Session heartbeat dan play policy                 |
| POST      | `/api/v1/children/:childId/game-sessions/:sessionId/attempts`  | `child:read-own`                    | Tidak | Parent, child, session, question      | Implemented | Attempt result dan next session state             |
| POST      | `/api/v1/children/:childId/game-sessions/:sessionId/end`       | `child:read-own`                    | Tidak | Parent, child, session                | Implemented | Idempotent session end state                      |
| GET       | `/api/v1/children/:childId/progress`                           | `progress:read-own`                 | Ya    | Parent-child service scope            | Implemented | Parent-visible progress summary                   |
| GET       | `/api/v1/parent/security`                                      | Parent                              | Tidak | Parent sendiri                        | Implemented | Sanitized PIN/gate status                         |
| PUT       | `/api/v1/parent/security/pin`                                  | Parent                              | Tidak | Parent sendiri                        | Implemented | Set/change PIN dan rotate gate token              |
| GET       | `/api/v1/parent/settings`                                      | `parent-setting:read-own`           | Ya    | Parent profile                        | Implemented | Settings dan usage summary                        |
| PATCH     | `/api/v1/parent/settings`                                      | `parent-setting:update-own`         | Ya    | Parent profile                        | Implemented | Update limits, timezone, energy flag              |
| GET       | `/api/v1/parent/dashboard`                                     | Belum diterapkan                    | Tidak | Intended parent scope                 | Placeholder | Intended dashboard summary                        |
| GET       | `/api/v1/admin/roles`                                          | `role:read`                         | Tidak | Tidak                                 | Implemented | Daftar initial roles                              |
| POST      | `/api/v1/admin/content`                                        | Permission belum ditegakkan handler | Tidak | Tidak                                 | Placeholder | Intended draft creation                           |
| PATCH     | `/api/v1/admin/content/:contentId`                             | Permission belum ditegakkan handler | Tidak | Tidak                                 | Placeholder | Intended draft update                             |
| POST      | `/api/v1/admin/content/:contentId/publish`                     | Permission belum ditegakkan handler | Tidak | Tidak                                 | Placeholder | Intended reviewed publish                         |
| GET       | `/api/v1/content/tracks`                                       | Public shell                        | Tidak | Tidak                                 | Placeholder | Intended published tracks                         |
| GET       | `/api/v1/content/levels/:levelId`                              | Public shell                        | Tidak | Tidak                                 | Placeholder | Intended level metadata                           |
| POST      | `/api/v1/game-sessions`                                        | Belum diterapkan                    | Tidak | Intended ownership                    | Placeholder | Legacy generic session start                      |
| GET       | `/api/v1/game-sessions/:sessionId`                             | Belum diterapkan                    | Tidak | Intended ownership                    | Placeholder | Legacy generic session status                     |
| POST      | `/api/v1/game-sessions/:sessionId/attempts`                    | Belum diterapkan                    | Tidak | Intended ownership                    | Placeholder | Legacy generic attempt                            |
| POST      | `/api/v1/game-sessions/:sessionId/complete`                    | Belum diterapkan                    | Tidak | Intended ownership                    | Placeholder | Legacy generic completion/reward                  |

Adventure APIs di bawah `/api/v1/children/:childId/game-sessions` adalah flow operational. Generic `/api/v1/game-sessions*` adalah placeholder dan tidak boleh digunakan sebagai kontrak aktif.

Request detail yang authoritative tetap berada pada Zod schema dan route handler masing-masing; dokumentasi ini tidak menggantikannya.

PATCH child hanya menerima `nickname`, `birthYear`, `ageRange`, `avatarKey`, dan `learningPreferences.focus`. Peralihan representasi usia wajib mengirim nilai pilihan dan `null` untuk alternatifnya. Missing, foreign, dan soft-deleted child menggunakan response `404` generik yang sama.
