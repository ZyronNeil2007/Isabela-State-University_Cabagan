/* ── module: features/id-generator/stepper.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
/* ═══════════════════════════════════════════════════════════════════════════
   8. STEPPER — Step navigation, progress bar & dot indicator
═══════════════════════════════════════════════════════════════════════════ */
const TOTAL_STEPS = 10;
const STEP_TITLES = [
    'Choose ID Version', // 1
    'Upload Photo',      // 2
    'Full Name',         // 3
    'ID Number',         // 4
    'Course / Dept.',    // 5
    'Date of Birth',     // 6
    'Parent / Guardian', // 7
    'Home Address',      // 8
    'Telephone',         // 9
    'Signature'          // 10
];

let currentStep = 1;

/** Touch devices: skip auto-focus so the on-screen keyboard doesn't cover the preview */
const COARSE_POINTER = window.matchMedia('(pointer: coarse)');

/** Pause CSS animations while the tab is hidden (saves battery on mobile) */
document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('tab-hidden', document.hidden);
});

/** Returns true — stepper mode is always active */
function isStepperMode() { return true; }

/* ── Dot indicators ─────────────────────────────────────── */
function buildStepperDots() {
    const container = document.getElementById('stepper-dots');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 1; i <= TOTAL_STEPS; i++) {
        const dot = document.createElement('span');
        dot.className      = 'stepper-dot';
        dot.dataset.step   = i;
        dot.title          = STEP_TITLES[i - 1];
        dot.setAttribute('role', 'button');
        dot.setAttribute('aria-label', `Go to step ${i}: ${STEP_TITLES[i - 1]}`);
        dot.addEventListener('click', () => goToStep(i));
        container.appendChild(dot);
    }
}

/* ── Desktop segmented progress bar ────────────────────── */
function buildDesktopProgressBar() {
    const bar = document.getElementById('desktop-progress-bar');
    if (!bar) return;
    bar.innerHTML = '';

    for (let i = 1; i <= TOTAL_STEPS; i++) {
        const seg = document.createElement('div');
        seg.className    = 'progress-segment';
        seg.dataset.step = i;
        seg.title        = STEP_TITLES[i - 1];
        seg.addEventListener('click', () => goToStep(i));
        bar.appendChild(seg);
    }
}

/** Update desktop segmented progress bar to reflect current step */
function updateDesktopProgressBar(step) {
    document.querySelectorAll('.progress-segment').forEach(seg => {
        const s = parseInt(seg.dataset.step);
        seg.classList.toggle('done',   s < step);
        seg.classList.toggle('active', s === step);
    });
}

/** Update the desktop header (badge + title) */
function updateDesktopHeader(step) {
    const badge = document.getElementById('desktop-step-badge');
    const title = document.getElementById('desktop-step-title');
    if (badge) badge.textContent = `Step ${step} of ${TOTAL_STEPS}`;
    if (title) title.textContent  = STEP_TITLES[step - 1];
}

/* ── Main step navigation function ─────────────────────── */
/**
 * Navigate to step n. Updates:
 *  • Visible form group
 *  • Header labels (mobile + desktop)
 *  • Progress bar / dots
 *  • Back / Next / Done button visibility
 *  • Card flip for back-face steps
 */
export function goToStep(n, opts = {}) {
    if (n < 1 || n > TOTAL_STEPS) return;
    currentStep = n;

    // ── Show/hide form groups ──
    document.querySelectorAll('.steps-wrapper .form-group').forEach(el => {
        const step = parseInt(el.dataset.step);
        if (step === currentStep) {
            el.classList.add('active-step');
            // Auto-focus the first interactive field (not file inputs)
            const firstInput = el.querySelector('input:not([type="file"]), textarea');
            if (firstInput && !opts.silent && !COARSE_POINTER.matches) setTimeout(() => firstInput.focus({ preventScroll: true }), 380);
        } else {
            el.classList.remove('active-step');
        }
    });

    // ── Mobile stepper header ──
    const mobileNameEl  = document.getElementById('stepper-step-name');
    const mobileCountEl = document.getElementById('stepper-count');
    if (mobileNameEl)  mobileNameEl.textContent  = STEP_TITLES[currentStep - 1];
    if (mobileCountEl) mobileCountEl.textContent = `${currentStep} / ${TOTAL_STEPS}`;

    // ── Mobile progress bar ──
    const fill = document.getElementById('stepper-progress');
    if (fill) fill.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;

    // ── Stepper dots ──
    document.querySelectorAll('.stepper-dot').forEach(dot => {
        const s = parseInt(dot.dataset.step);
        dot.classList.toggle('active', s === currentStep);
        dot.classList.toggle('done',   s < currentStep);
    });

    // ── Desktop header + segmented bar ──
    updateDesktopHeader(currentStep);
    updateDesktopProgressBar(currentStep);

    // ── Back / Next / Done button state ──
    const backBtn = document.getElementById('stepper-back');
    const nextBtn = document.getElementById('stepper-next');
    const doneBtn = document.getElementById('stepper-done');

    if (backBtn) backBtn.disabled = currentStep === 1;

    if (currentStep === TOTAL_STEPS) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (doneBtn) doneBtn.style.display = 'flex';
    } else {
        if (nextBtn) nextBtn.style.display = 'flex';
        if (doneBtn) doneBtn.style.display = 'none';
    }

    // ── Card face flip ──
    // Steps 1-5 = front face, steps 6-10 = back face
    const idCard    = document.getElementById('idCard');
    const flipTitle = document.getElementById('flip-title');
    const miniCard  = document.getElementById('mini-card');
    const shouldFlip = currentStep >= 6;

    if (idCard) {
        idCard.classList.toggle('is-flipped', shouldFlip);
        if (flipTitle) {
            flipTitle.textContent = shouldFlip ? 'Back Side' : 'Front Side';
        }
    }

    if (miniCard) {
        miniCard.classList.toggle('is-flipped', shouldFlip);
    }
}

/* ── Button handlers (called from HTML onclick) ─────────── */
/** Navigate to the next step */
export function stepperNext() {
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
}

/** Navigate to the previous step */
export function stepperBack() {
    if (currentStep > 1) goToStep(currentStep - 1);
}

/** Flip the main ID card and update the preview title */
export function flipCard() {
    const idCard    = document.getElementById('idCard');
    const flipTitle = document.getElementById('flip-title');
    if (!idCard) return;
    idCard.classList.toggle('is-flipped');
    
    const isFlipped = idCard.classList.contains('is-flipped');
    if (flipTitle) {
        flipTitle.textContent = isFlipped ? 'Back Side' : 'Front Side';
    }
    
    const miniCard = document.getElementById('mini-card');
    if (miniCard) miniCard.classList.toggle('is-flipped', isFlipped);
}

/* ── Resize: re-apply stepper at current step ────────────── */
let resizeRaf = 0;
function handleResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        if (isStepperMode()) goToStep(currentStep, { silent: true });
    });
}

window.addEventListener('resize', handleResize, { passive: true });

/* ── Boot stepper ───────────────────────────────────────── */
export function initStepper() {
    buildStepperDots();
    buildDesktopProgressBar();
    goToStep(1);
}
