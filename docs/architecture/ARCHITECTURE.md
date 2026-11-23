# ARCHITECTURE.md — Technical Architecture
# ISU Premium ID Generator · v3.9.0

---

## 1. Architecture Overview

The ISU Premium ID Generator is a **monorepo** containing two independent platforms:

```
isu_id/
├── web/        — Client-Side Web Application (primary)
└── android/    — Android Native App (Kotlin + Jetpack Compose + WebView shell)
```

Both platforms implement the same core product but use different technology stacks. This document covers both.

### Architecture Principles
- **Zero Backend** — All computation happens on the client. No server, no API, no database.
- **No Build Step (Web)** — Plain HTML/CSS and native ES modules, served by any static HTTP server (GitHub Pages, `localhost`, the Android asset loader). `file://` is **not** supported (browsers block module scripts there).
- **Privacy-First** — Student data never leaves the device.
- **Offline-First (Web)** — Service Worker provides stale-while-revalidate caching for full offline use after first load.
- **Performance Budget** — GPU-expensive operations (blur, backdrop-filter) removed or disabled on mobile. Background is in a fixed compositor layer. QR is memoized.

---

## 2. Web Application Architecture

### 2.1 File Structure

```
web/
├── index.html                 # SPA entry: DOM, ARIA, CDN scripts, <link> stylesheets (cascade order), <script type="module">
├── sw.js                      # Service Worker (precaches every module/stylesheet/asset — keep in sync!)
├── manifest.webmanifest       # PWA manifest
├── src/                       # ES modules (no build step) — see §2.2
│   ├── app.js                 #   entry: imports every module in the original single-file order
│   ├── core/
│   │   ├── config/            #   CONFIG / CONFIG_2026 / DEPARTMENT_LABELS (canvas coordinates)
│   │   ├── state/             #   `state` store, canvas/DOM refs
│   │   └── initialization/    #   boot (window load), navbar, expose-globals (inline-handler bridge)
│   ├── features/
│   │   ├── id-generator/      #   form bindings, templates, render engine, stepper
│   │   ├── card-preview/      #   CR80 HTML preview, tilt, card inspect, hologram/audio FX
│   │   ├── student-management/#   student tabs (add/switch/remove)
│   │   ├── photo-editor/      #   interactive cropper (pointer events, pinch zoom)
│   │   ├── signature/         #   signature pad, AI signature enhancement
│   │   ├── csv-import/  ocr/  batch-manager/  qr-verification/  campus-theme/
│   ├── services/
│   │   ├── storage/           #   session auto-save / restore (SESSION_KEY)
│   │   ├── export/            #   PDF (jsPDF) and PNG export
│   │   └── image-processing/  #   image loading, signature pixel algorithms
│   ├── animations/            #   GSAP/Anime/holographic motion layer
│   └── utils/                 #   toast, throttle
├── styles/                    # CSS, split along the original numbered sections (see styles/main.css)
│   ├── main.css               #   header + documented <link> load order
│   ├── base/  layout/  components/  features/  responsive/
├── assets/
│   ├── images/{logos,templates/{legacy,2026},placeholders,screenshots}
│   └── fonts/                 #   Poppins 400/600/700 (OFL)
└── tools/                     # dev-only: dummy_data_generator.py, photo_resizer.py, optimize_logo.ps1 (not shipped to Android)
```

Repository-level folders: `android/` (Kotlin + WebView shell, bundled copy of `web/` in `assets/www/`), `docs/`,
`scripts/` (`validation/`, `sync-android-assets/`), `.github/` (workflows, templates), `wiki/`.

### 2.2 JavaScript module map (`web/src/`)

`web/src/app.js` is the only `<script type="module">` entry. It imports every module in the **same order as the former
single file**, so top-level side effects (listener registration, first renders) happen in the same sequence. Imports are
explicit; only symbols used by other modules are exported.

**Inline-handler bridge.** `index.html` and a few template strings still use inline `onclick="…"` attributes, which can
only call globals. `core/initialization/expose-globals.js` is the single place that publishes those functions on
`window` (29 today). To migrate a handler to `addEventListener`, remove it from that list. `scripts/validation/regression.js`
fails if an inline handler in `index.html` does not resolve on `window`.

