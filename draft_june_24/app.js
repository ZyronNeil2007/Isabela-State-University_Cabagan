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
    activeStudentIndex: 0,
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
                dob:        '',
                parentName: '',
                address:    '',
                telephone:  ''
            }
        }
    ]
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

function updateSignatureImage() {
    const img = new Image();
    const dataUrl = sigCanvas.toDataURL('image/png');
    img.onload = () => {
        state.students[state.activeStudentIndex].signatureImage = img;
        state.students[state.activeStudentIndex].signatureDataUrl = dataUrl;
        renderCanvases();
    };
    img.src = dataUrl;
}

// Signature event listeners
sigCanvas.addEventListener('mousedown',  startDrawing);
sigCanvas.addEventListener('mousemove',  draw);
sigCanvas.addEventListener('mouseup',    stopDrawing);
sigCanvas.addEventListener('mouseout',   stopDrawing);
sigCanvas.addEventListener('touchstart', startDrawing, { passive: false });
sigCanvas.addEventListener('touchmove',  draw,         { passive: false });
sigCanvas.addEventListener('touchend',   stopDrawing);

document.getElementById('clear-signature').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    state.students[state.activeStudentIndex].signatureImage = null;
    state.students[state.activeStudentIndex].signatureDataUrl = null;
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
        state.students[state.activeStudentIndex].formData[stateKey] = UPPERCASE_FIELDS.has(id) ? raw.toUpperCase() : raw;
        renderCanvases();
        
        // Also update tab name if editing full name
        if (stateKey === 'name') {
            renderStudentTabs();
        }
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
            state.students[state.activeStudentIndex].rawSourceImage = img;
            openCropper();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset to allow same file re-upload
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
    const student = state.students[state.activeStudentIndex];

    // ── Front Face ──────────────────────────────────────────
    frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);

    if (state.frontTemplate) {
        frontCtx.drawImage(state.frontTemplate, 0, 0, frontCanvas.width, frontCanvas.height);
    } else {
        frontCtx.fillStyle = '#d4e8d4';
        frontCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);
    }

    // Photo: cover-fit into the defined box
    if (student.photoImage) {
        const { x, y, width, height } = CONFIG.photo;
        frontCtx.save();
        frontCtx.beginPath();
        frontCtx.rect(x, y, width, height);
        frontCtx.clip();

        const imgRatio = student.photoImage.width / student.photoImage.height;
        const boxRatio = width / height;
        let dw = width, dh = height, dx = x, dy = y;

        if (imgRatio > boxRatio) {
            dw = height * imgRatio;
            dx = x - (dw - width) / 2;
        } else {
            dh = width / imgRatio;
            dy = y - (dh - height) / 2;
        }

        frontCtx.drawImage(student.photoImage, dx, dy, dw, dh);
        frontCtx.restore();
    }

    // Signature
    if (student.signatureImage) {
        const { x, y, width, height } = CONFIG.signature;
        frontCtx.drawImage(student.signatureImage, x, y, width, height);
    }

    // Text fields on front face
    renderText(frontCtx, CONFIG.text.name,
        student.formData.name || 'JUAN DELA CRUZ');
    renderText(frontCtx, CONFIG.text.idNumber,
        student.formData.idNumber || '25-00001');
    renderText(frontCtx, CONFIG.text.course,
        formatCourseText(student.formData.course || 'Bachelor of Science in Computer Science'));

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
        student.formData.parentName || 'JANE DELA CRUZ');
    renderText(backCtx, CONFIG.text.address,
        'Address: ' + (student.formData.address || '123 MAIN ST, CAUAYAN CITY, ISABELA'));
    renderText(backCtx, CONFIG.text.telephone,
        'Telephone No.: ' + (student.formData.telephone || '+63 912 345 6789'));
    renderText(backCtx, CONFIG.text.dob,
        'Birth Date: ' + (
            student.formData.dob
                ? student.formData.dob.split('-').reverse().join('-')
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
    btn.innerHTML = '<i class="ph ph-circle-notch"></i> Generating PDF…';
    btn.classList.add('loading');

    // Yield to browser to paint the loading state before heavy work
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));

    try {
        const { jsPDF } = window.jspdf;
        // Create an A4 portrait PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const studentCount = state.students.length;
        const cardW = 54;      // CR80 standard width (mm)
        const cardH = 85.6;    // CR80 standard height (mm)
        const gapX = 10;
        const gapY = 8;
        const startX = (210 - (cardW * 2 + gapX)) / 2; // Centered
        const startY = 20;

        const originalIndex = state.activeStudentIndex;

        for (let i = 0; i < studentCount; i++) {
            if (i > 0 && i % 3 === 0) {
                pdf.addPage();
            }
            
            const rowIndex = i % 3;
            const y = startY + rowIndex * (cardH + gapY);

            // Print header on each page
            if (rowIndex === 0) {
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                const dateStr = new Date().toLocaleDateString();
                pdf.text(`ISU Student IDs — Page ${Math.floor(i / 3) + 1} — ${dateStr}`, 105, 12, { align: 'center' });
            }

            state.activeStudentIndex = i;
            renderCanvases(); // render i-th student
            
            const frontX = startX;
            const backX = startX + cardW + gapX;
            
            pdf.addImage(frontCanvas.toDataURL('image/png', 1.0), 'PNG', frontX, y, cardW, cardH);
            pdf.addImage(backCanvas.toDataURL('image/png', 1.0), 'PNG', backX, y, cardW, cardH);
            
            // Draw cut lines
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.setLineDashPattern([2, 2], 0);
            const p = 2; // padding around card
            pdf.rect(frontX - p, y - p, cardW + p * 2, cardH + p * 2);
            pdf.rect(backX - p, y - p, cardW + p * 2, cardH + p * 2);
            
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('✂ Cut here', frontX + cardW/2, y - p - 2, { align: 'center' });
            pdf.text('✂ Cut here', backX + cardW/2, y - p - 2, { align: 'center' });
        }

        // Restore active state
        state.activeStudentIndex = originalIndex;
        renderCanvases();

        const filename = studentCount === 1 ? `ISU_ID_${(state.students[0].formData.name || 'Student').replace(/\s+/g, '_')}_Print_Ready.pdf` : `ISU_ID_Batch_${studentCount}_Students.pdf`;
        pdf.save(filename);

    } catch (err) {
        console.error('[ISU ID] PDF Export failed:', err);
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

/* ═══════════════════════════════════════════════════════════════════════════
   13. STUDENT TABS LOGIC (Batch Print Feature)
═══════════════════════════════════════════════════════════════════════════ */
const MAX_STUDENTS = 5;

function renderStudentTabs() {
    const container = document.getElementById('student-tabs');
    if (!container) return;
    container.innerHTML = '';
    
    state.students.forEach((student, index) => {
        const tab = document.createElement('div');
        tab.className = 'student-tab' + (index === state.activeStudentIndex ? ' active' : '');
        tab.onclick = (e) => {
            if (!e.target.closest('.btn-remove-student')) {
                switchStudent(index);
            }
        };
        
        let thumbContent = '';
        if (student.photoDataUrl) {
            thumbContent = `<img src="${student.photoDataUrl}" class="student-tab-thumb" alt="thumb">`;
        } else {
            thumbContent = `<div class="student-tab-thumb" style="display:flex;align-items:center;justify-content:center;font-size:10px;"><i class="ph ph-user"></i></div>`;
        }
        
        let name = student.formData.name || `Student ${index + 1}`;
        if (name.length > 12) name = name.substring(0, 10) + '...';
        
        let removeBtn = '';
        if (state.students.length > 1) {
            removeBtn = `<button class="btn-remove-student" onclick="removeStudent(${index})"><i class="ph ph-x"></i></button>`;
        }
        
        tab.innerHTML = `${thumbContent} <span>${name}</span> ${removeBtn}`;
        container.appendChild(tab);
    });
    
    const addBtn = document.getElementById('add-student-btn');
    if (addBtn) {
        addBtn.style.display = state.students.length < MAX_STUDENTS ? 'inline-flex' : 'none';
    }
}

function switchStudent(index) {
    state.activeStudentIndex = index;
    const student = state.students[index];
    
    // Populate form inputs
    Object.entries(INPUT_KEY_MAP).forEach(([id, stateKey]) => {
        const el = document.getElementById(id);
        if (el) el.value = student.formData[stateKey] || '';
    });
    
    // Update photo preview
    const thumb = document.getElementById('photo-preview-thumb');
    const placeholder = document.getElementById('photo-placeholder');
    const wrapper = document.getElementById('photo-preview-wrapper');
    if (student.photoDataUrl) {
        thumb.src = student.photoDataUrl;
        if(wrapper) wrapper.style.display = 'inline-block';
        if(placeholder) placeholder.style.display = 'none';
    } else {
        if(wrapper) wrapper.style.display = 'none';
        if(placeholder) placeholder.style.display = 'flex';
    }
    
    // Update signature pad
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    const watermark = sigCanvas.parentElement.querySelector('.signature-watermark');
    if (student.signatureImage) {
        if (watermark) watermark.style.opacity = '0';
        sigCtx.drawImage(student.signatureImage, 0, 0, sigCanvas.width, sigCanvas.height);
    } else {
        if (watermark) watermark.style.opacity = '1';
    }
    
    renderStudentTabs();
    renderCanvases();
}

function addStudent() {
    if (state.students.length >= MAX_STUDENTS) return;
    
    state.students.push({
        photoImage: null,
        photoDataUrl: null,
        rawSourceImage: null,
        signatureImage: null,
        signatureDataUrl: null,
        formData: { name: '', idNumber: '', course: '', dob: '', parentName: '', address: '', telephone: '' }
    });
    
    switchStudent(state.students.length - 1);
}

function removeStudent(index) {
    if (state.students.length <= 1) return;
    state.students.splice(index, 1);
    if (state.activeStudentIndex >= state.students.length) {
        switchStudent(state.students.length - 1);
    } else {
        switchStudent(state.activeStudentIndex); // Re-render current
    }
}

document.getElementById('add-student-btn')?.addEventListener('click', addStudent);

// Call initially
setTimeout(renderStudentTabs, 100);


/* ═══════════════════════════════════════════════════════════════════════════
   14. INTERACTIVE PHOTO CROPPER LOGIC
═══════════════════════════════════════════════════════════════════════════ */
let cropZoom = 1;
let baseScale = 1;
let isDraggingCrop = false;
let startDragX = 0, startDragY = 0;
let imgOffsetX = 0, imgOffsetY = 0;

function openCropper() {
    const student = state.students[state.activeStudentIndex];
    if (!student.rawSourceImage) return;
    
    document.getElementById('cropper-modal').classList.add('active');
    const imgEl = document.getElementById('cropper-img');
    imgEl.src = student.rawSourceImage.src;
    
    // Calculate base scale so the image covers the frame initially
    const frame = document.querySelector('.cropper-frame');
    if (frame && student.rawSourceImage.width) {
        const frameRect = frame.getBoundingClientRect();
        const scaleX = frameRect.width / student.rawSourceImage.width;
        const scaleY = frameRect.height / student.rawSourceImage.height;
        baseScale = Math.max(scaleX, scaleY);
    } else {
        baseScale = 1;
    }
    
    cropZoom = 1;
    document.getElementById('cropper-zoom').value = 1;
    imgOffsetX = 0;
    imgOffsetY = 0;
    updateCropperTransform();
}

function closeCropper() {
    document.getElementById('cropper-modal').classList.remove('active');
}

function updateCropperTransform() {
    const imgEl = document.getElementById('cropper-img');
    if (imgEl) imgEl.style.transform = `translate(${imgOffsetX}px, ${imgOffsetY}px) scale(${baseScale * cropZoom})`;
}

document.getElementById('cropper-zoom')?.addEventListener('input', e => {
    cropZoom = parseFloat(e.target.value);
    updateCropperTransform();
});

const viewport = document.getElementById('cropper-viewport');
if (viewport) {
    viewport.addEventListener('mousedown', startCropDrag);
    viewport.addEventListener('mousemove', doCropDrag);
    window.addEventListener('mouseup', endCropDrag);
    viewport.addEventListener('touchstart', startCropDrag, {passive:false});
    viewport.addEventListener('touchmove', doCropDrag, {passive:false});
    window.addEventListener('touchend', endCropDrag);
}

function getEventPos(e) {
    return e.touches && e.touches.length > 0 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
}

function startCropDrag(e) {
    isDraggingCrop = true;
    const p = getEventPos(e);
    startDragX = p.x - imgOffsetX;
    startDragY = p.y - imgOffsetY;
    if(e.cancelable) e.preventDefault();
}

function doCropDrag(e) {
    if (!isDraggingCrop) return;
    const p = getEventPos(e);
    imgOffsetX = p.x - startDragX;
    imgOffsetY = p.y - startDragY;
    updateCropperTransform();
    if(e.cancelable) e.preventDefault();
}

function endCropDrag() {
    isDraggingCrop = false;
}

document.getElementById('cropper-cancel-btn')?.addEventListener('click', closeCropper);
document.getElementById('cropper-cancel')?.addEventListener('click', closeCropper);

document.getElementById('cropper-save-btn')?.addEventListener('click', () => {
    const frame = document.querySelector('.cropper-frame');
    if (!frame) return;
    const frameRect = frame.getBoundingClientRect();
    const vpRect = viewport.getBoundingClientRect();
    
    // Frame center relative to viewport center
    const frameCx = frameRect.left + frameRect.width/2 - (vpRect.left + vpRect.width/2);
    const frameCy = frameRect.top + frameRect.height/2 - (vpRect.top + vpRect.height/2);
    
    const cropCnv = document.getElementById('crop-canvas');
    cropCnv.width = 315;
    cropCnv.height = 355;
    const ctx = cropCnv.getContext('2d');
    
    const domToNativeX = 315 / frameRect.width;
    const domToNativeY = 355 / frameRect.height;
    
    const student = state.students[state.activeStudentIndex];
    const rawImage = student.rawSourceImage;
    if (!rawImage) return;

    ctx.save();
    ctx.translate(315/2, 355/2); 
    ctx.translate(imgOffsetX * domToNativeX - frameCx * domToNativeX, imgOffsetY * domToNativeY - frameCy * domToNativeY);
    ctx.scale(baseScale * cropZoom * domToNativeX, baseScale * cropZoom * domToNativeY);
    ctx.drawImage(rawImage, -rawImage.width/2, -rawImage.height/2);
    ctx.restore();
    
    const dataUrl = cropCnv.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
        student.photoImage = img;
        student.photoDataUrl = dataUrl;
        
        const thumb = document.getElementById('photo-preview-thumb');
        const wrapper = document.getElementById('photo-preview-wrapper');
        const placeholder = document.getElementById('photo-placeholder');
        if (thumb) thumb.src = dataUrl;
        if (wrapper) wrapper.style.display = 'inline-block';
        if (placeholder) placeholder.style.display = 'none';
        
        renderCanvases();
        renderStudentTabs();
        closeCropper();
    };
    img.src = dataUrl;
});

