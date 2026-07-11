# Alur Kerja Developer Agentic & Praktik Terbaik (Bahasa Indonesia)

Dokumen ini menguraikan standar operasional prosedur (SOP) bagi developer manusia yang berkolaborasi dengan Agen AI pada proyek Security Dashboard. Mengikuti alur kerja ini memastikan kualitas kode yang tinggi, mencegah konflik Git, dan mencegah halusinasi AI.

## 1. Aturan "Dokumentasi Pertama" (Pembuatan Spesifikasi)
Langkah pertama dalam pengembangan bukanlah menulis kode, melainkan menulis spesifikasi yang akan dibaca oleh agen pengkode (coding agents). Anda HARUS membuat dokumen spesifikasi fitur di direktori `docs/features/[nama-fitur]/`.

### Dokumen yang Diperlukan untuk Fitur Lengkap
Sebuah direktori fitur yang terdokumentasi penuh harus berisi file-file berikut:
1.  **`prd.md` (Product Requirements Document):** Mendefinisikan "Mengapa" dan "Apa" (cerita pengguna, kriteria penerimaan, alur pengguna).
2.  **`api.md` (Spesifikasi API):** Mendefinisikan kontrak backend (endpoint FastAPI, model PostgreSQL/SQLAlchemy, skema JSON request/response).
3.  **`design.md` (Spesifikasi Desain):** Mendefinisikan arsitektur frontend (hirarki komponen Next.js, manajemen state, interaksi UI, rujukan Tailwind).
4.  **`test.md` (Rencana Pengujian):** Menguraikan skenario pengujian unit, integrasi, dan E2E yang nantinya akan dieksekusi oleh agen `@qa`.

### Praktik Terbaik Prompting untuk Dokumen Fitur
Untuk mendapatkan spesifikasi berkualitas tinggi dari AI, prompt Anda harus eksplisit dan terstruktur. Jangan hanya meminta "spesifikasi fitur." Berikan konteks, tentukan struktur file, dan batasan teknis.

**Anatomi Prompt yang Ditulis dengan Baik:**
*   **Tetapkan Peran:** Selalu panggil peran yang tepat seperti `@product-manager` dan `@architect`.
*   **Berikan Konteks & Standar:** Suruh agen membaca standar proyek yang ada (misal, `docs/project-standards.md`).
*   **Daftar Output yang Diminta:** Minta AI secara eksplisit untuk membuat 4 file markdown yang diwajibkan di atas.
*   **Jelaskan Alur Bisnis secara Mendalam:** Berikan penjelasan serinci mungkin tentang bagaimana fitur tersebut harus bekerja (logika bisnis, interaksi pengguna, edge cases) agar AI dapat memahami secara penuh dan mengajukan pertanyaan klarifikasi jika ada yang ambigu.

**Contoh Prompt yang Sempurna untuk Menghasilkan Fitur:**
> *"Bertindak sebagai **@product-manager** dan **@architect**. Saya ingin merancang fitur 'Log Aktivitas Pengguna' baru untuk Security Dashboard.
> 
> Pertama, tolong baca `docs/project-standards.md` untuk memahami tech stack kita (Next.js 16 CSR, FastAPI, PostgreSQL).
> 
> Setelah itu, tolong buatkan paket dokumentasi fitur lengkap di direktori `docs/features/user-activity-log/`. Anda harus membuat tepat 4 file ini secara detail:
> 1. `prd.md`: Detailkan cerita pengguna (user stories) dan kriteria penerimaan.
> 2. `api.md`: Definisikan endpoint FastAPI dan model tabel SQLAlchemy.
> 3. `design.md`: Uraikan pohon komponen React dan manajemen state.
> 4. `test.md`: Definisikan kasus pengujian utama.
> 
> [Di sini, berikan penjelasan sedetail mungkin tentang bagaimana alur modul 'Log Aktivitas Pengguna' ini seharusnya berjalan. Jelaskan event apa saja yang dilacak, siapa yang dapat melihat log ini, dan logika pemfilteran yang dibutuhkan. Jika ada persyaratan yang kurang jelas, tolong ajukan pertanyaan klarifikasi kepada saya sebelum membuat dokumen.]"*

## 2. Pola Pikir "Full-Stack Orchestrator"
Sebagai developer manusia di proyek ini, Anda adalah seorang **Orkestrator**. Anda tidak perlu terpaku pada peran frontend atau backend, tetapi Anda harus memisahkan **konteks AI** dengan ketat berdasarkan peran tersebut.

