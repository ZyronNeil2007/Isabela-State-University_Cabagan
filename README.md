# 🎓 Isabela State University Premium ID Generator v3.4.2

A premium, fully responsive **client-side** web application for generating high-fidelity, print-ready student identification cards for **Isabela State University (ISU)**. Built with a stunning glassmorphism UI, interactive 3D card preview, and a powerful batch export engine — no backend, no build tools, runs entirely in the browser.

🔗 **Live Demo**: [https://zyronneil2007.github.io/Isabela-State-University_Cabagan/](https://zyronneil2007.github.io/Isabela-State-University_Cabagan/)

---

## ✨ Features

### 🆕 v3.4 — Session Auto-Save & OCR Autofill
- **💾 Auto-Save Session**: The app now auto-saves your entire session (all students, form data, photos, signatures) to `localStorage` after every change. If you close the tab by accident, a restore banner will appear on the next visit.
- **🔍 OCR Autofill from Photo**: Snap or upload a photo of any printed ID or registration form. Powered by **Tesseract.js** (local, runs in the browser), the system reads Name, ID Number, Course, and Date of Birth and pre-fills the form fields — skipping tedious manual entry for re-prints.
- **🟢 Smart Field Parsing**: Regex-based post-processing converts extracted dates to `YYYY-MM-DD` format and normalises names to uppercase automatically.

### 🆕 v3.3 — Local Signature Scanner & Extractor
- **🪄 Local Signature Extraction (No APIs)**: Scan or upload a photo of a signature written on white paper, and have it cropped and extracted instantly without external network requests or third-party APIs.
- **Background Removal & Contrast Enhancement**: Uses mathematical thresholding and custom canvas pixel filters to boost contrast, crop empty margins, and strip grey/white backgrounds to transparent.
- **🔄 Dual Signature Capture Modes**: Seamlessly toggle between drawing a signature freehand and uploading a photo for instant local scanning.

### 🆕 v3.2 — CSV Bulk Import & Unlimited Batches
- **📥 CSV Bulk Student Import**: Upload a `.csv` file containing 50+ students to auto-generate all ID cards in one click.
- **♾️ Infinite Batch Mode (CSV-only)**: Bypasses the manual student tab limit of 5, enabling infinite student card creation via CSV import.
- **🔍 Smart Header Matching**: Automatically maps columns using fuzzy matching for keys like Name, Student Number (ID), Course, Date of Birth, Parent/Guardian, Address, and Telephone.

### 🆕 v3.1 — Immersive Redesign & PDF Export
- **🎨 Immersive Hero Layout**: Complete visual overhaul of the hero section featuring a split-screen design, floating 3D cards, particle backgrounds, and dynamic grid layouts. Mobile view has been fully optimized for a perfect "above-the-fold" experience.
- **📄 Native PDF Export**: Upgraded the print batch engine from generating static PNGs to producing a **proper multi-page A4 PDF document** via `jsPDF`. IDs are precisely sized to **CR80 standard dimensions (3.375" x 2.125")** with accurate cut lines, perfect for ID card printers.

### 🆕 v3.0 — Batch & Precision Upgrades
- **👥 Multi-Student Batch Mode**: Generate up to **5 student IDs** in a single session using a tabbed interface. Each student tab maintains its own independent form state, photo, and signature.
- **✂️ Interactive Photo Cropper**: A modal-based crop editor with **pan, zoom (0.5×–3×),** and a locked **315:355 portrait aspect ratio** — ensuring every photo is perfectly framed before it hits the card.
- **🗂️ Smart A4 Batch Export**: The export engine dynamically arranges 1–5 student IDs into an optimized grid.

### ⚡ Core Features
- **🫧 Premium Glassmorphism UI**: Multi-tier CSS3 glass panels with backdrop blur, saturation layers, and ISU green (`#15B915`) & gold (`#C9A84C`) palette.
- **📱 Adaptive Stepper Form**: A 9-step wizard intelligently adapts between mobile (full-screen stepper) and desktop (side-by-side split layout) without breaking flow.
- **🔄 Interactive 3D Card Preview**: Real-time mouse-hover 3D tilt (powered by VanillaTilt) with a click-to-flip animation between Front and Back views.
- **🖼️ Mini Live Preview**: A compact in-header thumbnail syncs in real-time and auto-flips to match the active form step.
- **✍️ Digital Signature Pad**: Touch & mouse-friendly HTML5 canvas for capturing handwritten signatures, embedded directly on the card.
- **💾 Save as Image**: Export the Front, Back, or Both card sides individually as PNG images.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | Semantic HTML5 (ARIA roles, keyboard navigation) |
| Styling | Vanilla CSS3 (custom properties, GPU transforms, flexbox/grid) |
| Logic | Vanilla ES6+ JavaScript (Canvas API, jsPDF, FileReader) |
| OCR | [Tesseract.js v5](https://tesseract.projectnaptha.com/) (offline, WASM) |
| 3D Effects | [VanillaTilt.js](https://micku7zu.github.io/vanilla-tilt.js/) |
| Icons | [Phosphor Icons](https://phosphoricons.com/) |
| Typography | Inter — Google Fonts |

> **Zero runtime dependencies** on your server. No npm, no bundler, no backend.

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan.git
   ```
2. Open `index.html` directly in any modern browser — no server needed.

---

## 📋 Changelog

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