document.getElementById('recrop-btn')?.addEventListener('click', () => {
    openCropper();
});

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

function showMobileExportMenu() {
    document.getElementById('mobile-export-sheet')?.classList.add('show');
}
function hideMobileExportMenu() {
    document.getElementById('mobile-export-sheet')?.classList.remove('show');
}

function saveAsImage(side) {
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


/* ═══════════════════════════════════════════════════════════════════════════
   16. AI SIGNATURE — Photo upload → Claude Vision → BG removal → ID
═══════════════════════════════════════════════════════════════════════════ */

/** Currently loaded raw signature photo (before AI processing) */
let sigRawPhotoDataUrl = null;

/**
 * Switch between "Draw" and "AI from Photo" signature modes.
 * @param {'draw'|'upload'} mode
 */
function switchSigMode(mode) {
    const drawMode   = document.getElementById('sig-draw-mode');
    const uploadMode = document.getElementById('sig-upload-mode');
    const tabDraw    = document.getElementById('sig-tab-draw');
    const tabUpload  = document.getElementById('sig-tab-upload');

    if (mode === 'draw') {
        drawMode.style.display   = '';
        uploadMode.style.display = 'none';
        tabDraw.classList.add('active');
        tabUpload.classList.remove('active');
    } else {
        drawMode.style.display   = 'none';
        uploadMode.style.display = '';
        tabDraw.classList.remove('active');
        tabUpload.classList.add('active');
    }
}

/** Handle file selection from the signature photo input */
document.getElementById('sig-photo-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        sigRawPhotoDataUrl = ev.target.result;

        // Show preview image
        const preview     = document.getElementById('sig-upload-preview');
        const placeholder = document.getElementById('sig-upload-placeholder');
        const enhanceBtn  = document.getElementById('sig-enhance-btn');
        const clearBtn    = document.getElementById('sig-upload-clear');
        const resultPane  = document.getElementById('sig-result-preview');
        const statusPane  = document.getElementById('sig-ai-status');

        preview.src             = sigRawPhotoDataUrl;
        preview.style.display   = 'block';
        placeholder.style.display = 'none';
        enhanceBtn.style.display  = 'inline-flex';
        clearBtn.style.display    = 'inline-flex';
        resultPane.style.display  = 'none';
        statusPane.style.display  = 'none';
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // allow re-upload of same file
});

