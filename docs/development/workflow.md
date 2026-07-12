# Workflow Pengembangan

## 1. Tentukan scope

- Buat branch dengan tujuan tunggal.
- Catat acceptance criteria, protected boundaries, dan validation commands.
- Small bug memerlukan diagnosis dan focused test, bukan PRD penuh.
- Large feature atau architecture change memerlukan design/PRD secukupnya dan ADR bila keputusan arsitektur berubah.

## 2. Investigasi

- Baca `README.md`, `AGENTS.md`, ADR relevan, dan dokumentasi feature.
- Gunakan source, routes, Prisma, migrations, configuration, dan tests sebagai implementation truth.
- Periksa local changes sebelum editing dan jangan overwrite unrelated work.

## 3. Implementasi

- Jaga boundaries `src/features`, `src/server`, dan `src/game`.
- Enforce authorization dan ownership server-side.
- Jangan memperluas scope tanpa persetujuan.

## 4. Validasi

- Jalankan focused tests lebih dahulu.
- Jalankan lint/typecheck/build sesuai risiko dan scope.
- Gunakan test database terpisah untuk DB-backed checks.
- Manual browser validation harus mencatat scenario dan hasil aktual.

## 5. PR dan merge

- Review diff dan accidental files.
- Jelaskan perubahan, tests, failures, dan unresolved risks.
- Jangan gunakan `--no-verify`.
- Merge hanya setelah required checks dan review selesai.

## 6. Documentation dan phase closeout

- Update canonical docs bila behavior/status berubah.
- Jangan mengubah ADR lama untuk menutupi drift; buat ADR baru atau update drift report.
- Tutup phase dengan status yang jujur: implemented, partial, placeholder, atau planned.