**Rules for modules**
- Shared mutable state lives in `core/state/state.js`; a module may mutate `state` but must not reassign another
  module's `let` variables (ES imports are read-only).
- Modules never draw to the canvases directly: update `state`, then call `renderCanvases()` (`id-generator/render-engine.js`).
- `render-engine` is the hub: it triggers the CR80 preview, mini preview and session auto-save.
- Third-party libraries (jsPDF, Tesseract, QRCode, VanillaTilt, GSAP…) stay CDN globals and are read from `window`.
- Add a feature = new folder under `features/`, import it from `src/app.js`, add the file to `sw.js` `PRECACHE_ASSETS`
  (`scripts/validation/check-references.js` verifies this and that every named import resolves).

| Module | Lines | Exports |
|---|---|---|
| `src/animations/animations.js` | 592 | — (side effects only) |
| `src/app.js` | 60 | — (side effects only) |
| `src/core/config/card-config.js` | 243 | `CONFIG`, `CONFIG_2026`, `DEPARTMENT_LABELS` |
| `src/core/initialization/boot.js` | 59 | — (side effects only) |
| `src/core/initialization/expose-globals.js` | 50 | — (side effects only) |
| `src/core/initialization/navbar.js` | 22 | `initNavbar` |
| `src/core/state/canvas-refs.js` | 13 | `frontCanvas`, `frontCtx`, `backCanvas`, `backCtx`, `miniCanvasFront`, `miniCtxFront`, `miniCanvasBack`, `miniCtxBack` |
| `src/core/state/state.js` | 36 | `state` |
| `src/features/batch-manager/batch-manager.js` | 125 | `openBatchModal`, `closeBatchModal`, `selectBatchStudent`, `deleteBatchStudent`, `filterBatchTable`, `exportBatchCsv` |
| `src/features/campus-theme/campus-theme.js` | 116 | `CAMPUS_CONFIG`, `setCampusTheme` |
| `src/features/card-preview/card-inspect.js` | 44 | `openCardInspectModal`, `closeCardInspectModal`, `switchInspectFace` |
| `src/features/card-preview/cr80-preview.js` | 159 | `renderCr80Preview`, `updateMiniCanvas` |
| `src/features/card-preview/security-fx.js` | 115 | `toggleHologramOverlay`, `playAudioFx`, `toggleAudioFx`, `drawHologramWatermark` |
| `src/features/card-preview/tilt.js` | 20 | `initTilt` |
| `src/features/csv-import/csv-import.js` | 114 | — (side effects only) |
| `src/features/id-generator/form-bindings.js` | 130 | `INPUT_KEY_MAP`, `setIdVersion` |
| `src/features/id-generator/render-engine.js` | 378 | `renderCanvases` |
| `src/features/id-generator/stepper.js` | 209 | `goToStep`, `stepperNext`, `stepperBack`, `flipCard`, `initStepper` |
| `src/features/id-generator/templates.js` | 58 | `loadTemplates` |
| `src/features/ocr/ocr.js` | 274 | `openOcrModal`, `closeOcrModal`, `runOcrScan`, `applyOcrResults` |
| `src/features/photo-editor/cropper.js` | 183 | `openCropper` |
| `src/features/qr-verification/qr-code.js` | 84 | — (side effects only) |
| `src/features/signature/ai-signature.js` | 253 | `switchSigMode`, `clearUploadedSig`, `enhanceSignatureWithAI` |
| `src/features/signature/signature-pad.js` | 118 | `sigCanvas`, `sigCtx` |
| `src/features/student-management/student-tabs.js` | 128 | `renderStudentTabs`, `switchStudent`, `removeStudent` |
| `src/services/export/image-export.js` | 53 | `showMobileExportMenu`, `hideMobileExportMenu`, `saveAsImage` |
| `src/services/export/pdf-export.js` | 103 | — (side effects only) |
| `src/services/image-processing/image-loader.js` | 22 | `loadImage`, `loadImageFromDataUrl` |
| `src/services/image-processing/signature-processing.js` | 155 | `removeWhiteBackground`, `getOtsuThreshold`, `getContentBoundingBox` |
| `src/services/storage/session.js` | 146 | `SESSION_KEY`, `saveSessionToStorage`, `showRestoreBanner`, `onRestoreSession`, `onDiscardSession` |
| `src/utils/throttle.js` | 25 | `throttle` |
| `src/utils/toast.js` | 59 | `showToast` |

