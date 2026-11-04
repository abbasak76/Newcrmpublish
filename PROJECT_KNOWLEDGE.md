# AKHAVAN CRM — Project Knowledge & Domain Architecture Manual

**Document Version:** 1.0  
**Status:** Authoritative Architectural & Domain Knowledge Reference  
**Scope:** Architecture, Business Logic, System Engines, Boundaries, and Definitive Product Decisions.

---

## 1. Product Definition & Boundaries

### Core Identity
**AKHAVAN CRM** is an enterprise-grade Customer 360, Sales Operations, Field Distribution, Management Decision-Making, and Workflow Automation platform.

While "Akhavan" represents the flagship real-world deployment and FMCG distributor scenario, the underlying codebase is architected as a **multi-tenant, industry-agnostic enterprise solution**. The platform easily adapts to other organizations, FMCG distributors, supply chain operators, and commercial enterprises.

### Architectural Layering
The system enforces strict architectural boundaries between four distinct layers:
1. **CRM Core:** Universal abstractions for accounts, contacts, timeline activities, universal tasks, collaboration, dynamic forms, and RBAC policies.
2. **Industry Profile (FMCG & Wholesale Distribution):** Specialized modules for route visits, shelf auditing, delivery and returns, trade discounts, margin analysis, and Sayad cheque handling.
3. **Company / Tenant Configuration:** Organization-specific settings, branding, fiscal years, credit limit formulas, approval chains, and external system codes.
4. **User, Role & Permission Configuration:** Fine-grained Capabilities and Record-Level Access Scopes (OWN, TEAM, TERRITORY, BRANCH, TENANT).

---

## 2. The Data Authority Principle (CRM vs. ERP)

AKHAVAN CRM is **NOT** a replacement for an Enterprise Resource Planning (ERP) platform, warehouse inventory system, accounting ledger, or official fiscal invoicing engine. It operates alongside them.

| Operational Domain | Authoritative System of Record | CRM Responsibility |
| :--- | :--- | :--- |
| **Official Accounting & Ledger** | **ERP** | Read-only mirror; track sync status; receivables follow-up |
| **Official Fiscal Invoices** | **ERP** | Display synced invoices; link to CPQ quotes; track payments |
| **Warehouse Inventory Balances** | **ERP / WMS** | Read-only stock mirror; CPQ stock availability checks |
| **Sales Leads & Opportunities** | **CRM** | Full ownership of negotiation pipeline, win/loss, activities |
| **CPQ Proposals & Quotations** | **CRM** | Full ownership of quoting engine, pricing tiers, approval rules |
| **Universal Tasks & Escalations** | **CRM** | Full ownership of delegation, capacity, priority, SLAs |
| **Customer 360 & Timeline** | **CRM** | Unified aggregation of interactions, notes, calls, tickets, debt |
| **Field Ops & Geolocation** | **CRM** | Route tracking, check-ins, proof of delivery, geo-zones |

### Fundamental Data Rules
1. **Traceable External Lineage:** Any entity ingested from an ERP system must maintain an external ID (`externalId`), source system identifier (`sourceSystem`), and timestamp of last synchronization (`lastSyncedAt`).
2. **Estimates vs. Legal Books:** CRM analytics, simulated margins, and collection forecasts must clearly be labeled as operational calculations and never presented as official audited financial statements.
3. **Zero Parallel Accounting:** The CRM must never generate duplicate accounting voucher entries or competing balance books that diverge from the ERP.

---

## 3. Technical Baseline & Local-First Architecture

### Technology Stack
* **UI Framework:** React 19 (Functional Components, Hooks, React Router 6/7)
* **Build System:** Vite + TypeScript (Strict Mode)
* **Design System & Styling:** Tailwind CSS v4, Solar Ember design system tokens, Lucide React icons
* **Client State Management:** Zustand + Immer for immutable local state updates
* **Local Persistence:** IndexedDB (via local storage managers) for resilient offline-first operations
* **Validation & Forms:** Centralized Dynamic Form Engine (`DynamicFormRenderer`)

### Local-First & Infrastructure Reality
* **No Speculative Infrastructure:** Never assume that SQL Server, Supabase, Redis, background cron workers, or live ERP webhooks are active unless confirmed in the runtime environment.
* **Separation of Tiers:** Distinguish clearly between:
  1. *Local / Offline State:* IndexedDB persistent state.
  2. *Seed / Testing Data:* Pre-populated development fixtures.
  3. *Live Production Integration:* Connected backend API endpoints.
* **Resilient Graceful Degradation:** The application must remain fully functional locally even when network or ERP connectivity is severed.

---

## 4. Core Modules & Functional Scope

### A. Sales & Customer 360
* **Customer 360:** Unified executive Dossier featuring customer identity, credit health score, contacts directory, organizational branch hierarchy, unified timeline, CPQ history, opportunities, and open tasks.
* **Sales Pipeline & CPQ:** Multi-stage opportunities, CPQ quotation builder with margin constraints, tiered volume discounts, customer payment term validation, and quote-to-order progression.
* **Leads & Conversion:** Lead qualification, scoring, and automated conversion into formal Accounts.
* **Timeline & Activities:** Real-time logging of phone calls, visits, emails, and meetings with mention links.

