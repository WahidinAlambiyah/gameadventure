# Design Spec: People

## Overview
The `People` feature manages personnel, roles, and access mapping within the security context.

## Pages & Components

### 1. PeopleDashboard
*   KPIs: Total Personnel, Admin Roles, High-Risk Users (based on awareness/phishing scores).

### 2. PeopleList (`/people`)
*   Data Table: Name, Unit/Division, Role, Access Level.
*   Badges for Roles and Risk levels.

### 3. PeopleDetail & PeopleForm
*   User profile detail page.
*   Tabs: Profile, Asset Ownership (Servers/Apps they manage), Awareness Training Records, Access Logs.