### 2.3 Module Map (`animations.js`)

| Module | Library | Status | Description |
|---|---|---|---|
| A — Hero Particles | Three.js | **Disabled** (returns immediately) | Background particle constellation |
| B — Hero Entrance | GSAP | Active | Staggered fade-up of hero elements on load |
| C — Scroll Reveals | GSAP ScrollTrigger | Active | Intersection-based fade-up for features, bento, steps |
| D — Micro-interactions | Anime.js | Active | Button click scale, feature stagger |
| E — Holographic Shimmer | Three.js | Active | GLSL shader on `#holo-canvas`; responds to mouse + VanillaTilt |
| F — Scroll Parallax | GSAP ScrollTrigger | Disabled | Was attached to hero glows (removed) |
| G — Reduced Motion | `prefers-reduced-motion` | Active | Lazy `matchMedia` flag checked in each function |

---

## 3. Data Flow

### 3.1 Core Render Loop

```
User Input (form field, file upload, button click)
        │
        ▼
Event Listener (module 7 — form bindings)
        │
        ▼
state.students[activeIndex].formData updated
        │
        ▼
renderCanvases()  ◄──────────────────────────────────────────┐
        │                                                      │
        ├── drawFront(frontCtx, student, CONFIG/CONFIG_2026)  │
        │       ├─ ctx.drawImage(frontTemplate)               │
        │       ├─ ctx.drawImage(student.photoImage)          │
        │       ├─ [drawHologramWatermark() if showHologram]  │
        │       ├─ ctx.fillText(name, idNumber, course...)    │
        │       └─ renderQrCodeOnCanvas() (front/back varies) │
        │                                                      │
        ├── drawBack(backCtx, student, CONFIG/CONFIG_2026)    │
        │       ├─ ctx.drawImage(backTemplate)                │
        │       ├─ ctx.drawImage(student.signatureImage)      │
        │       └─ ctx.fillText(dob, parent, address, tel...) │
        │                                                      │
        ├── syncMiniCanvases()                                │
        │                                                      │
        └── saveSessionToStorage() ──► throttle(2s) ──► localStorage
```

### 3.2 Photo Upload Flow

```
<input type="file" accept="image/*"> change event
        │
        ├── Validate: type must be image/*, size ≤ 5 MB
        │       └── Fail: showToast('Image is too large...', 'error')
        │
        ├── FileReader.readAsDataURL(file)
        │
        ├── onload: create HTMLImageElement from dataUrl
        │
        ├── Store rawSourceImage = img (original, uncropped)
        │
        └── openCropper()
                │
                ├── Display raw image in cropper viewport
                ├── Calculate baseScale to fill cropper frame
                ├── User: pan (mousedown/touchstart drag), zoom (range slider)
                │
                └── "Use This Crop" click:
                        ├── Create offscreen 315×355 canvas
                        ├── ctx.save() → translate → scale → drawImage(rawSourceImage)
                        ├── ctx.restore()
                        ├── canvas.toDataURL() → cropDataUrl
                        ├── Create HTMLImageElement from cropDataUrl
                        ├── student.photoImage = croppedImg
                        ├── student.photoDataUrl = cropDataUrl
                        └── renderCanvases()
```

### 3.3 Session Persistence Flow

```
renderCanvases() [on every render]
        │
        └── saveSessionToStorage()   [throttled, max 1/2s]
                │
                ├── Build snapshot: students[].{ formData, photoDataUrl, signatureDataUrl }
                ├── Wrap: { version: state.idVersion, students: snapshot }
                ├── JSON.stringify()
                ├── Guard: if payload > 4.5 MB → warn + skip
                └── localStorage.setItem('isu_id_session_v1', json)

window.load event
        │
        └── Check localStorage.getItem('isu_id_session_v1')
                │
                ├── Parse: support old (array) and new ({ version, students }) format
                ├── Check: hasMeaningfulData = any student with name or photo
                └── showRestoreBanner()

[User clicks Restore]
        │
        └── restoreSessionFromStorage()
                │
                ├── Parse session → snapshot array
                ├── Restore state.idVersion → setIdVersion()
                ├── Promise.all: rebuild Image objects from dataUrls (async)
                ├── state.students = rebuilt
                └── switchStudent(0) → renderStudentTabs() → renderCanvases()
```

