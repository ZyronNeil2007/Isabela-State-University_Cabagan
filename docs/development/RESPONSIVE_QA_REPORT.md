# Responsive QA Report — Adaptive UI Overhaul (v3.8.8)

Harness: `scripts/validation/responsive_qa.js` (Playwright; dev-only, not shipped in the APK).
Run: `cd web && python3 -m http.server 8000 &` then
`NODE_PATH=$(npm root -g) node scripts/validation/responsive_qa.js --base http://localhost:8000 --out <dir> --label <name>`

## Breakpoint scale
≤380 compact phone · ≤767 phone · 768–1024 tablet · ≥1025 desktop. Cross-cutting rules live in `style.css` §24 (ADAPTIVE LAYER).

## Results (before → after)
| Check | Before | After |
|---|---|---|
| Horizontal overflow, 13 viewport/orientation profiles | 0 px | 0 px |
| 320×568 / 568×320 sections stretched to 600px | yes | fixed |
| Landscape-phone modal fit (OCR, batch, inspect, cropper) | failed | all fit |
| Mobile export sheet on phones >860px wide (landscape) | rendered off-screen | fixed |
| Tablet 768–1024 layout | stacked (<900) | two-column, sticky preview |
| Small tap targets (<44px), touch viewports | 43–50 | 8–14 (stepper dots only — 44px invisible hit area) |
| Desktop (≥1366) tap targets / layout | OK | unchanged |
| JS errors | 0 | 0 |

## Fixed issues
- Body flex-column let sections size to content (600px min-content) → `body > section/main/footer {width:100%; min-width:0}`.
- Conflicting `max-width:899px` stacking block removed from tablet range; tablets use two columns.
- `overflow-x:hidden` on html/body made body a scroll container and broke `position:sticky` → `overflow-x:clip` (hidden fallback). Sticky preview now works from 768px; sticky stepper bar works on phones.
- Modals: `100dvh` caps, safe-area padding, bottom sheets ≤767px, full-height panels on short landscape; `!important` removed from batch panel sizing.
- Export sheet re-parented to `<body>` (fixed inside a backdrop-filter ancestor was relative to that ancestor).
- Touch targets ≥45px for nav/buttons/pills/links; invisible hit areas for tiny dots.
- Preview toolbar wraps instead of clipping on tablet; shorter brand text on phones; `viewport-fit=cover`.
- Signature pad: Pointer Events (mouse/touch/pen), coalesced events, coordinates scaled to canvas, ResizeObserver re-fit only when width changes and never mid-stroke (viewport/keyboard resizes no longer erase the signature).
- Photo cropper: Pointer Events, two-finger pinch zoom, wheel zoom, slider kept in sync.
- Resize handler rAF-throttled and passive; step re-apply no longer steals focus; auto-focus skipped on touch devices (keyboard covered the preview).
- Perf: `decoding="async"`, lazy footer/drawer logos, CSS animations paused when tab hidden (`html.tab-hidden`); OCR already lazy; typing already rAF-debounced; reduced-motion already honoured; PWA/offline preserved (SW cache `isu-id-v3.8.8`).
- Android: web assets synced into `assets/www` (index, app, animations, style, fonts, 2026_id images); WebView `loadWithOverviewMode=false` so the viewport meta controls layout.

## Remaining limitations
- Stepper dots stay visually small by design (hit area is 44px).
- Landscape phones: preview is non-sticky (taller than the screen); two-column from ~812px wide.
- Verified in Chromium emulation only; real iOS Safari / Android WebView hardware testing recommended. Icon font (CDN) is blocked in the sandbox, so icons were not visible in screenshots.
- Android Compose wizard screens (native) were not changed.
