# BacaNgaji Adventure

BacaNgaji Adventure adalah platform belajar ramah anak usia 4–8 tahun. Produk ini menyiapkan petualangan membaca Bahasa Indonesia melalui SastraNusantara dan pengenalan huruf Hijaiyah melalui HijaiyahIsland. Akun dimiliki orang tua; anak direpresentasikan sebagai `ChildProfile`, bukan pengguna autentikasi terpisah.

## Status pengembangan

Fondasi parent onboarding, profil anak, parent gate, pengaturan waktu bermain, adventure map, sesi permainan, question attempt, multi-question progression, level completion, next-level unlock, dan ringkasan progress orang tua sudah tersedia. Rewards, operational energy economy, content administration, beberapa role administratif, storage upload, dan transactional email belum menjadi flow produksi lengkap.

Status rinci dan buktinya tersedia di [feature status](docs/product/feature-status.md).

## Stack terverifikasi

- Node.js 24, Next.js 16 App Router, React 19, dan TypeScript strict.
- Tailwind CSS 4 untuk UI aplikasi dan Phaser 4 untuk mini-game.
- Better Auth untuk autentikasi; Supabase Auth tidak digunakan.
- PostgreSQL melalui Prisma 7 dan `@prisma/adapter-pg`.
- Supabase hanya disiapkan untuk PostgreSQL dan Storage.
- Vitest untuk unit/integration/security tests dan Playwright untuk E2E.

## Mulai cepat

```bash
npm install
Copy-Item .env.example .env
npm run db:generate
npm run dev
```

Sesuaikan placeholder di `.env` untuk lingkungan lokal dan jangan commit secret. Panduan lengkap tersedia di [SETUP.md](SETUP.md).

## Perintah utama

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:unit
npm run test:integration
npm run test:security
npm run test:e2e
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
```

## Struktur repository

```text
src/app/       Next.js pages dan route handlers
src/features/  UI dan validasi berbasis fitur
src/server/    Auth, authorization, persistence, dan business services
src/game/      Phaser scenes dan mini-game
prisma/        Schema, migrations, dan development seed
tests/         Unit, integration, security, dan E2E tests
docs/          Dokumentasi kanonis dan ADR
```

## Batas arsitektur dan keamanan

- Scoring, correctness, progress, completion, rewards, energy, dan unlock harus server-authoritative.
- Child data selalu diperiksa dengan permission dan parent ownership.
- Application business tables tidak boleh dibuat di PostgreSQL `public`.
- Secret dan `SUPABASE_SERVICE_ROLE_KEY` tidak boleh dikirim ke browser.
- Phaser hanya menangani gameplay; Next.js menangani aplikasi, navigasi, dan portal.

Mulai penelusuran dokumentasi dari [docs/README.md](docs/README.md). Keputusan arsitektur historis berada di `docs/architecture/adr/`.
