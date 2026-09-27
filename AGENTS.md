# AGENTS.md — Agent & Contributor Ruleset
# ISU Premium ID Generator · v3.8.2

> This file is the source of truth for all agents, AI assistants, and human contributors working on this codebase. Read it before making any changes.

---

## 1. Project Identity

| Key | Value |
|---|---|
| **Project** | ISU Premium ID Generator |
| **Version** | 3.8.2 |
| **Type** | Client-Side PWA (no build step, no framework, no backend) |
| **Entry Point** | `web/index.html` |
| **Primary Logic** | `web/app.js` |
| **Styling** | `web/style.css` |
| **Animations** | `web/animations.js` |
| **Android App** | `android/` (Kotlin + Jetpack Compose + WebView shell) |

---

## 2. Absolute Rules (Do Not Violate)

### 2.1 — No Build Tools
There is **no Webpack, Vite, Rollup, npm, or Node.js build pipeline** for the web app. Do not introduce one. All files are plain HTML, CSS, and vanilla JavaScript. They must be openable directly via `file://` or a static HTTP server.

### 2.2 — No Backend
There is **no server, no API, no database, no auth**. All processing — rendering, OCR, signature extraction, PDF generation, session persistence — happens entirely in the browser. Do not introduce any server-side dependency.

### 2.3 — No Frameworks for the Web App
Do **not** introduce React, Vue, Svelte, Angular, or any JS framework into the `web/` directory. The web app is intentionally vanilla HTML/CSS/JS.

### 2.4 — No New CDN Dependencies Without Justification
All CDN libraries must:
1. Be loaded with `defer` attribute.
2. Include a SHA-384 SRI hash (`integrity` attribute).
3. Include `crossorigin="anonymous"`.
4. Be documented in `ARCHITECTURE.md` under the Integrations section.

### 2.5 — Privacy Preservation
Never introduce code that:
- Sends user-entered data (name, ID, photo, signature) to any external server.
- Uses third-party analytics scripts (Google Analytics, Segment, Mixpanel, etc.).
- Sets cookies or accesses `document.cookie`.

### 2.6 — No Modification Without Understanding the State Model
The global `state` object in `app.js` is the single source of truth. Before modifying any feature, understand the full state flow:
```
DOM input event → state.students[activeIndex].formData update → renderCanvases() → saveSessionToStorage()
```
Always update `state` first, then call `renderCanvases()`. Never mutate the canvas directly without going through state.

### 2.7 — Preserve Existing Comments and Docstrings
Do not remove or shorten existing JSDoc comments, section headers (the `═══` banner comments in `app.js`), or CSS section comments. These are the developer's primary navigation system in a large, single-file codebase.

---

## 3. File Responsibilities

| File | Owner | Responsibility | Do NOT |
|---|---|---|---|
| `web/index.html` | Structure | HTML layout, ARIA, CDN imports, section IDs | Add inline `<script>` blocks beyond the PWA registration snippet; add styles beyond `:root` overrides |
| `web/style.css` | Styling | All CSS; design tokens in `:root`; 22 documented sections | Use `!important` excessively; add Tailwind; use inline styles in JS unless dynamically computed |
| `web/app.js` | Logic | State management, canvas rendering, all feature modules | Move logic to HTML; use `document.write`; use synchronous XHR |
| `web/animations.js` | Motion | GSAP, Anime.js, Three.js animations only | Add business logic; modify state object; call `renderCanvases()` |
| `web/sw.js` | PWA | Service Worker; cache versioning | Add fetch interception for POST requests |
| `web/manifest.webmanifest` | PWA | App identity, icons, display mode | Change `start_url` without updating SW cache name |

---

## 4. Code Conventions

### 4.1 JavaScript
- **ES6+** syntax: arrow functions, `const`/`let`, template literals, destructuring, `async/await`, `Promise`.
- **No `var`**. Use `const` by default; `let` only when reassignment is needed.
- **Naming**:
  - Constants (module-level, never reassigned): `UPPER_SNAKE_CASE` (e.g., `CONFIG`, `CAMPUS_CONFIG`, `SESSION_KEY`).
  - State fields and local variables: `camelCase`.
  - DOM element lookups: prefer `getElementById` for unique elements; `querySelector` for CSS selectors.
- **Error handling**: Wrap all async operations in `try/catch/finally`. All user-facing errors must go through `showToast(message, 'error')`.
- **DOM queries**: Do not cache DOM element references at module top-level if elements may not exist at parse time. Use `?.` optional chaining or guard with `if (!el) return;`.
- **Throttle/Debounce**: Use the existing `throttle()` utility in `app.js`. Do not import lodash.
- **No jQuery**.

### 4.2 CSS
- All design tokens live in `style.css` under section `1. DESIGN TOKENS` as CSS custom properties on `:root`.
- Never hardcode color hex values in component rules — always reference a CSS variable.
- New components must follow the existing glass tier system:
  - `--glass-t1-*`: Main panels (form, preview).
  - `--glass-t2-*`: Inner cards, form groups.
  - `--glass-t3-*`: Nav, footer elements.
