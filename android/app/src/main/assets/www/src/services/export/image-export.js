/* ── module: services/export/image-export.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { backCanvas, frontCanvas } from '../../core/state/canvas-refs.js';

/* ═══════════════════════════════════════════════════════════════════════════
   15. EXPORT DROPDOWNS & SAVE AS IMAGE
═══════════════════════════════════════════════════════════════════════════ */

// Toggle Desktop Dropdown
document.getElementById('save-image-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('export-dropdown-menu')?.classList.toggle('show');
});

// Hide dropdown on outside click
document.addEventListener('click', () => {
    document.getElementById('export-dropdown-menu')?.classList.remove('show');
});

export function showMobileExportMenu() {
    const sheet = document.getElementById('mobile-export-sheet');
    if (!sheet) return;
    // A fixed element inside a backdrop-filter ancestor is positioned against
    // that ancestor, not the viewport (breaks landscape phones >860px wide).
    // Re-parent to <body> so it is always viewport-fixed.
    if (sheet.parentElement !== document.body) document.body.appendChild(sheet);
    sheet.classList.add('show');
}
export function hideMobileExportMenu() {
    document.getElementById('mobile-export-sheet')?.classList.remove('show');
}

export function saveAsImage(side) {
    const student = state.students[state.activeStudentIndex];
    const baseName = `ISU_ID_${(student.formData.name || 'Student').replace(/\s+/g, '_')}`;
    
    if (side === 'front' || side === 'both') {
        const link = document.createElement('a');
        link.download = `${baseName}_Front.png`;
        link.href = frontCanvas.toDataURL('image/png');
        link.click();
    }
    
    if (side === 'back' || side === 'both') {
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `${baseName}_Back.png`;
            link.href = backCanvas.toDataURL('image/png');
            link.click();
        }, side === 'both' ? 500 : 0);
    }
}
