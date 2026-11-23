/* ── module: core/state/state.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
/* ═══════════════════════════════════════════════════════════════════════════
   2. STATE — Single reactive data store
═══════════════════════════════════════════════════════════════════════════ */
export const state = {
    frontTemplate:     null,
    backTemplate:      null,
    front2026Template: null,
    photoPlaceholder2026: null,   // silhouette shown in the 2026 photo frame until a photo is added
    back2026Template:  null,
    activeStudentIndex: 0,
    idVersion: '2026',  // 'old' | '2026'  (CR80 2026 design is the default)
    campusTheme: 'cabagan', // 'cabagan' | 'echague' | 'cauayan' | 'ilagan' | 'roxas'
    showHologram: true,
    audioEnabled: true,
    inspectFace: 'front',
    students: [
        {
            photoImage:     null,
            photoDataUrl:   null,
            signatureImage: null,
            signatureDataUrl: null,
            formData: {
                name:       '',
                idNumber:   '',
                course:     '',
                department: '',
                dob:        '',
                parentName: '',
                address:    '',
                telephone:  ''
            }
        }
    ]
};