### Praktik Terbaik: Prompting Berdasarkan Peran
Jangan pernah meminta agen AI untuk membangun fitur full-stack dalam satu prompt (misal, "Buat backend dan frontend untuk halaman login"). Hal ini akan mengacaukan konteks AI.
Sebaliknya, pisahkan eksekusi Anda:
1.  **Fase Backend:** *"Bertindak sebagai **@backend-dev**, baca `docs/features/[fitur]/api.md` dan implementasikan endpoint FastAPI-nya."*
2.  **Verifikasi:** Uji kode backend secara lokal.
3.  **Fase Frontend:** Buka konteks baru atau pindah peran dengan jelas. *"Bertindak sebagai **@frontend-dev**, baca spesifikasi UI dan buat komponen React untuk mengkonsumsi API yang baru saja kita buat."*

## 3. Alur Kerja Git & Code Review
Agen AI dapat membuat kode dengan cepat, tetapi mereka kurang memiliki kesadaran konteks menyeluruh seperti manusia. **Manusia bertanggung jawab penuh atas operasi Git.**

### Proses Git Langkah-demi-Langkah
1.  **Buat Branch:** Manusia menjalankan `git checkout -b feature/[id-tiket]-[deskripsi-singkat]`.
2.  **Pair Program:** Manusia bekerja dengan Agen untuk menghasilkan dan menyempurnakan kode.
3.  **Commit & Push:** Manusia meninjau perubahan (diff) secara lokal, menjalankan `git commit`, dan melakukan push ke repositori.
4.  **Buka PR:** Manusia membuka Pull Request di repositori remote.
5.  **Review oleh Agen:** Manusia membuka chat Agen dan memanggil skill `/code-review`, memberikan nama branch atau diff. AI memeriksa celah keamanan, regresi gaya kode, dan tes yang hilang.
6.  **Selesaikan & Merge:** Manusia memperbaiki umpan balik AI, melakukan commit perbaikan, dan melakukan merge PR.

## 4. Memastikan Konsistensi UI & Rendering
Jangan biarkan agen AI berhalusinasi membuat kelas Tailwind secara acak untuk setiap halaman baru. Kita memelihara sistem desain yang ketat.

### Cara Membangun UI & Rendering
1.  **Gunakan CSR (Client-Side Rendering):** Semua halaman dan komponen Next.js harus default sebagai client-side rendering (gunakan direktif `"use client"`) kecuali ada instruksi berbeda.
2.  **TypeScript Typing (Fleksibel):** Proyek ini menggunakan file `.ts`/`.tsx` dengan pengecekan tipe dinonaktifkan (`strict: false`, `noImplicitAny: false`). Agen AI TIDAK PERLU repot menulis definisi tipe yang rumit; kerjakan seolah-olah Anda menulis JavaScript biasa.
3.  **Gunakan Komponen Dasar:** Selalu periksa `@/components/_ui/` untuk mencari komponen standar yang ada (misal, `<Button>`, `<Card>`) sebelum meminta AI membuat yang baru.
4.  **Referensi Sistem Desain:** Saat membuat UI baru, instruksikan AI: *"Rujuk ke `docs/design-system.md` untuk styling yang tepat."*
5.  **Manfaatkan Skill:** Gunakan skill `brand-guidelines` dalam prompt Anda untuk memasukkan palet warna dan aturan tipografi resmi kita langsung ke dalam konteks agen.

## 5. Serah Terima Agen (Handoff) yang Terstandardisasi
Saat Anda beralih antar agen yang berbeda atau menghentikan pekerjaan, pastikan AI meninggalkan laporan status terstandardisasi pada output-nya. Ini memudahkan Anda atau agen berikutnya untuk melanjutkan pekerjaan.

```markdown
**Role**: [Peran Agen]
**Status**: [Selesai / Sedang Berjalan]
**Summary of Actions**: [Apa yang telah dibangun]
**Next Steps**: [Contoh: @frontend-dev perlu menghubungkan API ke endpoint /login]
```

---

# Agentic Developer Workflow & Best Practices (English)

This document outlines the standard operating procedure for human developers collaborating with AI Agents on the Security Dashboard project. Following these workflows ensures high code quality, prevents Git conflicts, and prevents AI hallucinations.

## 1. The "Documentation First" Rule (Generating Specs)
The very first step in development is not writing code, but writing the specifications that the coding agents will read. You MUST generate feature specifications in the `docs/features/[feature-name]/` directory.

### Required Documents for a Complete Feature
A fully documented feature directory must contain the following files:
1.  **`prd.md` (Product Requirements Document):** Defines the "Why" and "What" (user stories, acceptance criteria, user flows).
2.  **`api.md` (API Specification):** Defines the backend contracts (FastAPI endpoints, PostgreSQL/SQLAlchemy models, request/response JSON schemas).
3.  **`design.md` (Design Specification):** Defines the frontend architecture (Next.js component hierarchy, state management, UI interactions, Tailwind references).
4.  **`test.md` (Test Plan):** Outlines unit, integration, and E2E testing scenarios to be executed later by the `@qa` agent.

