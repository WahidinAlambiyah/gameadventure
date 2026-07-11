# Design Spec: Security Service

## Overview
The `Security Service` feature is a ticketing system for firewall rules, whitelists, VPN access, and permission elevation.

## Pages & Components

### 1. RequestAccessList
*   Ticket list table.
*   Columns: Ticket ID, Requester, Type (VPN, Firewall, App Access), Status (Pending, Approved, Rejected).

### 2. RequestAccessDetail
*   Detail view of the request context.
*   Approval workflow actions (Approve / Reject buttons).
*   Chat/Notes timeline for communication between requester and approver.

### 3. RequestAccessForm
*   Standard form to submit a new access request.
*   Fields dynamically change based on Request Type (e.g., Firewall rule needs Source/Destination IP).
