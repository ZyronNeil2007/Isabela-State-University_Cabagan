# 🚀 Release Notes — v3.6.0: University Multi-Campus & Security Studio Edition

## 🎓 Summary
We are thrilled to announce **v3.6.0** of the **Isabela State University Premium Digital ID Generator**! This release scales the generator university-wide across **all 11 ISU campuses**, introduces real-time verification QR codes, security watermark overlays, a glassmorphic batch student data table manager, a high-resolution 3D card inspector studio, Web Audio API sound feedback, and comprehensive bug fixes for all 14 previously tracked issues.

---

## ✨ New Features & Upgrades

### 🏛️ 1. All 11 ISU Campus Color Themes
Users can now generate student IDs tailored to any Isabela State University campus:
- **Cabagan Main Campus** (Emerald Green & Metallic Gold)
- **Echague Main Campus** (Royal Navy & Imperial Gold)
- **Cauayan Campus** (Crimson Maroon & Satin Gold)
- **Ilagan Campus** (Deep Purple & Metallic Silver)
- **Roxas Campus** (Dark Teal & Amber)
- **Angadanan Campus** (Forest Green & Copper)
- **San Mateo Campus** (Deep Bronze & Amber)
- **Jones Campus** (Midnight Blue & Sky Cyan)
- **Palanan Campus** (Ocean Blue & Sunset Orange)
- **San Mariano Campus** (Leaf Emerald & Yellow)
- **Santiago City Extension** (Dark Plum & Rose Gold)

*Theme selection updates CSS variable tokens, live ID card canvas headers, and smoothly animates Three.js WebGL particle constellation colors.*

### 📱 2. Real-Time Verification QR Code Generator
- Generates a sharp, dynamic QR Code on the back face of the student ID card.
- Encodes student details (`ISU-VERIFY:[ID]:[NAME]`) scannable by standard mobile cameras or campus gate entry readers. Includes fallback matrix renderer.

### 🛡️ 3. Holographic Security Watermark & Ribbon Overlay
- Interactive toggle in the card stage preview toolbar.
- Renders an official ISU Seal watermark, UV guilloche security curves, and an iridescent ribbon sheen reflection on the card front.

### 📊 4. Glassmorphism Batch Student Data Manager
- Accessible via the table icon button in the student tab bar.
- Shows student photo/signature completeness badges (`✓ Yes` / `✗ Missing`).
- Offers real-time search/filtering, inline tab switching, row deletion, and full CSV batch re-export.

### 🔍 5. High-Resolution 3D Card Inspector Studio
- Fullscreen modal for inspecting Front and Back card faces at 300 DPI native canvas print quality.

### 🔊 6. Web Audio API Micro-Sound FX
- Zero-dependency Web Audio API synthesized sound cues for card flips, tab clicks, and batch export chimes with an instant mute toggle button.

---

## 🛠️ Resolved Issues & Bug Fixes (from issues.txt)

1. **PDF Export State Recovery**: Wrapped batch print loop in `try...finally` to guarantee active student tab restoration on failure.
2. **Date Format Standardization**: Standardized Date-of-Birth parsing using UTC getters (`getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`).
3. **Canvas Resize Integrity**: Preserves and redraws stored signature image buffer on window resize events.
4. **Strict CSV Header Matching**: Replaced substring header checks with word-boundary matching to prevent false collisions.
5. **Smart OCR Navigation**: Corrected OCR autofill step navigation flow.
6. **Dynamic Hero Stats**: Dynamically updates the "Max Batch" stat chip beyond 5 when larger CSV batches are imported.
7. **Destructive Action Protection**: Added confirmation dialogs before removing student tabs with inputted data.
8. **Broadened Camera Support**: Removed restrictive `capture="environment"` attribute to allow gallery photo selection.
9. **Glassmorphism Toasts**: Replaced all native browser `alert()` dialogs with styled toast notifications.
10. **Card Flip Synchronization**: Unified flip states between main card, mini card, and flip title indicators.
11. **Codebase Maintenance**: Corrected duplicate section numbers in `app.js`.
12. **Cropper Dimensional Accuracy**: Computed cropper base scale using `requestAnimationFrame` after paint.
13. **Quota Overflow Protection**: Bounded auto-save serialized payloads to 4.5MB limits to prevent localStorage crashes.
14. **Tesseract SRI Security Hardening**: Pinned Tesseract.js to v5.1.1 with SHA-384 Subresource Integrity hashes.
