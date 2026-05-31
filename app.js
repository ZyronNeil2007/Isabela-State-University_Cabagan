/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ISU PREMIUM ID GENERATOR — app.js
 *  Isabela State University · Spatial Edition 2026
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  MODULES:
 *  1.  CONFIG         — canvas coordinates & text layout
 *  2.  STATE          — reactive data store
 *  3.  CANVAS REFS    — DOM element references
 *  4.  SIGNATURE PAD  — freehand drawing on canvas
 *  5.  FORM BINDINGS  — real-time input → state → render
 *  6.  TEMPLATE LOAD  — async image loading
 *  7.  RENDER ENGINE  — front / back canvas draw calls
 *  8.  STEPPER        — step navigation, progress, dots
 *  9.  TILT EFFECT    — VanillaTilt 3D card hover
 * 10.  NAVBAR         — scroll-shrink behaviour
 * 11.  EXPORT         — A4 print PNG download
 * 12.  BOOT           — initialise everything on load
 * ═══════════════════════════════════════════════════════════════════════════
 */


/* ═══════════════════════════════════════════════════════════════════════════
   1. CONFIG — Canvas coordinate map & text style definitions
   All pixel values are relative to the native template image dimensions.
═══════════════════════════════════════════════════════════════════════════ */
const CONFIG = {
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


/* ═══════════════════════════════════════════════════════════════════════════
   2. STATE — Single reactive data store
═══════════════════════════════════════════════════════════════════════════ */
const state = {
    frontTemplate:  null,
    backTemplate:   null,
    photoImage:     null,
    signatureImage: null,
    formData: {
        name:       '',
        idNumber:   '',
        course:     '',
        dob:        '',
        parentName: '',
        address:    '',
        telephone:  ''
    }
};


/* ═══════════════════════════════════════════════════════════════════════════
   3. CANVAS REFERENCES
═══════════════════════════════════════════════════════════════════════════ */
const frontCanvas     = document.getElementById('front-canvas');
const frontCtx        = frontCanvas.getContext('2d');
const backCanvas      = document.getElementById('back-canvas');
const backCtx         = backCanvas.getContext('2d');
const miniCanvasFront = document.getElementById('mini-canvas-front');
const miniCtxFront    = miniCanvasFront ? miniCanvasFront.getContext('2d') : null;
const miniCanvasBack  = document.getElementById('mini-canvas-back');
const miniCtxBack     = miniCanvasBack  ? miniCanvasBack.getContext('2d')  : null;


/* ═══════════════════════════════════════════════════════════════════════════
   4. SIGNATURE PAD — Freehand drawing with mouse & touch support
═══════════════════════════════════════════════════════════════════════════ */
const sigCanvas = document.getElementById('signature-pad');
const sigCtx    = sigCanvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;

/** Resize the canvas to match its CSS-rendered width */
function initSignaturePad() {
    const rect = sigCanvas.parentElement.getBoundingClientRect();
    sigCanvas.width  = rect.width  || 300;
    sigCanvas.height = 140;
    sigCtx.lineWidth   = 2.5;
    sigCtx.lineCap     = 'round';
    sigCtx.lineJoin    = 'round';
    sigCtx.strokeStyle = '#111111';
}

/** Normalise pointer position for both mouse and touch events */
function getPointerPos(e) {
    const rect = sigCanvas.getBoundingClientRect();
    const source = e.touches && e.touches.length > 0 ? e.touches[0] : e;
    return {
        x: source.clientX - rect.left,
        y: source.clientY - rect.top
    };
}

function startDrawing(e) {
    isDrawing = true;
    const p = getPointerPos(e);
    lastX = p.x;
    lastY = p.y;

    // Hide the watermark as soon as drawing starts
    const watermark = sigCanvas.parentElement.querySelector('.signature-watermark');
    if (watermark) watermark.style.opacity = '0';
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const p = getPointerPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(lastX, lastY);
    sigCtx.lineTo(p.x, p.y);
    sigCtx.stroke();
    lastX = p.x;
    lastY = p.y;
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    updateSignatureImage();
}

/** Capture signature canvas as an Image object, then re-render the ID */
function updateSignatureImage() {
    const img = new Image();
    img.onload = () => {
        state.signatureImage = img;
        renderCanvases();
    };
    img.src = sigCanvas.toDataURL('image/png');
}

// Signature event listeners
sigCanvas.addEventListener('mousedown',  startDrawing);
sigCanvas.addEventListener('mousemove',  draw);
sigCanvas.addEventListener('mouseup',    stopDrawing);
sigCanvas.addEventListener('mouseout',   stopDrawing);
sigCanvas.addEventListener('touchstart', startDrawing, { passive: false });
sigCanvas.addEventListener('touchmove',  draw,         { passive: false });
sigCanvas.addEventListener('touchend',   stopDrawing);

// Clear button
document.getElementById('clear-signature').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    state.signatureImage = null;
    // Restore watermark
    const watermark = sigCanvas.parentElement.querySelector('.signature-watermark');
    if (watermark) watermark.style.opacity = '1';
    renderCanvases();
});