### Best Practices for Prompting Feature Docs
To get high-quality specifications from the AI, your prompt must be explicit and structured. Do not just ask for "a feature spec." Provide the context, the exact file structure, and technical constraints.

**Anatomy of a Well-Written Prompt:**
*   **Assign the Role:** Always invoke specific roles like `@product-manager` and `@architect`.
*   **Provide Context & Standards:** Instruct the agent to read existing project standards (e.g., `docs/project-standards.md`).
*   **List the Required Outputs:** Explicitly ask the AI to generate the 4 required markdown files listed above.
*   **Explain the Business Flow in Depth:** Provide as much detail as possible about how the feature should work (business logic, user interactions, edge cases) so the AI fully understands your intent and can ask clarifying questions if needed.

**Example of a Perfect Prompt to Generate a Feature:**
> *"Acting as the **@product-manager** and **@architect**, I want to design a new 'User Activity Log' feature for the Security Dashboard.
> 
> First, please read `docs/project-standards.md` to understand our tech stack (Next.js 16 CSR, FastAPI, PostgreSQL).
> 
> Then, please generate a complete feature documentation suite in the `docs/features/user-activity-log/` directory. You must create exactly these 4 files in detail:
> 1. `prd.md`: Detail the user stories and acceptance criteria.
> 2. `api.md`: Define the FastAPI endpoints and SQLAlchemy table models.
> 3. `design.md`: Outline the React component tree and state management.
> 4. `test.md`: Define the main test cases.
> 
> [Here, provide as much detail as possible on how the 'User Activity Log' flow should work. Explain what events are tracked, who can view these logs, and the required filtering logic. If any requirements are ambiguous based on my description, please ask me clarifying questions before generating the documents.]"*

## 2. The "Full-Stack Orchestrator" Mindset
As a human developer on this project, you are an **Orchestrator**. You do not need to be siloed into frontend or backend roles, but you must strictly silo the **AI's context** based on those roles.

### Best Practice: Role-Based Prompting
Never ask an AI agent to build a full-stack feature in a single prompt (e.g., "Build the backend and frontend for the login page"). This confuses the AI's context.
Instead, split your execution:
1.  **Backend Phase:** *"Acting as the **@backend-dev**, read `docs/features/[feature]/api.md` and implement the FastAPI endpoints."*
2.  **Verify:** Test the backend code locally.
3.  **Frontend Phase:** Open a new context or clearly switch roles. *"Acting as the **@frontend-dev**, read the UI spec and build the React component to consume the API we just built."*

## 3. Git & Code Review Workflow
AI agents can generate code rapidly, but they lack the overarching contextual awareness of a human. **Humans are strictly responsible for Git operations.**

### Step-by-Step Git Process
1.  **Create Branch:** Human runs `git checkout -b feature/[ticket-id]-[brief-desc]`.
2.  **Pair Program:** Human works with the Agent to generate and refine code.
3.  **Commit & Push:** Human reviews the diff locally, runs `git commit`, and pushes to the repository.
4.  **Open PR:** Human opens a Pull Request on the remote repository.
5.  **Agentic Review:** Human opens an Agent chat and invokes the `/code-review` skill, providing the branch name or diff. The AI checks for security flaws, styling regressions, and missing tests.
6.  **Resolve & Merge:** Human addresses AI feedback, commits fixes, and merges the PR.

## 4. Enforcing UI Consistency & Rendering
Do not let AI agents hallucinate random Tailwind classes for every new page. We maintain a strict design system.

### How to Build UIs & Render
1.  **Use CSR (Client-Side Rendering):** All Next.js pages and components must default to client-side rendering (using the `"use client"` directive) unless specifically instructed otherwise.
2.  **TypeScript Typing (Flexible):** This project uses `.ts`/`.tsx` files with type checking disabled (`strict: false`, `noImplicitAny: false`). Type annotations are optional — add them when helpful, but they are not required. Follow the existing tsconfig settings.
3.  **Use Base Components:** Always check `@/components/_ui/` for existing standard components (e.g., `<Button>`, `<Card>`) before asking the AI to build new ones.
4.  **Reference the Design System:** When generating new UI, instruct the AI: *"Reference `docs/design-system.md` for proper styling."*
5.  **Leverage Skills:** Use the `brand-guidelines` skill in your prompt to inject our official color palettes and typography rules directly into the agent's context.

## 5. Standardized Agent Handoffs
When you switch between different agents or pause work, ensure the AI leaves a standardized status report in its output. This makes it easier to resume work later.

```markdown
**Role**: [Agent Role]
**Status**: [Complete / In Progress]
**Summary of Actions**: [What was built]
**Next Steps**: [e.g., @frontend-dev needs to link the API to the /login endpoint]
```
