---
name: database-prisma
description: Mengarahkan perubahan Prisma, migration, seed, query, transaction, dan advisory lock secara aman.
---

# Database dan Prisma

## Purpose

Menjaga schema, migration, data, dan concurrency tetap aman serta dapat direview.

## Use This Skill When

Mengubah Prisma schema, migration, seed, query, transaction, atau advisory lock.

## Required Reading

`docs/database/README.md`, `docs/architecture/overview.md`, dan ADR yang relevan di `docs/architecture/adr/`.

## Responsibilities

Verifikasi schema ownership, relasi, migration path, idempotency seed, transaction boundary, lock, dan rollback risk.

## Mandatory Constraints

Tidak boleh `prisma db push`, `prisma migrate reset`, destructive DB command, edit applied migration, atau business table di `public`. Seed wajib deterministic/idempotent. Pertahankan transaction dan advisory lock.

## Expected Workflow

Inspect schema/migration/query -> tentukan apakah migration diperlukan -> ubah minimal -> review SQL/concurrency -> validasi.

## Validation

Gunakan script DB aktual secara aman, focused tests, Prisma validation/generation bila relevan, dan review migration diff.

## Required Output

Schema/data impact, migration answer, transaction/lock impact, commands, dan hasil validasi.

## Out of Scope

Menjalankan perubahan destruktif atau production data repair tanpa otorisasi eksplisit.
