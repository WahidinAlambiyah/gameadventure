# Dokumentasi BacaNgaji Adventure

`README.md` di root adalah entry point manusia. `AGENTS.md` adalah entry point AI coding agent. File ini adalah indeks dokumentasi kanonis. Current implementation truth tetap berasal dari source code, routes, Prisma schema, migrations, `package.json`, configuration, dan tests.

## Dokumentasi aktif

| Dokumen                                                                    | Tujuan                                               |
| -------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`../README.md`](../README.md)                                             | Ringkasan produk dan quick start                     |
| [`../SETUP.md`](../SETUP.md)                                               | Setup lokal, database, seed, dan validasi            |
| [`architecture/overview.md`](architecture/overview.md)                     | Arsitektur modular monolith dan boundaries           |
| [`architecture/architecture-drift.md`](architecture/architecture-drift.md) | Status implementasi ADR dan drift                    |
| [`api/README.md`](api/README.md)                                           | Inventory route handlers aktual                      |
| [`database/README.md`](database/README.md)                                 | Schema ownership, models, migration, dan seed        |
| [`security/README.md`](security/README.md)                                 | Implemented, partial, dan deferred security controls |
| [`game-design/README.md`](game-design/README.md)                           | Batas Next.js/Phaser dan gameplay authority          |
| [`product/overview.md`](product/overview.md)                               | Tujuan produk dan aktor                              |
| [`product/feature-status.md`](product/feature-status.md)                   | Status fitur dan role berbasis evidence              |
| [`product/roadmap.md`](product/roadmap.md)                                 | Riwayat Phase 1A–1G dan arah lanjutan                |
| [`development/workflow.md`](development/workflow.md)                       | Workflow kontribusi dan closeout                     |
| [`testing/README.md`](testing/README.md)                                   | Struktur test dan status pelaporan                   |
| [`standards/language-policy.md`](standards/language-policy.md)             | Kebijakan bahasa dokumentasi                         |

## Architecture Decision Records

ADR-001 sampai ADR-008 berada di [`architecture/adr/`](architecture/adr/). ADR mencatat keputusan historis dan tidak otomatis membuktikan bahwa seluruh keputusan sudah terimplementasi.

## Development history

Catatan Phase 1A, Phase 1B, PWA, dan screen-time berada di [`development/`](development/). Ringkasan lintas phase berada di [`product/roadmap.md`](product/roadmap.md).

## Standards dan templates

Dokumen aktif di [`standards/`](standards/) harus diverifikasi terhadap implementasi sebelum digunakan. Templates di [`templates/`](templates/) adalah scaffold penulisan, bukan bukti bahwa fitur tersedia.

## Archive

[`archive/kamsiber-security-dashboard/`](archive/kamsiber-security-dashboard/) berisi material impor/historis. Isi archive tidak authoritative untuk arsitektur, API, database, security, feature status, setup, atau perintah development BacaNgaji Adventure.
