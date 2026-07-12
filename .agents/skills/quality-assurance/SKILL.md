---
name: quality-assurance
description: Merencanakan dan menilai test, regression risk, phase closeout, dan readiness BacaNgaji Adventure.
---

# Quality Assurance

## Purpose

Menghasilkan evidence kualitas yang proporsional dan jujur.

## Use This Skill When

Menyusun test plan, menilai regression risk, menutup phase, atau memverifikasi PR.

## Required Reading

`docs/testing/README.md` dan `docs/development/workflow.md`.

## Responsibilities

Cakup happy path, negative/auth/ownership cases, focused tests, regression surface, CI status, dan manual validation.

## Mandatory Constraints

Jangan mengubah `NOT RUN` menjadi pass atau menyamakan HTTP/automated check dengan browser validation.

## Expected Workflow

Petakan acceptance criteria -> pilih test layers -> jalankan focused checks -> catat failure/gap -> nilai readiness.

## Validation

Pastikan command dan suite aktual sesuai yang dilaporkan; review output dan diff.

## Required Output

Coverage matrix ringkas, commands/results, manual status, regression risk, dan blocker/limitation.

## Out of Scope

Mengklaim production readiness tanpa evidence.
