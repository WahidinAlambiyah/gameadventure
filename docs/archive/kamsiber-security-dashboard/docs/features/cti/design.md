# Design Spec: Cyber Threat Intelligence (CTI)

## Overview
The `CTI` feature manages threat intelligence, IoCs (Indicators of Compromise), external sources, and threat landscape mapping.

## Pages & Components

### 1. CtiDashboard (`/cti/dashboard`)
*   **Header:** "Dashboard Threat Intelligence"
*   **KPI Cards:** Active Threats, Critical IoCs, Source Reliability metrics.
*   **Widgets & Charts:**
    *   Threat categories breakdown.
    *   Recent Intelligence feed.
    *   TLP (Traffic Light Protocol) distribution.

### 2. CtiList (`/cti`)
*   **Data Table:** Threat Name, Category, Severity, Status, Source, TLP, Date.
*   Filters for TLP, Confidence, Status.

### 3. CtiDetail (`/cti/:id`)
*   **Header:** Threat Title, TLP Badge, Severity Badge.
*   **Content Layout:**
    *   Left column: Threat description, Actor info.
    *   Right column: Source details, Target assets.
*   **Tabs:**
    *   Overview.
    *   IoC List: Table of IPs, Domains, Hashes with Defanged display.
    *   Dampak & Mitigasi.

### 4. CtiForm (`/cti/form`)
*   **Layout:** `<FormTabs>` component to organize input into steps.
*   **Tabs:**
    *   *Informasi Intel:* Judul, Kategori, Severity, Status, Deskripsi.
    *   *Sumber Intel:* Jenis Sumber, Nama, Trust Level, Tanggal, URL.
    *   *IOC:* Dynamic list to add IPs, Domains, Hashes with Confidence and TLP dropdowns.
    *   *Dampak & Tindak Lanjut:* Affected Assets (Tags input), Credential Leak template import, File Upload.
*   **Floating Action Bar:** Bottom fixed bar for "Simpan Draft" and "Simpan Final".

## Specific UI Tokens
*   TLP Colors mapping: RED (`bg-red-500`), AMBER (`bg-amber-500`), GREEN (`bg-green-500`), WHITE (`bg-white border`).
*   Icons: `Target`, `Globe`, `Zap`, `Key`.