### 3.4 OCR Flow

```
openOcrModal()
        │
        └── ensureTesseractLoaded()  [lazy CDN inject, cached after first load]

[User uploads image → File read to ocrRawDataUrl]

runOcrScan()
        │
        ├── ensureTesseractLoaded()  [no-op if already loaded]
        ├── Tesseract.recognize(ocrRawDataUrl, 'eng', { logger })
        │       └── logger: update setOcrStatus('Recognising ... XX%')
        │
        ├── Extract fields via ocrExtract(text, regexPatterns[]):
        │       ├── Name: /Name[\s]+([A-Z...]{4,60})/im or ALL-CAPS line fallback
        │       ├── ID:   /\b(20\d{2}[-—]\d{4,6})\b/ etc.
        │       ├── Course: /Bachelor of.../im or /BSC?.../im
        │       └── DOB:  various date format patterns → ISO conversion
        │
        ├── Display results in #ocr-results review panel
        │
        └── [User clicks "Apply to Form"]
                └── applyOcrResults()
                        ├── Update student.formData fields
                        ├── Update DOM input values
                        ├── renderStudentTabs() + renderCanvases()
                        ├── closeOcrModal()
                        └── goToStep(firstEmptyStep)
```

### 3.5 PDF Export Flow

```
#download-btn click
        │
        ├── Show loading state ("Generating PDF…")
        ├── await new Promise(rAF + 50ms timeout) → paint loading UI
        │
        ├── const { jsPDF } = window.jspdf
        ├── new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
        │
        ├── For each student (i = 0 to studentCount-1):
        │       ├── if i > 0 && i % 5 === 0: pdf.addPage()
        │       ├── Calculate colIndex = i % 5
        │       ├── Calculate dynamic page centering (based on students on this page)
        │       ├── Calculate frontX, frontY, backX, backY
        │       ├── If colIndex === 0: print page header text
        │       ├── state.activeStudentIndex = i
        │       ├── renderCanvases()  [renders student i]
        │       ├── pdf.addImage(frontCanvas.toDataURL('image/png', 1.0), ...)
        │       ├── pdf.addImage(backCanvas.toDataURL('image/png', 1.0), ...)
        │       └── pdf.rect() dashed cut guides (front + back)
        │
        ├── pdf.save(filename)
        │
        └── finally:
                ├── state.activeStudentIndex = originalIndex
                ├── renderCanvases()   [restore active student]
                └── restore button state
```

---

## 4. State Architecture

### 4.1 The Global `state` Object

```js
const state = {
  idVersion:          '2026',   // 'old' | '2026'  (2026 CR80 is the default)
  campusTheme:        'cabagan',
  showHologram:       false,
  audioEnabled:       false,
  activeStudentIndex: 0,
  _quotaWarned:       false,    // internal: prevents repeated quota warnings
  students: [
    {
      photoImage:       null,   // HTMLImageElement — NOT serialized
      photoDataUrl:     null,   // base64 PNG string — serialized
      rawSourceImage:   null,   // HTMLImageElement — NOT serialized
      signatureImage:   null,   // HTMLImageElement — NOT serialized
      signatureDataUrl: null,   // base64 PNG string — serialized
      formData: {
        name:       '',
        idNumber:   '',
        course:     '',
        department: '',
        dob:        '',
        parentName: '',
        address:    '',
        telephone:  ''
      }
    }
  ]
};
```

### 4.2 State Mutation Rules
- **Single-page, global** — `state` is an exported `const` object in `web/src/core/state/state.js`.
- All form inputs mutate `state.students[state.activeStudentIndex].formData[key]` via `INPUT_KEY_MAP` bindings.
- After any mutation: call `renderCanvases()`.
- Do **not** directly mutate canvas pixels. Always go through `renderCanvases()`.

### 4.3 `INPUT_KEY_MAP`
Maps HTML element IDs to `formData` state keys:
```js
const INPUT_KEY_MAP = {
  'full-name':   'name',
  'id-number':   'idNumber',
  'course':      'course',
  'department':  'department',
  'dob':         'dob',
  'parent-name': 'parentName',
  'address':     'address',
  'telephone':   'telephone'
};
```