/** Allow clicking the upload area (but not the buttons/preview inside it) */
document.getElementById('sig-upload-area')?.addEventListener('click', e => {
    if (e.target.id === 'sig-upload-area' || e.target.closest('.sig-upload-placeholder')) {
        document.getElementById('sig-photo-input').click();
    }
});

/** Clear uploaded signature photo and reset UI */
function clearUploadedSig() {
    sigRawPhotoDataUrl = null;

    const preview     = document.getElementById('sig-upload-preview');
    const placeholder = document.getElementById('sig-upload-placeholder');
    const enhanceBtn  = document.getElementById('sig-enhance-btn');
    const clearBtn    = document.getElementById('sig-upload-clear');
    const resultPane  = document.getElementById('sig-result-preview');
    const statusPane  = document.getElementById('sig-ai-status');

    preview.style.display     = 'none';
    placeholder.style.display = 'flex';
    enhanceBtn.style.display  = 'none';
    clearBtn.style.display    = 'none';
    resultPane.style.display  = 'none';
    statusPane.style.display  = 'none';

    // Clear from student state too
    const student = state.students[state.activeStudentIndex];
    student.signatureImage    = null;
    student.signatureDataUrl  = null;
    renderCanvases();
}

/**
 * Extract the base64 data (without the "data:image/...;base64," prefix)
 * and the media type from a data URL.
 */
