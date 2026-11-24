/* ── module: core/config/card-config.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
/* ═══════════════════════════════════════════════════════════════════════════
   1. CONFIG — Canvas coordinate map & text style definitions
   All pixel values are relative to the native template image dimensions.
═══════════════════════════════════════════════════════════════════════════ */
export const CONFIG = {
    /** Scale from logical coords → native canvas pixels */
    scaleMultiplier: 4.17,

    /** Photo crop box on front face (pixels in native resolution) */
    photo: { x: 161, y: 213, width: 315, height: 355 },

    /** Signature placement on front face */
    signature: { x: 160, y: 575, width: 319, height: 120 },

    /** Per-field text style definitions */
    text: {
        name: {
            x: 319, y: 710,
            align: 'center',
            font: "11.2px 'Roboto Condensed'",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#000000',
            strokeStyle: 'transparent'
        },
        idNumber: {
            x: 319, y: 795,
            align: 'center',
            font: "9.8px 'Nourd', sans-serif",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#000000',
            strokeStyle: 'transparent'
        },
        course: {
            x: 319, y: 915,
            align: 'center',
            font: "10.8px 'Roboto Condensed'",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#000000',
            strokeStyle: 'transparent',
            maxWidth: 550
        },
        parentName: {
            x: 64, y: 145,
            align: 'left',
            font: "7.7px 'Arial'",
            isBold: true,
            strokeThickness: 10,
            fillStyle: '#000000',
            strokeStyle: 'transparent'
        },
        address: {
            x: 64, y: 185,
            align: 'left',
            font: "4.9px 'Arial Nova Condensed', sans-serif",
            isBold: true,
            strokeThickness: 16,
            fillStyle: '#000000',
            strokeStyle: 'transparent',
            maxWidth: 500
        },
        telephone: {
            x: 64, y: 205,
            align: 'left',
            font: "4.9px 'Arial Nova Condensed', sans-serif",
            isBold: true,
            strokeThickness: 16,
            fillStyle: '#000000',
            strokeStyle: 'transparent'
        },
        dob: {
            x: 64, y: 250,
            align: 'left',
            font: "5.7px 'Arial MT Pro', sans-serif",
            isBold: false,
            strokeThickness: 0,
            fillStyle: '#000000',
            strokeStyle: 'transparent'
        }
    }
};

/**
 * CONFIG for the 2026 New ID template — "ISU Student ID – CR80 Template".
 * Front: 816 × 1296 px   Back: 816 × 1296 px   (CR80 = 54 × 85.6 mm, 384 dpi)
 *
 * All coordinates are native canvas pixels, taken from the CR80 design:
 *   - new_template_front.id.png  (blank CR80 front — labels, seal, university wordmark, photo frame)
 *   - new_template_back.id.png   (blank CR80 back  — labels, QR, registrar block)
 *   - front_reference.png / back_reference.png (filled references rendered by this app)
 *
 * FRONT
 * ─────
 *  Photo frame outer: left=181 top=300 size=453×453 (6px green border, 28px radius)
 *  Photo FILL area (inside the border): x=187 y=306 w=441 h=441, radius 22
 *    (until a photo is added, cr80_photo_placeholder.png — the template's silhouette — fills it)
 *  Signature: sits in the free band between the photo frame and the name
 *  NAME value:           top=880  font 41px Poppins Bold      → text centre y = 907
 *  STUDENT NUMBER value: top=984  font 41px Poppins Bold      → text centre y = 1011
 *  Department block:     top=1112 font 32px Poppins SemiBold, line-height 41.6px,
 *                        up to 3 lines (bottom band starts at y=1248)
 *
 * BACK
 * ────
 *  Four label rows (21px labels) 76px apart. Each value (32px Poppins Bold)
 *  starts right after its label; the x / y below were measured from the
 *  rendered template. Values stop at x=492 so they never touch the QR code
 *  (QR left edge = 510) and shrink to fit via `autoShrink`.
 */
