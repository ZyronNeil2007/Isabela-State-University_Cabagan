# Repository Refactoring Audit

Status: **audit + proposed plan only — no structural changes made.**
Base: `feat/responsive-overhaul` (includes origin/main v3.9.0). Measured 2026-11-23.

## 1. Current repository inventory

| Area | Files | Notes |
|---|---|---|
| `web/` | `index.html` (1470 L), `app.js` (3356 L, 91 top-level functions, 1 file), `animations.js` (591 L), `style.css` (6250 L, 27 media blocks), `sw.js`, `manifest.webmanifest`, `fonts/`, `images/`, `scripts/` | Classic `<script defer>` files, no build step. |
| `android/` | Kotlin/Compose app + `assets/www/` (full **manual copy** of `web/`) | WebView loads `https://appassets.androidplatform.net/assets/www/`. |
| Repo root | `index.html`, `404.html` (redirect to `./web/`), 8 markdown docs, `issue.md`, `issues.txt`, `SKILL.md`, `.nojekyll`, `wiki/` (5 md) | Root is cluttered. |
| CI | `.github/workflows/deploy-pages.yml` | Publishes `./web` as the Pages root. No tests, no validation. |

## 2. Findings

### 2.1 `app.js` structure (the main refactoring target)
It is one shared global scope split by 21 banner sections. Measured cross-section dependencies (who reads whose top-level symbols):

- **Leaf sections (no outbound deps):** config, state, canvas refs, stepper, tilt, navbar.
- **Heavily depended-on:** `state` (88 refs everywhere), canvas refs (render 69, templates 14, cr80 14), `render` (called from 10 sections), `config` (render, cr80), `navbar` (`showToast`-style helper, used by 7 sections).
- **Hub sections:** `enhance` (campus themes/QR/hologram) reads state 24×, navbar 7×, render/students/canvas; `students` reads state 15× and signature pad 5×.
- **No cycles at section level that can't be broken** by moving shared state/helpers down into `core/` and `utils/`; the only back-edges are `render → session`, `render → enhance`, `render → cr80` (render triggers session save, QR/hologram draw and the HTML preview) — these need an explicit hook/registry (`onRender` callbacks) instead of direct calls.

Proposed mapping (section → module):

| Section | Target |
|---|---|
| 1 CONFIG (+ `DEPARTMENT_LABELS`, `INPUT_KEY_MAP`) | `src/core/config/` |
| 2 STATE, 3 CANVAS REFS | `src/core/state/` |
| 12 BOOT | `src/core/initialization/` |
| 4 SIGNATURE PAD, 17 AI SIGNATURE | `src/features/signature/` |
| 5 FORM BINDINGS | `src/features/id-generator/` |
| 6 TEMPLATE LOADING, 7 RENDER ENGINE | `src/features/id-generator/` (canvas renderer) |
| 7b CR80 PREVIEW, 9 TILT | `src/features/card-preview/` |
| 8 STEPPER | `src/features/id-generator/stepper` |
| 13 STUDENT TABS | `src/features/student-management/` |
| 14 CROPPER | `src/features/photo-editor/` |
| 16 CSV | `src/features/csv-import/` |
| 18 OCR | `src/features/ocr/` |
| batch manager / QR / campus themes (section 20) | `features/batch-manager`, `qr-verification`, `campus-theme` |
| 11 EXPORT, 15 EXPORT DROPDOWNS | `src/services/export/` |
| 17 SESSION SAVE | `src/services/storage/` |
| image helpers (`loadImage`, bg removal) | `src/services/image-processing/` |
| 10 NAVBAR | `src/features/` or `src/utils/` (toast helper → `utils`) |
| `animations.js` | `src/animations/` |

### 2.2 HTML ↔ JS coupling (highest migration risk)
- `index.html` has **80 inline event handlers** (`onclick="setCampusTheme(...)"`, `saveAsImage`, `stepperNext`, `openOcrModal`, `onRestoreSession`, …) calling ~30 distinct **global functions**. ES modules do not create globals, so every one must be explicitly exposed.
- `window.onCampusThemeChange` is an optional cross-file hook; `animations.js` does not read any `app.js` symbol (verified), so it can move independently.
- Third-party libs are **CDN globals** used from app code: `jsPDF`, `Tesseract` (lazy), `QRCode`, `VanillaTilt`. Remain classic CDN scripts; modules must read them from `window`.
- DOM IDs/classes are queried by id across the app and by the QA harness — selectors must not change.

