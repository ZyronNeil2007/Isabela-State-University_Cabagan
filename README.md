# 🎓 Isabela State University Premium ID Generator v3.0

A premium, fully responsive **client-side** web application for generating high-fidelity, print-ready student identification cards for **Isabela State University (ISU)**. Built with a stunning Apple-style glassmorphism UI, interactive 3D card preview, and a powerful batch export engine — no backend, no build tools, runs entirely in the browser.

🔗 **Live Demo**: [https://zyronneil2007.github.io/Isabela-State-University_Cabagan/](https://zyronneil2007.github.io/Isabela-State-University_Cabagan/)

---

## ✨ Features

### 🆕 v3.0 — Batch & Precision Upgrades
- **👥 Multi-Student Batch Mode**: Generate up to **5 student IDs** in a single session using a tabbed interface. Each student tab maintains its own independent form state, photo, and signature.
- **✂️ Interactive Photo Cropper**: A modal-based crop editor with **pan, zoom (0.5×–3×),** and a locked **315:355 portrait aspect ratio** — ensuring every photo is perfectly framed before it hits the card.
- **🗂️ Smart A4 Batch Export**: The export engine dynamically arranges 1–5 student IDs into an optimized grid on a **300 DPI A4 canvas (2480×3508 px)**, with precise dashed cut guides and a page header for professional physical printing.

### ⚡ Core Features
- **🫧 Premium Glassmorphism UI**: Multi-tier CSS3 glass panels with backdrop blur, saturation layers, and ISU green (`#15B915`) & gold (`#C9A84C`) palette.
- **📱 Adaptive Stepper Form**: A 9-step wizard intelligently adapts between mobile (full-screen stepper) and desktop (side-by-side split layout) without breaking flow.
- **🔄 Interactive 3D Card Preview**: Real-time mouse-hover 3D tilt (powered by VanillaTilt) with a click-to-flip animation between Front and Back views.
- **🖼️ Mini Live Preview**: A compact in-header thumbnail syncs in real-time and auto-flips to match the active form step.
- **✍️ Digital Signature Pad**: Touch & mouse-friendly HTML5 canvas for capturing handwritten signatures, embedded directly on the card.
- **💾 Save as Image**: Export the Front, Back, or Both card sides individually as PNG images alongside the batch A4 PDF-ready export.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | Semantic HTML5 (ARIA roles, keyboard navigation) |
| Styling | Vanilla CSS3 (custom properties, GPU transforms, flexbox/grid) |
| Logic | Vanilla ES6+ JavaScript (Canvas API, FileReader, Touch Events) |
| 3D Effects | [VanillaTilt.js](https://micku7zu.github.io/vanilla-tilt.js/) |
| Icons | [Phosphor Icons](https://phosphoricons.com/) |
| Typography | Inter — Google Fonts |

> **Zero dependencies** at runtime. No npm, no bundler, no backend.

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan.git
   ```
2. Open `index.html` directly in any modern browser — no server needed.

---

## 📋 Changelog

### v3.0.0 *(2026-06-22)*
- `feat` — Multi-student tab system (up to 5 students) with independent state per tab
- `feat` — Interactive photo cropper modal with pan/zoom and 315:355 aspect ratio lock
- `feat` — Dynamic A4 batch export engine: 1–5 student grid with cut guides & page header
- `feat` — Desktop export actions panel + mobile bottom sheet for Save Image / Print Batch
- `fix` — Repaired corrupted CSS that broke photo preview and live badge styling
- `fix` — Footer layout: removed `100vw` negative-margin hack causing horizontal scrollbar on Windows
- `fix` — Mobile export sheet visibility (no longer bleeds into page layout)
- `fix` — Desktop export actions correctly hidden on mobile, restored at 900px+

### v2.0.0
- Premium glassmorphism redesign with multi-tier glass panels
- 9-step stepper form with mini live card preview in header
- VanillaTilt 3D hover effect on card preview
- Digital signature pad (HTML5 Canvas)
- A4 print export with front + back dual-card layout

### v1.0.0
- Initial ISU ID generator — single student, basic form, canvas render

---

## 🧑‍💻 Credits & License

Created, designed, and developed by **Zyron Neil**.

Feel free to open a pull request or submit an issue in the [repository](https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan).

---
© 2026 Zyron Neil. All rights reserved.
