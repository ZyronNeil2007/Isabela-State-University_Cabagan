/* ── module: features/id-generator/templates.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { backCanvas, frontCanvas, miniCanvasBack, miniCanvasFront } from '../../core/state/canvas-refs.js';
import { setIdVersion } from './form-bindings.js';

/* ═══════════════════════════════════════════════════════════════════════════
   6. TEMPLATE LOADING — Async load both ID face templates
═══════════════════════════════════════════════════════════════════════════ */
function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => { console.warn(`[ISU ID] Template not found: ${src}`); resolve(null); };
        img.src = src;
    });
}

/**
 * Ask the browser to load the Poppins weights used by the CR80 ID canvas text.
 * Canvas text does not trigger @font-face downloads by itself.
 * Resolves (never rejects) so a font failure just falls back to Arial.
 */
function loadPoppinsFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
        document.fonts.load("600 32px 'Poppins'"),
        document.fonts.load("700 41px 'Poppins'")
    ]).catch(() => {});
}

export async function loadTemplates() {
    const [front, back, front2026, back2026, photoPlaceholder2026] = await Promise.all([
        loadImage('assets/images/templates/legacy/template_front.id.png'),
        loadImage('assets/images/templates/legacy/template_back.id.png'),
        loadImage('assets/images/templates/2026/new_template_front.id.png?v=cr80c'),
        loadImage('assets/images/templates/2026/new_template_back.id.png?v=cr80b'),
        loadImage('assets/images/placeholders/cr80_photo_placeholder.png'),
        // CR80 design uses Poppins on the canvas — make sure it is loaded before first draw
        loadPoppinsFonts()
    ]);

    state.frontTemplate     = front;
    state.backTemplate      = back;
    state.front2026Template = front2026;
    state.back2026Template  = back2026;
    state.photoPlaceholder2026 = photoPlaceholder2026;

    // Set canvas intrinsic sizes from the loaded images (use old template as default)
    frontCanvas.width  = front ? front.width  : 638;
    frontCanvas.height = front ? front.height : 1013;
    backCanvas.width   = back  ? back.width   : 638;
    backCanvas.height  = back  ? back.height  : 1013;

    if (miniCanvasFront) {
        miniCanvasFront.width  = frontCanvas.width;
        miniCanvasFront.height = frontCanvas.height;
    }
    if (miniCanvasBack) {
        miniCanvasBack.width  = backCanvas.width;
        miniCanvasBack.height = backCanvas.height;
    }

    // Sync toggle buttons / course-vs-department field with the default version, then draw
    setIdVersion(state.idVersion);
}
