# ARCHITECTURE.md — Technical Architecture
# ISU Premium ID Generator · v3.8.2

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
- **No Build Step (Web)** — Plain HTML/CSS/JS; openable directly via `file://` or a static HTTP server.
- **Privacy-First** — Student data never leaves the device.
- **Offline-First (Web)** — Service Worker provides stale-while-revalidate caching for full offline use after first load.
- **Performance Budget** — GPU-expensive operations (blur, backdrop-filter) removed or disabled on mobile. Background is in a fixed compositor layer. QR is memoized.

---

## 2. Web Application Architecture

### 2.1 File Structure

```
web/
├── index.html              # SPA entry point; DOM structure, ARIA, CDN imports
├── style.css               # Complete design system (22 documented sections, 5926 lines)
├── app.js                  # Application brain (3095 lines, 20 numbered modules)
├── animations.js           # Motion layer (592 lines, 7 modules: A–G)
├── sw.js                   # Service Worker (stale-while-revalidate strategy)
├── manifest.webmanifest    # PWA manifest (icons, display, theme color)
├── images/
│   ├── isu_logo_256.png
│   ├── isu_logo_512.png
│   ├── template_front.id.png       # Old ID front template
│   ├── template_back.id.png        # Old ID back template
│   ├── 2026_id/
│   │   ├── new_template_front.id.png   # 2026 ID front template
│   │   └── new_template_back.id.png    # 2026 ID back template
│   └── hero_sreenshot/              # README screenshots
└── scripts/
    ├── dummy_data_generator.py     # Generates test CSVs
    └── photo_resizer.py            # Batch-resizes photos to 315×355px
```

### 2.2 Module Map (`app.js`)

The `app.js` file is organized into 20 numbered modules, delimited by `═══` banner comments:

| Module | Name | Key Exports / Functions |
|---|---|---|
| 1 | CONFIGURATION | `CONFIG`, `CONFIG_2026`, `DEPT_MAP` |
| 2 | STATE | `state` object, `setIdVersion()`, `throttle()` |
| 3 | CANVAS SETUP | `frontCanvas`, `backCanvas`, `frontCtx`, `backCtx`, `miniCanvas*` |
| 4 | SIGNATURE PAD | `sigCanvas`, `sigCtx`, drawing event listeners |
| 5 | TEMPLATES | `loadTemplates()`, `frontTemplate`, `backTemplate`, `front2026Template`, `back2026Template` |
| 6 | RENDER ENGINE | `renderCanvases()`, `drawFront()`, `drawBack()`, `renderQrCodeOnCanvas()`, `drawHologramWatermark()` |
| 7 | FORM BINDINGS | `INPUT_KEY_MAP`, per-input `addEventListener` that updates `state.students[activeIndex].formData` and calls `renderCanvases()` |
| 8 | STEPPER | `TOTAL_STEPS = 10`, `STEP_TITLES`, `goToStep()`, `stepperNext()`, `stepperBack()`, `initStepper()`, `buildStepperDots()`, `buildDesktopProgressBar()` |
| 9 | TILT EFFECT | `initTilt()` — VanillaTilt initialization |
| 10 | NAVBAR | `initNavbar()` — IntersectionObserver scroll-shrink |
| 11 | TOAST | `showToast(message, type)` — glassmorphic toast |
| 12 | EXPORT (PDF) | `download-btn` click handler — jsPDF A4 landscape batch |
| 12 (Boot) | BOOT | `window.addEventListener('load')` — `loadTemplates()`, `initStepper()`, `initNavbar()`, `initTilt()`, session check |
| 13 | STUDENT TABS | `MAX_STUDENTS = 5`, `renderStudentTabs()`, `switchStudent()`, `addStudent()`, `removeStudent()` |
| 14 | PHOTO CROPPER | `openCropper()`, `closeCropper()`, `startCropDrag()`, `doCropDrag()`, `endCropDrag()`, `updateCropperTransform()` |
| 15 | EXPORT DROPDOWNS | `save-image-btn`, `showMobileExportMenu()`, `saveAsImage(side)` |
| 16 | CSV IMPORT | `csv-upload` change handler, `parseCSVLine()`, fuzzy header mapping |
| 17 | AI SIGNATURE | `switchSigMode()`, `enhanceSignatureWithAI()`, `removeWhiteBackground()`, `getOtsuThreshold()`, `getContentBoundingBox()` |
| 17 (Session) | SESSION SAVE | `SESSION_KEY`, `saveSessionToStorage()`, `restoreSessionFromStorage()`, `showRestoreBanner()` |
| 18 | OCR | `openOcrModal()`, `ensureTesseractLoaded()`, `runOcrScan()`, `ocrExtract()`, `applyOcrResults()` |
| 20 | ENHANCEMENT SUITE | `CAMPUS_CONFIG`, `setCampusTheme()`, `toggleHologramOverlay()`, `playAudioFx()`, `toggleAudioFx()`, `renderQrCodeOnCanvas()`, `openBatchModal()`, `renderBatchTable()` |

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
  idVersion:          'old',    // 'old' | '2026'
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
- **Single-page, global** — `state` is a module-level `const` object in `app.js`.
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
Two sets of PNG template images:
- **Old**: `images/template_front.id.png` + `images/template_back.id.png`
- **2026**: `images/2026_id/new_template_front.id.png` + `images/2026_id/new_template_back.id.png`

