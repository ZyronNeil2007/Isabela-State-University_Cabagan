/* ── module: features/campus-theme/campus-theme.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { renderCanvases } from '../id-generator/render-engine.js';
import { showToast } from '../../utils/toast.js';
import { playAudioFx } from '../card-preview/security-fx.js';

/* ═══════════════════════════════════════════════════════════════════════════
   20. ENHANCEMENT SUITE — Campus Themes, QR Generator, Security Hologram,
       Batch Table Manager, Card Inspector & Web Audio FX
   ═══════════════════════════════════════════════════════════════════════════ */

/** Campus Config Dictionary — 11 ISU Campuses */
export const CAMPUS_CONFIG = {
    cabagan: {
        name: 'Cabagan Main Campus',
        headerText: 'ISABELA STATE UNIVERSITY · CABAGAN',
        primary: '#0f5132',
        accent: '#d4af37',
        particleColor: 0x15B915
    },
    echague: {
        name: 'Echague Main Campus',
        headerText: 'ISABELA STATE UNIVERSITY · ECHAGUE',
        primary: '#1b365d',
        accent: '#eaaa00',
        particleColor: 0x3b82f6
    },
    cauayan: {
        name: 'Cauayan Campus',
        headerText: 'ISABELA STATE UNIVERSITY · CAUAYAN',
        primary: '#800020',
        accent: '#dfb15b',
        particleColor: 0xef4444
    },
    ilagan: {
        name: 'Ilagan Campus',
        headerText: 'ISABELA STATE UNIVERSITY · ILAGAN',
        primary: '#4a154b',
        accent: '#c0c0c0',
        particleColor: 0xa855f7
    },
    roxas: {
        name: 'Roxas Campus',
        headerText: 'ISABELA STATE UNIVERSITY · ROXAS',
        primary: '#008080',
        accent: '#ffbf00',
        particleColor: 0x14b8a6
    },
    angadanan: {
        name: 'Angadanan Campus',
        headerText: 'ISABELA STATE UNIVERSITY · ANGADANAN',
        primary: '#1e4d2b',
        accent: '#b87333',
        particleColor: 0x10b981
    },
    san_mateo: {
        name: 'San Mateo Campus',
        headerText: 'ISABELA STATE UNIVERSITY · SAN MATEO',
        primary: '#92400e',
        accent: '#f59e0b',
        particleColor: 0xf59e0b
    },
    jones: {
        name: 'Jones Campus',
        headerText: 'ISABELA STATE UNIVERSITY · JONES',
        primary: '#0f172a',
        accent: '#06b6d4',
        particleColor: 0x06b6d4
    },
    palanan: {
        name: 'Palanan Campus',
        headerText: 'ISABELA STATE UNIVERSITY · PALANAN',
        primary: '#0284c7',
        accent: '#f97316',
        particleColor: 0x0284c7
    },
    san_mariano: {
        name: 'San Mariano Campus',
        headerText: 'ISABELA STATE UNIVERSITY · SAN MARIANO',
        primary: '#047857',
        accent: '#eab308',
        particleColor: 0x047857
    },
    santiago: {
        name: 'Santiago City Extension',
        headerText: 'ISABELA STATE UNIVERSITY · SANTIAGO',
        primary: '#581c87',
        accent: '#f43f5e',
        particleColor: 0xf43f5e
    }
};

/** Set active Campus Theme */
export function setCampusTheme(campusKey, skipSound = false) {
    if (!CAMPUS_CONFIG[campusKey]) return;
    state.campusTheme = campusKey;
    if (!skipSound) playAudioFx('click');

    // Update active state on campus pill buttons
    document.querySelectorAll('.campus-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.campus === campusKey);
    });

    const config = CAMPUS_CONFIG[campusKey];
    document.documentElement.style.setProperty('--green-600', config.primary);
    document.documentElement.style.setProperty('--gold-400', config.accent);

    // Notify window for Three.js particle constellation color animation in animations.js
    if (typeof window.onCampusThemeChange === 'function') {
        window.onCampusThemeChange(config);
    }

    showToast(`Switched campus theme to ${config.name}`, 'info');
    renderCanvases();
}