function parseDataUrl(dataUrl) {
    const [header, data] = dataUrl.split(',');
    const mediaType = header.match(/data:([^;]+)/)[1];
    return { data, mediaType };
}

/**
 * Set the AI processing status message shown below the photo.
 * @param {string} msg  - Status text
 * @param {boolean} show - Whether to show the status bar
 */
function setAiStatus(msg, show = true) {
    const bar  = document.getElementById('sig-ai-status');
    const text = document.getElementById('sig-ai-status-text');
    if (bar)  bar.style.display  = show ? 'flex' : 'none';
    if (text) text.textContent   = msg;
}

/**
 * Remove the near-white background from a canvas in place.
 * Works by setting pixels whose lightness is above a threshold to transparent.
 *
 * Strategy:
 *  1. Convert each pixel to its luminance.
 *  2. Pixels brighter than the threshold → alpha = 0 (transparent).
 *  3. Dark pixels (ink) → kept; alpha boosted toward 255 for crispness.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} threshold  - Luminance cutoff 0-255 (default 210)
 */
function removeWhiteBackground(canvas, threshold = 210) {
    const ctx      = canvas.getContext('2d');
    const imgData  = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d        = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // Perceived luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum > threshold) {
            // Near-white → fully transparent
            d[i + 3] = 0;
        } else {
            // Ink pixel — boost opacity proportionally to how dark it is
            const inkStrength = 1 - lum / threshold;
            d[i + 3] = Math.min(255, Math.round(inkStrength * 320));
            // Tint ink toward pure black for a clean look on the ID card
            const mix = 0.35;
            d[i]     = Math.round(r * (1 - mix));
            d[i + 1] = Math.round(g * (1 - mix));
            d[i + 2] = Math.round(b * (1 - mix));
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

/**
 * Main AI enhancement pipeline:
 *  1. Send the photo to Claude Vision with a prompt to describe the clean signature region.
 *  2. Use the AI's bounding-box guidance to crop tightly (if provided).
 *  3. Run our canvas-based white-background remover.
 *  4. Persist the result to the student state and render on the ID.
 */
async function enhanceSignatureWithAI() {
    if (!sigRawPhotoDataUrl) return;

    const enhanceBtn = document.getElementById('sig-enhance-btn');
    const clearBtn   = document.getElementById('sig-upload-clear');
    const resultPane = document.getElementById('sig-result-preview');

    enhanceBtn.disabled = true;
    clearBtn.disabled   = true;
    resultPane.style.display = 'none';
    setAiStatus('Sending photo to Claude AI…', true);

    try {
        /* ── Step 1: Ask Claude to analyse the signature photo ── */
        const { data: imgData, mediaType } = parseDataUrl(sigRawPhotoDataUrl);

        setAiStatus('AI is analysing your signature…', true);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model:      'claude-sonnet-4-6',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type:   'image',
                            source: { type: 'base64', media_type: mediaType, data: imgData }
                        },
                        {
                            type: 'text',
                            text: `You are a signature extraction assistant. Analyze this photo of a handwritten signature on white/light paper.

Return ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "hasSignature": true/false,
  "quality": "good" | "fair" | "poor",
  "cropHint": {
    "xPct": 0-100,
    "yPct": 0-100,
    "wPct": 0-100,
    "hPct": 0-100
  },
  "brightnessAdjust": -50 to 50,
  "contrastBoost": 0 to 100,
  "suggestedThreshold": 180 to 240,
  "notes": "brief note"
}

cropHint is the bounding box of the signature as percentages of the full image.
suggestedThreshold is the luminance cutoff (0-255) to separate ink from background.
If hasSignature is false, still return valid JSON with other fields set to defaults.`
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API error ${response.status}: ${await response.text()}`);
        }

        const apiResult = await response.json();
        let aiGuide = null;

        // Parse AI JSON response
        try {
            const rawText = apiResult.content
                .filter(b => b.type === 'text')
                .map(b => b.text)
                .join('');
            const jsonStr = rawText.replace(/```json|```/g, '').trim();
            aiGuide = JSON.parse(jsonStr);
        } catch (_) {
            // If parsing fails, use safe defaults
            aiGuide = {
                hasSignature:        true,
                cropHint:            { xPct: 5, yPct: 10, wPct: 90, hPct: 80 },
                brightnessAdjust:    0,
                contrastBoost:       20,
                suggestedThreshold:  215
            };
        }

        if (!aiGuide.hasSignature) {
            setAiStatus('No signature detected. Please upload a clearer photo.', true);
            enhanceBtn.disabled = false;
            clearBtn.disabled   = false;
            return;
        }

        setAiStatus('Processing and removing background…', true);

        /* ── Step 2: Load the source image onto a canvas ── */
        const sourceImg = await new Promise((res, rej) => {
            const img = new Image();
            img.onload  = () => res(img);
            img.onerror = () => rej(new Error('Failed to load image'));
            img.src = sigRawPhotoDataUrl;
        });

        // Apply AI crop hint
        const ch  = aiGuide.cropHint || { xPct: 5, yPct: 5, wPct: 90, hPct: 90 };
        const srcX = Math.round((ch.xPct / 100) * sourceImg.width);
        const srcY = Math.round((ch.yPct / 100) * sourceImg.height);
        const srcW = Math.round((ch.wPct / 100) * sourceImg.width);
        const srcH = Math.round((ch.hPct / 100) * sourceImg.height);

        // Work at a safe resolution (2× the ID card signature slot)
        const OUT_W = 638;
        const OUT_H = 240;

        const workCanvas = document.createElement('canvas');
        workCanvas.width  = OUT_W;
        workCanvas.height = OUT_H;
        const wCtx = workCanvas.getContext('2d');

        // Fill white before drawing (needed for contrast adjustments)
        wCtx.fillStyle = '#ffffff';
        wCtx.fillRect(0, 0, OUT_W, OUT_H);
        wCtx.drawImage(sourceImg, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H);

        /* ── Step 3: Apply brightness / contrast adjustments ── */
        const imgData2  = wCtx.getImageData(0, 0, OUT_W, OUT_H);
        const pixels    = imgData2.data;
        const brightness = (aiGuide.brightnessAdjust || 0);
        const contrast   = (aiGuide.contrastBoost    || 20) / 100;
        const factor     = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < pixels.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                let v = pixels[i + c];
                v = Math.round(factor * (v - 128) + 128 + brightness);
                pixels[i + c] = Math.max(0, Math.min(255, v));
            }
        }
        wCtx.putImageData(imgData2, 0, 0);

        /* ── Step 4: Remove white background using AI-suggested threshold ── */
        const threshold = aiGuide.suggestedThreshold || 215;
        removeWhiteBackground(workCanvas, threshold);

        /* ── Step 5: Render result preview ── */
        const resultCanvas = document.getElementById('sig-result-canvas');
        resultCanvas.width  = OUT_W;
        resultCanvas.height = OUT_H;
        const rCtx = resultCanvas.getContext('2d');
        rCtx.clearRect(0, 0, OUT_W, OUT_H);
        rCtx.drawImage(workCanvas, 0, 0);

        setAiStatus('', false);
        resultPane.style.display = 'flex';

        /* ── Step 6: Persist to student state & re-render ID card ── */
        const finalDataUrl = workCanvas.toDataURL('image/png');
        const finalImg     = new Image();
        finalImg.onload = () => {
            const student = state.students[state.activeStudentIndex];
            student.signatureImage   = finalImg;
            student.signatureDataUrl = finalDataUrl;
            renderCanvases();
        };
        finalImg.src = finalDataUrl;

    } catch (err) {
        console.error('[ISU ID] AI signature enhancement failed:', err);
        setAiStatus('Enhancement failed. Try again or draw your signature manually.', true);
    } finally {
        enhanceBtn.disabled = false;
        clearBtn.disabled   = false;
    }
}

