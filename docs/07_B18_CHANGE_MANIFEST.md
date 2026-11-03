# b18 — Change Manifest

## Source changes
- `src/components/SettingsWorkspace.tsx`: editable permission profiles; role scope, parent role and default workspace controls; user direct-supervisor control; audit events; cycle safeguards.
- `src/lib/version.ts`, `package.json`, `metadata.json`, `VERSION.md`: version `0.11.4`, release `r11-cp9-b18`.
- `src/lib/geoIntelligence.ts`: polygon validation, point-in-polygon, geometry versioning, canonical metric catalog.
- `src/types.ts` and `src/lib/storage.ts`: persisted state shape and safe empty defaults for geo collections.
- `tests/rbac-configurability.test.mjs`: behavior and UI-contract tests.
- `tests/geoIntelligence.test.mjs`: polygon, geometry versioning and metric contract tests.
- `package.json`: includes the new test in `npm test`.

## Audit and handoff files
- `RBAC_AUDIT_b18.md`
- `STATUS_b18.md`
- `NOT_DONE_b18.md`
- `CHANGELOG_b18.md`
- `HANDOFF.md`
- `docs/README.md`

## Unchanged boundaries
- No backend, SQL Server, ERP, or real GPS integration is claimed.
- No MapLibre tile map, map drawing UI, connected heatmap, print flow, or real collection operations are claimed as implemented; only the geospatial domain engine and testable polygon logic exist.
- Existing RBAC service remains the single client-side engine; no parallel engine was introduced.
- Bottom navigation and Solar Ember design direction remain unchanged.
