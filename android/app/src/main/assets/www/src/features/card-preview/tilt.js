/* ── module: features/card-preview/tilt.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
/* ═══════════════════════════════════════════════════════════════════════════
   9. TILT EFFECT — VanillaTilt 3D card hover (loaded via CDN, deferred)
═══════════════════════════════════════════════════════════════════════════ */
export function initTilt() {
    const tiltEl = document.getElementById('card-tilt-wrapper');
    if (!tiltEl || typeof VanillaTilt === 'undefined') return;

    VanillaTilt.init(tiltEl, {
        max:          7,       // max tilt angle in degrees — subtle & premium
        speed:        500,     // transition speed in ms
        glare:        true,    // subtle glare reflection
        'max-glare':  0.12,   // glare opacity
        scale:        1.025,   // very slight lift on hover
        perspective:  900,     // matching CSS perspective
        gyroscope:    true,    // tilt on mobile motion sensors
        'full-page-listening': false
    });
}
