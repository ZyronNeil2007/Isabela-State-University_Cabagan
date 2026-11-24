/* ── module: core/initialization/boot.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { loadTemplates } from '../../features/id-generator/templates.js';
import { renderCanvases } from '../../features/id-generator/render-engine.js';
import { initStepper } from '../../features/id-generator/stepper.js';
import { initTilt } from '../../features/card-preview/tilt.js';
import { initNavbar } from './navbar.js';
import { SESSION_KEY, showRestoreBanner } from '../../services/storage/session.js';

/* ═══════════════════════════════════════════════════════════════════════════
   12. BOOT — Initialise all modules when DOM + assets are ready
═══════════════════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
    // Load ID card templates & render
    loadTemplates();

    // Re-render once web fonts are fully ready to prevent font-swap layout shifts
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => renderCanvases()).catch(() => {});
    }

    // Check if a previous session exists and show restore banner
    (() => {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Support both old (array) and new ({ version, students }) formats
                const snapshot = Array.isArray(parsed) ? parsed : (parsed && parsed.students);
                // Only show banner when there is meaningful data (non-empty name or photo)
                const hasMeaningfulData = Array.isArray(snapshot) && snapshot.some(s =>
                    (s.formData && s.formData.name) || s.photoDataUrl
                );
                if (hasMeaningfulData) showRestoreBanner();
            }
        } catch { /* ignore parse errors */ }
    })();

    // Boot stepper
    initStepper();

    // Navbar scroll behaviour
    initNavbar();

    // 3D tilt — VanillaTilt is deferred, wait for it to be available
    if (typeof VanillaTilt !== 'undefined') {
        initTilt();
    } else {
        // Script is deferred; poll briefly then give up gracefully
        let attempts = 0;
        const tiltPoll = setInterval(() => {
            if (typeof VanillaTilt !== 'undefined') {
                initTilt();
                clearInterval(tiltPoll);
            }
            if (++attempts > 20) clearInterval(tiltPoll);
        }, 150);
    }
});