---

## 5. Canvas Rendering Architecture

### 5.1 Canvas Elements
| ID | Role | Dimensions |
|---|---|---|
| `front-canvas` | Main front ID face preview | Template PNG native width × height |
| `back-canvas` | Main back ID face preview | Template PNG native width × height |
| `mini-canvas-front` | Thumbnail in mobile stepper header | ~190 × 280 px (approx) |
| `mini-canvas-back` | Thumbnail in mobile stepper header | Same as mini-front |
| `sig-canvas` | Signature drawing pad | DOM-sized (CSS pixels) |
| `crop-canvas` (offscreen) | Crop output | 315 × 355 px |
| `holo-canvas` | WebGL holographic shimmer | Stage size (CSS) |
| `#hero-webgl-canvas` | Three.js particles | **Disabled** |

### 5.2 Template System
Two sets of PNG template images (used by the **canvases**, which are the PNG/PDF export source):
- **Old**: `assets/images/templates/legacy/template_front.id.png` + `assets/images/templates/legacy/template_back.id.png`
- **2026 (CR80)**: `assets/images/templates/2026/new_template_front.id.png` (`?v=cr80c`) + `assets/images/templates/2026/new_template_back.id.png` (`?v=cr80b`) — blank 816 × 1296 px boards. The front export template is rendered from the "ISU Student ID – CR80 Template" HTML with the values removed; the back is rendered from the app's own HTML back card so both match.

Templates are loaded as `HTMLImageElement` objects on boot via `loadTemplates()`, together with `cr80_photo_placeholder.png` (`state.photoPlaceholder2026`) and the Poppins fonts. Canvas dimensions are set to match the loaded template.

### 5.2a CR80 HTML Preview (2026 ID)
For the **2026** version the preview section shows a live **HTML/CSS card** instead of the canvas:
- Markup: `#cr80-front` / `#cr80-back` inside `.cr80-stage` (in `web/index.html`, `.flip-card-front` / `.flip-card-back`).
- Styles: `web/styles/features/cr80-card.css` (§23) — positions are plain CSS on an 816 × 1296 px board; JS scales it to the preview width via `--cr80-scale` (`ResizeObserver`).
- Binding: `renderCanvases()` → `renderCr80Preview()` fills name, ID number, department, photo (silhouette placeholder when empty), signature, contact person, address, contact number and birth date. Text auto-fits (`fitCr80Text`); back values use an aligned two-column layout and wrap to two lines.
- The `.flip-card` gets the class `is-cr80`, which shows the HTML card and hides the canvases. The canvases are **still rendered on every change** because PNG/PDF export, the mini preview and the inspect modal read them.
- **Keep both in sync**: any layout change to the HTML card must be mirrored in `CONFIG_2026` / the blank template PNGs (and vice-versa).

### 5.3 Coordinate Config (`CONFIG` for Old Template)
All coordinates are in **native canvas pixels** (not CSS pixels). The old template uses a ~4.17× scale factor. The `CONFIG` object defines bounding boxes and text positions for every rendered element on both card faces.

### 5.4 2026 Template Specifics
- Uses `CONFIG_2026` with a separate coordinate set (816 × 1296 px, Poppins text, `autoShrink` / `wrap` options handled in `renderText2026()`).
- `DEPT_MAP` lookup converts department abbreviations (e.g., `"CICT"`) to full college names.
- Photo is drawn *before* the template overlay (so the green template border appears over the photo).
- Photo clipping uses `ctx.roundRect()` or a manual arc-path for rounded corners.

---

## 6. Security Architecture

### 6.1 Subresource Integrity (SRI)
All CDN-loaded scripts carry SHA-384 `integrity` attributes:

| Script | Version | SRI |
|---|---|---|
| Phosphor Icons | Latest | SHA-384 hash present |
| Three.js | r134 | SHA-384 hash present |
| VanillaTilt.js | 1.8.1 | SHA-384 hash present |
| GSAP | 3.12.5 | SHA-384 hash present |
| GSAP ScrollTrigger | 3.12.5 | SHA-384 hash present |
| Anime.js | v4 | SHA-384 hash present |
| jsPDF | 2.5.1 | SHA-384 hash present |
| Tesseract.js | 5.1.1 | SHA-384 hash present (lazy-loaded) |

