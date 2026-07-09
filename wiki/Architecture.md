# Architecture & Tech Stack

The ISU Premium ID Generator operates strictly as a **Client-Side Single-Page Application (SPA)**. It boasts zero backend dependencies and does not rely on bundlers or build steps like Webpack or Node.js.

## 🛠️ Technology Stack
- **HTML5:** Semantic markup, ARIA accessibility attributes, and native file input handling.
- **CSS3:** Custom properties (CSS variables), `clamp()` fluid typography, Flexbox/Grid layouts, and CSS transitions/animations.
- **JavaScript (ES6+):** Pure vanilla JavaScript driving the DOM manipulation, rendering engine, and application state.
- **Tesseract.js v5:** Used via CDN (WASM) for completely offline Optical Character Recognition (OCR).
- **jsPDF:** Generates the multi-page A4 PDF batches.
- **VanillaTilt.js:** Provides the smooth, interactive 3D hover effects on the ID preview cards.

## 📂 File Structure
The project is intentionally kept simple and flat:
- `index.html`: The main entry point. Contains the layout, SVG icons, and DOM structure.
- `style.css`: All application styling, neatly organized into 25 documented sections (e.g., CSS tokens, reset, typography, components, animations).
- `app.js`: The powerhouse of the application. Contains all logic, state management, and the Canvas rendering pipeline.
- `images/`: Contains the blank ID template references (Front and Back), university logos, and other static assets.
- `scripts/`: Python utility scripts (e.g., `resize_photos.py`) used by administrators to batch process student photos before uploading.

## 🎨 The Canvas Rendering Pipeline
The core of the ID generator is the HTML5 Canvas API. The rendering pipeline works as follows:

1. **State Management:** When a user types in a field or uploads an image, the global `students` array (which holds up to 5 student objects) is updated.
2. **Debounced Re-render:** The `renderCard()` function is triggered. It uses `requestAnimationFrame` and a debounce timer to prevent lag while typing.
3. **Template Layering:** 
   - The blank template image (e.g., `images/2026_id/new_template_front.id.png`) is drawn onto the `frontCanvas` and `backCanvas`.
   - Uploaded photos are drawn using `drawImage()`, respecting aspect ratios and applying circular or rectangular clipping masks.
4. **Text Layering:** 
   - A configuration object (e.g., `TEXT_CONFIG_2026`) dictates the exact X/Y coordinates, fonts, colors, and alignments for each specific field.
   - `ctx.fillText()` draws the text dynamically over the template.
5. **Mini-Map Sync:** The generated canvas data is synchronized to the smaller header preview thumbnails in real-time.
