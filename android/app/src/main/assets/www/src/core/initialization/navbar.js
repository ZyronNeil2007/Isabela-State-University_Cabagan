/* ── module: core/initialization/navbar.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
/* ═══════════════════════════════════════════════════════════════════════════
   10. NAVBAR — Scroll-shrink effect
═══════════════════════════════════════════════════════════════════════════ */
export function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // Use IntersectionObserver to detect when the hero section leaves viewport
    const heroSection = document.getElementById('home');
    if (!heroSection) return;

    const observer = new IntersectionObserver(
        ([entry]) => {
            navbar.classList.toggle('scrolled', !entry.isIntersecting);
        },
        { threshold: 0.05 }
    );

    observer.observe(heroSection);
}