### 2.3 Hardcoded paths
- `app.js`: 5 image paths in `loadImage()` + `CR80_PHOTO_PLACEHOLDER`, some with cache-busters (`?v=cr80c`, `?v=cr80b`).
- `style.css`: 3 `url('fonts/…')`; `index.html`: logos, hero screenshots; `sw.js`: ~20 precache entries (+ `style.css?v=`); `manifest.webmanifest`: 2 icon paths; root `index.html`/`404.html`: `./web/`, `web/images/isu_logo_256.png`; Android `WebIdScreen.kt`: `assets/www/index.html`; docs: 89 references to `web/…` paths.
- All paths are **relative to the page**; moving files under `src/` and `styles/` changes relative resolution for CSS (`url(../assets/fonts/…)`) — must be rewritten per file.

### 2.4 Duplicate / obsolete / misplaced files
| Item | Evidence | Proposed action |
|---|---|---|
| `android/.../assets/www/` | Full copy of `web/`, synced by hand (stale between releases: it was missing the 2026 template for several releases) | Replace by `scripts/sync-android-assets` (copy + excludes), CI check for drift |
| `www/{isu_logo*.png, template_*.png, back/front_reference.png}` at www **root** | Legacy duplicates; `index.html` only references `images/…` | Verify unreferenced, then drop from the sync set |
| `www/scripts/*.py` | Dev scripts copied into the APK | Exclude (`tools/` not shipped) |
| `web/images/isu_logo.png` (1.9 MB) | Not referenced by HTML/CSS/JS/manifest/SW (only 256/512 are) | Verify Android launcher doesn't use it, then remove or move to `assets/images/logos/source/` |
| `web/images/2026_id/zn logo.png` | Space in name, unreferenced anywhere | Ask owner; likely remove |
| `web/images/hero_sreenshot/` (typo, 1.9 MB) | Check usage in `index.html` hero before moving; rename to `screenshots/` | Rename + fix refs |
| `web/images/2026_id/{front,back}_reference.png`, `images/{front,back}_reference.png` | Reference overlays used for pixel alignment/dev; in SW precache but not needed at runtime if unused by app code | Verify; move to `docs/design/` or keep as `templates/…/reference` |
| `web/scripts/optimize_logo.ps1`, `generate_dummy_students.py`, `resize_photos.py`, `responsive_qa.js` | Docs call the dummy-data script `dummy_data_generator.py` / `photo_resizer.py` (names don't exist) | Move to `web/tools/` and fix docs *or* rename to match the proposed tree |
| Dead CSS | `.hero-grid`, `.hero-text-col`, `.hero-card-col` and similar | Remove during CSS split, verified by grep + visual diff |
| Root `issue.md`, `issues.txt`, `release_notes.md`, `SKILL.md`, `PRD.md`, `wiki/` | Tracker/notes/skill file in repo root | Move into `docs/` (`docs/development`, `docs/decisions`); `SKILL.md` is a design-skill prompt — confirm intent before moving |
| Missing | `CHANGELOG.md` (changelog lives in README), `CONTRIBUTING.md` (wiki/Contributing.md), `SECURITY.md`, PR/issue templates, CI tests | Create |

### 2.5 PWA / deployment / Android constraints
- GitHub Pages deploys `./web` as site root → everything the app needs must remain **inside `web/`**; `docs/`, `scripts/` stay outside (fine).
- Root `index.html`/`404.html` redirect to `./web/` — unchanged.
- Service worker precaches by explicit list: after splitting into ~40 module/CSS files the list must be generated/validated (new `scripts/validation` check: every file referenced by `index.html`/imports is in `PRECACHE_ASSETS`); cache name must be bumped on every structural release.
- ES modules require HTTP(S): **opening `index.html` via `file://` will stop working** (CORS on module scripts). Pages, localhost and the Android asset loader (https origin) are fine.
- Module graph = many small requests: acceptable on HTTP/2 + SW cache; first uncached load slower on weak mobile networks. Mitigation: `<link rel="modulepreload">` for the critical graph.
- CSS split via `@import` creates a serial waterfall; prefer one `<link>` per layer in `index.html` (or a single `main.css` only if `@import` cost is acceptable — to decide, see questions).
- Android: WebView needs `https://appassets…/assets/www/` to contain the same tree; `WebBridge` JS hooks (`window.AndroidBridge`, `__androidPhotoCb`) are consumed by `app.js` — must stay reachable as globals.
- `localStorage` key `isu_id_session_v1` and the saved student JSON shape must remain byte-compatible (verified by a round-trip test before and after).

## 3. Migration risks (ranked)
1. **Inline handlers → globals** (80 uses): a missed export is a silent dead button. Mitigation: one `expose-globals.js` + automated check that every handler name in HTML exists on `window`.
2. **Shared mutable top-level `let`s** (`currentStep`, `cropZoom`, `isDrawing`, `_tesseractLoaded`, …) become module-private; cross-module writes would break. Mitigation: move to `state`/module-local setters per owner, no cross-module writes.
3. **Render pipeline order** (`renderCanvases()` → cr80 → session save → QR/hologram): must remain in the same order and still rAF-debounced; golden pixel tests guard this.
4. **Canvas coordinates/text layout**: CONFIG moves verbatim; pixel-hash export tests for legacy and 2026 templates.
5. **Service worker staleness**: old clients caching old paths. Mitigation: cache bump + SW `activate` cleanup (already present).
6. **Android drift** if the sync step is forgotten → automated sync + CI drift check.
7. **Doc link rot** (89 refs).
8. Merge conflicts with in-flight PRs (responsive overhaul touches app.js/style.css heavily) → merge #responsive first.

## 4. Proposed migration plan (small, independently testable phases)

**Phase 0 — Safety net (no behavior change).** Add Playwright regression suite under `scripts/validation/`: (a) PNG export hash for legacy + 2026 on seeded data; (b) session save/restore round-trip incl. `SESSION_KEY`; (c) inline-handler → `window` check; (d) selector inventory; (e) asset-reference checker (HTML/CSS/JS/SW/manifest paths exist); (f) responsive harness (existing). Record golden baselines from current `main`.

**Phase 1 — Repo hygiene & docs scaffolding.** Create `docs/{architecture,development,deployment,design,security,decisions}`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/pull_request_template.md`, `ISSUE_TEMPLATE/`. Move root notes (`PRD`, `issue.md`, `issues.txt`, `release_notes.md`, `wiki/`) into `docs/` with link fixes. *Files only; app untouched.*

**Phase 2 — Assets.** `web/images`→`web/assets/images/{logos,templates/{legacy,2026},placeholders,screenshots}`, `fonts`→`assets/fonts`, `scripts`→`tools`. Update every reference found in §2.3, SW precache, manifest, CSS `url()`; `git mv` (history preserved), checker must pass; remove verified-unused files only after confirmation.

**Phase 3 — CSS.** Split `style.css` along its existing numbered banners into `styles/{base,layout,components,features,responsive}` (+ `main.css`). Verification: concatenated cascade order identical; computed-style/screenshot diff on all 8 viewports; dead rules removed only with grep proof. Responsive rules consolidate into `styles/responsive/` using the §24 breakpoint scale.

**Phase 4 — JS to ES modules (incremental, bottom-up).**
 4a. Switch `app.js` to `<script type="module">` unchanged (still one file) + `expose-globals`; verify.
 4b. Extract leaves: `config`, `state`, `utils` (toast, helpers). Verify golden tests.
 4c. Extract services: storage (session), image-processing, export (PNG/PDF).
 4d. Extract features one per commit: signature → photo-editor → student-management → csv-import → ocr → qr/campus-theme → batch-manager → card-preview → id-generator (render engine last).
 4e. `core/initialization` (boot) + `src/app.js` entry that only wires modules; `animations.js` → `src/animations/`.
 After each commit: golden tests + manual feature checklist (§ user's list).

**Phase 5 — Android sync tooling.** `scripts/sync-android-assets` (copy `web/` minus tools/dev files into `assets/www/`), CI drift check, verify WebView loads the module graph.

**Phase 6 — Docs.** README, ARCHITECTURE, DESIGN_SYSTEM, AGENTS, CONTRIBUTING, CHANGELOG, `docs/development/MIGRATION_GUIDE.md`; final report (changed files, tests, remaining issues).

Each phase = its own branch/PR (or logically separate commits), mergeable alone and revertible.

## 5. Decisions needed before Phase 2+
1. **Inline handlers:** keep them (exposed on `window` via one bridge — safest, recommended) or convert to `addEventListener` (cleaner, but touches all 80 and every selector contract).
2. **`file://` support:** accept dropping double-click-to-open (modules need a server)?
3. **CSS loading:** several `<link>` tags (fast, recommended) vs `main.css` with `@import`.
4. **Unused/odd files** (`zn logo.png`, `isu_logo.png` 1.9 MB, `SKILL.md`, `issues.txt`): delete, archive in `docs/`, or keep?
5. **Tools naming:** rename scripts to the tree's names (`dummy_data_generator.py`, `photo_resizer.py`) or keep current names and fix docs?
6. **Merge order:** merge the responsive-overhaul PR first (recommended) so the refactor starts from a stable base.
