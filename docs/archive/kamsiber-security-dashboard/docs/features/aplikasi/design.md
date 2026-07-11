# Design Spec: Aplikasi

## Overview
The `Aplikasi` feature manages the inventory of applications, their security posture, patching status, compliance, and vulnerabilities (VA/Pentest).

## Pages & Components

### 1. AplikasiDashboard (`/aplikasi/dashboard`)
*   **Header:** Title "Dashboard Aplikasi" and date range selector / export button.
*   **KPI Cards:**
    *   Total Aplikasi (Blue)
    *   Aplikasi Critical (Red)
    *   Temuan High/Critical (Orange/Green)
    *   Patching Overdue (Red/Green)
    *   Backup Gagal (Red/Green)
*   **Charts:**
    *   *Bar Chart:* Distribusi Kritikalitas
    *   *Bar Chart:* Status Patching
    *   *Line Chart:* Tren Temuan per Bulan
*   **Widgets:** Compliance Standar progress bars, Perlu Perhatian Segera (Alert list), Status VA & Pentest breakdown, Aktivitas Terbaru.

### 2. AplikasiList (`/aplikasi`)
*   **Header:** "Inventaris Aplikasi" + Create button.
*   **Tabs Section:** "Inventaris Aplikasi" (Table) vs "Temuan Open" (Table).
*   **Filter Bar:** Search input, Filters for Kritikalitas, Environment, Patching, VA, Compliance, Owner.
*   **Data Table:**
    *   Columns: Nama Aplikasi, Kode, Owner, Kritikalitas (Badge), Environment (Badge), Patching (Badge), VA (Badge), Pentest (Badge), Standar Keamanan (Progress bar), Compliance (Badge), Backup (Badge).

### 3. AplikasiDetail (`/aplikasi/:id`)
*   **Header:** App Name, Status Badges, Quick Actions (Export, Edit).
*   **Health Summary Grid:** 6 mini-stats (Patching, VA, Pentest, Temuan Open, Backup, dll).
*   **Tabs:**
    *   Overview: Detail spesifikasi, Server Terkait, External Exposure.
    *   Temuan VA/Pentest: Vulnerability list & severity breakdown.
    *   Patching: Patching history.
    *   Compliance: Checklist standar.
    *   Audit Trail: Logs.

### 4. Forms (AplikasiForm, AplikasiTambahTemuan, AplikasiUpdatePatching)
*   Standard layouts using `<Form>` components, often leveraging `<SlideOver>` or multi-tab layouts for complex forms.

## Specific UI Tokens
*   Uses `Server`, `Shield`, `Activity`, `Database` icons extensively.
*   Standard badge colors map directly to the Global Design System (Critical=Red, High=Orange, Medium=Amber, Low=Blue).
