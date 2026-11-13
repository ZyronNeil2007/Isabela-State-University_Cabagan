# 🚀 Release Notes — v3.9.0: Redesign, accessibility and bug fixes

## 📦 Summary
Apple-style redesign of the web app (light + automatic dark, flat grouped surfaces, one accent from the selected campus), plus fixes found in a code review. The card renderer and all `CONFIG` coordinates are untouched.

## 🔧 Fixes
- Dates of birth no longer shift by one day in UTC+8; M/D/Y and ISO inputs are both understood.
- CSV import: quoted commas/newlines, BOM, `idNumber` / `student_id` header aliases. CSV export: real Blob download (the old data-URI truncated at `#`), BOM + CRLF, formula-injection guard.
- Batch table escapes imported text; deleting a student keeps the active tab consistent.
- PDF export: clear message and restored button if jsPDF failed to load.
- Signature pad maps pointer position correctly when the canvas is CSS-scaled.
- Pinned Phosphor Icons to 2.1.2 (unpinned URL could never match its SRI hash).

## 🎨 Design & accessibility
- New `style.css` (token-driven, 20 sections); new `index.html` markup. Hero reduced to one message and one action; features as a list, not a bento grid.
- Dialog focus management (Escape, focus in/out, Tab trap), `aria-pressed` toggles, visible focus rings, 16 px inputs, `prefers-reduced-motion/-transparency/-contrast`, `forced-colors`.
- Button text ≥ 4.5:1 on all 11 campus colours; dark-mode accent text ≥ 4.7:1.
- Mobile stepper dots are ~26 × 32 px (below the 28 px guideline minimum by 2 px; they are a secondary control alongside Back/Next).

## 📉 Performance
- Removed GSAP, ScrollTrigger, Anime.js, Three.js and `animations.js`; Roboto Condensed is self-hosted (`web/fonts/`, SIL OFL 1.1).
- Service worker (`isu-id-v3.9.0`) also caches CORS CDN assets for offline icons and PDF export.

## ⚠️ Not done
- `android/` is unchanged. Its bundled `www/` is still v3.5.0 and has known issues (malformed QRCode SRI, non-scannable fallback QR, `allowBackup=true`, `fallbackToDestructiveMigration`). Sync before releasing Android 3.9.0.

---

# 🚀 Release Notes — v3.8.2: Documentation & Source of Truth Architecture

## 📦 Summary

**v3.8.2** is a **documentation and architecture release** for the Isabela State University (ISU) Premium ID Generator. This release establishes a comprehensive, professional documentation suite to serve as the project's single source of truth. No application logic, styling, or functionality was modified in this release.

---

## 📚 Documentation

Four primary architectural documents have been created in the repository root:

- **`PRD.md` (Product Requirements Document)**: Documents all 17 core features, functional requirements, user flows, data schemas, edge cases, and integrations.
- **`AGENTS.md` (Contributor Ruleset)**: Establishes 15 absolute developer rules, file responsibilities, code conventions, state management guidelines, and testing checklists.
- **`DESIGN_SYSTEM.md` (Design System)**: Documents the complete CSS token system, typography scales, glassmorphism tiers, all 11 campus color palettes, and responsive breakpoints.
- **`ARCHITECTURE.md` (Architecture Overview)**: Maps the monolithic application structure (20 logic modules, 7 animation modules), data flow, canvas generation system, Progressive Web App (PWA) configuration, and Android hybrid stack.

- `README.md`: Bumped version references to v3.8.2.

---

## 🔧 Technical Changes

- `web/sw.js`: Bumped Service Worker cache name to `isu-id-v3.8.2`.
- `web/index.html`: Bumped CSS cache buster to `v3.8.2` and updated footer version badges.
- `android/app/build.gradle.kts`: Bumped `versionName` to `"3.8.2"`.
- `android/app/src/main/assets/www/index.html`: Synced web changes to Android WebView assets.

---

## ⚠️ Breaking Changes

> [!NOTE]
> **None** — This is a documentation-only release. All features, UI, and performance optimizations from v3.8.1 remain untouched.

---

## 🙏 Credits / Contributors

- **Lead Developer**: Zyron Neil ([@ZyronNeil2007](https://github.com/ZyronNeil2007))
- **Institution**: Isabela State University (ISU) — Cabagan Campus
