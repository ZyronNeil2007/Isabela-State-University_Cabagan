# PRD.md — Product Requirements Document
# ISU Premium ID Generator · v3.8.2

---

## 1. Product Overview

| Field | Value |
|---|---|
| **Product Name** | ISU Premium ID Generator |
| **Version** | 3.8.2 (as of 2026-09-27) |
| **Product Type** | Client-Side Progressive Web Application (PWA) |
| **Description** | A fully client-side, zero-server web application that generates print-ready student identification cards for all 11 campuses of Isabela State University (Philippines). |
| **Repository** | https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan |
| **Author** | Zyron Neil |

### Problem Being Solved
ISU students and administrators lack a fast, accessible, zero-cost tool to produce print-quality student ID cards without proprietary desktop software, specialized hardware, or institutional back-end systems.

### Primary Goals
- **Zero-Server, Zero-Privacy-Risk** — All data stays on the user's device. No uploads, no accounts, no cookies, no external API calls for personal data.
- **Print-Ready Output** — Export CR80-standard (85.6 × 54 mm) front+back ID cards packed onto A4 landscape PDF.
- **Multi-Campus Support** — Cover all 11 ISU campuses with distinct color schemes.
- **Accessibility** — Support mobile, tablet, and desktop with responsive design and keyboard navigation.

---

## 2. Target Users

### 2.1 ISU Students (Primary)
- Fill in personal data; upload photo and signature.
- Use single-ID generation, photo cropping, signature capture, and PDF export.

### 2.2 School Administrators / Registrars (Secondary)
- Prepare and upload CSV data for batch generation.
- Verify completeness via the Batch Manager modal and export A4 print PDFs.

> **NEEDS VERIFICATION** — No authentication or RBAC exists. Both user types use the same interface with no login gate.

---

## 3. Core Features

### Feature 1 — ID Template Version Selection
- Two official templates: **Old ID** and **2026 New ID**.
- Controlled by `state.idVersion` (`'old'` | `'2026'`).
- Switching reloads the appropriate template PNG images and CONFIG coordinate objects.

### Feature 2 — Campus Theme Selector
- 11 ISU campuses: Cabagan (default), Echague, Cauayan, Ilagan, Roxas, Angadanan, San Mateo, Jones, Palanan, San Mariano, Santiago City.
- Each campus has a primary color, accent color, and particle color defined in `CAMPUS_CONFIG`.
- Theme applies to UI CSS variables (`--green-600`, `--gold-400`) and hologram watermark accents.
- The underlying ID template PNG does **not** change per campus theme.

### Feature 3 — 10-Step Guided Form (Stepper)
- Steps: 1. ID Version, 2. Photo, 3. Full Name, 4. ID Number, 5. Course/Department, 6. DOB, 7. Parent/Guardian, 8. Address, 9. Telephone, 10. Signature.
- Steps 1–5 show the front card face; steps 6–10 auto-flip to the back face.
- All alphabetic fields are auto-uppercased.
- No hard validation on text fields — blanks show placeholder text on the card.

### Feature 4 — Real-Time Canvas Preview
- Every form input triggers a debounced `renderCanvases()` via `requestAnimationFrame`.
- Updates both `front-canvas`, `back-canvas`, and the mini preview thumbnails.
- VanillaTilt.js adds a 3D tilt hover on the card preview wrapper.

### Feature 5 — Photo Upload & Interactive Cropper
- Accepts any `image/*` file up to 5 MB.
- Opens a pan/zoom cropper modal after upload.
- Crop output: 315 × 355 px, drawn at `CONFIG.photo` coordinates on canvas.

### Feature 6 — Signature Capture
- **Draw mode**: Freehand on a touch/mouse HTML5 Canvas.
- **AI Photo mode**: Upload a photo of a physical signature → Otsu's binarization → autocrop to content bounds → 45% contrast boost → background removal → transparent PNG.

### Feature 7 — Batch Multi-Student Mode
- UI tab limit: **5 students** (`MAX_STUDENTS = 5`).
- Each student has independent: `formData`, `photoImage`, `signatureImage`.
- CSV import **bypasses** the 5-student UI limit.

