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

**v3.9.0** introduces the **CR80 2026 Student ID template**, live HTML/CSS card preview, high-fidelity two-column back alignment, dynamic auto-shrinking text, bundled local typography, and optimizations across the web application and Android assets.

---

## ✨ New Features

- **CR80 2026 ID Standard as Default**:
  - The 2026 New ID now follows the official *ISU Student ID – CR80 Template* (816 × 1296 px layout, standard CR80 54 × 85.6 mm card ratio) as the default selection upon initial load.
- **Live HTML/CSS Card Preview**:
  - Embedded high-fidelity front and back HTML card faces (`#cr80-front` and `#cr80-back`) directly in the preview section (`style.css` §23).
  - All form fields (student name, ID number, department/college, photo, signature, emergency contact person, residential address, telephone/contact number, birth date) update the live card instantly.
  - Interactive scaling powered by `ResizeObserver` automatically fits the 816 × 1296 px card board to the user's viewport and container width.
- **Refined 2026 Front Layout**:
  - Official university wordmark image integrated into the header.
  - Adjusted "Cabagan, Isabela" positioning (y 178 → 173 px).
  - Silhouette placeholder displayed in the photo frame until a student photo is uploaded (rendered both in the live HTML preview and export canvases).
- **Two-Column Back-Side Alignment**:
  - Formatted labels and values in clean, distinct columns (values aligned at x = 232–492 px), vertically centered per row.
  - Dynamic font shrinking down to 22 px with wrapping for long multi-line contact entries.
- **Synchronized Canvas Rendering with Auto-Shrink & Wrap**:
  - Added `autoShrink` and `wrap` options in `renderText2026()` so exported PNG and PDF canvases match the live HTML card preview.

---

## 🚀 Improvements

- **Offline-First Typography**:
  - Bundled local Poppins font files (400, 600, 700 Latin woff2 subsets, SIL OFL) under `web/fonts/` for offline visual fidelity and consistency.
- **Hero Image Optimization**:
  - Resized landing page hero reference images to 520 px width, reducing asset footprint by over 55% (≈ 400 KB total vs. ≈ 940 KB).
- **Android Asset Parity**:
  - Synchronized `web/style.css` with `android/app/src/main/assets/www/style.css`.
  - Bumped Android `versionCode` to `5` and `versionName` to `"3.9.0"`.

---

## 🐛 Bug Fixes

- **College of Engineering (COE) Label**:
  - Corrected COE designation to "College of Engineering" across department selection dropdowns and ID card text rendering.
- **Broken Image Icon on Empty Signature**:
  - Fixed specificity conflict where global `img { display: block }` overrode the HTML `[hidden]` attribute on empty signatures.
- **Typography & Canvas Pixel Snapping**:
  - Reset inherited line-height and text-rendering inside the CR80 card for exact template pixel alignment; snapped canvas text lines to whole pixel grids.

---

## 🔧 Technical Changes

- **PWA Service Worker Cache**:
  - Bumped Service Worker cache name to `isu-id-v3.9.0` with updated precache asset references (`./style.css?v=3.9.0`, fonts, and template images).
- **Documentation Suite Sync**:
  - Updated `README.md`, `PRD.md`, `AGENTS.md`, `DESIGN_SYSTEM.md`, and `ARCHITECTURE.md` to reflect version `3.9.0`.

---

## ⚠️ Breaking Changes

> [!NOTE]
> **None** — Backward compatibility is maintained. The legacy ID template option remains fully accessible via the ID version toggle.

---

## 🙏 Credits / Contributors

- **Lead Developer**: Zyron Neil ([@ZyronNeil2007](https://github.com/ZyronNeil2007))
- **Co-Author & Review**: Claude Sonnet 5.5
- **Institution**: Isabela State University (ISU) — Cabagan Campus
