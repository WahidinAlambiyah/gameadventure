# Design Spec: Digital Forensics & Incident Response (DFIR)

## Overview
The `DFIR` feature manages incident response tickets, forensic investigations, playbooks, and post-incident reports.

## Pages & Components

### 1. DfirDashboard (`/dfir/dashboard`)
*   **KPI Cards:** Open Incidents, Critical Incidents, MTTD (Mean Time to Detect), MTTR (Mean Time to Respond).
*   **Charts:** Incident Trends, Incident by Category.
*   **Widgets:** Active Investigations, Escalation Alerts.

### 2. DfirList (`/dfir`)
*   **Table:** Incident ID, Name, Severity, Phase (Triage, Containment, Eradication, Recovery), PIC, Updated At.
*   Status Badges represent Incident phases.

### 3. DfirDetail (`/dfir/:id`)
*   **Header:** Incident Name, Severity, Phase Timeline.
*   **Phase Tracker:** A visual horizontal stepper indicating current incident phase.
*   **Tabs:**
    *   Overview: Details, Affected Assets, Root Cause.
    *   Evidences: Uploaded forensic artifacts.
    *   Playbook / Tasks: Checklist of response actions.
    *   Chronology: Timeline of events and actions taken.

### 4. DfirForm (`/dfir/form`)
*   Form for creating or updating an incident ticket.
*   Requires mapping to affected Servers/Apps.

## Specific UI Tokens
*   Timeline/Chronology UI components.
*   Phase Stepper UI.
*   Icons: `Activity`, `ShieldAlert`, `Clock`, `FileText`.