### 6.2 No External Data Transmission
- No `fetch()` to external APIs.
- No `XMLHttpRequest`.
- No WebSocket connections.
- All `Image.src` assignments load local template files or same-origin data URLs.
- Tesseract.js WASM runs locally in a Web Worker spawned by the library.

### 6.3 Content Security Policy
> ⚠️ **NEEDS VERIFICATION** — No explicit `Content-Security-Policy` header or meta tag is defined in `index.html`. Adding one is recommended if deploying to a controlled server.

---

## 7. PWA Architecture

### 7.1 Service Worker (`sw.js`)

- **Cache version**: `isu-id-v3.9.2` (must be bumped on every release that changes cached assets).
- **Install**: Opens cache, `addAll()` the precache list. Calls `skipWaiting()` to immediately activate.
- **Activate**: Deletes all caches not matching the current `CACHE_NAME`. Calls `clients.claim()`.
- **Fetch**: Stale-While-Revalidate strategy — serves cached response immediately, fetches network in background, updates cache on success.

**Precached assets**:
```
./
./index.html
./styles/**/*.css?v=3.9.2     (43 stylesheets, in <link> order)
./src/**/*.js                 (every ES module)
./manifest.webmanifest
./assets/images/logos/isu_logo_256.png
./assets/images/logos/isu_logo_512.png
./assets/images/templates/legacy/template_front.id.png
./assets/images/templates/legacy/template_back.id.png
./assets/images/templates/2026/front_reference.png
./assets/images/templates/2026/back_reference.png
./assets/images/templates/2026/new_template_front.id.png?v=cr80c
./assets/images/templates/2026/new_template_back.id.png?v=cr80b
./assets/images/templates/2026/cr80_seal.png
./assets/images/templates/2026/cr80_university_wordmark.png
./assets/images/placeholders/cr80_photo_placeholder.png
./assets/images/templates/2026/cr80_qr.png
./assets/images/templates/2026/cr80_registrar_signature.png
./assets/fonts/poppins-latin-400.woff2
./assets/fonts/poppins-latin-600.woff2
./assets/fonts/poppins-latin-700.woff2
```

### 7.2 Web App Manifest (`manifest.webmanifest`)

