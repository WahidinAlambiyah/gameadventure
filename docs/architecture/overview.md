# Ringkasan Arsitektur

BacaNgaji Adventure adalah modular monolith berbasis Next.js App Router. Satu deployment menangani public pages, authentication UI, parent portal, child mode, admin surface, REST route handlers, PWA shell, dan pemuatan Phaser secara lazy.

## Batas modul

- `src/app`: pages, layouts, dan HTTP route handlers.
- `src/features`: komponen dan validasi yang dimiliki feature.
- `src/server`: authentication, authorization, repositories, parent gate, database, audit, security adapters, dan business services.
- `src/game`: Phaser scenes dan mini-game rendering; bukan sumber keputusan scoring atau progress.

## Identity dan authorization

Better Auth mengelola lifecycle akun parent dan privileged users. Supabase Auth tidak digunakan. Role dan permission dihydrate dari database, tetapi setiap server path tetap harus memanggil guard yang sesuai.

Anak adalah `ChildProfile` di bawah `ParentProfile`, bukan auth user. Child mode berjalan dalam authenticated parent session. Query child-sensitive harus memeriksa parent ownership.

## Gameplay authority

Client mengirim fakta seperti `questionId`, `selectedOptionId`, dan `clientSequence`. Service server memvalidasi session, ownership, urutan attempt, correctness, progression, completion, dan unlock. Rewards dan operational energy economy belum menjadi flow lengkap meskipun schema foundation tersedia.

Next.js mengelola navigation, session, content loading, dan feedback aplikasi. Phaser dibatasi pada rendering dan interaction mini-game.

## Persistence

Prisma mengakses PostgreSQL melalui `@prisma/adapter-pg`:

- `gameadventure_auth`: Better Auth data.
- `gameadventure`: parent, child, RBAC, content, gameplay, progress, rewards, energy, dan screen-time.
- `gameadventure_audit`: audit logs dan security events.

Application business tables tidak boleh dibuat di `public`.

Supabase disiapkan untuk PostgreSQL dan Storage saja. Storage, transactional email, persistent distributed rate limiting, dan production observability belum seluruhnya operational.

Lihat ADR untuk decision history dan [`architecture-drift.md`](architecture-drift.md) untuk status realisasinya.
