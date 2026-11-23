/* ── module: features/signature/ai-signature.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { renderCanvases } from '../id-generator/render-engine.js';
import { removeWhiteBackground, getOtsuThreshold, getContentBoundingBox } from '../../services/image-processing/signature-processing.js';

/* ═══════════════════════════════════════════════════════════════════════════
   17. AI SIGNATURE — Photo upload → Claude Vision → BG removal → ID
═══════════════════════════════════════════════════════════════════════════ */

/** Currently loaded raw signature photo (before AI processing) */
let sigRawPhotoDataUrl = null;

/**
 * Switch between "Draw" and "AI from Photo" signature modes.
 * @param {'draw'|'upload'} mode
 */
export function switchSigMode(mode) {
    const drawMode   = document.getElementById('sig-draw-mode');
    const uploadMode = document.getElementById('sig-upload-mode');
    const tabDraw    = document.getElementById('sig-tab-draw');
    const tabUpload  = document.getElementById('sig-tab-upload');

    if (mode === 'draw') {
        drawMode.style.display   = '';
        uploadMode.style.display = 'none';
        tabDraw.classList.add('active');
        tabUpload.classList.remove('active');
    } else {
        drawMode.style.display   = 'none';
        uploadMode.style.display = '';
        tabDraw.classList.remove('active');
        tabUpload.classList.add('active');
    }
}

/** Handle file selection from the signature photo input */
document.getElementById('sig-photo-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        sigRawPhotoDataUrl = ev.target.result;

        // Show preview image
        const preview     = document.getElementById('sig-upload-preview');
        const placeholder = document.getElementById('sig-upload-placeholder');
        const enhanceBtn  = document.getElementById('sig-enhance-btn');
        const clearBtn    = document.getElementById('sig-upload-clear');
        const resultPane  = document.getElementById('sig-result-preview');
        const statusPane  = document.getElementById('sig-ai-status');

        preview.src             = sigRawPhotoDataUrl;
        preview.style.display   = 'block';
        placeholder.style.display = 'none';
        enhanceBtn.style.display  = 'inline-flex';
        clearBtn.style.display    = 'inline-flex';
        resultPane.style.display  = 'none';
        statusPane.style.display  = 'none';
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // allow re-upload of same file
});

/** Allow clicking the upload area (but not the buttons/preview inside it) */
document.getElementById('sig-upload-area')?.addEventListener('click', e => {
    if (e.target.id === 'sig-upload-area' || e.target.closest('.sig-upload-placeholder')) {
        document.getElementById('sig-photo-input').click();
    }
});

/** Clear uploaded signature photo and reset UI */
export function clearUploadedSig() {
    sigRawPhotoDataUrl = null;

    const preview     = document.getElementById('sig-upload-preview');
    const placeholder = document.getElementById('sig-upload-placeholder');
    const enhanceBtn  = document.getElementById('sig-enhance-btn');
    const clearBtn    = document.getElementById('sig-upload-clear');
    const resultPane  = document.getElementById('sig-result-preview');
    const statusPane  = document.getElementById('sig-ai-status');

    preview.style.display     = 'none';
    placeholder.style.display = 'flex';
    enhanceBtn.style.display  = 'none';
    clearBtn.style.display    = 'none';
    resultPane.style.display  = 'none';
    statusPane.style.display  = 'none';

    // Clear from student state too
    const student = state.students[state.activeStudentIndex];
    student.signatureImage    = null;
    student.signatureDataUrl  = null;
    renderCanvases();
}

/**
 * Extract the base64 data (without the "data:image/...;base64," prefix)
 * and the media type from a data URL.
 */
function parseDataUrl(dataUrl) {
    const [header, data] = dataUrl.split(',');
    const mediaType = header.match(/data:([^;]+)/)[1];
    return { data, mediaType };
}

/**
 * Set the AI processing status message shown below the photo.
 * @param {string} msg  - Status text
 * @param {boolean} show - Whether to show the status bar
 */
function setAiStatus(msg, show = true) {
    const bar  = document.getElementById('sig-ai-status');
    const text = document.getElementById('sig-ai-status-text');
    if (bar)  bar.style.display  = show ? 'flex' : 'none';
    if (text) text.textContent   = msg;
}




/**
 * Main signature extraction pipeline:
 *  1. Load the signature image client-side.
 *  2. Calculate optimal threshold automatically via Otsu's method.
 *  3. Autocrop signature to its tight content bounds.
 *  4. Draw onto destination signature canvas with centered padding.
 *  5. Enhance contrast and strip background to transparent.
 *  6. Persist to student state and render on the ID.
 */
