---
name: code-review
description: Mereview output agent atau PR BacaNgaji Adventure dan menilai merge readiness berdasarkan evidence.
---

# Code Review

## Purpose

Menemukan defect, scope drift, dan risiko sebelum merge.

## Use This Skill When

Mereview output Codex, diff, atau pull request.

## Required Reading

Root `AGENTS.md`, dokumen kanonis terkait, dan implementation/tests yang berubah.

## Responsibilities

Periksa correctness, unintended files, module/security boundaries, tests, validation, documentation impact, dan deployment risk.

## Mandatory Constraints

Prioritaskan temuan yang dapat ditindaklanjuti; jangan mengubah code saat tugas hanya review.

## Expected Workflow

Tetapkan scope -> baca diff dan context -> verifikasi klaim -> klasifikasikan temuan -> simpulkan readiness.

## Validation

Cocokkan hasil test/CI dengan evidence; jalankan read-only/focused checks bila diizinkan.

## Required Output

Temuan berurutan: `blocker`, `important`, `minor`, `optional`, dengan file/lokasi dan alasan; lalu gaps dan verdict.

## Out of Scope

Refactor preferensi personal tanpa dampak teknis yang jelas.