// Re-init on resize
window.addEventListener('resize', initSignaturePad);
initSignaturePad();


/* ═══════════════════════════════════════════════════════════════════════════
   5. FORM BINDINGS — Map every input to state, then re-render
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Convert kebab-case input IDs to the camelCase state keys.
 * E.g. "full-name" → "name", "id-number" → "idNumber"
 */
const INPUT_KEY_MAP = {
    'full-name':   'name',
    'id-number':   'idNumber',
    'course':      'course',
    'dob':         'dob',
    'parent-name': 'parentName',
    'address':     'address',
    'telephone':   'telephone'
};

const UPPERCASE_FIELDS = new Set(['full-name', 'id-number', 'course', 'parent-name', 'address', 'telephone']);

Object.entries(INPUT_KEY_MAP).forEach(([id, stateKey]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => {
        const raw = e.target.value;
        state.formData[stateKey] = UPPERCASE_FIELDS.has(id) ? raw.toUpperCase() : raw;
        renderCanvases();
    });
});

// Profile picture — file upload handler
document.getElementById('profile-pic').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => {
            state.photoImage = img;
            renderCanvases();

            // Update the thumbnail inside the upload area
            const thumb       = document.getElementById('photo-preview-thumb');
            const placeholder = document.getElementById('photo-placeholder');
            if (thumb) {
                thumb.src = event.target.result;
                thumb.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});


/* ═══════════════════════════════════════════════════════════════════════════
   6. TEMPLATE LOADING — Async load both ID face templates
═══════════════════════════════════════════════════════════════════════════ */
function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => { console.warn(`[ISU ID] Template not found: ${src}`); resolve(null); };
        img.src = src;
    });
}

async function loadTemplates() {
    const [front, back] = await Promise.all([
        loadImage('images/template_front.id.png'),
        loadImage('images/template_back.id.png')
    ]);

    state.frontTemplate = front;
    state.backTemplate  = back;

    // Set canvas intrinsic sizes from the loaded images
    frontCanvas.width  = front ? front.width  : 638;
    frontCanvas.height = front ? front.height : 1013;
    backCanvas.width   = back  ? back.width   : 638;
    backCanvas.height  = back  ? back.height  : 1013;

    if (miniCanvasFront) {
        miniCanvasFront.width  = frontCanvas.width;
        miniCanvasFront.height = frontCanvas.height;
    }
    if (miniCanvasBack) {
        miniCanvasBack.width  = backCanvas.width;
        miniCanvasBack.height = backCanvas.height;
    }

    renderCanvases();
}


/* ═══════════════════════════════════════════════════════════════════════════
   7. RENDER ENGINE — Draw ID card faces onto their canvases
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Draw a single text field onto a canvas context.
 * Handles multi-line text split by '\n', font scaling, and optional stroke.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} textConfig - from CONFIG.text
 * @param {string} textValue  - string to draw (may contain '\n')
 */
