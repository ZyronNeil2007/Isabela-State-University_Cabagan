# 🚀 Release Notes — v3.8.2: Documentation & Source of Truth Architecture

## 📦 Summary

**v3.8.2** is a **documentation and architecture release** for the Isabela State University (ISU) Premium ID Generator. This release establishes a comprehensive, professional documentation suite to serve as the project's single source of truth. No application logic, styling, or functionality was modified in this release.

---

## 📚 Documentation

Four primary architectural documents have been created in the repository root:

- **`PRD.md` (Product Requirements Document)**: Documents all 17 core features, functional requirements, user flows, data schemas, edge cases, and integrations.
- **`AGENTS.md` (Contributor Ruleset)**: Establishes 15 absolute developer rules, file responsibilities, code conventions, state management guidelines, and testing checklists.
- **`DESIGN_SYSTEM.md` (Design System)**: Documents the complete CSS token system, typography scales, glassmorphism tiers, all 11 campus color palettes, and responsive breakpoints.
- **`ARCHITECTURE.md` (Architecture Overview)**: Maps the monolithic application structure (20 logic modules, 7 animation modules), data flow, canvas generation system, Progressive Web App (PWA) configuration, and Android hybrid stack.

- `README.md`: Bumped version references to v3.8.2.

---

## 🔧 Technical Changes

- `web/sw.js`: Bumped Service Worker cache name to `isu-id-v3.8.2`.
- `web/index.html`: Bumped CSS cache buster to `v3.8.2` and updated footer version badges.
- `android/app/build.gradle.kts`: Bumped `versionName` to `"3.8.2"`.
- `android/app/src/main/assets/www/index.html`: Synced web changes to Android WebView assets.

---

## ⚠️ Breaking Changes

> [!NOTE]
> **None** — This is a documentation-only release. All features, UI, and performance optimizations from v3.8.1 remain untouched.

---

## 🙏 Credits / Contributors

- **Lead Developer**: Zyron Neil ([@ZyronNeil2007](https://github.com/ZyronNeil2007))
- **Institution**: Isabela State University (ISU) — Cabagan Campus
