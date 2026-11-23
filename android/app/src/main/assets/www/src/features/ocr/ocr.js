/* ── module: features/ocr/ocr.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { renderCanvases } from '../id-generator/render-engine.js';
import { goToStep } from '../id-generator/stepper.js';
import { renderStudentTabs } from '../student-management/student-tabs.js';

/* ═══════════════════════════════════════════════════════════════════════════
   18. OCR AUTOFILL — Snap or upload a printed ID / registration form photo.
       Tesseract.js extracts text → regex patterns pull name, ID, course, DOB.
       Fields are pre-filled and the form re-renders instantly.
═══════════════════════════════════════════════════════════════════════════ */

let ocrRawDataUrl = null;   // Raw photo dataUrl for the OCR modal

let _tesseractLoaded = false;

/**
 * Lazily inject the Tesseract.js CDN script the first time the modal opens.
 * This removes ~4 MB WASM from the critical page-load path.
 */
function ensureTesseractLoaded() {
    return new Promise((resolve, reject) => {
        if (_tesseractLoaded || typeof Tesseract !== 'undefined') {
            _tesseractLoaded = true;
            return resolve();
        }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js';
        s.integrity = 'sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F';
        s.crossOrigin = 'anonymous';
        s.onload  = () => { _tesseractLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('Failed to load Tesseract.js'));
        document.head.appendChild(s);
    });
}

/** Open the OCR upload modal */
export function openOcrModal() {
    const modal = document.getElementById('ocr-modal');
    if (modal) modal.classList.add('active');
    ocrRawDataUrl = null;
    resetOcrModal();
    // Pre-load Tesseract in background while the user uploads their photo
    ensureTesseractLoaded().catch(() => {});
}


/** Close the OCR upload modal */
export function closeOcrModal() {
    const modal = document.getElementById('ocr-modal');
    if (modal) modal.classList.remove('active');
}

/** Reset all UI inside the OCR modal to its initial state */
function resetOcrModal() {
    const preview     = document.getElementById('ocr-preview-img');
    const placeholder = document.getElementById('ocr-placeholder');
    const scanBtn     = document.getElementById('ocr-scan-btn');
    const statusPane  = document.getElementById('ocr-status');
    const resultsPane = document.getElementById('ocr-results');

    if (preview)     { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = 'flex';
    if (scanBtn)     scanBtn.style.display = 'none';
    if (statusPane)  statusPane.style.display = 'none';
    if (resultsPane) resultsPane.style.display = 'none';
}

/** File selected in the OCR modal */
document.getElementById('ocr-file-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        ocrRawDataUrl = ev.target.result;

        const preview     = document.getElementById('ocr-preview-img');
        const placeholder = document.getElementById('ocr-placeholder');
        const scanBtn     = document.getElementById('ocr-scan-btn');
        const resultsPane = document.getElementById('ocr-results');
        const statusPane  = document.getElementById('ocr-status');

        if (preview)     { preview.src = ocrRawDataUrl; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        if (scanBtn)     scanBtn.style.display = 'inline-flex';
        if (resultsPane) resultsPane.style.display = 'none';
        if (statusPane)  statusPane.style.display = 'none';
    };
    reader.readAsDataURL(file);
    e.target.value = '';
});

/** Allow clicking the OCR upload zone */
document.getElementById('ocr-upload-zone')?.addEventListener('click', e => {
    if (e.target.id === 'ocr-upload-zone' || e.target.closest('.ocr-placeholder')) {
        document.getElementById('ocr-file-input').click();
    }
});

/**
 * Set status message inside the OCR modal.
 * @param {string} msg
 * @param {boolean} show
 */
function setOcrStatus(msg, show = true) {
    const pane = document.getElementById('ocr-status');
    const text = document.getElementById('ocr-status-text');
    if (pane) pane.style.display = show ? 'flex' : 'none';
    if (text) text.textContent = msg;
}

/**
 * Try to extract a value from OCR text using an array of regex patterns.
 * Returns the first non-empty captured group or null.
 * @param {string} text
 * @param {RegExp[]} patterns
 * @returns {string|null}
 */
function ocrExtract(text, patterns) {
    for (const re of patterns) {
        const m = text.match(re);
        if (m && m[1] && m[1].trim()) return m[1].trim();
    }
    return null;
}

/**
 * Run Tesseract OCR on the loaded photo, then parse the result to fill form fields.
 */
