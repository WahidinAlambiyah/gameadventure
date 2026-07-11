# Design Spec: Integrasi

## Overview
The `Integrasi` feature manages connections to external security tools (e.g., Nessus, SIEM, EDR) and API sync statuses.

## Pages & Components

### 1. IntegrasiDashboard
*   Overview of all external connections.
*   Metrics: API Health, Last Sync Times, Total Findings Imported.

### 2. IntegrasiDetail & IntegrasiForm
*   Settings-style layout to configure API keys, Endpoints, and schedules.
*   Connection status indicators (Green connected, Red disconnected).
*   Test Connection action button.
