# CHANGELOG b42 — Operational entity coverage

- Extended `searchMentions` to include CRM opportunities and cases, internal requests/onboarding applications, and ERP-mirror warehouses, using structured references and existing local state only.
- Added warehouse destination routing to the existing operations workspace.
- Extended mention-engine regression tests for opportunity, case, request, and warehouse references.
- Updated release metadata and `HANDOFF.md` to reflect the user's required execution order: source integration → operational/field intelligence → secure real infrastructure.
- No live ERP or warehouse API was added; mention results are local-state search and do not imply live connectivity.