### Feature 8 — CSV Bulk Import
- Fuzzy column header matching (case-insensitive regex word-boundary).
- Supported headers: `name`/`full`, `id`/`student`/`number`, `course`/`program`/`degree`, `dob`/`birth`/`date`, `parent`/`guardian`, `address`/`home`, `tel`/`phone`/`mobile`/`contact`.
- DOB expected as `YYYY-MM-DD`. Malformed/empty rows skipped.
- If first tab is empty, it is replaced by the first CSV row.

### Feature 9 — OCR Autofill
- Tesseract.js v5.1.1 (WASM) — lazy-loaded (~4 MB) only on first OCR modal open.
- Extracts: Name, ID Number, Course, DOB via regex patterns.
- Two-step: scan → review → "Apply to Form".
- 100% in-browser; no data transmitted.

### Feature 10 — A4 Batch PDF Export
- jsPDF 2.5.1 (CDN, deferred).
- A4 landscape; up to 5 student pairs per page; CR80 dimensions (54 × 85.6 mm).
- Front+back stacked vertically per column; dashed cut guides; page header with date.
- Filenames: `ISU_ID_{NAME}_Print_Ready.pdf` (single) or `ISU_ID_Batch_{N}_Students.pdf` (batch).

### Feature 11 — PNG Image Export
- Options: Front only, Back only, Both sides (500 ms delay between both).
- Filenames: `ISU_ID_{NAME}_Front.png` / `_Back.png`.

### Feature 12 — Session Auto-Save & Restore
- `localStorage` key: `isu_id_session_v1`.
- Saves: `formData`, `photoDataUrl`, `signatureDataUrl`, `idVersion` per student.
- Throttled to once per 2 s; skipped if payload > 4.5 MB (quota guard).
- Restore banner shown on load if a meaningful prior session exists.

### Feature 13 — Security Hologram Watermark
- Elements: semi-transparent seal circle, UV guilloche wave curves, iridescent ribbon gradient.
- Drawn at 6–7% opacity; embedded in all exports.
- Toggled via `state.showHologram`.

### Feature 14 — High-Resolution Card Inspector
- Full-screen modal showing the front or back canvas at native resolution.
- Inline "Download Front" / "Download Back" buttons.

### Feature 15 — Batch Data Manager Modal
- Table: #, Name, ID Number, Course, Photo status, Signature status, Actions.
- Search, select student, delete student, CSV re-export.

### Feature 16 — Web Audio Sound FX
- Web Audio API (no library).
- Sounds: `flip` (sine sweep), `chime`/`success` (triangle chord), `click`/`tab` (sine beep).
- Toggled via speaker icon (`state.audioEnabled`).

### Feature 17 — Progressive Web App (PWA)
- `manifest.webmanifest` + `sw.js` Service Worker.
- Stale-While-Revalidate cache strategy; precaches core assets on install.
- Fully functional offline after first load.