function renderText(ctx, textConfig, textValue) {
    if (!textValue) return;

    const m = CONFIG.scaleMultiplier;
    let fontString = textConfig.font;
    let fontSize = 10;

    // Scale the px font size by the multiplier
    const sizeMatch = fontString.match(/([\d.]+)px/);
    if (sizeMatch && m !== 1.0) {
        const scaled = parseFloat(sizeMatch[1]) * m;
        fontSize     = scaled;
        fontString   = fontString.replace(/[\d.]+px/, `${scaled}px`);
    }

    ctx.font        = (textConfig.isBold ? 'bold ' : '') + fontString;
    ctx.textAlign   = textConfig.align;
    ctx.textBaseline = 'middle';

    const lines      = textValue.split('\n');
    const lineHeight = fontSize * 1.15;
    const startY     = textConfig.y - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
        const y = startY + i * lineHeight;

        // Optional stroke (for heavier text on busy backgrounds)
        if (textConfig.strokeThickness > 0) {
            ctx.lineWidth   = (textConfig.strokeThickness / 10) * m;
            ctx.strokeStyle = textConfig.strokeStyle;
            ctx.lineJoin    = 'round';
            ctx.miterLimit  = 2;
            textConfig.maxWidth
                ? ctx.strokeText(line, textConfig.x, y, textConfig.maxWidth)
                : ctx.strokeText(line, textConfig.x, y);
        }

        ctx.fillStyle = textConfig.fillStyle;
        textConfig.maxWidth
            ? ctx.fillText(line, textConfig.x, y, textConfig.maxWidth)
            : ctx.fillText(line, textConfig.x, y);
    });
}

/**
 * Smart-wrap long course names: split after degree prefix if possible.
 * E.g. "BS COMPUTER SCIENCE" → "BACHELOR OF SCIENCE\nIN COMPUTER SCIENCE"
 *
 * @param {string} course
 * @returns {string}
 */
function formatCourseText(course) {
    if (!course) return '';
    const upper = course.toUpperCase().trim();

    if (upper.startsWith('BACHELOR OF SCIENCE IN '))
        return 'BACHELOR OF SCIENCE\nIN ' + course.substring(23).trim().toUpperCase();

    if (upper.startsWith('BACHELOR OF SCIENCE '))
        return 'BACHELOR OF SCIENCE\n' + course.substring(20).trim().toUpperCase();

    if (upper.includes(' IN ')) {
        const idx = upper.indexOf(' IN ');
        return course.substring(0, idx).trim().toUpperCase()
             + '\nIN ' + course.substring(idx + 4).trim().toUpperCase();
    }

    return upper;
}

/**
 * Main render function — draws both card faces and the mini preview.
 * Called every time state changes (input, photo upload, signature).
 */
