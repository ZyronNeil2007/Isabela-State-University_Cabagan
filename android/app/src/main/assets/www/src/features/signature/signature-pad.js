/* ── module: features/signature/signature-pad.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { renderCanvases } from '../id-generator/render-engine.js';

/* ═══════════════════════════════════════════════════════════════════════════
   4. SIGNATURE PAD — Freehand drawing with mouse & touch support
═══════════════════════════════════════════════════════════════════════════ */
export const sigCanvas = document.getElementById('signature-pad');
export const sigCtx    = sigCanvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;

/** Resize the canvas to match its CSS-rendered width.
 *  Skipped while a stroke is in progress, and when the width is unchanged
 *  (unless forced) so mobile URL-bar / keyboard resizes don't wipe the pad. */
function initSignaturePad(force = true) {
    if (isDrawing) return;
    const rect = sigCanvas.parentElement.getBoundingClientRect();
    const w = Math.round(rect.width) || 300;
    if (!force && w === sigCanvas.width) return;
    sigCanvas.width  = w;
    sigCanvas.height = 140;
    sigCtx.lineWidth   = 2.5;
    sigCtx.lineCap     = 'round';
    sigCtx.lineJoin    = 'round';
    sigCtx.strokeStyle = '#111111';

    if (state.students && state.students[state.activeStudentIndex]) {
        const img = state.students[state.activeStudentIndex].signatureImage;
        if (img) {
            sigCtx.drawImage(img, 0, 0, sigCanvas.width, sigCanvas.height);
        }
    }
}

/** Pointer position in canvas pixels (compensates CSS scaling) */
function getPointerPos(e) {
    const rect = sigCanvas.getBoundingClientRect();
    const sx = rect.width  ? sigCanvas.width  / rect.width  : 1;
    const sy = rect.height ? sigCanvas.height / rect.height : 1;
    return {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top)  * sy
    };
}

function startDrawing(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    isDrawing = true;
    try { sigCanvas.setPointerCapture(e.pointerId); } catch (_) { /* synthetic event */ }
    const p = getPointerPos(e);
    lastX = p.x;
    lastY = p.y;

    // Hide the watermark as soon as drawing starts
    const watermark = sigCanvas.parentElement.querySelector('.signature-watermark');
    if (watermark) watermark.style.opacity = '0';
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    // Coalesced events give smooth curves on fast finger / pen strokes
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (events.length ? events : [e])) {
        const p = getPointerPos(ev);
        sigCtx.beginPath();
        sigCtx.moveTo(lastX, lastY);
        sigCtx.lineTo(p.x, p.y);
        sigCtx.stroke();
        lastX = p.x;
        lastY = p.y;
    }
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    updateSignatureImage();
}

function updateSignatureImage() {
    const img = new Image();
    const dataUrl = sigCanvas.toDataURL('image/png');
    img.onload = () => {
        state.students[state.activeStudentIndex].signatureImage = img;
        state.students[state.activeStudentIndex].signatureDataUrl = dataUrl;
        renderCanvases();
    };
    img.src = dataUrl;
}

// Signature event listeners — Pointer Events unify mouse, touch and pen
// (touch-action:none in CSS stops the page scrolling while signing)
sigCanvas.addEventListener('pointerdown',   startDrawing);
sigCanvas.addEventListener('pointermove',   draw);
sigCanvas.addEventListener('pointerup',     stopDrawing);
sigCanvas.addEventListener('pointercancel', stopDrawing);

document.getElementById('clear-signature').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    state.students[state.activeStudentIndex].signatureImage = null;
    state.students[state.activeStudentIndex].signatureDataUrl = null;
    // Restore watermark
    const watermark = sigCanvas.parentElement.querySelector('.signature-watermark');
    if (watermark) watermark.style.opacity = '1';
    renderCanvases();
});

// Re-fit when the container's width changes (rotation, split-view, layout switch)
if ('ResizeObserver' in window) {
    new ResizeObserver(() => initSignaturePad(false)).observe(sigCanvas.parentElement);
} else {
    window.addEventListener('resize', () => initSignaturePad(false));
}
initSignaturePad();
