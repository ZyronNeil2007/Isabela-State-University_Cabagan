# Features & Bug Fixes Tracker — v3.6.0 Release

## 1. Multi-Campus & College Color Theme Selector (Resolved Roadmap Item #4)

### Problem Description
Isabela State University (ISU) spans 11 campuses across Isabela province (Cabagan, Echague, Cauayan, Ilagan, Roxas, Angadanan, San Mateo, Jones, Palanan, San Mariano, and Santiago City Extension). Previously, the generator only supported Cabagan Main Campus styling.

### Implemented Solution
Integrated a university-wide Campus Theme Engine:
1. **11 Campus Presets**: Implemented themes for all 11 ISU campuses with distinct color palettes.
2. **Dynamic UI & Canvas Sync**: Swapping themes updates CSS root variables (`--green-600`, `--gold-400`), live canvas background accents, and WebGL Three.js hero particle constellation colors.

---

## 2. Real-Time Verification QR Code Generator

### Implemented Solution
Renders a dynamic QR code on the ID back face encoding verification payload `ISU-VERIFY:[ID]:[NAME]`. Scannable by standard camera apps or campus entry readers.

---

## 3. Holographic Security Watermark Overlay

### Implemented Solution
Adds an interactive toggle to render an official ISU Seal watermark, UV guilloche security curves, and iridescent ribbon sheen on the front ID card face.

---

## 4. Glassmorphism Batch Student Data Manager

### Implemented Solution
A glassmorphism table modal displaying all batch students with photo/signature completeness badges (`✓ Yes` / `✗ Missing`), real-time search filtering, row deletion, and CSV re-export.

---

## 5. Comprehensive Bug Fixes (All 14 Tracked Issues Resolved)

### 🔴 High Priority — Bugs
- **#01 - PDF Export State Mutation**: Wrapped PDF export loop in `try...finally` to ensure `state.activeStudentIndex` is always restored even if `pdf.addImage()` throws mid-loop.
- **#02 - DOB Date Formatting Desync**: Switched date parsing to UTC getters (`getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`) to avoid locale desync garbling DOB strings.
- **#03 - Signature Canvas Cleared on Resize**: Attached redraw logic to window resize handlers to restore `student.signatureImage` data onto the canvas buffer.
- **#04 - CSV Header Fuzzy Match Collision**: Replaced substring `includes('id')` checks with exact word-boundary regex (`\b`) to prevent false matches like "address".
- **#05 - OCR Navigation Flow Jumps**: Fixed `applyOcrResults()` to step sequentially through unfilled fields rather than jumping back to step 1.

### 🟡 UX Issues
- **#06 - Static Hero Stat Badge**: Dynamically updates the "Max Batch" hero chip past 5 when CSV files containing larger student batches are imported.
- **#07 - Unconfirmed Student Tab Deletion**: Added confirmation dialogs (`confirm()`) before deleting student tabs containing populated form data.
- **#08 - Restrictive Signature Photo Input**: Removed `capture="environment"` attribute to allow users to select signature files from photo galleries.
- **#09 - Blocking Native Alerts**: Replaced all native `alert()` popups with non-blocking glassmorphic toast notifications.

### 🔵 Logic Gaps
- **#10 - Manual vs Auto Card Flip Desync**: Synchronized `shouldFlip`, `idCard`, and `miniCard` classes to ensure the card face matches current stepper progress.
- **#11 - Codebase Module Numbering**: Corrected duplicate section numbers in `app.js`.
- **#12 - Cropper Zero-Scale Race Condition**: Wrapped `baseScale` calculation in `requestAnimationFrame` to ensure modal dimensions are rendered before scaling.

### 🟣 Performance / Security Risks
- **#13 - LocalStorage Quota Exceeded**: Bounded `saveSessionToStorage()` payload serialization to 4.5MB limits, preventing browser quota crashes.
- **#14 - CDN SRI Security Hardening**: Pinned Tesseract.js to v5.1.1 and embedded SHA-384 Subresource Integrity hashes into script tags.
