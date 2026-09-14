# 🚀 Release Notes — v3.8.1: Scroll Performance & GPU Optimization

## 📦 Summary

**v3.8.1** is a targeted **performance and rendering optimization release** for the Isabela State University (ISU) Premium ID Generator. This release directly eliminates scrolling lag and stutter by solving three core graphics rendering bottlenecks: continuous document repaints caused by fixed background attachments, high GPU blur calculation overhead on decorative orbs, and overlapping backdrop-filter calculations on mobile and tablet devices.

---

## ✨ New Features

> [!NOTE]
> This is a focused **Performance & Bugfix Release (v3.8.1)**. All core application features, campus themes, QR verification, and export tools from previous releases remain fully supported.

---

## 🚀 Improvements & Performance

### 1. Eliminated Scroll Repaint Bottleneck
- **Root Cause**: The `body` element previously utilized `background-attachment: fixed` combined with 5 complex layered radial and linear CSS gradients. This forced the browser rendering engine to invalidate and repaint the entire background on every single pixel of scroll.
- **Solution**: Removed `background-attachment: fixed` from `body`. Moved the layered gradient to a dedicated `body::before` pseudo-element with `position: fixed; inset: 0; z-index: -1; pointer-events: none`.
- **Result**: The background is painted once into its own dedicated compositor layer. Scrolling now occurs seamlessly over a static layer with zero scroll-linked document repaints.

### 2. Eliminated Heavy CSS Blur Calculations
- **Root Cause**: The decorative background `.orb` elements spanned 400px–700px across the viewport with `filter: blur(80px)`, requiring immense GPU fragment shader computation.
- **Solution**: Removed `filter: blur(80px)` entirely from `.orb`. The orbs already feature multi-stop `radial-gradient(circle, ..., transparent)` styling, creating a naturally soft, diffused appearance without mathematical blur overhead.
- **Ambient Hero Glow Tuning**: Scaled down `.hero-glow-primary` blur from 60px to 30px, and `.hero-glow-gold` from 80px to 40px, conserving GPU resources.

### 3. Mobile & Tablet GPU Optimization (`@media max-width: 860px`)
- **Root Cause**: Mobile devices and integrated GPUs struggle to compute multi-layered `backdrop-filter: blur(...)` and `-webkit-backdrop-filter` in real time, especially when scrolling over layered content.
- **Solution**: Implemented targeted media query overrides for screens ≤ 860px:
  - Disabled `backdrop-filter` on `.glass-panel`, `.form-group`, `.liquid-glass`, `#navbar.scrolled`, `.top-nav-backdrop`, `.hero-floating-badge`, `.hero-stats`, `.btn-ghost`, `.btn-nav`, `.cropper-modal-overlay`, `.session-banner`, and `.export-dropdown-menu`.
  - Added semi-opaque solid fallback colors (e.g., `rgba(4, 30, 4, 0.82)`) preserving the signature ISU glassmorphic visual identity and high contrast text readability.
  - Hidden `.floating-orbs` and hero glow blobs entirely on mobile screens, saving significant off-screen GPU compositing bandwidth.

---

## 🐛 Bug Fixes

- **Scroll Jank & Stutter**: Completely resolved the frame drops experienced during rapid scrolling down the page and through the hero section.
- **Android WebView Overdraw**: Synchronized the optimized CSS rules to the Android application assets (`android/app/src/main/assets/www/style.css`), providing fluid 60fps scrolling on mobile devices.
- **Service Worker Stale Cache**: Updated cache identifiers and precache asset URLs to ensure existing clients receive the new stylesheet immediately without requiring manual cache clearing.

---

## 🔧 Technical Changes

- `web/style.css`:
  - Removed `background-attachment: fixed` from `body`.
  - Added `body::before` fixed layer for gradient background.
  - Removed `filter: blur(80px)` from `.orb`.
  - Reduced hero glow blur values (60px → 30px, 80px → 40px).
  - Added `@media (max-width: 860px)` performance block disabling `backdrop-filter` and hiding decorative orbs on mobile.
- `web/index.html`:
  - Stylesheet cache-buster bumped: `style.css?v=3.8.0` → `style.css?v=3.8.1`.
  - Footer version badges updated to `v3.8.1` / `Scroll Performance & GPU Optimization`.
  - About modal version label updated to `v3.8.1`.
- `web/sw.js`:
  - Cache version updated: `CACHE_NAME = 'isu-id-v3.8.1'`.
  - Precache list updated with `./style.css?v=3.8.1`.
- `android/app/build.gradle.kts`:
  - `versionCode` incremented: `3` → `4`.
  - `versionName` incremented: `"3.8.0"` → `"3.8.1"`.
- `android/app/src/main/assets/www/style.css`:
  - Synchronized with `web/style.css`.
- `android/app/src/main/assets/www/index.html`:
  - Stylesheet cache-buster updated to `style.css?v=3.8.1`.
- `README.md`:
  - Bumped project version to `v3.8.1`.
  - Added comprehensive v3.8.1 changelog entries.

---

## 📚 Documentation

- `README.md`: Title and changelog updated with v3.8.1 release details.
- `release_notes.md`: Replaced with complete v3.8.1 release notes.

---

## ⚠️ Breaking Changes

> [!NOTE]
> **None** — All functionality, keyboard shortcuts, student batch management, and export capabilities are 100% backwards compatible.

---

## 🙏 Credits / Contributors

- **Lead Developer**: Zyron Neil ([@ZyronNeil2007](https://github.com/ZyronNeil2007))
- **Institution**: Isabela State University (ISU) — Cabagan Campus
