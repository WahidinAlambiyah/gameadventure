# Database BacaNgaji Adventure

Prisma menggunakan PostgreSQL multi-schema dan `@prisma/adapter-pg`.

## Schema ownership

- `gameadventure_auth`: `User`, `Account`, `Session`, dan `Verification` untuk Better Auth.
- `gameadventure`: parent/child, RBAC, content, gameplay, progress, settings, rewards, energy, dan usage.
- `gameadventure_audit`: `AuditLog` dan `SecurityEvent`.

Application business tables tidak boleh dibuat di `public`.

## Relasi utama

- `User` dapat memiliki satu `ParentProfile`.
- `ParentProfile` memiliki `ChildProfile`, `ParentSecuritySetting`, `ParentalSetting`, usage, dan ledgers.
- `ChildProfile` memiliki `GameSession`, `QuestionAttempt`, `LevelProgress`, `TrackProgress`, usage, dan ledgers.
- Learning hierarchy memakai track, zone, level, lesson, question, option, dan asset models.
- Parent ownership harus tetap menjadi bagian query, bukan hanya pemeriksaan UI.

## Gameplay dan progress

`GameSession` dan `QuestionAttempt` menyimpan session dan fakta jawaban. `LevelProgress` menjadi sumber mastery/unlock per level; session completion dapat menjadi metadata activity tetapi bukan pengganti progress.

`RewardLedger`, `EnergyLedger`, dan enum transaction sudah tersedia sebagai schema foundation. Keberadaan model tersebut tidak berarti operational rewards atau energy economy sudah diterapkan.

## Child profile retention

Lifecycle deletion mengisi `ChildProfile.deletedAt`; application flow tidak melakukan hard delete. `GameSession`, `QuestionAttempt`, `LevelProgress`, `TrackProgress`, `DailyPlayUsage`, `RewardLedger`, dan `EnergyLedger` tetap tersimpan untuk kebutuhan internal. Query parent/child operational hanya membaca child dengan `deletedAt: null`. Restore dan parent-facing deleted-child history tidak tersedia.

## Migration safety

```bash
npm run db:generate
npm run db:migrate
npm run db:deploy
```

- Gunakan `db:migrate` untuk membuat migration development yang direview.
- Gunakan `db:deploy` untuk menjalankan migration yang sudah disetujui.
- Jangan gunakan `prisma db push` sebagai pengganti migration.
- Jangan gunakan `prisma migrate reset` pada database bersama.
- Jangan edit migration yang sudah applied.
- Gunakan `DATABASE_URL` untuk runtime dan `DIRECT_URL` untuk migration connection sesuai `.env.example`.

## Seed

```bash
npm run db:seed
```

Seed bersifat idempotent, development-only, dan menolak `APP_ENV=production`. Seed menyiapkan permissions, roles, demo identities/profiles, dan demo learning content. Data seed bukan bukti production content readiness.

Source of truth struktur tetap `prisma/schema.prisma` dan migration files, bukan ringkasan ini.