```json
{
  "name": "ISU ID Generator",
  "short_name": "ISU ID",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#010d01",
  "theme_color": "#15B915",
  "icons": [
    { "src": "./assets/images/logos/isu_logo_256.png", "sizes": "256x256", "type": "image/png" },
    { "src": "./assets/images/logos/isu_logo_512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 8. Third-Party Library Integrations

| Library | Version | CDN | Role | Load |
|---|---|---|---|---|
| Plus Jakarta Sans | — | Google Fonts | UI font | `<link>` preconnect |
| Roboto Condensed | — | Google Fonts | ID card canvas font | `<link>` preconnect |
| Phosphor Icons | Latest | jsdelivr | UI icons | `<script>` defer, SRI |
| Three.js | r134 | cdn.jsdelivr | WebGL shader (holo shimmer) | `<script>` defer, SRI |
| VanillaTilt.js | 1.8.1 | cdn.jsdelivr | 3D tilt hover on card | `<script>` defer, SRI |
| GSAP | 3.12.5 | cdn.jsdelivr | Scroll/entrance animations | `<script>` defer, SRI |
| GSAP ScrollTrigger | 3.12.5 | cdn.jsdelivr | Scroll-driven reveals | `<script>` defer |
| Anime.js | v4 | cdn.jsdelivr | Micro-interactions | `<script>` defer, SRI |
| jsPDF | 2.5.1 | cdnjs | A4 PDF generation | `<script>` defer, SRI |
| Tesseract.js | 5.1.1 | unpkg | OCR WASM engine | Lazy — `<script>` injected on demand |
| QRCode.js | — | — | QR code generation | ⚠️ NEEDS VERIFICATION — referenced in code but script tag was removed per changelog |

> **Note on QRCode.js**: The v3.8.0 changelog states "Removed `QRCode.js` script tag from `web/index.html`". The `renderQrCodeOnCanvas()` function gracefully falls back to `drawFallbackQr()` if `typeof QRCode === 'undefined'`. Verify current state in `index.html`.

---

## 9. Android Application Architecture

### 9.1 Tech Stack

| Layer | Technology |
|---|---|
| Language | Kotlin |
| UI Framework | Jetpack Compose + Material 3 |
| Navigation | Navigation Compose |
| OCR | ML Kit Text Recognition (on-device) |
| QR Code | ZXing Core 3.5.3 |
| Photo Crop | uCrop 2.2.8 |
| Image Loading | Coil 2.6.0 |
| Session DB | Room 2.6.1 (SQLite) |
| Settings | DataStore Preferences 1.1.1 |
| Serialization | kotlinx-serialization-json 1.6.0 |
| WebView | AndroidX WebKit 1.11.0 (WebViewAssetLoader) |
| Permissions | Accompanist Permissions 0.34.0 |

### 9.2 Android Build Config
```kotlin
applicationId    = "com.isu.id"
minSdk           = 24    // Android 7.0 Nougat
targetSdk        = 34    // Android 14
compileSdk       = 34
versionCode      = 5
versionName      = "3.9.0"
```

### 9.3 Android vs. Web Feature Parity

| Feature | Web (Vanilla JS) | Android (Kotlin) |
|---|---|---|
| OCR | Tesseract.js (WASM) | ML Kit Text Recognition |
| QR Code | QRCode.js / drawFallbackQr | ZXing |
| Photo Crop | Custom JS modal | uCrop library |
| Session Persistence | localStorage | Room database |
| Settings | In-memory state | DataStore |
| PDF Export | jsPDF | ⚠️ NEEDS VERIFICATION |
| WebView Bridge | N/A | WebViewAssetLoader for hybrid view |

### 9.4 Asset Sync
`android/app/src/main/assets/www/` is a generated mirror of `web/` — never edit it by hand. Run `node scripts/sync-android-assets/sync.js` after every web change (`--check` fails on drift; CI runs it). The sync excludes `sw.js`/manifest (a service worker would cache stale assets across app updates), `tools/`, screenshots, source/brand logos and unused legacy reference overlays. `index.html` skips service-worker registration inside the WebView (`window.AndroidBridge`).

---

## 10. Performance Architecture

### 10.1 Render Performance (Web)

| Optimization | Implementation |
|---|---|
| Canvas debounce | `renderCanvases()` called inside `requestAnimationFrame`; max 1 render/~16ms |
| Canvas dimension guard | Only reassign `canvas.width/height` if dimensions actually changed |
| QR code memoization | `_qrCache` object; skips re-encoding if payload and size unchanged |
| Session save throttle | `throttle(saveSessionToStorage, 2000)` — max 1 localStorage write per 2s |
| Tesseract.js lazy load | ~4 MB WASM injected only on first OCR modal open |
| Three.js particles | Disabled (`initThreeHero()` returns immediately) |
| WebGL shimmer pause | rAF pauses on `document.hidden`; resumes on `visibilitychange` |

### 10.2 CSS Performance (Web)

| Optimization | Implementation |
|---|---|
| Fixed background | `body::before { position: fixed }` — painted once per compositor layer |
| No orb `filter: blur()` | Removed v3.8.1; uses `radial-gradient` for natural soft edges |
| Reduced hero glow blur | `.hero-glow-primary`: 60px → 30px; `.hero-glow-gold`: 80px → 40px |
| Mobile `backdrop-filter` disabled | All glass tiers use solid fallback at ≤ 860px |
| Orbs hidden on mobile | `.floating-orbs { display: none }` at ≤ 860px |
| Hero glows hidden on mobile | `.hero-glow-*` hidden at ≤ 860px |
| Static hero elements | Hero animations stopped in v3.8.0; no CSS animation running on hero on idle |
| `contain: layout style` | Applied to `.hero-section` for CSS containment |

---

## 11. Deployment

| Platform | URL | Method |
|---|---|---|
| GitHub Pages | https://zyronneil2007.github.io/Isabela-State-University_Cabagan/ | Auto-deploy from `main` |
| Vercel | https://isabela-state-university-cabagan.vercel.app | ⚠️ NEEDS VERIFICATION |
| Netlify | https://idgenratorisuc.netlify.app | ⚠️ NEEDS VERIFICATION |

**Local development** (static server required — ES modules do not load from `file://`):
```bash
cd web
python3 -m http.server 8000    # or: npx serve .
# open http://localhost:8000
```