- Every new CSS section must have the matching section header comment style:
  ```css
  /* ───────────────────────────────────────────────────────────
     N. SECTION NAME
  ─────────────────────────────────────────────────────────── */
  ```
- Animations must respect `prefers-reduced-motion`. Check `animations.js` module G for the pattern.
- Mobile performance rules (≤ 860px): disable `backdrop-filter`, hide decorative orbs/glows.

### 4.3 HTML
- Use semantic HTML5 elements (`<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`, `<header>`).
- Every interactive element must have a descriptive `id` attribute (used by `getElementById` in JS).
- Use `aria-label`, `aria-hidden`, `role`, `aria-expanded` per existing patterns.
- File inputs for images: `accept="image/*"`.
- Modals: must have `class="modal-overlay"` and include `aria-hidden` toggling.

---

## 5. Canvas Rendering Rules

### 5.1 — Always Render via `renderCanvases()`
Never draw directly to `frontCanvas` or `backCanvas` outside of `renderCanvases()`. This function is the single render entry point. It reads from `state.students[state.activeStudentIndex]` and calls `drawFront()` + `drawBack()`.

### 5.2 — CONFIG Object Structure (Old Template)
```js
CONFIG = {
  photo:     { x, y, w, h },           // Photo bounding box (pixels, 4.17x scale)
  name:      { x, y, fontSize, color },
  idNumber:  { x, y, fontSize, color },
  course:    { x, y, fontSize, color },
  dob:       { x, y, fontSize, color },
  parent:    { x, y, fontSize, color },
  address:   { x, y, fontSize, color },
  telephone: { x, y, fontSize, color },
  signature: { x, y, w, h },
  qr:        { x, y, size }
}
```

### 5.3 — Canvas Scale
- Old template: internal pixel scale = `4.17x` (canvas is 4.17× larger than the displayed CSS size).
- 2026 template: uses its own `CONFIG_2026` with distinct coordinate mapping.
- All coordinates in CONFIG are in native canvas pixels, not CSS pixels.

### 5.4 — Dimension Guard
Before resizing a canvas, always check if dimensions actually changed:
```js
if (canvas.width !== newW || canvas.height !== newH) {
  canvas.width  = newW;
  canvas.height = newH;
}
```
This prevents unnecessary GPU buffer discards on every call.

### 5.5 — Image Loading
Use the `loadImageFromDataUrl(dataUrl)` helper:
```js
function loadImageFromDataUrl(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
```

---

## 6. State Management Rules

### 6.1 — Single Source of Truth
```js
const state = {
  idVersion:           'old' | '2026',
  campusTheme:         'cabagan' | ... (11 options),
  showHologram:        boolean,
  audioEnabled:        boolean,
  activeStudentIndex:  number,
  students:            StudentObject[],
  _quotaWarned:        boolean        // internal flag; do not expose to UI
};
```

### 6.2 — Student Object Shape
```js
{
  photoImage:       HTMLImageElement | null,
  photoDataUrl:     string | null,
  rawSourceImage:   HTMLImageElement | null,
  signatureImage:   HTMLImageElement | null,
  signatureDataUrl: string | null,
  formData: {
    name:       string,
    idNumber:   string,
    course:     string,
    department: string,
    dob:        string,
    parentName: string,
    address:    string,
    telephone:  string
  }
}
```

### 6.3 — Adding a New Field
To add a new form field to the student data:
1. Add the field key to `formData` in the student template (in `addStudent()` and `restoreSessionFromStorage()`).
2. Add an entry to `INPUT_KEY_MAP` mapping the HTML input ID to the state key.
3. Add rendering logic in `drawFront()` or `drawBack()` referencing the correct CONFIG coordinates.
4. Add coordinates to `CONFIG` and `CONFIG_2026`.
5. Update `saveSessionToStorage()` to confirm the field is included via `{ ...s.formData }` spread.

---

## 7. Session Persistence Rules

- Key: `isu_id_session_v1`
- Throttle: `saveSessionToStorage` is throttled at 2 s via the `throttle()` utility.
- Quota guard: if the JSON payload > 4.5 MB, skip save and warn once (`state._quotaWarned`).
- Serialization: only plain objects are saved — `Image` objects are excluded and rebuilt from `dataUrl` strings on restore.
- Backward compatibility: the restore function supports both old format (array) and new format `{ version, students }`.

---

## 8. OCR Module Rules

- Tesseract.js is **lazy-loaded** via a dynamically appended `<script>` tag the first time the OCR modal opens.
- After loading, `_tesseractLoaded = true` to prevent re-injection.
- OCR runs on `'eng'` language only in the current implementation.
- Extracted fields use `ocrExtract(text, patterns[])` — returns first match or `null`.
- Before applying results, always show the review panel (`ocr-results`). Never auto-apply.
- After applying, call `goToStep(firstEmptyStep)` to guide the user to the next unfilled field.

---

## 9. Signature Processing Rules

