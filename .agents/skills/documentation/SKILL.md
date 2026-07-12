---
name: documentation
description: Memperbarui dokumentasi kanonis BacaNgaji Adventure berdasarkan implementation evidence tanpa duplikasi atau klaim status palsu.
---

# Documentation

## Purpose

Menjaga dokumentasi ringkas, kanonis, terhubung, dan sesuai implementasi.

## Use This Skill When

Mengubah roadmap, architecture docs, setup, API inventory, feature status, atau phase closeout.

## Required Reading

`docs/README.md`, dokumen target, dan implementation evidence yang relevan.

## Responsibilities

Verifikasi fakta; update dokumen kanonis sebelum membuat duplikat; bedakan implemented, partial, placeholder, dan planned; validasi link; pertahankan ADR history; hindari legacy project content.

## Mandatory Constraints

Dokumentasi bukan bukti implementasi. Jangan menulis ulang ADR lama untuk menutupi drift atau memasukkan fakta archive sebagai status aktif.

## Expected Workflow

Tentukan audience/sumber kebenaran -> verifikasi evidence -> edit minimal -> audit status, link, dan istilah legacy.

## Validation

Prettier hanya file scope, link/path audit, terminology audit, dan `git diff --check`.

## Required Output

File/status yang berubah, evidence, validation results, uncertainty, dan documentation impact.

## Out of Scope

Mengubah runtime behavior saat scope documentation-only.
