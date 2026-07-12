# Setup BacaNgaji Adventure

## Prasyarat

- Node.js 24.x sesuai `package.json` dan `.nvmrc`.
- npm dan PostgreSQL yang dapat diakses dari mesin pengembangan.
- Database development terpisah dari production.

## Environment

Salin template tanpa mengubah atau menghapus `.env.example`:

```powershell
Copy-Item .env.example .env
```

Isi hanya variable yang tercantum pada `.env.example`. Minimum local runtime memerlukan URL aplikasi, koneksi database, serta konfigurasi Better Auth. Integrasi Google OAuth, email provider, Supabase Storage, Turnstile, dan observability dapat tetap kosong bila flow terkait tidak digunakan.

Jangan commit `.env`, credential database, token, atau service-role key. `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server.

## Instalasi dan development

```bash
npm install
npm run db:generate
npm run dev
```

Buka `http://localhost:3000` sesuai nilai default `NEXT_PUBLIC_APP_URL` dan `BETTER_AUTH_URL` pada `.env.example`.

## Database

Gunakan `DATABASE_URL` untuk runtime pooled connection dan `DIRECT_URL` untuk migration connection sesuai placeholder `.env.example`.

```bash
npm run db:migrate
npm run db:seed
```

`npm run db:seed` bersifat development-only, idempotent, dan menolak `APP_ENV=production`. Seed menyiapkan role, permission, akun demo, parent/child demo, serta content demo yang diperlukan adventure flow.

Untuk environment terkelola, deployment migration menggunakan:

```bash
npm run db:deploy
```

Aturan keselamatan database:

- Jangan gunakan `prisma db push`.
- Jangan gunakan `prisma migrate reset` pada database bersama.
- Jangan mengedit migration yang sudah applied.
- Review migration baru sebelum `db:deploy`.

## Validasi

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Focused suites:

```bash
npm run test:unit
npm run test:integration
npm run test:security
npm run test:e2e
```

Sebagian integration test database hanya berjalan bila test database yang sesuai dikonfigurasi. Jangan arahkan test destruktif ke production.

## Manual demo flow

1. Jalankan migration dan development seed.
2. Jalankan `npm run dev`.
3. Register atau login sebagai parent demo.
4. Selesaikan parent onboarding bila diminta.
5. Pilih atau buat `ChildProfile`.
6. Buka adventure map dan mulai level yang tersedia.
7. Jawab pertanyaan sampai level selesai dan periksa unlock level berikutnya.
8. Buka parent gate, lalu periksa settings dan `/parent/progress`.

Catat validasi browser sebagai `PASS`, `PARTIAL`, `NOT RUN`, atau `BLOCKED`. Automated tests tidak menggantikan manual browser validation.

## Batas penting

- Project tidak menggunakan Supabase Auth.
- Jangan mengekspos secret ke client code.
- Jangan menganggap rewards atau operational energy economy sudah lengkap hanya karena schema tersedia.
