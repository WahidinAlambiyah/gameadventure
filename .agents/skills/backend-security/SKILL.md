---
name: backend-security
description: Menjaga batas security BacaNgaji Adventure saat mengubah API, auth, permission, parent gate, ownership, atau response sensitif.
---

# Backend Security

## Purpose

Menjaga authorization dan data boundary tetap server-side.

## Use This Skill When

Mengubah API route, auth/session/permission, parent gate, child ownership, atau response sensitif.

## Required Reading

`docs/security/README.md`, `docs/api/README.md`, dan `docs/architecture/overview.md`.

## Responsibilities

Verifikasi session, permission, parent gate, ownership, relationship, sanitized response, dan negative tests.

## Mandatory Constraints

Jangan gunakan Supabase Auth, membuat child sebagai auth user, mengekspos credential, atau melemahkan guard.

## Expected Workflow

Petakan actor/resource -> audit guard dan query -> implementasi minimal -> tambah positive/negative coverage.

## Validation

Focused unit/integration/security tests serta lint/typecheck sesuai risiko.

## Required Output

Guard yang diperiksa, perubahan behavior, test cases, dan dampak security/API.

## Out of Scope

Redesign product flow atau database tanpa scope terpisah.
