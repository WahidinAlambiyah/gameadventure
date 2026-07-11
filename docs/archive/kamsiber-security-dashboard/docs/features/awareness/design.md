# Design Spec: Security Awareness

## Overview
The `Awareness` feature manages security training, phishing simulations, and employee awareness campaigns.

## Pages & Components

### 1. AwarenessDashboard (`/awareness/dashboard`)
*   **Header:** "Dashboard Security Awareness" + Year Filter + Export button.
*   **KPI Cards:** Total Campaign, Partisipasi Rata-rata, Click Rate Phishing, Open Rate Phishing, Unit Berisiko Tinggi.
*   **Charts:**
    *   *Horizontal Bar Chart:* Partisipasi per Unit.
    *   *Pie Chart:* Distribusi Tipe Konten.
    *   *Line Chart:* Tren Hasil Phishing Simulation (Click Rate, Open Rate, Lapor Rate).
    *   *Area Chart:* Tren Campaign Bulanan & Partisipasi.
*   **Widgets:**
    *   Top 5 Konten Paling Efektif (Table).
    *   Item Perlu Perhatian (List of alerts).
    *   Aktivitas Terbaru (Feed).

### 2. AwarenessList (`/awareness`)
*   **Header:** "Daftar Campaign & Modul" + Create button.
*   **Filter Bar:** Search, Type, Status.
*   **Data Table:** Title, Type, Target, Participation, Phishing Metrics (if applicable), Status.

### 3. AwarenessDetail (`/awareness/:id`)
*   **Header:** Campaign details, active status, completion metrics.
*   **Tabs:** Overview (Metrics), Peserta (List of participants and status), Hasil (Phishing clicks/reports), Audit Trail.

### 4. AwarenessForm
*   Multi-step or tabbed form for creating campaigns.
*   Fields for Content Type (Phishing, E-Learning, Bulletin), Target Audience, Schedule, and Template selection.

## Specific UI Tokens
*   Heavy use of `Users`, `Megaphone`, `MousePointerClick`, `Eye` icons.
*   Phishing metrics use inverse colors (High Click Rate = Red).