### B. Smart Finance & Treasury
* **Receivables & Aging Analysis:** Overdue balances, aging buckets (0-30, 31-60, 61-90, 90+ days), and risk classification.
* **Cheque Tracking (Sayad):** Cheque lifecycle tracking (Received, Deposited, Cleared, Bounced, Returned) with Sayad serial number validation and due-date alerts.
* **Payment Allocation & Settlement:** Ingesting bank transfers, cash receipts, and POS receipts with invoice reconciliation.
* **Credit Notes & Return Vouchers:** Processing return merchandise authorizations (RMA) and mirror credit note requests with formal approval workflows.

### C. Field Operations, Distribution & Workflow
* **Universal Task Engine:** Actionable tasks connecting sales reps, collection officers, and delivery drivers with SLA countdowns.
* **Operations Control & Logistics:** Order dispatch tracking, delivery route validation, proof-of-delivery (signature/photo), and return handling.
* **Geo-Intelligence:** Zone map editor, polygon geofencing, customer location mapping, and territory boundary validation.
* **Administrative Automation:** Internal personnel requests, mission approvals, expense reimbursement, and team meetings.

---

## 5. Definitive Sales & Order Cycles

The system natively supports two distinct, tightly coordinated sales order lifecycles:

```
[Path 1: CRM-Originated Order]
Sales Rep / CPQ Quote -> Business Rules & Margin Check -> Approval Chain -> Sent to ERP -> ERP Invoicing & Delivery -> Sync Back to CRM

[Path 2: ERP-Imported Order]
ERP Order Feed -> Deduplication & Validation -> Sync to CRM -> CPQ / Commercial Review -> ERP Official Processing
```

### Path 1: Orders Created in CRM
1. A sales rep or authorized user compiles a quote in the CPQ engine.
2. The CPQ engine validates volume discounts, product pricing tiers, payment terms, and approved credit limits.
3. If discount or credit limits exceed thresholds, an automated approval request is routed to the supervisor.
4. Upon approval, the order payload is formatted for ERP dispatch.
5. The ERP confirms acceptance, allocates inventory, and issues the official fiscal invoice.
6. The CRM captures the ERP order/invoice reference numbers and updates the local order status.

### Path 2: Orders Imported from ERP
1. Valid ERP orders are pulled into the CRM staging area.
2. The system matches foreign records against existing records using composite unique keys.
3. Verified orders that require commercial negotiation or amendments are loaded into the CPQ interface.
4. Canceled, voided, or fulfilled ERP states are strictly respected. The CRM never overrides an official ERP status without an authorized integration transaction.

### Deduplication & Idempotency Rules
* Every external record is uniquely identified by the composite tuple:  
  `{ sourceSystem, entityType, tenantId, externalDocumentId }`
* Identical document numbers belonging to different business entities or branches must NEVER be coalesced into a single record.
* All sync endpoints must be idempotent: repeated runs, network retries, or partial batch resubmissions must never create duplicate accounts, orders, or payments.

---

## 6. Universal Task & Delegation Engine

Tasks are NOT static to-do lists. They serve as the **central operational nexus** across sales, collection, field operations, and customer service.

### Task Data Contract
Every task record contains:
* **Identification:** Unique stable ID, creation timestamp, creator ID.
* **Routing:** Assignee type (`USER` or `GROUP`), Assignee ID, Department / Team.
* **Classification:** Operational category (`FOLLOW_UP`, `COLLECTION`, `VISIT`, `CPQ_REVIEW`, `INTERNAL`), priority (`LOW`, `NORMAL`, `HIGH`, `URGENT`).
* **SLA & Scheduling:** Target due date, remaining SLA hours, escalation triggers, breach flags.
* **Contextual Anchor:** Associated entity reference (`accountId`, `quoteId`, `invoiceId`, `caseId`).
* **Hierarchy:** Parent task ID and subtask list.
* **Auditability:** Delegation history, execution proof/evidence, status lifecycle (`OPEN`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CANCELLED`).

### Workload Balancing & Smart Priority
The task engine computes prioritization based on:
1. Financial urgency (overdue balance size and aging days).
2. Time remaining until SLA breach.
3. Active worker capacity and workload distribution.
4. Geographic proximity (clustering nearby accounts on field days).

---

## 7. Collaboration, Mentions & Dynamic Forms

### Multi-Entity Mention Architecture
The mention engine allows referencing real CRM entities across notes, task descriptions, and operational chat using the structured syntax `@Entity:ID`:
* **Supported Entity Types:** Accounts, Users, Groups, Cheques, Invoices, Products/SKUs, Quotes, Tasks, and Service Cases.
* **Structured Reference Record:** Each mention stores:
  `{ entityType: string, entityId: string, displayText: string, source: 'CRM' | 'ERP' }`
* **Integrity Rule:** Plain text strings alone are never treated as valid foreign entity keys.

### Universal Dynamic Form Integration
* All entity creation forms (Accounts, Contacts, Tasks, Quotes, Cheques, Activities, Cases) route through the centralized schema engine (`DynamicFormRenderer` and `dynamicFormEngine.ts`).
* No individual workspace may hand-roll custom input components that bypass central field validation, Persian date parsing, Sayad checksums, or RBAC security guards.

### Operational Chat Engine
* Team chat supports real-time entity mentions with expandable summary preview cards.
* Users can convert any message directly into an actionable task while preserving the originating customer context and entity mentions.
* Sensitive actions (e.g. approving a quote, modifying credit limits) require explicit secondary confirmation modals and are never executed silently.
