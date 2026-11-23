/* ── module: features/id-generator/form-bindings.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { renderCanvases } from './render-engine.js';
import { showToast } from '../../utils/toast.js';
import { renderStudentTabs } from '../student-management/student-tabs.js';
import { openCropper } from '../photo-editor/cropper.js';

/* ═══════════════════════════════════════════════════════════════════════════
   5. FORM BINDINGS — Map every input to state, then re-render
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Convert kebab-case input IDs to the camelCase state keys.
 * E.g. "full-name" → "name", "id-number" → "idNumber"
 */
export const INPUT_KEY_MAP = {
    'full-name':   'name',
    'id-number':   'idNumber',
    'course':      'course',
    'dob':         'dob',
    'parent-name': 'parentName',
    'address':     'address',
    'telephone':   'telephone'
};

const UPPERCASE_FIELDS = new Set(['full-name', 'id-number', 'course', 'parent-name', 'address', 'telephone']);

/**
 * requestAnimationFrame-based debounce.
 * Coalesces rapid successive calls into one execution per animation frame.
 * This means typing fast only triggers one canvas draw per ~16 ms,
 * keeping the UI silky-smooth without any input lag.
 */
function rafDebounce(fn) {
    let rafId = null;
    return function(...args) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = null;
            fn.apply(this, args);
        });
    };
}

/**
 * Throttle: at most once per `limit` ms.
 * Used for saveSessionToStorage to avoid LocalStorage thrash.
 */
export function throttle(fn, limit = 2000) {
    let lastRun = 0;
    let timer = null;
    return function(...args) {
        const now = Date.now();
        const remaining = limit - (now - lastRun);
        if (remaining <= 0) {
            clearTimeout(timer);
            lastRun = now;
            fn.apply(this, args);
        } else {
            clearTimeout(timer);
            timer = setTimeout(() => {
                lastRun = Date.now();
                fn.apply(this, args);
            }, remaining);
        }
    };
}

/** Debounced version — used by form inputs for live canvas updates */
const debouncedRender = rafDebounce(renderCanvases);

Object.entries(INPUT_KEY_MAP).forEach(([id, stateKey]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => {
        const raw = e.target.value;
        state.students[state.activeStudentIndex].formData[stateKey] = UPPERCASE_FIELDS.has(id) ? raw.toUpperCase() : raw;
        debouncedRender();

        // Also update tab name if editing full name
        if (stateKey === 'name') {
            renderStudentTabs();
        }
    });
});


/**
 * Switch the ID version between 'old' and '2026'.
 * Updates state, toggles the active button UI, shows/hides form fields,
 * and re-renders the card.
 *
 * @param {'old'|'2026'} version
 * @param {boolean} silent - If true, skip DOM toggle (used during session restore)
 */
export function setIdVersion(version, silent = false) {
    state.idVersion = version;

    if (!silent) {
        // Toggle button active states
        const btnOld  = document.getElementById('btn-old-id');
        const btn2026 = document.getElementById('btn-2026-id');
        if (btnOld)  btnOld.classList.toggle('active',  version === 'old');
        if (btn2026) btn2026.classList.toggle('active', version === '2026');
    }

    // Show/hide course vs department fields
    const courseWrapper = document.getElementById('course-field-wrapper');
    const deptWrapper   = document.getElementById('department-field-wrapper');
    if (courseWrapper) courseWrapper.style.display = version === 'old' ? '' : 'none';
    if (deptWrapper)   deptWrapper.style.display   = version === '2026' ? '' : 'none';

    // Update step 5 label dynamically
    const stepGroup = document.querySelector('.form-group[data-step="5"]');
    if (stepGroup) {
        stepGroup.dataset.stepTitle = version === '2026' ? 'Department' : 'Course';
    }

    renderCanvases();
}

// Department dropdown — bind change event
document.getElementById('department')?.addEventListener('change', e => {
    state.students[state.activeStudentIndex].formData.department = e.target.value;
    renderCanvases();
});

// Profile picture — file upload handler
document.getElementById('profile-pic').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image file', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image is too large. Maximum size is 5MB.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => {
            state.students[state.activeStudentIndex].rawSourceImage = img;
            openCropper();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset to allow same file re-upload
});
