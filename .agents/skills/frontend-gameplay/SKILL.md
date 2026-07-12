---
name: frontend-gameplay
description: Mengarahkan child UI, React, Phaser, question flow, adventure map, dan completion feedback dengan server authority tetap utuh.
---

# Frontend Gameplay

## Purpose

Membangun gameplay UI yang responsif tanpa memindahkan keputusan bisnis ke client.

## Use This Skill When

Mengubah child UI, React state, Phaser, question flow, adventure map, atau completion feedback.

## Required Reading

`docs/game-design/README.md`, `docs/architecture/overview.md`, dan `docs/testing/README.md`.

## Responsibilities

Jadikan Phaser renderer/input; tangani loading, empty, error, rest, dan completed; cegah duplicate submission dan stale response menimpa terminal state.

## Mandatory Constraints

Server menentukan correctness, completion, progress, dan unlock. Jangan percaya hasil gameplay client.

## Expected Workflow

Petakan state dan authority -> audit race/duplicate path -> implementasi minimal -> automated dan browser validation.

## Validation

Focused component/integration tests, typecheck, dan manual browser scenario yang jujur.

## Required Output

State/interaction changes, authority boundary, automated results, dan manual validation status.

## Out of Scope

Mengubah business rules, schema, auth, atau reward policy tanpa scope eksplisit.
