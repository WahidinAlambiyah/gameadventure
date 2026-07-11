# Security Dashboard - Project & Agentic Standards

This document serves as the absolute source of truth for all human developers and AI agents working on the Security Dashboard project. **All AI agents MUST read and adhere to these guidelines before executing any code.**

## 1. Core Principles
*   **Documentation First Rule:** No code is to be written without a corresponding specification (PRD, API Spec, Design Spec) residing in the `docs/features/` directory.
*   **Role-Based Execution:** Agents must adhere strictly to their invoked roles (e.g., `@frontend-dev` must not modify backend routing; `@backend-dev` must not touch UI components).
*   **Modular Architecture:** Develop features in isolated "Feature Slices" to prevent merge conflicts when multiple agents are operating simultaneously.

## 2. Technology Stack & Versions
All dependencies must lock to the recommended versions below to ensure consistency across all agent environments.

### Environment & Runtimes
*   **Node.js:** **v26.x LTS** (Active LTS)
*   **Python:** **v3.12.x**
*   **Package Manager:** **npm** (v10.x) or **pnpm** (v9.x)
*   **Docker:** **v24.x+** and **Docker Compose v2.x+** (Used for local environment consistency, specifically database and backend services)

### Frontend
*   **Framework:** Next.js **v16.x** (App Router) & React **v19.x**
*   **Rendering Strategy:** **Client-Side Rendering (CSR) First.** All components and pages MUST default to client-side rendering (using the `"use client"` directive at the top of the file) unless Server-Side Rendering (SSR) is explicitly specified in the feature's design doc.
*   **Styling:** TailwindCSS **v4.x** (Using `oklch` color tokens and CSS variables). **CRITICAL RULE (Canonical Classes):** Selalu gunakan *class* bawaan (misal: `z-100` atau `max-w-100`) dan hindari penulisan nilai arbitrer dengan kurung siku (seperti `z-[100]`, `z-[101]`, atau `max-w-[400px]`) apabila *utility class* ekuivalen sudah tersedia atau disarankan oleh *Tailwind IntelliSense*.
*   **Language:** TypeScript **v6.x** (Using `.ts` and `.tsx`). **CRITICAL NOTE:** Strict type checking is disabled; developers should treat it primarily as JavaScript. Future agents working on this project MUST avoid writing TypeScript typings as much as possible.
*   **Runtime:** Node.js **v26.x LTS**
*   **Package Manager:** npm (**v10.x**)

### Backend
*   **Framework:** FastAPI **v0.115.x** (or latest stable)
*   **Server:** Uvicorn **v0.34.x**
*   **Lainnya:** Menggunakan `gunicorn`, `alembic`, `pydantic-settings`, dan `slowapi`.

### Database
*   **Engine:** PostgreSQL **v16.x**
*   **Driver:** Psycopg 3 (`psycopg[binary]`)
*   **ORM / Query Builder:** SQLAlchemy **v2.+** (via SQLModel untuk FastAPI integrasi)

## 3. Directory Structure Boundaries
Agents must respect the following boundaries to avoid Git conflicts:

*   `/frontend` - Owned by `@frontend-dev`.
    *   `/frontend/src/features/[feature-name]` - UI components, hooks, and local state specific to a feature.
*   `/backend` - Owned by `@backend-dev`.
    *   `/backend/api/routes/` - FastAPI endpoints.
    *   `/backend/core/` - Business logic and security policies.
*   `/docs` - Owned by `@product-manager` and `@architect`.
    *   `/docs/features/` - Specs and PRDs.

## 4. Git & Workflow Standards
*   **Branching:** Use short-lived feature branches (`feature/[ticket-id]-[brief-desc]`).
*   **AI Code Review:** All Pull Requests must be reviewed by the `@code-review` agent to check for security vulnerabilities, style compliance, and testing regressions.
*   **Testing:** The `@qa` agent must provide automated tests for every new feature before merging.

## 5. Agent Communication Standards
When an agent completes a task, it must output a standardized report to maintain context for the next developer/agent.
Required Format:
1. **Role**: [Agent Role]
2. **Status**: [Complete/Blocked/In Progress]
3. **Summary of Actions**: [What was done]
4. **Artifacts Modified**: [File paths]
5. **Next Steps**: [Handoff instructions]

## 6. AI Agent Operational Rules
To ensure safe, efficient, and consistent collaboration, all AI agents must observe the following operational guidelines:

*   **Mandatory Context Reading:** Before executing any code changes, agents MUST read and strictly follow provided markdown documentation (e.g., `docs/design-system.md`, features PRD, API specs, design specs). If a referenced or required document does not exist, the agent MUST stop and work with the developer (or the appropriate agent role) to write the required documentation first.
*   **Continuous Documentation Maintenance:** Agents MUST always update relevant documentation files (e.g., PRDs, API specs, design specs) immediately before or after implementing code changes. This ensures that documentation remains the single source of truth, reducing inconsistencies and preventing drift when collaborating with multiple developers and agents.
*   **Artifact & State Management:** Utilize shared artifacts (`implementation_plan.md`, `task.md`, `walkthrough.md`) to pass context between agents. Do not rely on assumed memory across different agent invocations.
*   **Handling Ambiguity & Blocked States:** Do not hallucinate missing requirements or guess implementation details. If instructions are ambiguous, dependencies are missing, or tests fail repeatedly, agents MUST stop, mark status as `Blocked`, and request clarification from the human user or the relevant agent role.
*   **Secret & Credential Management:** **NEVER** write, commit, or output real credentials, tokens, or passwords. Always use `.env.example` templates and placeholder values (e.g., `<DB_PASSWORD>`).
*   **Tool & Workflow Utilization:** Always prioritize specialized workflows (e.g., `/bug-fix`, `/feature-development`) and existing agent skills (`@code-review`, `@quality-assurance`) over generic tasks. Use safe, native file-editing tools over arbitrary bash terminal commands whenever possible.