function renderCanvases() {
    // ── Front Face ──────────────────────────────────────────
    frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);

    if (state.frontTemplate) {
        frontCtx.drawImage(state.frontTemplate, 0, 0, frontCanvas.width, frontCanvas.height);
    } else {
        frontCtx.fillStyle = '#d4e8d4';
        frontCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);
    }

    // Photo: cover-fit into the defined box
    if (state.photoImage) {
        const { x, y, width, height } = CONFIG.photo;
        frontCtx.save();
        frontCtx.beginPath();
        frontCtx.rect(x, y, width, height);
        frontCtx.clip();

        const imgRatio = state.photoImage.width / state.photoImage.height;
        const boxRatio = width / height;
        let dw = width, dh = height, dx = x, dy = y;

        if (imgRatio > boxRatio) {
            dw = height * imgRatio;
            dx = x - (dw - width) / 2;
        } else {
            dh = width / imgRatio;
            dy = y - (dh - height) / 2;
        }

        frontCtx.drawImage(state.photoImage, dx, dy, dw, dh);
        frontCtx.restore();
    }

    // Signature
    if (state.signatureImage) {
        const { x, y, width, height } = CONFIG.signature;
        frontCtx.drawImage(state.signatureImage, x, y, width, height);
    }

    // Text fields on front face
    renderText(frontCtx, CONFIG.text.name,
        state.formData.name || 'JUAN DELA CRUZ');
    renderText(frontCtx, CONFIG.text.idNumber,
        state.formData.idNumber || '25-00001');
    renderText(frontCtx, CONFIG.text.course,
        formatCourseText(state.formData.course || 'Bachelor of Science in Computer Science'));

    // ── Back Face ───────────────────────────────────────────
    backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);

    if (state.backTemplate) {
        backCtx.drawImage(state.backTemplate, 0, 0, backCanvas.width, backCanvas.height);
    } else {
        backCtx.fillStyle = '#ffffff';
        backCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
    }

    // White rectangle to clear the info area before writing text
    backCtx.fillStyle = '#ffffff';
    backCtx.fillRect(60, 170, 500, 120);

    // Text fields on back face
    renderText(backCtx, CONFIG.text.parentName,
        state.formData.parentName || 'JANE DELA CRUZ');
    renderText(backCtx, CONFIG.text.address,
        'Address: ' + (state.formData.address || '123 MAIN ST, CAUAYAN CITY, ISABELA'));
    renderText(backCtx, CONFIG.text.telephone,
        'Telephone No.: ' + (state.formData.telephone || '+63 912 345 6789'));
    renderText(backCtx, CONFIG.text.dob,
        'Birth Date: ' + (
            state.formData.dob
                ? state.formData.dob.split('-').reverse().join('-')
                : '01-01-2000'
        ));

    // ── Mini preview (mobile stepper header) ────────────────
    updateMiniCanvas();
}

