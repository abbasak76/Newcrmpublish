# Phase 1 evidence — b41 (partial delivery)

## Implemented in source
- Added structured entity reference cards to chat messages when `entityMentions` exists; cards show entity type, display text, source label, optional local subtitle, and route action.
- Expanded route dispatch for CUSTOMER, STAFF, CHECK, INVOICE and PRODUCT in addition to existing task/quote/opportunity/case routes.
- Replaced handoff and remaining-items documents with a unified, explicit execution checklist and acceptance gates.

## Not yet proven / not marked complete
- Each route must be checked against actual router definitions and authorization in a running browser.
- Full custom-form mention coverage, page-by-page UI states, browser/IndexedDB and mobile accessibility remain open.
- ERP, SQL Server/RLS, push, SMS/messaging, Redis, background scheduler and real TSP/ETA require external configuration.
- Build/typecheck must pass in a dependency-installed environment.

## Gate
This is a partial source delivery, not a claim that Phase 1 or production readiness is complete.