---

## 12. Directory Index (Full Repository)

```
Isabela-State-University_Cabagan/
├── web/
│   ├── index.html                 # SPA entry: DOM, ARIA, CDN scripts, <link> stylesheets (cascade order), <script type="module">
│   ├── sw.js                      # Service Worker (precaches every module/stylesheet/asset — keep in sync!)
│   ├── manifest.webmanifest       # PWA manifest
│   ├── src/                       # ES modules (no build step) — see §2.2
│   │   ├── app.js                 #   entry: imports every module in the original single-file order
│   │   ├── core/
│   │   │   ├── config/            #   CONFIG / CONFIG_2026 / DEPARTMENT_LABELS (canvas coordinates)
│   │   │   ├── state/             #   `state` store, canvas/DOM refs
│   │   │   └── initialization/    #   boot (window load), navbar, expose-globals (inline-handler bridge)
│   │   ├── features/
│   │   │   ├── id-generator/      #   form bindings, templates, render engine, stepper
│   │   │   ├── card-preview/      #   CR80 HTML preview, tilt, card inspect, hologram/audio FX
│   │   │   ├── student-management/#   student tabs (add/switch/remove)
│   │   │   ├── photo-editor/      #   interactive cropper (pointer events, pinch zoom)
│   │   │   ├── signature/         #   signature pad, AI signature enhancement
│   │   │   ├── csv-import/  ocr/  batch-manager/  qr-verification/  campus-theme/
│   │   ├── services/
│   │   │   ├── storage/           #   session auto-save / restore (SESSION_KEY)
│   │   │   ├── export/            #   PDF (jsPDF) and PNG export
│   │   │   └── image-processing/  #   image loading, signature pixel algorithms
│   │   ├── animations/            #   GSAP/Anime/holographic motion layer
│   │   └── utils/                 #   toast, throttle
│   ├── styles/                    # CSS, split along the original numbered sections (see styles/main.css)
│   │   ├── main.css               #   header + documented <link> load order
│   │   ├── base/  layout/  components/  features/  responsive/
│   ├── assets/
│   │   ├── images/{logos,templates/{legacy,2026},placeholders,screenshots}
│   │   └── fonts/                 #   Poppins 400/600/700 (OFL)
│   └── tools/                     # dev-only: dummy_data_generator.py, photo_resizer.py, optimize_logo.ps1 (not shipped to Android)
│
├── android/                    # Kotlin + Jetpack Compose + WebView shell
│   └── app/src/main/assets/www/  # generated mirror of web/ (scripts/sync-android-assets)
│
├── docs/
│   ├── architecture/           # ARCHITECTURE.md, REFACTORING_AUDIT.md
│   ├── design/                 # DESIGN_SYSTEM.md, PRD.md
│   ├── development/            # MIGRATION_GUIDE.md, KNOWN_ISSUES.md, QA reports, release notes
│   ├── deployment/             # DEPLOYMENT.md
│   ├── security/               # THIRD_PARTY.md
│   └── decisions/              # ADRs
├── scripts/
│   ├── validation/             # check-references, regression, features, responsive_qa, eslint config
│   └── sync-android-assets/    # web -> android www mirror (+ --check)
├── .github/                    # workflows (deploy-pages, validate), issue/PR templates
├── wiki/                       # GitHub wiki sources (kept in place)
├── index.html  404.html        # redirect to ./web/ for project-site URLs
├── README.md  CHANGELOG.md  CONTRIBUTING.md  SECURITY.md  AGENTS.md  LICENSE
```

---

## Responsive layer
`web/styles/responsive/adaptive.css` (§24 ADAPTIVE LAYER) ADAPTIVE LAYER owns cross-cutting responsive rules. Breakpoints: ≤380 / ≤767 phone / 768–1024 tablet / ≥1025 desktop. Never use `overflow:hidden` on html/body/ancestors of sticky elements (use `clip`). Modals are bottom sheets ≤767px; fixed sheets must be children of `<body>`.
