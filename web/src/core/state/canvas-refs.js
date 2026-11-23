/* ── module: core/state/canvas-refs.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
/* ═══════════════════════════════════════════════════════════════════════════
   3. CANVAS REFERENCES
═══════════════════════════════════════════════════════════════════════════ */
export const frontCanvas     = document.getElementById('front-canvas');
export const frontCtx        = frontCanvas.getContext('2d');
export const backCanvas      = document.getElementById('back-canvas');
export const backCtx         = backCanvas.getContext('2d');
export const miniCanvasFront = document.getElementById('mini-canvas-front');
export const miniCtxFront    = miniCanvasFront ? miniCanvasFront.getContext('2d') : null;
export const miniCanvasBack  = document.getElementById('mini-canvas-back');
export const miniCtxBack     = miniCanvasBack  ? miniCanvasBack.getContext('2d')  : null;