export async function enhanceSignatureWithAI() {
    if (!sigRawPhotoDataUrl) return;

    const enhanceBtn = document.getElementById('sig-enhance-btn');
    const clearBtn   = document.getElementById('sig-upload-clear');
    const resultPane = document.getElementById('sig-result-preview');

    enhanceBtn.disabled = true;
    clearBtn.disabled   = true;
    resultPane.style.display = 'none';
    setAiStatus('Scanning and extracting signature...', true);

    try {
        // Wait 50ms so UI updates and spinner shows
        await new Promise(res => setTimeout(res, 50));

        /* ── Step 1: Load the source image ── */
        const sourceImg = await new Promise((res, rej) => {
            const img = new Image();
            img.onload  = () => res(img);
            img.onerror = () => rej(new Error('Failed to load image'));
            img.src = sigRawPhotoDataUrl;
        });

        /* ── Step 2: Draw to a normalized scanning canvas ── */
        const maxScanDim = 1200;
        let scanW = sourceImg.width;
        let scanH = sourceImg.height;
        if (scanW > maxScanDim || scanH > maxScanDim) {
            if (scanW > scanH) {
                scanH = Math.round((scanH * maxScanDim) / scanW);
                scanW = maxScanDim;
            } else {
                scanW = Math.round((scanW * maxScanDim) / scanH);
                scanH = maxScanDim;
            }
        }

        const scanCanvas = document.createElement('canvas');
        scanCanvas.width  = scanW;
        scanCanvas.height = scanH;
        const sCtx = scanCanvas.getContext('2d');
        sCtx.drawImage(sourceImg, 0, 0, scanW, scanH);

        const scanImgData = sCtx.getImageData(0, 0, scanW, scanH);

        /* ── Step 3: Run Otsu's thresholding to find optimal cutoff ── */
        const threshold = getOtsuThreshold(scanImgData);

        /* ── Step 4: Detect content bounding box (autocrop) ── */
        const box = getContentBoundingBox(scanCanvas, threshold);

        /* ── Step 5: Draw cropped signature onto target canvas ── */
        const OUT_W = 638;
        const OUT_H = 240;

        const workCanvas = document.createElement('canvas');
        workCanvas.width  = OUT_W;
        workCanvas.height = OUT_H;
        const wCtx = workCanvas.getContext('2d');

        // Fill white background first (so contrast boost works properly)
        wCtx.fillStyle = '#ffffff';
        wCtx.fillRect(0, 0, OUT_W, OUT_H);

        // Draw cropped signature with aspect ratio preservation (centered with 90% size)
        const scale = Math.min(OUT_W / box.w, OUT_H / box.h) * 0.9;
        const destW = box.w * scale;
        const destH = box.h * scale;
        const destX = (OUT_W - destW) / 2;
        const destY = (OUT_H - destH) / 2;

        wCtx.drawImage(scanCanvas, box.x, box.y, box.w, box.h, destX, destY, destW, destH);

        /* ── Step 6: Apply Contrast Boost for crisp lines ── */
        const imgData2  = wCtx.getImageData(0, 0, OUT_W, OUT_H);
        const pixels    = imgData2.data;
        const contrast   = 45 / 100; // Boost contrast by 45% for crisp pen strokes
        const factor     = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < pixels.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                let v = pixels[i + c];
                v = Math.round(factor * (v - 128) + 128);
                pixels[i + c] = Math.max(0, Math.min(255, v));
            }
        }
        wCtx.putImageData(imgData2, 0, 0);

        /* ── Step 7: Remove background using threshold ── */
        removeWhiteBackground(workCanvas, 220);

        /* ── Step 8: Render result preview ── */
        const resultCanvas = document.getElementById('sig-result-canvas');
        resultCanvas.width  = OUT_W;
        resultCanvas.height = OUT_H;
        const rCtx = resultCanvas.getContext('2d');
        rCtx.clearRect(0, 0, OUT_W, OUT_H);
        rCtx.drawImage(workCanvas, 0, 0);

        setAiStatus('', false);
        resultPane.style.display = 'flex';

        /* ── Step 9: Persist to student state & re-render ID card ── */
        const finalDataUrl = workCanvas.toDataURL('image/png');
        const finalImg     = new Image();
        finalImg.onload = () => {
            const student = state.students[state.activeStudentIndex];
            student.signatureImage   = finalImg;
            student.signatureDataUrl = finalDataUrl;
            renderCanvases();
        };
        finalImg.src = finalDataUrl;

    } catch (err) {
        console.error('[ISU ID] Signature enhancement failed:', err);
        setAiStatus('Enhancement failed. Try again or draw your signature manually.', true);
    } finally {
        enhanceBtn.disabled = false;
        clearBtn.disabled   = false;
    }
}
