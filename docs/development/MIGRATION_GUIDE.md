# Migration Guide — single-file app → modular monorepo

For contributors with local branches or bookmarks from before the refactor.

## Where did things go?
| Before | After |
|---|---|
| `web/app.js` (sections 1–20) | `web/src/**` — see the section→module table in `docs/architecture/REFACTORING_AUDIT.md` §2.1 and the module list in `docs/architecture/ARCHITECTURE.md` §2.2 |
| `web/animations.js` | `web/src/animations/animations.js` |
| `web/style.css` | `web/styles/**` (43 files; order = `<link>` order in `index.html`, see `styles/main.css`) |
| `web/images/…`, `web/images/2026_id/…` | `web/assets/images/{logos,templates/{legacy,2026},placeholders,screenshots}/…` |
| `web/fonts/` | `web/assets/fonts/` |
| `web/scripts/generate_dummy_students.py` / `resize_photos.py` | `web/tools/dummy_data_generator.py` / `photo_resizer.py` |
| `web/scripts/responsive_qa.js` | `scripts/validation/responsive_qa.js` |
| `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `PRD.md`, `release_notes.md`, `issue.md`, `issues.txt`, `SKILL.md` | `docs/architecture/`, `docs/design/`, `docs/development/` (issues preserved in `KNOWN_ISSUES.md`) |
| changelog in README | `CHANGELOG.md` |

## Rebasing a branch that edited the old files
1. `git fetch && git rebase origin/main` — Git follows the renames for whole-file moves (`images/`, `fonts/`, docs).
2. `app.js` and `style.css` were **split**, so Git cannot rebase edits automatically. Re-apply your hunk in the module/CSS
   file that now holds that code (search for the function name or the section banner; every module starts with a
   `/* ── module: … extracted verbatim from app.js ── */` line and keeps the original banner comments).
3. New cross-file use of a function → `import` it (and `export` it in its module). Run
   `node scripts/validation/check-references.js` — it reports unresolved imports and files missing from the SW precache.

## Practical changes
- **Run via HTTP** (`cd web && python3 -m http.server 8000`); `file://` no longer works.
- Globals are gone: from the browser console only the inline-handler functions exist on `window`. Add a function to
  `core/initialization/expose-globals.js` only if an HTML attribute needs it.
- Top-level `let` variables are module-private. Share state through `state` or an exported function.
- New files must be added to `web/sw.js` `PRECACHE_ASSETS` (stylesheets also need a `<link>` in `index.html`).
- After editing `web/`, run `node scripts/sync-android-assets/sync.js` (never edit `android/.../assets/www` by hand).
- Bump the SW cache name when cached assets change.

## What did *not* change
Card dimensions and `CONFIG`/`CONFIG_2026` coordinates, canvas rendering, student data shape, `SESSION_KEY`
(`isu_id_session_v1`) and stored-session format, DOM ids/classes, PWA/offline behaviour, Android asset loading URL.

## Verification performed
Pixel hashes of both templates (front/back), session round-trip, inline-handler resolution, DOM id inventory,
feature smoke tests (photo/cropper, signature, CSV, student add/remove, batch, inspect, themes, exports, OCR modal,
restore, offline reload) on phone and desktop viewports, identical results on the pre-refactor build; CSS screenshots
pixel-identical at 8 viewports; the Android bundle served through the same suites.
