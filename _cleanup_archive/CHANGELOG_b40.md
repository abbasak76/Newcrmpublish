# CHANGELOG b40 — Form Mention JSX Fix

## Changes applied
- Fixed a JSX/TypeScript syntax defect in `src/components/shared/DynamicFormRenderer.tsx`: the textarea mention menu had been placed inside a conditional-expression branch in a way that broke parsing.
- Kept the text-field mention menu and moved textarea mention rendering to a valid position after the field-type conditional. Structured mention references remain attached to the form values.
- Added `tests/formMentionPlacement.test.mjs` and wired it into `npm test` to guard the placement/conditional structure and mention-reference contract.
- Synchronized release metadata to `0.12.14` / `r11-cp9-b40-form-mention-fix`.

## Validation
- `npm test`: PASS, including new 4-assertion form-mention structure test.
- `npm run audit:contracts`: PASS, static SQL contract checks only.
- `npm run build`: BLOCKED because `vite` is not installed (`node_modules` absent).
- `npm run lint`: TypeScript compiler starts but BLOCKED because project type dependencies are absent (`vite/client` not found). Before dependency resolution, it exposed the JSX syntax issue now fixed.
- No browser/IndexedDB, SQL Server/RLS, live ERP, push notification, SMS, WhatsApp, Eitaa, Rubika, or map-provider end-to-end test was possible in this environment.

## Scope boundary
This is a targeted source-integrity fix, not a claim that all product roadmap items or external integrations are complete.
