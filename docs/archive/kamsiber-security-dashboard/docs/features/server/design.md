# Design Spec: Server

## Overview
The `Server` feature manages the inventory of physical and virtual servers, OS lifecycle, endpoint protection, and exposure mapping.

## Pages & Components

### 1. ServerDashboard (`/server/dashboard`)
*   **KPI Cards:** Total Servers, Unsupported OS (EOL), Unprotected Endpoints, Critical Patching.
*   **Charts:** OS Distribution, Patching Status, Environment Distribution.
*   **Widgets:** Needs Attention list (Servers needing updates/agents).

### 2. ServerList (`/server`)
*   **Table:** Hostname, IP, OS, Environment, Endpoint Status, Exposure, Patch Level.
*   Badges for Endpoint (Protected, Partial, Unprotected) and Exposure (Internet-Facing, Internal).

### 3. ServerDetail (`/server/:id`)
*   **Header:** Hostname, Status Badges (Env, Status, EOL Warning).
*   **Health Summary Grid:** Endpoint, Exposure, Patch Level, Tipe, Placement, Aplikasi terhubung.
*   **Tabs Layout:**
    *   Overview: Spec Cards (CPU, RAM, Storage, Uptime), Peran, Metadata side-panel.
    *   Aplikasi Terkait: Link apps to servers.
    *   VA: List of vulnerabilities affecting the server.
    *   Endpoint Status: List of installed agents (CrowdStrike, SentinelOne, etc.).
    *   NESSUS: Integrations sync.
    *   CTI / External: Exposure findings.
    *   Patching History.
*   **SlideOvers (Modals):** `<SlideOver>` components used heavily for linking apps, adding Endpoint tools, logging patching, and logging VA findings.

### 4. ServerForm (`/server/form`)
*   Standard creation form for server assets.
*   Fields for Hostname, IP, OS, Version, Environment, Hardware specs.

## Specific UI Tokens
*   `SlideOver` drawer is the primary interaction model for adding relational data without leaving the detail page.
*   Heavy use of `Cpu`, `HardDrive`, `Database`, `Server`, `Globe` icons.
