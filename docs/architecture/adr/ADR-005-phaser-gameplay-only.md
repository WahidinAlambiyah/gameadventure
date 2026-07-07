# ADR-005: Use Phaser Only for Gameplay Modules

## Status

Accepted

## Decision

Use Phaser for mini-game scenes only. Next.js owns application UI.

## Consequences

Phaser is lazy-loaded on gameplay pages so public and dashboard bundles do not pay the game-engine cost.
