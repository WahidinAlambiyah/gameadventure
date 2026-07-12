# Workflow Feature Development

1. Baca root `AGENTS.md`, dokumentasi, skill, dan implementation evidence yang relevan.
2. Investigasi current behavior dan local changes.
3. Definisikan user problem, scope terkecil, out of scope, dan acceptance criteria.
4. Identifikasi dependency, security/data/concurrency risk, serta kebutuhan ADR/dokumentasi.
5. Implementasikan perubahan minimal sesuai module dan authority boundaries.
6. Jalankan focused validation lalu checks tambahan sesuai risiko.
7. Jalankan manual test yang relevan dan catat `PASS`, `PARTIAL`, `NOT RUN`, atau `BLOCKED`.
8. Review diff, accidental files, migration, API/security impact, dan documentation impact.
9. Buat PR dengan evidence, limitation, dan rollback consideration; jangan gunakan `--no-verify`.
10. Merge setelah required checks/review, lalu pastikan dokumentasi kanonis telah diperbarui.