export const CONFIG_2026 = {
    scaleMultiplier: 1,

    /**
     * Photo FILL area: strictly inside the green border.
     */
    photo: { x: 187, y: 306, width: 441, height: 441, borderRadius: 22 },

    /** Signature placement between the photo frame and the name */
    signature: { x: 258, y: 758, width: 300, height: 114 },

    text: {
        /** Student NAME — large bold caps, centre y = 907. */
        name: {
            x: 408, y: 907,
            align: 'center',
            font: "41px 'Poppins', Arial, sans-serif",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#0a6a35',
            strokeStyle: 'transparent',
            maxWidth: 744,
            autoShrink: 24
        },

        /** STUDENT NUMBER — bold, centre y = 1011. */
        idNumber: {
            x: 408, y: 1011,
            align: 'center',
            font: "41px 'Poppins', Arial, sans-serif",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#0a6a35',
            strokeStyle: 'transparent',
            maxWidth: 744,
            autoShrink: 24
        },

        /**
         * DEPARTMENT full name — SemiBold, multi-line (split on '\n').
         * y is the centre of the whole block (free area 1112 → 1237).
         */
        department: {
            x: 408, y: 1178,
            align: 'center',
            font: "600 32px 'Poppins', Arial, sans-serif",
            isBold: false,
            strokeThickness: 0,
            fillStyle: '#0a6a35',
            strokeStyle: 'transparent',
            maxWidth: 740,
            autoShrink: 20,
            lineHeight: 41.6
        },

        /* ══════════════════════════════════════════════════════════════
         * BACK FACE — Canvas 816 × 1296 px
         * Values sit on the same line as their printed label.
         * ═════════════════════════════════════════════════════════════ */

        /** CONTACT PERSON value — row 1 */
        parentName: {
            x: 232, y: 175,
            align: 'left',
            font: "bold 32px 'Poppins', Arial, sans-serif",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#0a6a35',
            strokeStyle: 'transparent',
            maxWidth: 260,
            autoShrink: 22,
            wrap: true
        },

        /** ADDRESS value — row 2 */
        address: {
            x: 232, y: 251,
            align: 'left',
            font: "bold 32px 'Poppins', Arial, sans-serif",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#0a6a35',
            strokeStyle: 'transparent',
            maxWidth: 260,
            autoShrink: 22,
            wrap: true
        },

        /** CONTACT NO. value — row 3 */
        telephone: {
            x: 232, y: 327,
            align: 'left',
            font: "bold 32px 'Poppins', Arial, sans-serif",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#0a6a35',
            strokeStyle: 'transparent',
            maxWidth: 260,
            autoShrink: 22,
            wrap: true
        },

        /** BIRTH DATE value — row 4 */
        dob: {
            x: 232, y: 403,
            align: 'left',
            font: "bold 32px 'Poppins', Arial, sans-serif",
            isBold: true,
            strokeThickness: 0,
            fillStyle: '#0a6a35',
            strokeStyle: 'transparent',
            maxWidth: 260,
            autoShrink: 22,
            wrap: true
        }
    }
};

/** Lookup for 2026 department abbreviation → full college name for rendering */
export const DEPARTMENT_LABELS = {
    'CBM':    'COLLEGE OF BUSINESS AND MANAGEMENT',
    'CCJE':   'COLLEGE OF CRIMINAL JUSTICE EDUCATION',
    'CAST':   'COLLEGE OF AGRICULTURAL,\nSCIENCE AND TECHNOLOGY',
    'CCSICT': 'COLLEGE OF COMPUTING STUDIES,\nINFORMATION COMMUNICATION\nTECHNOLOGY',
    'COE':    'COLLEGE OF ENGINEERING',
    'CED':    'COLLEGE OF EDUCATION',
    'CFEM':   'COLLEGE OF FORESTRY AND\nENVIRONMENTAL MANAGEMENT',
    'CCSS':   'COLLEGE OF COMMUNICATION\nAND SOCIAL SCIENCES',
    'CS':     'COLLEGE OF SCIENCE'
};