export async function runOcrScan() {
    if (!ocrRawDataUrl) return;

    const scanBtn = document.getElementById('ocr-scan-btn');
    if (scanBtn) { scanBtn.disabled = true; }

    setOcrStatus('Loading OCR engine…', true);
    document.getElementById('ocr-results').style.display = 'none';

    try {
        // Ensure Tesseract.js is loaded (lazy-loaded on first OCR modal open)
        await ensureTesseractLoaded();

        setOcrStatus('Recognising text… (this may take 10–30 s)', true);


        const result = await Tesseract.recognize(
            ocrRawDataUrl,
            'eng',          // Language
            { logger: m => {
                if (m.status === 'recognizing text') {
                    setOcrStatus(`Recognising text… ${Math.round(m.progress * 100)}%`, true);
                }
            }}
        );

        const raw = result.data.text;
        console.log('[ISU ID OCR] Raw text:', raw);

        /* ── Field extraction ── */
        // Name: look for a full-caps line or label
        const extractedName = ocrExtract(raw, [
            /Name[:\s]+([A-Z][A-Z\s,.-]{4,60})/im,
            /Student[:\s]+([A-Z][A-Z\s,.-]{4,60})/im,
            // Fallback: longest ALL-CAPS line (likely the name)
            /^([A-Z]{2}[A-Z,\s.-]{6,50})$/m
        ]);

        // ID Number: common formats like 25-00001, 2025-00001, 2025-BSCS-001
        const extractedId = ocrExtract(raw, [
            /(?:ID|Student)\s*(?:No|Number|#)?[:\s]+([0-9]{2,4}[-—][0-9A-Z]{3,10})/im,
            /\b(20\d{2}[-—]\d{4,6})\b/,
            /\b(\d{2}[-—]\d{4,6})\b/
        ]);

        // Course / Degree
        const extractedCourse = ocrExtract(raw, [
            /(?:Course|Program|Degree)[:\s]+([A-Za-z\s]{5,60})/im,
            /\b(Bachelor\s+of\s+[A-Za-z\s]{4,50})/im,
            /\b(BS[CS]?\s+[A-Za-z\s]{3,40})/im
        ]);

        // Date of Birth: various date formats
        const extractedDob = ocrExtract(raw, [
            /(?:DOB|Birth(?:day|\s*Date)?|Born)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/im,
            /(?:DOB|Birth(?:day|\s*Date)?|Born)[:\s]+(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/im,
            /\b(\d{4}-\d{2}-\d{2})\b/  // ISO 8601 fallback
        ]);

        /* ── Display extracted results in modal ── */
        const fillField = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        };
        fillField('ocr-result-name',   extractedName);
        fillField('ocr-result-id',     extractedId);
        fillField('ocr-result-course', extractedCourse);
        fillField('ocr-result-dob',    extractedDob);

        setOcrStatus('', false);
        document.getElementById('ocr-results').style.display = 'block';
        const applyBtn = document.getElementById('ocr-apply-btn');
        if (applyBtn) applyBtn.style.display = 'inline-flex';

        // Store for apply step
        document.getElementById('ocr-results').dataset.name   = extractedName   || '';
        document.getElementById('ocr-results').dataset.id     = extractedId     || '';
        document.getElementById('ocr-results').dataset.course = extractedCourse || '';
        document.getElementById('ocr-results').dataset.dob    = extractedDob    || '';

    } catch (err) {
        console.error('[ISU ID OCR] Failed:', err);
        setOcrStatus('OCR failed: ' + err.message, true);
    } finally {
        if (scanBtn) scanBtn.disabled = false;
    }
}

/**
 * Apply the OCR-extracted values to the active student's form fields and re-render.
 */
export function applyOcrResults() {
    const resultsEl = document.getElementById('ocr-results');
    if (!resultsEl) return;

    const student = state.students[state.activeStudentIndex];

    const name   = resultsEl.dataset.name   || '';
    const id     = resultsEl.dataset.id     || '';
    const course = resultsEl.dataset.course || '';
    const dob    = resultsEl.dataset.dob    || '';

    if (name) {
        student.formData.name = name.toUpperCase();
        const el = document.getElementById('full-name');
        if (el) el.value = student.formData.name;
    }
    if (id) {
        student.formData.idNumber = id.toUpperCase();
        const el = document.getElementById('id-number');
        if (el) el.value = student.formData.idNumber;
    }
    if (course) {
        student.formData.course = course.toUpperCase();
        const el = document.getElementById('course');
        if (el) el.value = student.formData.course;
    }
    if (dob) {
        // Try to convert to YYYY-MM-DD for the date input
        let iso = dob;
        const mdy = dob.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
        if (mdy) {
            const y = mdy[3].length === 2 ? '20' + mdy[3] : mdy[3];
            iso = `${y}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
        }
        student.formData.dob = iso;
        const el = document.getElementById('dob');
        if (el) el.value = iso;
    }

    renderStudentTabs();
    renderCanvases();
    closeOcrModal();

    // Jump to next unfilled step
    if (!student.formData.name) goToStep(2);
    else if (!student.formData.idNumber) goToStep(3);
    else if (!student.formData.course) goToStep(4);
    else if (!student.formData.dob) goToStep(5);
    else if (!student.formData.parentName) goToStep(6);
    else if (!student.formData.address) goToStep(7);
    else if (!student.formData.telephone) goToStep(8);
}
