# Design Spec: Master Data & Additional Features

## Overview
This covers the remaining domains which generally follow a standardized CRUD List & Form pattern.

## Features

### 1. Master Data (`/master/*`)
*   Standardized List & Form views for system configurations.
*   Includes: Jabatan, Kategori Dfir, Layanan, Lokasi, Operasi Sistem, Organisasi, Perangkat, Server, Standar Keamanan.
*   **UI Pattern:** Simple Table with Search/Filter, and a SlideOver or Dialog for Add/Edit actions.

### 2. Integrasi (`/integrasi`)
*   Manages connections to external security tools (Nessus, SIEM, EDR).
*   **UI Pattern:** Settings-style layout with connection status indicators (Green connected, Red disconnected).

### 3. People (`/people`)
*   Manages personnel, roles, and access mapping.
*   **UI Pattern:** User list table, User profile detail page showing associated assets and awareness scores.

### 4. Perangkat (`/perangkat`)
*   Manages endpoints/devices (Laptops, Workstations).
*   **UI Pattern:** Follows the exact same layout patterns as the `Server` module (List, Detail with Tabs for Endpoint agents, Spec cards).

### 5. Request Access (`/request-access`)
*   Ticketing system for Firewall rules, Whitelists, VPN access.
*   **UI Pattern:** Ticket list table, Detail view with Approval workflow (Approve/Reject buttons), Chat/Notes timeline.

## Specific UI Tokens
*   Consistency with Global Design System tables, badges, and SlideOvers.
*   Use of unified Breadcrumb navigation across all detail pages.
