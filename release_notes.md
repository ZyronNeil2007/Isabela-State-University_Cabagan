# 🚀 Release Notes — v3.8.0: Performance & UI Refinement

## 📦 Summary

**v3.8.0** is a **performance and UI refinement release** for the ISU Premium ID Generator. This release focuses on dramatically reducing CPU/GPU overhead on page load, cleaning up the hero section's visual clutter, adding full Progressive Web App (PWA) support, and hardening Content Security Policy with Subresource Integrity hashes on all CDN scripts.

---

## ✨ New Features

- **PWA Support — `manifest.webmanifest`**: Added a complete Web App Manifest enabling the app to be installed to the home screen/desktop with standalone display mode, correct theme colour, and ISU logo icons at 256px and 512px.
- **Service Worker (`sw.js`)**: Stale-while-revalidate caching strategy pre-caches all critical assets (HTML, CSS, JS, images, ID templates) for offline-first instant loading on repeat visits.
- **Service Worker Auto-Registration**: `web/index.html` now registers `sw.js` on `window.load` automatically.

---

## 🚀 Improvements

### Hero Section Cleanup
- Removed the `.hero-seal` background watermark logo for a cleaner, distraction-free hero.
- Removed the `.hero-badge` eyebrow version chip to declutter the heading area.
- Stopped all continuous CSS animations in the hero: mesh grid drift, ambient glow breathing, and floating orb animations. Hero decorative elements are now fully static.

### Performance
- **Three.js Particle Canvas Disabled**: `#hero-webgl-canvas` is now `display: none !important`, eliminating the 60fps WebGL render loop on page load.
- **Scroll Parallax Removed**: GSAP ScrollTrigger no longer attaches scroll listeners to removed hero elements.
- **Canvas Resize Guard**: `renderCanvases()` only reassigns `.width`/`.height` when dimensions actually change — prevents unnecessary GPU buffer discards.
- **QR Code Memoised Cache**: `renderQrCodeOnCanvas()` maintains a `_qrCache` offscreen element to avoid DOM reflows and repeated encoding.
- **Font-Swap Re-render**: Canvases are re-rendered after `document.fonts.ready` to prevent font-swap layout shifts.
- **Holographic Shimmer Tab Pause**: The holographic canvas rAF loop pauses on `document.hidden` and resumes on `visibilitychange`.

### Security
- SHA-384 SRI hashes added to all CDN `<script>` tags: GSAP 3.12.5, GSAP ScrollTrigger, Anime.js v4, jsPDF 2.5.1.
- All CDN scripts marked `defer` for non-blocking parallel loading.

### Developer Experience & Image Optimisation
- Logo `<img>` elements updated from `isu_logo.png` to optimised `isu_logo_256.png`/`isu_logo_512.png` with explicit `width`, `height`, and `decoding="async"` attributes for CLS prevention.
- Scroll progress bar (`#scroll-progress`) removed from DOM, CSS, and JavaScript entirely.
- CSS cache buster updated: `style.css?v=3.7.0` → `style.css?v=3.8.0`.

---

## 🐛 Bug Fixes

- Holo canvas background tab drain fixed — rAF now pauses/resumes on `visibilitychange`.
- Font-swap canvas shift fixed — `document.fonts.ready` triggers re-render.
- Android logo inconsistency fixed — all references point to optimised image files.

---

## 🔧 Technical Changes

- `web/sw.js` — New: Service Worker, `CACHE_NAME = 'isu-id-v3.8.0'`.
- `web/manifest.webmanifest` — New: PWA Web App Manifest.
- `web/images/isu_logo_256.png` / `isu_logo_512.png` — New: Optimised ISU logo assets.
- `web/animations.js` — Three.js particles disabled (early return); scroll parallax removed; holo canvas `visibilitychange` added; hero-badge animation removed.
- `web/app.js` — Canvas resize guard; `_qrCache` QR memo; `document.fonts.ready` re-render.
- `web/style.css` — Removed `.hero-seal`, `.hero-badge`, `#scroll-progress`, animation keyframes; cache buster bumped.
- `web/index.html` — Removed scroll progress bar, hero watermark, hero badge, `QRCode.js` script; SRI hashes added; `defer` on all scripts; logo `<img>` updated; SW registration; version strings → v3.8.0.
- `android/app/build.gradle.kts` — `versionCode` 2→3, `versionName` "3.7.0"→"3.8.0".
- `android/app/src/main/assets/www/` — index.html, style.css, animations.js synced.
- `index.html` (root) — Favicon `<link>` added.

---

## 📚 Documentation

- `README.md` — Title bumped to v3.8.0; v3.8.0 changelog section added.
- `release_notes.md` — Fully replaced with v3.8.0 notes.

---

## ⚠️ Breaking Changes

> [!NOTE]
> **None** — All functionality from v3.7.0 is preserved. The Three.js canvas is disabled but not deleted.

---

## 🙏 Credits

Developed and maintained by **Zyron Neil**. Repository: [ZyronNeil2007/Isabela-State-University_Cabagan](https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan)

