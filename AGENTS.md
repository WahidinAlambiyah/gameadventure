# Panduan Utama AI Agent

File ini adalah satu-satunya entry point instruksi utama untuk AI coding agent di BacaNgaji Adventure. Instruksi di sini mengungguli panduan di `.agents/`.

## Sebelum bekerja

1. Baca `AGENTS.md`.
2. Baca hanya dokumentasi kanonis yang relevan melalui [`docs/README.md`](docs/README.md).
3. Baca hanya skill, rule, atau workflow yang relevan melalui [`.agents/README.md`](.agents/README.md).
4. Periksa perubahan lokal dan implementation evidence yang relevan sebelum mengedit.

Jangan membaca seluruh `docs/` atau `.agents/` tanpa kebutuhan. Pisahkan fakta terkonfirmasi dari asumsi, jelaskan risiko dan trade-off, lalu kerjakan hanya scope yang disepakati.

## Batas wajib

- Jangan gunakan Supabase Auth. Child profile bukan auth user.
- Jangan buat application business tables di PostgreSQL `public`. Schema yang disetujui hanya `gameadventure_auth`, `gameadventure`, dan `gameadventure_audit`.
- Jangan gunakan `prisma db push`, `prisma migrate reset`, perintah database destruktif, atau mengedit migration yang sudah applied.
- Jangan mengekspos secret, hash, token, cookie, atau service-role key ke browser, log, response, maupun dokumentasi.
- Jangan melemahkan server-side permission, ownership check, parent gate, atau screen-time enforcement.
- Gameplay tetap server-authoritative untuk correctness, scoring, reward, progress, energy, completion, dan unlock. Phaser hanya renderer/input.
- Pertahankan transaction boundary dan advisory-lock behavior pada critical section; jangan mengubahnya tanpa analisis concurrency dan regression test.
- Jangan gunakan `npm audit fix --force` atau `--no-verify`.
- Pertahankan module boundaries di `src/features`, `src/server`, dan `src/game`.
- Catat perubahan arsitektur melalui ADR baru; jangan menulis ulang history ADR untuk menyembunyikan drift.

## Validasi dan laporan akhir

Gunakan script aktual dari `package.json` sesuai scope. Jangan menyatakan validasi yang tidak dijalankan sebagai lulus. Laporan akhir wajib mencakup:

- file yang berubah;
- behavior yang berubah;
- dampak schema, API, dan security;
- test dan validasi beserta hasilnya;
- status validasi manual (`PASS`, `PARTIAL`, `NOT RUN`, atau `BLOCKED`);
- limitation atau risiko tersisa;
- dampak dokumentasi;
- saran commit message.
