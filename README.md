# 🎓 Isabela State University Premium ID Generator v3.6.0

A premium, fully responsive **client-side** web application for generating high-fidelity, print-ready student identification cards for **all 11 Isabela State University (ISU) campuses**. Built with a stunning glassmorphism UI, interactive 3D card preview, multi-campus theme engine, security hologram overlays, real-time QR verification, and a powerful batch export studio — no backend, no build tools, runs entirely in the browser.

🔗 **Live Demo**: [https://zyronneil2007.github.io/Isabela-State-University_Cabagan/](https://zyronneil2007.github.io/Isabela-State-University_Cabagan/)

---

## ✨ Features

### 🆕 v3.6 — University Multi-Campus & Security Studio Edition
- **🏛️ All 11 ISU Campus Themes**: Instant theme switching across all 11 ISU campuses (Cabagan, Echague, Cauayan, Ilagan, Roxas, Angadanan, San Mateo, Jones, Palanan, San Mariano, Santiago City). Propagates accent colors to UI buttons, live canvas graphics, and WebGL Three.js hero particles.
- **📱 Real-Time Verification QR Code**: Renders a dynamic, scannable QR Code (`ISU-VERIFY:[ID]:[NAME]`) on the card back for instant campus gate verification.
- **🛡️ Holographic Security Watermark**: Interactive toggle for ISU Seal watermark, UV guilloche security curves, and iridescent ribbon sheen reflection.
- **📊 Glassmorphic Batch Data Manager**: Table modal with student photo/signature completeness badges, real-time search, batch deletion, and CSV re-export.
- **🔍 High-Res 3D Card Inspector Studio**: Full-screen 300 DPI canvas inspection modal for front and back faces.
- **🔊 Web Audio API Sound FX**: Native Web Audio API sound cues for card flips, tab switching, and batch export chimes with an instant mute toggle.

### 🆕 v3.5 — Bento Grid & Spatial Motion Overhaul
- **🎨 Immersive Spatial Redesign**: Split-screen hero layout, animated 6-card Bento Grid for features, and a guided 3-step process.
- **🚀 Advanced GSAP & Three.js Animations**: Particle constellation background in the hero section and holographic shimmer effects on the live card stage.

### 🆕 v3.4 — Session Auto-Save & OCR Autofill
- **💾 Auto-Save Session**: Auto-saves your entire session (all students, form data, photos, signatures) to `localStorage` after every change.
- **🔍 OCR Autofill from Photo**: Snap or upload a photo of any printed ID or registration form. Powered by **Tesseract.js** (offline WASM), extracts Name, ID Number, Course, and DOB automatically.

### 🆕 v3.3 — Local Signature Scanner & Extractor
- **🪄 Local Signature Extraction (No APIs)**: Otsu binarization and automatic bounding-box cropping strip paper shadows and convert handwritten paper signatures to clean, transparent ink.

### 🆕 v3.2 — CSV Bulk Import & Unlimited Batches
- **📥 CSV Bulk Student Import**: Upload a `.csv` file containing 50+ students to auto-generate all ID cards in one click with smart header mapping.

### 🆕 v3.1 — Native A4 Landscape PDF Export
- **📄 Native A4 Landscape PDF Export**: Arranges up to 5 student pairs (10 cards total) per sheet in side-by-side front/back stacked rows for easy double-sided printing.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | Semantic HTML5 (ARIA roles, keyboard navigation) |
| Styling | Vanilla CSS3 (custom properties, GPU transforms, glassmorphism) |
| Logic | Vanilla ES6+ JavaScript (Canvas API, jsPDF, FileReader) |
| 3D / Graphics | [Three.js r134](https://threejs.org/), [VanillaTilt.js](https://micku7zu.github.io/vanilla-tilt.js/) |
| Animations | [GSAP 3](https://greensock.com/gsap/) + ScrollTrigger, [Anime.js v4](https://animejs.com/) |
| OCR | [Tesseract.js v5](https://tesseract.projectnaptha.com/) (offline WASM) |
| Icons & Fonts | [Phosphor Icons](https://phosphoricons.com/), Google Fonts (Plus Jakarta Sans, Roboto Condensed) |

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan.git
   ```
2. Open `index.html` directly in any modern browser — no server needed.

---

## 📋 Changelog

### v3.6.0 *(2026-07-25)*
- `feat` — Multi-Campus Theme Selector supporting all 11 ISU campuses (Cabagan, Echague, Cauayan, Ilagan, Roxas, Angadanan, San Mateo, Jones, Palanan, San Mariano, Santiago City).
- `feat` — Real-Time Verification QR Code Generator for ID card back.
- `feat` — Holographic Security Watermark Overlay with UV guilloche curves and iridescent sheen.
- `feat` — Glassmorphism Batch Student Data Manager Modal with search, status badges, and CSV export.
- `feat` — High-Resolution 3D Card Inspector Studio modal.
- `feat` — Web Audio API synthesized sound effects with mute toggle.
- `fix` — Fully resolved all 14 outstanding bugs/UX issues from `issues.txt`.

### v3.4.3 *(2026-07-08)*
- `fix` — Corrected formatting and alignment issues in the module directory index within the main application script (`app.js`).
- `fix` — Standardized documentation and sequence ordering for secondary logical layers.

### v3.4.2 *(2026-06-28)*
- `fix` — Resolved 14 critical issues spanning bugs, UI desyncs, and edge-case exceptions.
- `fix` — Corrected activeStudentIndex mutation error when PDF exports fail midway.
- `fix` — Replaced obtrusive `alert()` dialogs in CSV import with native glassmorphism toast notifications.
- `perf` — Upgraded session `localStorage` to check file quota and prevent browser crash limits.
- `sec` — Secured Tesseract.js WASM imports by pinning CDN to v5.1.1 and adding SHA-384 Subresource Integrity hashes.

### v3.4.1 *(2026-06-26)*
- `fix` — Fixed hero stage card clipping on mobile viewports by enabling visible overflow and percentage-based transforms.
- `fix` — Reorganized mobile hero CTA buttons into a full-width stacked column for easier tap targets.
- `fix` — Improved version badge wrapping and tightened vertical rhythm across the hero section.
- `fix` — Added cache buster query parameter to `style.css` to ensure immediate delivery of UI updates.

### v3.4.0 *(2026-06-24)*
- `feat` — Auto-save session to `localStorage` on every render; restore banner on next page load.
- `feat` — OCR Autofill from a printed ID or registration form photo using Tesseract.js (local WASM, no server).
- `feat` — Smart regex field parser: extracts Name, ID Number, Course, and DOB from raw OCR text.
- `feat` — Cinematic hero redesign with spatial mesh grid layout and morphing ambient glows.
- `perf` — Significant performance tuning: debounced canvas rendering, throttled localStorage saves, lazy-loaded Tesseract.js, and strict CSS `contain` isolation.
- `ux` — Applied results review step in OCR modal before committing to the form; "Apply to Form" only shows post-scan.
- `ux` — Session restore banner slides in with a spring animation; dismissed silently if session is empty.

### v3.3.2 *(2026-06-24)*
- `fix` — Dynamically centers the cards on the A4 page for incomplete batches (e.g., exactly 1 student or 4 students).

### v3.3.1 *(2026-06-24)*
- `feat` — Redesigned print batch PDF layout to A4 Landscape, fitting up to 5 student card pairs (Front + Back) per page side-by-side.

### v3.3.0 *(2026-06-24)*
- `feat` — Added 100% client-side Local Signature Scanner/Extractor (no external APIs, offline-compatible).
- `feat` — Implemented Otsu's Binarization algorithm for adaptive paper thresholding (shadow and grey background removal).
- `feat` — Implemented automatic content bounding-box detection (autocrop) to trim paper margins.
- `ui` — Designed glass tab toggles to switch between draw and upload signature modes.

### v3.2.0 *(2026-06-24)*
- `feat` — Added client-side CSV bulk student import to support generating large batches of ID cards.
- `feat` — Bypassed manual batch limit (5) for CSV uploads, enabling infinite student batches.
- `feat` — Automated fuzzy column header mapping for Name, ID, Course, DOB, Parent/Guardian, Address, and Telephone.

### v3.1.0 *(2026-06-23)*
- `feat` — Completely redesigned Hero section with split-screen layout, floating 3D cards, and animated particles.
- `feat` — Converted A4 print export from PNG to an actual PDF using `jsPDF`.
- `feat` — ID cards strictly conform to standard CR80 (85.6mm x 54mm) size upon export.
- `ui` — Mobile hero and feature-pills refined for maximum visual appeal on small screens.

### v3.0.0 *(2026-06-22)*
- `feat` — Multi-student tab system (up to 5 students) with independent state per tab
- `feat` — Interactive photo cropper modal with pan/zoom and 315:355 aspect ratio lock
- `feat` — Dynamic A4 batch export engine: 1–5 student grid with cut guides & page header
- `feat` — Desktop export actions panel + mobile bottom sheet for Save Image / Print Batch
- `fix` — Repaired corrupted CSS that broke photo preview and live badge styling
- `fix` — Footer layout: removed `100vw` negative-margin hack causing horizontal scrollbar on Windows
- `fix` — Mobile export sheet visibility (no longer bleeds into page layout)
- `fix` — Desktop export actions correctly hidden on mobile, restored at 900px+

### v2.0.0
- Premium glassmorphism redesign with multi-tier glass panels
- 9-step stepper form with mini live card preview in header
- VanillaTilt 3D hover effect on card preview
- Digital signature pad (HTML5 Canvas)
- A4 print export with front + back dual-card layout

### v1.0.0
- Initial ISU ID generator — single student, basic form, canvas render

---

## 🧑‍💻 Credits & License

Created, designed, and developed by **Zyron Neil**.

Feel free to open a pull request or submit an issue in the [repository](https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan).

---
© 2026 Zyron Neil. All rights reserved.
