# ADR 0001 — ES modules with a `window` bridge for inline handlers

Date: 2026-11-23 · Status: accepted (owner decisions)

- **Inline handlers stay.** `index.html` keeps its ~80 `onclick`-style handlers; the functions they call are exposed on
  `window` from one place (`web/src/core/initialization/expose-globals.js`). Migrating to `addEventListener` is a later,
  incremental step.
- **`file://` is no longer supported.** Modules require HTTP(S): GitHub Pages, localhost, and the Android asset loader.
  The README documents running a local dev server.
- **Several `<link>` tags for CSS**, in dependency order (no `@import` waterfall).
- **Scripts renamed** to `dummy_data_generator.py` and `photo_resizer.py`.
- **Merge order:** responsive overhaul (PR #22) merged first; the refactor starts from that stable base.
- Unchanged by decision: ID card dimensions, template coordinates, rendering behaviour, data structures,
  `SESSION_KEY`, Android asset compatibility.