Templates are loaded as `HTMLImageElement` objects on boot via `loadTemplates()`. Canvas dimensions are set to match the loaded template's `naturalWidth` × `naturalHeight`.

### 5.3 Coordinate Config (`CONFIG` for Old Template)
All coordinates are in **native canvas pixels** (not CSS pixels). The old template uses a ~4.17× scale factor. The `CONFIG` object defines bounding boxes and text positions for every rendered element on both card faces.

### 5.4 2026 Template Specifics
- Uses `CONFIG_2026` with separate coordinate set.
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

- **Cache version**: `isu-id-v3.8.2` (must be bumped on every release that changes cached assets).
- **Install**: Opens cache, `addAll()` the precache list. Calls `skipWaiting()` to immediately activate.
- **Activate**: Deletes all caches not matching the current `CACHE_NAME`. Calls `clients.claim()`.
- **Fetch**: Stale-While-Revalidate strategy — serves cached response immediately, fetches network in background, updates cache on success.

**Precached assets**:
```
./
./index.html
./style.css?v=3.8.2
./app.js
./animations.js
./manifest.webmanifest
./images/isu_logo_256.png
./images/isu_logo_512.png
./images/template_front.id.png
./images/template_back.id.png
./images/2026_id/new_template_front.id.png
./images/2026_id/new_template_back.id.png
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
    { "src": "./images/isu_logo_256.png", "sizes": "256x256", "type": "image/png" },
    { "src": "./images/isu_logo_512.png", "sizes": "512x512", "type": "image/png" }
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
versionCode      = 4
versionName      = "3.8.2"
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
`android/app/src/main/assets/www/style.css` mirrors `web/style.css`. When updating the web stylesheet, the Android asset must be updated in the same commit.

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

**Local development** (no build step required):
```bash
# Option 1: npx serve
cd web && npx serve .

# Option 2: Python
cd web && python -m http.server 8000
```

> **Note**: `file://` protocol works for most features. A local HTTP server is required for `Tesseract.js` WASM (CORS restriction on `file://` in some browsers).

---

## 12. Directory Index (Full Repository)

```
isu_id/
├── web/
│   ├── index.html
│   ├── style.css                   # 5926 lines, 22 sections
│   ├── app.js                      # 3095 lines, 20 modules
│   ├── animations.js               # 592 lines, 7 modules (A–G)
│   ├── sw.js                       # Service Worker
│   ├── manifest.webmanifest        # PWA Manifest
│   ├── images/
│   │   ├── isu_logo_256.png
│   │   ├── isu_logo_512.png
│   │   ├── template_front.id.png
│   │   ├── template_back.id.png
│   │   ├── 2026_id/
│   │   │   ├── new_template_front.id.png
│   │   │   └── new_template_back.id.png
│   │   └── hero_sreenshot/
│   └── scripts/
│       ├── dummy_data_generator.py
│       └── photo_resizer.py
│
├── android/
│   ├── app/
│   │   ├── build.gradle.kts        # minSdk 24, versionCode 4, versionName 3.8.2
│   │   ├── proguard-rules.pro
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── assets/www/         # Mirrored web assets (style.css, etc.)
│   │       ├── java/com/isu/id/    # Kotlin source (Compose screens, Room, ML Kit)
│   │       └── res/                # Android resources
│   ├── gradle/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradlew / gradlew.bat
│   └── gradle.properties
│
├── wiki/
│   ├── Architecture.md             # Legacy architecture stub
│   └── Setup_and_Usage.md
│
├── PRD.md                          # Product Requirements Document
├── AGENTS.md                       # Agent & contributor ruleset
├── DESIGN_SYSTEM.md                # Visual design system reference
├── ARCHITECTURE.md                 # This file
├── README.md
├── release_notes.md
└── .gitignore
```
