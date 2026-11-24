/* ── module: features/card-preview/cr80-preview.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { DEPARTMENT_LABELS } from '../../core/config/card-config.js';
import { state } from '../../core/state/state.js';
import { backCanvas, frontCanvas, miniCanvasBack, miniCanvasFront, miniCtxBack, miniCtxFront } from '../../core/state/canvas-refs.js';
import { drawHologramWatermark } from './security-fx.js';

/* ═══════════════════════════════════════════════════════════════════════════
   7b. CR80 HTML PREVIEW — Live HTML card for the 2026 ID
   The preview section shows the "ISU Student ID – CR80 Template" markup
   (index.html #cr80-front / #cr80-back, styled in style.css §23). It is filled
   from the same state as the canvases: input → state → renderCanvases() →
   renderCr80Preview(). The canvases keep rendering as the PNG/PDF export source.
═══════════════════════════════════════════════════════════════════════════ */

/** Design-board width the CR80 faces are laid out on (px) */
const CR80_BOARD_W = 816;

/** Silhouette shown in the photo frame until the student's photo is added */
const CR80_PHOTO_PLACEHOLDER = 'assets/images/placeholders/cr80_photo_placeholder.png';

/**
 * Shrink an element's font-size until it fits maxWidth (never below minPx).
 * Uses offsetWidth (layout width) so the CSS scale transform does not affect it.
 *
 * @param {HTMLElement} el
 * @param {number} basePx
 * @param {number} minPx
 * @param {number} maxWidth
 */
function fitCr80Text(el, basePx, minPx, maxWidth) {
    let size = basePx;
    el.style.fontSize = size + 'px';
    while (size > minPx && el.offsetWidth > maxWidth) {
        size -= 1;
        el.style.fontSize = size + 'px';
    }
}

/** Format a date-input value as MM/DD/YYYY (falls back to the raw text) */
function formatCr80Dob(raw) {
    if (!raw) return '01/01/2000';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getUTCFullYear()}`;
}

/** Keep each CR80 face scaled to the width of its preview stage */
function updateCr80Scale() {
    document.querySelectorAll('.cr80-stage').forEach(stage => {
        const w = stage.clientWidth;
        if (w > 0) stage.style.setProperty('--cr80-scale', String(w / CR80_BOARD_W));
    });
}

let _cr80Observer = null;

/**
 * Fill the CR80 HTML front/back from the active student and toggle the
 * HTML card vs. canvas depending on the selected ID version.
 */
export function renderCr80Preview() {
    const card = document.getElementById('idCard');
    if (!card) return;

    const is2026 = state.idVersion === '2026';
    card.classList.toggle('is-cr80', is2026);
    if (!is2026) return;

    if (!_cr80Observer && typeof ResizeObserver !== 'undefined') {
        _cr80Observer = new ResizeObserver(updateCr80Scale);
        document.querySelectorAll('.cr80-stage').forEach(st => _cr80Observer.observe(st));
    }
    updateCr80Scale();

    const student = state.students[state.activeStudentIndex];
    const fd      = student.formData;
    const $       = id => document.getElementById(id);

    // ── Front ──
    const photo = $('cr80-photo');
    if (photo) {
        // No photo yet → the template's silhouette placeholder (same as the export canvas)
        const photoSrc = student.photoDataUrl || CR80_PHOTO_PLACEHOLDER;
        if (photo.getAttribute('src') !== photoSrc) photo.src = photoSrc;
        photo.alt = student.photoDataUrl ? 'Student photo' : 'Photo placeholder';
        photo.hidden = false;
    }
    const sig = $('cr80-signature');
    if (sig) {
        if (student.signatureDataUrl) {
            if (sig.getAttribute('src') !== student.signatureDataUrl) sig.src = student.signatureDataUrl;
            sig.hidden = false;
        } else {
            sig.removeAttribute('src');
            sig.hidden = true;
        }
    }

    const nameEl = $('cr80-name');
    nameEl.textContent = fd.name || 'JUAN DELA CRUZ';
    fitCr80Text(nameEl, 41, 24, 744);

    const idEl = $('cr80-idnumber');
    idEl.textContent = fd.idNumber || '25-00001';
    fitCr80Text(idEl, 41, 24, 744);

    const deptEl = $('cr80-department');
    deptEl.textContent = fd.department ? (DEPARTMENT_LABELS[fd.department] || fd.department) : 'COLLEGE / DEPARTMENT';
    fitCr80Text(deptEl, 32, 20, 680);

    // Holographic watermark overlay (same toggle as the canvas version)
    const holo = $('cr80-holo');
    if (holo) {
        const hctx = holo.getContext('2d');
        hctx.clearRect(0, 0, holo.width, holo.height);
        drawHologramWatermark(hctx, holo.width, holo.height);
    }

    // ── Back ──  aligned value column (x 232 → 492): shrink to 22px, then wrap to 2 lines
    const fill = (id, text) => {
        const el = $(id);
        el.classList.remove('is-wrapped');
        el.textContent = text;
        let size = 32;
        el.style.fontSize = size + 'px';
        while (size > 22 && el.scrollWidth > el.clientWidth) {
            size -= 1;
            el.style.fontSize = size + 'px';
        }
        if (el.scrollWidth > el.clientWidth) {
            el.classList.add('is-wrapped');
            // keep shrinking until the wrapped text fits the 64px row height
            while (size > 15 && el.offsetHeight > 64) {
                size -= 1;
                el.style.fontSize = size + 'px';
            }
        }
    };
    fill('cr80-parent',    fd.parentName || 'JANE DELA CRUZ');
    fill('cr80-address',   fd.address    || 'BARUCBOC, QUEZON, ISABELA');
    fill('cr80-telephone', fd.telephone  || '09123456789');
    fill('cr80-dob',       formatCr80Dob(fd.dob));
}


/** Copy the main canvases into the small mini-preview thumbnails */
export function updateMiniCanvas() {
    if (miniCanvasFront && miniCtxFront) {
        miniCtxFront.clearRect(0, 0, miniCanvasFront.width, miniCanvasFront.height);
        miniCtxFront.drawImage(frontCanvas, 0, 0, miniCanvasFront.width, miniCanvasFront.height);
    }
    if (miniCanvasBack && miniCtxBack) {
        miniCtxBack.clearRect(0, 0, miniCanvasBack.width, miniCanvasBack.height);
        miniCtxBack.drawImage(backCanvas, 0, 0, miniCanvasBack.width, miniCanvasBack.height);
    }
}