/** Copy the main canvases into the small mini-preview thumbnails */
function updateMiniCanvas() {
    if (miniCanvasFront && miniCtxFront) {
        miniCtxFront.clearRect(0, 0, miniCanvasFront.width, miniCanvasFront.height);
        miniCtxFront.drawImage(frontCanvas, 0, 0, miniCanvasFront.width, miniCanvasFront.height);
    }
    if (miniCanvasBack && miniCtxBack) {
        miniCtxBack.clearRect(0, 0, miniCanvasBack.width, miniCanvasBack.height);
        miniCtxBack.drawImage(backCanvas, 0, 0, miniCanvasBack.width, miniCanvasBack.height);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   8. STEPPER — Step navigation, progress bar & dot indicator
═══════════════════════════════════════════════════════════════════════════ */
const TOTAL_STEPS = 9;
const STEP_TITLES = [
    'Upload Photo',       // 1
    'Full Name',          // 2
    'ID Number',          // 3
    'Degree Program',     // 4
    'Date of Birth',      // 5
    'Parent / Guardian',  // 6
    'Home Address',       // 7
    'Telephone',          // 8
    'Signature'           // 9
];

let currentStep = 1;

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
function goToStep(n) {
    if (n < 1 || n > TOTAL_STEPS) return;
    currentStep = n;

    // ── Show/hide form groups ──
    document.querySelectorAll('.steps-wrapper .form-group').forEach(el => {
        const step = parseInt(el.dataset.step);
        if (step === currentStep) {
            el.classList.add('active-step');
            // Auto-focus the first interactive field (not file inputs)
            const firstInput = el.querySelector('input:not([type="file"]), textarea');
            if (firstInput) setTimeout(() => firstInput.focus({ preventScroll: true }), 380);
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
    // Steps 1-4 = front face, steps 5-9 = back face
    const idCard    = document.getElementById('idCard');
    const flipTitle = document.getElementById('flip-title');
    const miniCard  = document.getElementById('mini-card');
    const shouldFlip = currentStep >= 5;

    if (idCard) {
        const isCurrentlyFlipped = idCard.classList.contains('is-flipped');
        if (shouldFlip && !isCurrentlyFlipped) {
            idCard.classList.add('is-flipped');
            if (flipTitle) flipTitle.textContent = 'Back Side';
        } else if (!shouldFlip && isCurrentlyFlipped) {
            idCard.classList.remove('is-flipped');
            if (flipTitle) flipTitle.textContent = 'Front Side';
        }
    }

    if (miniCard) {
        miniCard.classList.toggle('is-flipped', shouldFlip);
    }
}

/* ── Button handlers (called from HTML onclick) ─────────── */
/** Navigate to the next step */
function stepperNext() {
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
}

/** Navigate to the previous step */
function stepperBack() {
    if (currentStep > 1) goToStep(currentStep - 1);
}

/** Flip the main ID card and update the preview title */
function flipCard() {
    const idCard    = document.getElementById('idCard');
    const flipTitle = document.getElementById('flip-title');
    if (!idCard) return;
    idCard.classList.toggle('is-flipped');
    if (flipTitle) {
        flipTitle.textContent = idCard.classList.contains('is-flipped')
            ? 'Back Side'
            : 'Front Side';
    }
}

/* ── Resize: re-apply stepper at current step ────────────── */
function handleResize() {
    if (isStepperMode()) goToStep(currentStep);
}

window.addEventListener('resize', handleResize);

/* ── Boot stepper ───────────────────────────────────────── */
function initStepper() {
    buildStepperDots();
    buildDesktopProgressBar();
    goToStep(1);
}


/* ═══════════════════════════════════════════════════════════════════════════
   9. TILT EFFECT — VanillaTilt 3D card hover (loaded via CDN, deferred)
═══════════════════════════════════════════════════════════════════════════ */
function initTilt() {
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


/* ═══════════════════════════════════════════════════════════════════════════
   10. NAVBAR — Scroll-shrink effect
═══════════════════════════════════════════════════════════════════════════ */
function initNavbar() {
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


/* ═══════════════════════════════════════════════════════════════════════════
   11. EXPORT — Generate A4 print-ready PNG and trigger download
═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('download-btn').addEventListener('click', async () => {
    const btn = document.getElementById('download-btn');

    // ── Loading state feedback ──
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-circle-notch"></i> Generating…';
    btn.classList.add('loading');

    // Yield to browser to paint the loading state before heavy canvas work
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));

    try {
        const exportCanvas  = document.getElementById('export-canvas');
        exportCanvas.width  = 2480;   // A4 at 300 dpi
        exportCanvas.height = 3508;
        const ctx = exportCanvas.getContext('2d');

        // White page background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Card dimensions and layout on A4
        const printWidth  = 638;
        const printHeight = 1011;
        const xPos        = (exportCanvas.width  - printWidth) / 2;
        const yPosFront   = 380;
        const yPosBack    = yPosFront + printHeight + 220;

        // Draw both card faces
        ctx.drawImage(frontCanvas, xPos, yPosFront, printWidth, printHeight);
        ctx.drawImage(backCanvas,  xPos, yPosBack,  printWidth, printHeight);

        // Dashed cut guides around each card
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth   = 3;
        ctx.setLineDash([14, 14]);
        const p = 4;
        ctx.strokeRect(xPos - p, yPosFront - p, printWidth + p * 2, printHeight + p * 2);
        ctx.strokeRect(xPos - p, yPosBack  - p, printWidth + p * 2, printHeight + p * 2);

        // Reset dash
        ctx.setLineDash([]);

        // "Cut here" label
        ctx.font      = '28px Inter, sans-serif';
        ctx.fillStyle = '#cccccc';
        ctx.textAlign = 'center';
        ctx.fillText('✂ Cut here', exportCanvas.width / 2, yPosFront - p - 20);
        ctx.fillText('✂ Cut here', exportCanvas.width / 2, yPosBack  - p - 20);

        // Trigger download
        const link    = document.createElement('a');
        link.download = `ISU_ID_${(state.formData.name || 'Student').replace(/\s+/g, '_')}_Print_Ready.png`;
        link.href     = exportCanvas.toDataURL('image/png');
        link.click();

    } catch (err) {
        console.error('[ISU ID] Export failed:', err);
        alert('Export failed. Please try again.');
    } finally {
        // Restore button state
        btn.innerHTML = originalHTML;
        btn.classList.remove('loading');
    }
});


/* ═══════════════════════════════════════════════════════════════════════════
   12. BOOT — Initialise all modules when DOM + assets are ready
═══════════════════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
    // Load ID card templates & render
    loadTemplates();

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
