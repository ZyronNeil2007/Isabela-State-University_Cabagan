# 🚀 Release Notes — v3.7.0: Monorepo Restructure & Repository Organization

## 📦 Summary

**v3.7.0** is a **structural release** for the ISU Premium ID Generator project. This release reorganizes the repository into a clean monorepo layout, separating the client-side web application and the Android application into dedicated top-level subdirectories. There are no changes to application features, UI, or logic in this release — all functionality from v3.6.0 is preserved unchanged.

---

## 🏗️ Repository Restructure

The root of `isu_id` now contains two clean, dedicated subdirectories:

### `web/` — Client-Side Web Application
```
web/
├── index.html         # Main web UI entry point
├── style.css          # Glassmorphism design system & animations
├── app.js             # Application state, Canvas rendering engine
├── animations.js      # GSAP 3, Anime.js v4 & Three.js visual layer
├── images/            # ID templates, university seals & logos
│   └── 2026_id/
└── scripts/           # Python admin utilities
    ├── generate_dummy_students.py
    └── resize_photos.py
```

### `android/` — Android Studio Project
```
android/
├── app/               # Android module (Kotlin, Compose, WebView bridge, ML Kit)
├── gradle/wrapper/
├── build.gradle.kts   # Root build config
├── settings.gradle.kts
├── gradlew / gradlew.bat
└── gradle.properties
```

---

## 🚀 Improvements

- **Monorepo Layout**: The previously flat root has been organized into `web/` and `android/` subdirectories, making it easier to navigate and work on each platform independently.
- **Updated `.gitignore`**: Now includes proper ignore patterns for `android/.gradle/`, `android/build/`, `android/app/build/`, IDE artifacts, and web tooling.

---

## 📚 Documentation

- **`README.md`**: Added a full **Project Structure** diagram showing the new `web/` and `android/` layout, and updated **Getting Started** instructions with separate web and Android running steps.
- **`wiki/Architecture.md`**: Updated **File Structure** section to reflect the new monorepo organization.
- **`wiki/Setup_and_Usage.md`**: Updated **Running the Project Locally** with separate web and Android instructions.

---

## 🔧 Technical Changes

- Android `versionCode` bumped from `1` to `2`, `versionName` from `3.6.0` to `3.7.0`.
- Web `style.css` cache-buster parameter updated from `?v=3.6.0` to `?v=3.7.0`.
- Version badges in `web/index.html` updated to `v3.7.0`.

---

## ⚠️ Breaking Changes

> [!NOTE]
> **None** — All web and Android application functionality is identical to v3.6.0.

The only change for existing users is path-based: if you cloned the repository previously, web app files are now in `web/` (previously at root) and the Android project is in `android/` (previously also at root). Update any bookmarks or IDE project roots accordingly.

---

## ✅ Resolved Issues

- Closes #6 — v3.6.0 release tracker issue (all features shipped and verified in v3.6.0; this release wraps up repository organization).

---

## 🙏 Credits

Developed and maintained by **Zyron Neil**. Repository: [ZyronNeil2007/Isabela-State-University_Cabagan](https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan)
