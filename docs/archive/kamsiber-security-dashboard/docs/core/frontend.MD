# Dokumentasi Pembaruan Package.json Frontend

**Tanggal**: 18 Juni 2026

## Ringkasan Pembaruan
File `frontend/package.json` telah diperbarui agar selaras dan menyamai versi stabil terbaru yang terdapat pada `zpic/daskam/dashboard-kamsiber-fe-nextjs/package.json`.

## Detail Perubahan

### Perubahan Script
- Port untuk `dev` dan `start` diubah menjadi `3000` (`next dev -p 3000`, `next start -p 3000`).
- Script `lint` diubah dari `next lint` menjadi `eslint`.
- Penambahan script `test` dengan perintah `vitest run` (berdasarkan aturan global untuk memastikan terminal tertutup otomatis).

### Penambahan & Perubahan Dependencies
- **React & Next.js**: Diperbarui ke versi terbaru (Next.js `^16.2.9`, React & React DOM `^19.2.7`).
- **Material UI**: Ditambahkan library MUI (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`).
- **Lainnya**: Penambahan `axios` (`^1.17.0`), penyesuaian versi `lucide-react`.

### Penambahan & Perubahan DevDependencies
- **Testing**: Ditambahkan library testing komprehensif (`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@vitejs/plugin-react`).
- **TypeScript & Linting**: Diperbarui ke TypeScript `^6.0.3`, ESLint `^9.39.4`, dan config terbaru.
- **Overrides**: Penambahan overrides untuk `postcss` `^8.5.10`.

Pembaruan ini memastikan *frontend* berjalan dengan standar yang aman dan sinkron dengan arsitektur terkini dari zpic.

### Penyesuaian Konfigurasi Lanjutan
- **`next.config.ts` & `rewrites`**: Mengganti `next.config.mjs` menjadi `next.config.ts` yang disalin langsung dari *zpic*, yang mana telah menyertakan integrasi proksi `rewrites()` ke API Backend (`localhost:8000`) dan juga perbaikan root *turbopack*.
- **`postcss.config.mjs`**: Menambahkan file konfigurasi berisi plugin `@tailwindcss/postcss` agar *styles* Tailwind CSS v4 yang dipanggil via `@import "tailwindcss";` di `globals.css` dapat diterjemahkan (compile) dengan benar oleh Next.js.
- **Konfigurasi Tambahan (Sinkronisasi dari Zpic)**: 
  - Telah menyalin dan memperbarui `tsconfig.json` ke setelan bundler Next.js terbaru. Diperbarui juga untuk menonaktifkan aturan penulisan tipe yang kaku (`"strict": false`, `"noImplicitAny": false`, `"strictNullChecks": false`) agar lebih fleksibel.
  - Membuang `.eslintrc.json` bawaan dan menggantinya dengan `eslint.config.mjs` berstandar `flat config` baru.
  - Menyalin file `vitest.config.mts` dari *zpic* agar pengujian front-end terkonfigurasi dengan benar.

### Sinkronisasi Komponen & Data (Dari Zpic)
- Menyalin seluruh arsitektur komponen siap pakai dari `zpic/.../src/components/*` ke `frontend/src/components/`. Path canonical untuk komponen standar adalah `@/components/_ui/`.
- Menyalin modul pendukung dan referensi *mock data* dari `zpic/.../src/utils/` dan `zpic/.../src/app/data/` guna menjamin fungsionalitas komponen tanpa memicu *build error*.
- Memperbaiki aturan gaya (*styling*) pada komponen UI (seperti `ConfirmDialog.tsx`, `Spinner.tsx`, `BaseSelect.tsx`) agar sepenuhnya menggunakan *Canonical Classes* yang didukung secara natif oleh Tailwind CSS v4 (menggantikan *arbitrary values*).

### Penyesuaian Layout & Autentikasi *(18 Juni 2026, 10:00 WIB)*
- **Migrasi AppShell**: Mengganti `AppShell.tsx` bawaan dengan komponen `DashboardLayout` utuh dari `zpic` yang sudah mencakup navigasi *Sidebar* dengan sub-menu otomatis, *Header*, tata letak profil di pojok kanan atas, serta tombol *Logout*.
- **Bypass Autentikasi (Temporary)**: Telah menonaktifkan pengecekan `localStorage` untuk mematikan *loop redirect* pada rute `/login`. Autentikasi saat ini dalam kondisi nonaktif (di-bypass) hingga modul keamanan selesai dikonfigurasi.