The AI signature enhancement pipeline (`enhanceSignatureWithAI`) follows this sequence:
1. Load source image into a normalized scan canvas (max 1200px dimension).
2. Run **Otsu's binarization** (`getOtsuThreshold`) to find optimal ink/paper cutoff.
3. Find content bounding box (`getContentBoundingBox`) with 10px padding.
4. Draw cropped signature onto 638 × 240 px work canvas at 90% scale, centered.
5. Apply 45% contrast boost via the factor formula.
6. Remove near-white background (`removeWhiteBackground`) at threshold 220.
7. Render result to preview canvas in the modal.
8. On "Use This Signature", save final dataUrl + Image to `student.signatureDataUrl` / `student.signatureImage`.

---

## 10. Export Module Rules

### PDF Export
- Uses `jsPDF` with `orientation: 'landscape'`, `unit: 'mm'`, `format: 'a4'`.
- Cards are CR80: 54 mm wide × 85.6 mm tall. Horizontal gap: 3 mm. Vertical gap: 6 mm.
- Cards are centered per-page, accounting for the actual number of students on that page.
- `activeStudentIndex` must be restored in the `finally` block after iteration.
- If `pdf.save()` throws, show toast error: `'Export failed. Please try again.'`

### PNG Export
- Use `canvas.toDataURL('image/png')` directly — no compression.
- "Both sides": schedule back PNG download with a 500 ms timeout after front.

---

## 11. Animation Module Rules (`animations.js`)

- Must register `gsap.registerPlugin(ScrollTrigger)` at the top.
- Always check `prefersReducedMotion()` inside each function — never at parse time.
- Three.js `initThreeHero()` is currently **disabled** (returns immediately). Do not re-enable without profiling.
- The holographic shimmer rAF loop must pause when `document.hidden === true`.
- `window.onCampusThemeChange` is a public callback registered by `animations.js`. `app.js` calls it on campus theme switch to update particle colors.

---

## 12. Android App Rules (`android/`)

- Kotlin + Jetpack Compose; targeting API 24+ (Android 7.0+).
- `versionCode` and `versionName` must match `web/sw.js` cache version on every release.
- OCR uses **ML Kit Text Recognition** (on-device) — not Tesseract.js.
- QR generation uses **ZXing**.
- Photo crop uses **uCrop** library.
- Session persistence uses **Room** (SQLite) + **DataStore** (preferences).
- The `android/app/src/main/assets/www/` directory contains a mirrored copy of the web app's `style.css` — keep it in sync with `web/style.css`.

---

## 13. Testing Checklist (Before Any PR)

- [ ] Open `web/index.html` directly in Chrome and Firefox (no local server).
- [ ] Fill in a full student record: name, photo (upload + crop), ID, course/department, DOB, parent, address, telephone, signature (draw and AI modes).
- [ ] Verify live canvas updates on each step.
- [ ] Verify card flips at step 6.
- [ ] Test PDF export (single + batch of 2 students).
- [ ] Test PNG export (front, back, both).
- [ ] Test session restore: fill form, reload page, click "Restore".
- [ ] Test CSV import with the sample CSV from `web/scripts/dummy_data_generator.py`.
- [ ] Test OCR modal (if applicable — requires local HTTP server for Tesseract WASM).
- [ ] Test all 11 campus themes — verify UI colors update.
- [ ] Test on mobile viewport (Chrome DevTools): stepper, export sheet, camera input.
- [ ] Confirm no `console.error` output (warnings are acceptable).
- [ ] Check that `sw.js` cache version (`isu-id-vX.Y.Z`) was bumped if any cached asset changed.

---

## 14. Naming Conventions for New Features

| Element | Convention | Example |
|---|---|---|
| CSS variables | `--category-shade` | `--green-500`, `--glass-t1-bg` |
| HTML element IDs | `kebab-case`, descriptive | `ocr-scan-btn`, `batch-modal` |
| JS functions | `camelCase`, verb-first | `renderCanvases()`, `openCropper()` |
| JS constants | `UPPER_SNAKE_CASE` | `CAMPUS_CONFIG`, `SESSION_KEY` |
| Image files | `descriptive_snake_case.ext` | `template_front.id.png` |
| CSS keyframes | `camelCase` | `@keyframes wordPop`, `@keyframes pulseDot` |
| Section comments in `app.js` | `N. FEATURE NAME — Description` | `17. SESSION SAVE — Auto-persist...` |
| Section comments in `style.css` | `N. SECTION NAME` with `───` divider | `22. RESPONSIVE BREAKPOINTS` |

---

## 15. What NOT to Change Without Discussion

- The `CONFIG` and `CONFIG_2026` objects — changing coordinates breaks the template alignment.
- The `SESSION_KEY` constant — changing it invalidates all users' saved sessions.
- The SW cache name `isu-id-vX.Y.Z` convention — must be bumped with every release.
- The `MAX_STUDENTS = 5` UI tab limit — changing this without updating PDF layout logic breaks exports.
- The `CAMPUS_CONFIG` color palette — these represent the official institutional colors of each ISU campus.
- SRI hash values on CDN scripts — must be recalculated if the CDN version is updated.
