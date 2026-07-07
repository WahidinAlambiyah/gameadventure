# AGENTS.md

AI coding agents must read `README.md`, `docs/architecture/adr/`, and relevant files under `docs/` before changing architecture.

Rules:

- Do not use Supabase Auth.
- Do not create application business tables in PostgreSQL `public`.
- Do not expose secrets or service-role keys to browser code.
- Do not trust client gameplay results; scoring, rewards, progress, energy, and unlocks are server-authoritative.
- Do not make children authentication users.
- Enforce authorization server-side, not only by hiding UI.
- Validate child data access with permission and ownership.
- Preserve module boundaries under `src/features`, `src/server`, and `src/game`.
- Document architecture changes with an ADR before or with implementation.
- Keep placeholders explicit and do not pretend incomplete features are production-ready.
- Run relevant validation commands before finishing.
- Report changed files, tests executed, failures, and unresolved risks.

Before coding:

1. Understand the goal.
2. State assumptions.
3. Identify risks.
4. Choose the simplest maintainable approach.
5. Explain trade-offs.
6. Implement only the agreed or clearly implied scope.