---

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | Render both ID card sides on HTML5 Canvas in real time as form data changes. |
| FR-002 | Support two template versions (Old ID, 2026 New ID), switchable at any time. |
| FR-003 | Display a 10-step guided stepper with Back/Next/Done navigation. |
| FR-004 | Auto-flip preview to back face at step 6 or higher. |
| FR-005 | Validate photo: image/* MIME and max 5 MB; show error toast otherwise. |
| FR-006 | Open interactive cropper modal (pan + zoom slider) after photo selection. |
| FR-007 | Accept freehand signature drawing (mouse and touch). |
| FR-008 | Accept photo of handwritten signature; apply Otsu's binarization, autocrop, contrast boost, and background removal client-side. |
| FR-009 | Support up to 5 independent student tabs via UI. |
| FR-010 | CSV import: unlimited rows, fuzzy header matching, skip malformed rows. |
| FR-011 | Lazily load Tesseract.js WASM on first OCR modal open; show real-time progress. |
| FR-012 | Show OCR results for user review before applying to form. |
| FR-013 | Export A4 landscape PDF: CR80 dimensions, 5 students/page, dashed cut guides. |
| FR-014 | Export individual card faces as PNG files. |
| FR-015 | Auto-save session to localStorage after every render, throttled to 1 save/2 s. |
| FR-016 | Show restore banner on load if a prior meaningful session exists. |
| FR-017 | Support 11 campus color themes via pill buttons. |
| FR-018 | Render security hologram watermark on front canvas when enabled. |
| FR-019 | Provide high-resolution card inspector modal. |
| FR-020 | Provide Batch Data Manager with search, status indicators, and CSV export. |
| FR-021 | Register Service Worker for offline-first PWA behavior. |
| FR-022 | Auto-uppercase all alphabetic input fields before canvas render. |
| FR-023 | Apply glass blur navbar effect on scroll past hero section. |
| FR-024 | Provide mobile navigation drawer (hamburger) on viewports < 861px. |
| FR-025 | Play Web Audio API sound effects on card flip, tab switch, campus switch, export. |
| FR-026 | Pause WebGL holographic shimmer rAF loop when browser tab is hidden. |

---

## 5. Non-Functional Requirements

### Performance
- `requestAnimationFrame` debounce: max 1 re-render per ~16 ms.
- `localStorage` saves: throttled to 1 per 2 s.
- Tesseract.js: lazy-loaded (~4 MB WASM) on first OCR modal open only.
- `backdrop-filter` and blur effects disabled on mobile (≤ 860px).
- Background uses `position: fixed` `::before` pseudo-element (not `background-attachment: fixed`).
- QR code rendering: memoized offscreen cache to avoid DOM reflows.

### Security
- No backend; zero user data transmitted externally.
- SHA-384 SRI hashes on all CDN scripts.
- All CDN scripts use `defer` for non-blocking parallel loading.

### Accessibility
- ARIA roles on: navigation drawer, hamburger, preview card, progress bar, stepper dots.
- Auto-focus first input on each step (380 ms delay for animation).
- Keyboard: Enter/Space triggers card flip.
- Decorative elements: `aria-hidden="true"`.

### Responsiveness
- Mobile-first; single-column stepper on mobile (< 861px); split-panel on desktop (≥ 900px).
- Fluid typography via `clamp()`.
- Mobile: bottom export drawer. Desktop: dropdown.

### Reliability
- All image loads: Promise-based with `.onerror` fallbacks.
- Template PNG fallback: colored fill rect + console warning.
- PDF export: `finally` block restores state.
- `localStorage` save: wrapped in `try/catch`.

### Browser Support
Chrome 90+, Firefox 88+, Edge 90+, Safari 15+. Requires Canvas 2D API, FileReader, `backdrop-filter`, Web Audio API, `IntersectionObserver`, Service Workers, `document.fonts.ready`.

---

## 6. User Flows

### Flow A — Single Student Quick Generation
```
Load page → check localStorage (no session / discard)
→ Hero: "Create Your ID" → scroll to Generator
→ Step 1: Choose template version
→ Step 2: Upload photo → cropper → apply crop
→ Steps 3–9: Enter name, ID, course, DOB, parent, address, telephone
→ Step 10: Draw/upload signature → AI enhance (optional)
→ "Download ID" → Export menu → PDF or PNG
```

### Flow B — Session Restore
```
Load page → restore banner appears
→ [Restore]: all students rehydrated from localStorage, form populated
→ [Discard]: localStorage cleared, fresh start
```

### Flow C — CSV Batch Import
```
Click CSV import icon → select .csv file
→ JS parses with fuzzy header matching
→ Students array populated (unlimited rows)
→ Toast: "Imported N students"
→ Open Batch Manager → review completeness
→ Add photos/signatures manually per tab
→ Print Batch PDF
```

### Flow D — OCR Autofill
```
Click "OCR Autofill" → modal opens; Tesseract pre-loads
→ Upload/snap photo of printed ID or form
→ "Scan & Extract" → progress 0–100%
→ Review extracted fields (Name, ID, Course, DOB)
→ "Apply to Form" → fields filled, canvas re-renders
→ Modal closes; auto-navigate to first empty step
```

---

## 7. Data Schema

### Student Object (in-memory)
| Field | Type | Notes |
|---|---|---|
| `name` | string | Auto-uppercased |
| `idNumber` | string | Auto-uppercased |
| `course` | string | Old ID only |
| `department` | string | 2026 ID only; abbreviation → full name lookup |
| `dob` | string | `YYYY-MM-DD`; displayed as `DD-MM-YYYY` (old) or `MM/DD/YYYY` (2026) |
| `parentName` | string | Auto-uppercased |
| `address` | string | Auto-uppercased |
| `telephone` | string | Auto-uppercased |
| `photoDataUrl` | string | Base64 PNG |
| `photoImage` | Image | HTMLImageElement (not serialized) |
| `rawSourceImage` | Image | Original uncropped upload |
| `signatureDataUrl` | string | Base64 PNG |
| `signatureImage` | Image | HTMLImageElement (not serialized) |

### Application State
| Field | Type | Values |
|---|---|---|
| `idVersion` | string | `'old'` or `'2026'` |
| `campusTheme` | string | One of 11 campus keys |
| `showHologram` | boolean | — |
| `audioEnabled` | boolean | — |
| `activeStudentIndex` | number | 0 to students.length-1 |
| `students` | array | Array of student objects |

### localStorage Schema (`isu_id_session_v1`)
```json
{
  "version": "old | 2026",
  "students": [
    {
      "formData": { "name": "", "idNumber": "", "course": "", "department": "", "dob": "", "parentName": "", "address": "", "telephone": "" },
      "photoDataUrl": "data:image/png;base64,...",
      "signatureDataUrl": "data:image/png;base64,..."
    }
  ]
}
```

---

## 8. Business Rules
| Rule | Description |
|---|---|
| BR-001 | Steps 1–5 → front face; steps 6–10 → auto-flip to back face |
| BR-002 | Blank fields show placeholder text on canvas (not errors) |
| BR-003 | Old ID: free-text `course` field; 2026 ID: `department` dropdown |
| BR-004 | UI tab limit: 5 students; CSV import bypasses this limit |
| BR-005 | Crop output always 315 × 355 px |
| BR-006 | 2026 ID: photo drawn *under* template (border shows over photo); Old ID: template drawn *over* photo area |
| BR-007 | Hologram watermark embedded in all canvas exports |
| BR-008 | QR payload: `ISU-VERIFY:{studentId}:{studentName}` |
| BR-009 | Campus theme changes UI colors only — does not swap template PNG |
| BR-010 | PDF export: `activeStudentIndex` temporarily iterated per student; restored in `finally` |
| BR-011 | Session save: throttled 2 s, skipped if payload > 4.5 MB |
| BR-012 | localStorage save gracefully fails in private/incognito mode |

---

## 9. Integrations
| Service | Purpose | Load Method |
|---|---|---|
| Google Fonts | Plus Jakarta Sans (UI) + Roboto Condensed (card text) | `<link>` preconnect |
| Phosphor Icons | UI icon library | CDN script, defer, SRI |
| Three.js r134 | WebGL holographic shimmer | CDN script, defer, SRI |
| VanillaTilt.js 1.8.1 | 3D tilt hover on card preview | CDN script, defer, SRI |
| GSAP 3.12.5 + ScrollTrigger | Scroll animations, hero entrance | CDN script, defer, SRI |
| Anime.js v4 | Micro-interactions | CDN script, defer, SRI |
| jsPDF 2.5.1 | A4 PDF generation | CDN script, defer, SRI |
| Tesseract.js 5.1.1 | OCR WASM engine | Lazy-loaded on first OCR open |

---

## 10. Edge Cases & Error Handling
| Scenario | Behavior |
|---|---|
| Photo > 5 MB | Toast error: "Image is too large. Maximum size is 5MB." |
| Non-image file upload | Toast error: "Please upload a valid image file" |
| PDF export error | Toast error: "Export failed. Please try again." |
| Template PNG not found | Fallback: colored fill rect + console warning |
| Session payload > 4.5 MB | Save skipped; one-time toast warning |
| localStorage unavailable | `try/catch` swallows; silent skip |
| Tesseract.js load failure | OCR status shows error in modal |
| VanillaTilt not yet loaded | Polled every 150 ms, max 20 attempts |
| QRCode library missing | `drawFallbackQr()` — deterministic charCode pattern |
| Tab hidden during WebGL shimmer | rAF paused; resumed on `visibilitychange` |
