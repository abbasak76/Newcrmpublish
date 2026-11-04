# CHANGELOG b41 — Chat entity previews and execution handoff

- Unified `HANDOFF.md` with all requested capabilities, phased execution order and hard acceptance gates.
- Rebuilt `REMAINING_ITEMS.md` as one source of truth, separating source work from environment-blocked integrations.
- Added entity reference preview rows to chat messages with type, display text, source label, local subtitle when available, and navigation action.
- Expanded entity route mapping for customer/staff/check/invoice/product/task/quote mentions. Route destinations for less-used entity types still require route-by-route browser verification.
- Version: 0.12.15 / r11-cp9-b41-chat-entity-previews.

## Validation status
- `npm test`: PASS (including 10 chat entity preview contracts). `npm run audit:contracts`: PASS (static-only).
- Build failed because `vite` is not installed; lint failed because `vite/client` is unavailable. Browser and external integrations remain unverified until dependencies and real environment are available.
