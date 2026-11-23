/* ── module: services/storage/session.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { setIdVersion, throttle } from '../../features/id-generator/form-bindings.js';
import { showToast } from '../../utils/toast.js';
import { renderStudentTabs, switchStudent } from '../../features/student-management/student-tabs.js';

/* ═══════════════════════════════════════════════════════════════════════════
   17. SESSION SAVE — Auto-persist students[] to localStorage after every render
       Serialises formData + dataUrl strings (images are already base64).
       On load, a restore banner lets the user resume or start fresh.
═══════════════════════════════════════════════════════════════════════════ */
export const SESSION_KEY = 'isu_id_session_v1';

/**
 * Serialise the current students array into localStorage.
 * We skip the Image objects (not serialisable) — they are rebuilt from
 * the *DataUrl strings when needed.
 */
/**
 * Serialise the current students array into localStorage.
 * We skip the Image objects (not serialisable) — they are rebuilt from
 * the *DataUrl strings when needed.
 * Throttled to at most once every 2 s to avoid repeated stringify of large
 * base64 photo dataUrls on every keystroke.
 */
export const saveSessionToStorage = throttle(function _saveSession() {
    try {
        const snapshot = state.students.map(s => ({
            photoDataUrl:     s.photoDataUrl     || null,
            signatureDataUrl: s.signatureDataUrl || null,
            formData:         { ...s.formData }
        }));
        // Also save the global version setting
        const payload = { version: state.idVersion, students: snapshot };
        const json = JSON.stringify(payload);
        if (json.length > 4.5 * 1024 * 1024) {
            console.warn('[ISU ID] Session too large, skipping save to avoid quota error.');
            if (!state._quotaWarned) {
                showToast("Batch is too large to auto-save.", "warning");
                state._quotaWarned = true;
            }
            return;
        }
        localStorage.setItem(SESSION_KEY, json);
    } catch (e) {
        // Quota exceeded or private-mode restriction
        console.warn('[ISU ID] Session save failed:', e);
    }
}, 2000);


/**
 * Restore a previously saved session.
 * Rebuilds Image objects from stored dataUrls.
 */
async function restoreSessionFromStorage() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;

    let payload;
    try { payload = JSON.parse(raw); } catch { return false; }

    // Support both old format (array) and new format ({ version, students })
    let snapshot, savedVersion;
    if (Array.isArray(payload)) {
        snapshot = payload;
        savedVersion = 'old';
    } else if (payload && Array.isArray(payload.students)) {
        snapshot = payload.students;
        savedVersion = payload.version || 'old';
    } else {
        return false;
    }

    if (snapshot.length === 0) return false;

    // Restore global version state
    if (savedVersion) {
        state.idVersion = savedVersion;
        setIdVersion(savedVersion, /*silent=*/true);
    }

    // Rebuild students array with Image objects rehydrated
    const rebuilt = await Promise.all(snapshot.map(async s => {
        const student = {
            photoImage:       null,
            photoDataUrl:     s.photoDataUrl || null,
            rawSourceImage:   null,
            signatureImage:   null,
            signatureDataUrl: s.signatureDataUrl || null,
            formData:         { ...s.formData }
        };

        if (s.photoDataUrl) {
            student.photoImage = await loadImageFromDataUrl(s.photoDataUrl);
        }
        if (s.signatureDataUrl) {
            student.signatureImage = await loadImageFromDataUrl(s.signatureDataUrl);
        }

        return student;
    }));

    state.students = rebuilt;
    return true;
}

/** Promise-wrapper to create an Image from a data URL */
function loadImageFromDataUrl(dataUrl) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
}

/** Wipe saved session */
function clearSavedSession() {
    localStorage.removeItem(SESSION_KEY);
}

/** Show / hide the session restore banner */
export function showRestoreBanner() {
    const banner = document.getElementById('session-restore-banner');
    if (banner) banner.classList.add('show');
}

function hideRestoreBanner() {
    const banner = document.getElementById('session-restore-banner');
    if (banner) banner.classList.remove('show');
}

/** Called by the "Restore" button on the banner */
export async function onRestoreSession() {
    hideRestoreBanner();
    const ok = await restoreSessionFromStorage();
    if (ok) {
        switchStudent(0);   // Reload first student into the form
        renderStudentTabs();
    }
}

/** Called by the "Discard" button on the banner */
export function onDiscardSession() {
    clearSavedSession();
    hideRestoreBanner();
}
