/**
 * ==========================================
 * CONFIGURATION
 * ==========================================
 */
const CONFIG = {
    scaleMultiplier: 4.17,
    photo: { x: 161, y: 213, width: 315, height: 355 },
    signature: { x: 160, y: 575, width: 319, height: 120 },
    text: {
        name:       { x: 319, y: 710,  align: 'center', font: "11.2px 'Roboto Condensed'",              isBold: true,  strokeThickness: 0,  fillStyle: "#000000", strokeStyle: "transparent" },
        idNumber:   { x: 319, y: 795,  align: 'center', font: "9.8px 'Nourd', sans-serif",              isBold: true,  strokeThickness: 0,  fillStyle: "#000000", strokeStyle: "transparent" },
        course:     { x: 319, y: 915,  align: 'center', font: "10.8px 'Roboto Condensed'",              isBold: true,  strokeThickness: 0,  fillStyle: "#000000", strokeStyle: "transparent", maxWidth: 550 },
        parentName: { x: 64,  y: 145,  align: 'left',   font: "7.7px 'Arial'",                          isBold: true,  strokeThickness: 10, fillStyle: "#000000", strokeStyle: "transparent" },
        address:    { x: 64,  y: 185,  align: 'left',   font: "4.9px 'Arial Nova Condensed', sans-serif", isBold: true, strokeThickness: 16, fillStyle: "#000000", strokeStyle: "transparent", maxWidth: 500 },
        telephone:  { x: 64,  y: 205,  align: 'left',   font: "4.9px 'Arial Nova Condensed', sans-serif", isBold: true, strokeThickness: 16, fillStyle: "#000000", strokeStyle: "transparent" },
        dob:        { x: 64,  y: 250,  align: 'left',   font: "5.7px 'Arial MT Pro', sans-serif",       isBold: false, strokeThickness: 0,  fillStyle: "#000000", strokeStyle: "transparent" }
    }
};

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
    frontTemplate: null,
    backTemplate:  null,
    photoImage:    null,
    signatureImage: null,
    formData: { name: '', idNumber: '', course: '', dob: '', parentName: '', address: '', telephone: '' }
};

// ─── Canvas Elements ──────────────────────────────────────────────────────────
const frontCanvas = document.getElementById('front-canvas');
const frontCtx    = frontCanvas.getContext('2d');
const backCanvas  = document.getElementById('back-canvas');
const backCtx     = backCanvas.getContext('2d');
const miniCanvas  = document.getElementById('mini-canvas');
const miniCtx     = miniCanvas ? miniCanvas.getContext('2d') : null;

// ─── Signature Pad ────────────────────────────────────────────────────────────
const sigCanvas = document.getElementById('signature-pad');
const sigCtx    = sigCanvas.getContext('2d');
let isDrawing = false;
let lastX = 0, lastY = 0;

function initSignaturePad() {
    const rect = sigCanvas.parentElement.getBoundingClientRect();
    sigCanvas.width  = rect.width;
    sigCanvas.height = 150;
    sigCtx.lineWidth   = 3;
    sigCtx.lineCap     = 'round';
    sigCtx.lineJoin    = 'round';
    sigCtx.strokeStyle = '#000000';
}

window.addEventListener('resize', initSignaturePad);
initSignaturePad();

function getPointerPos(e) {
    const rect = sigCanvas.getBoundingClientRect();
    let clientX = e.clientX, clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDrawing(e) { isDrawing = true; const p = getPointerPos(e); lastX = p.x; lastY = p.y; }
function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const p = getPointerPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(lastX, lastY);
    sigCtx.lineTo(p.x, p.y);
    sigCtx.stroke();
    lastX = p.x; lastY = p.y;
}
function stopDrawing() { if (isDrawing) { isDrawing = false; updateSignatureImage(); } }
function updateSignatureImage() {
    const img = new Image();
    img.onload = () => { state.signatureImage = img; renderCanvases(); };
    img.src = sigCanvas.toDataURL('image/png');
}

sigCanvas.addEventListener('mousedown',  startDrawing);
sigCanvas.addEventListener('mousemove',  draw);
sigCanvas.addEventListener('mouseup',    stopDrawing);
sigCanvas.addEventListener('mouseout',   stopDrawing);
sigCanvas.addEventListener('touchstart', startDrawing, { passive: false });
sigCanvas.addEventListener('touchmove',  draw,         { passive: false });
sigCanvas.addEventListener('touchend',   stopDrawing);

document.getElementById('clear-signature').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    state.signatureImage = null;
    renderCanvases();
});

// ─── Form Inputs ──────────────────────────────────────────────────────────────
const inputs = ['full-name', 'id-number', 'course', 'dob', 'parent-name', 'address', 'telephone'];
inputs.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', e => {
        const key = id.replace(/-([a-z])/g, g => g[1].toUpperCase()).replace('fullN', 'n');
        state.formData[key] = e.target.value.toUpperCase();
        renderCanvases();
    });
});

// Profile picture — handles both the old input and the new upload area
document.getElementById('profile-pic').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => {
            state.photoImage = img;
            renderCanvases();
            // Update thumb inside the upload area (mobile step 1)
            const thumb = document.getElementById('photo-preview-thumb');
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

// ─── Template Loading ─────────────────────────────────────────────────────────
function loadTemplates() {
    const load = src => new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => { console.error('Missing:', src); resolve(null); };
        img.src = src;
    });

    Promise.all([load('images/template_front.id.png'), load('images/template_back.id.png')]).then(([front, back]) => {
        state.frontTemplate = front;
        state.backTemplate  = back;

        frontCanvas.width  = front ? front.width  : 638;
        frontCanvas.height = front ? front.height : 1013;
        backCanvas.width   = back  ? back.width   : 638;
        backCanvas.height  = back  ? back.height  : 1013;

        // Set mini canvas intrinsic size
        if (miniCanvas) {
            miniCanvas.width  = frontCanvas.width;
            miniCanvas.height = frontCanvas.height;
        }

        renderCanvases();
    });
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function renderText(ctx, textConfig, textValue) {
    if (!textValue) return;
    const m = CONFIG.scaleMultiplier;
    let fontString = textConfig.font;
    const sizeMatch = fontString.match(/([\d.]+)px/);
    let fontSize = 10;
    if (sizeMatch && m !== 1.0) {
        const newSize = parseFloat(sizeMatch[1]) * m;
        fontSize = newSize;
        fontString = fontString.replace(/[\d.]+px/, `${newSize}px`);
    }
    ctx.font = (textConfig.isBold ? 'bold ' : '') + fontString;
    ctx.textAlign    = textConfig.align;
    ctx.textBaseline = 'middle';

    const lines      = textValue.split('\n');
    const lineHeight = fontSize * 1.15;
    const startY     = textConfig.y - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        if (textConfig.strokeThickness > 0) {
            ctx.lineWidth   = (textConfig.strokeThickness / 10) * m;
            ctx.strokeStyle = textConfig.strokeStyle;
            ctx.lineJoin    = 'round';
            ctx.miterLimit  = 2;
            textConfig.maxWidth ? ctx.strokeText(line, textConfig.x, y, textConfig.maxWidth) : ctx.strokeText(line, textConfig.x, y);
        }
        ctx.fillStyle = textConfig.fillStyle;
        textConfig.maxWidth ? ctx.fillText(line, textConfig.x, y, textConfig.maxWidth) : ctx.fillText(line, textConfig.x, y);
    });
}

function formatCourseText(course) {
    if (!course) return '';
    const upper = course.toUpperCase().trim();
    if (upper.startsWith('BACHELOR OF SCIENCE IN ')) return 'BACHELOR OF SCIENCE\nIN ' + course.substring(23).trim();
    if (upper.startsWith('BACHELOR OF SCIENCE '))    return 'BACHELOR OF SCIENCE\n'    + course.substring(20).trim();
    if (upper.includes(' IN ')) {
        const idx = upper.indexOf(' IN ');
        return course.substring(0, idx).trim() + '\nIN ' + course.substring(idx + 4).trim();
    }
    return course;
}

function renderCanvases() {
    // ── Front ──
    frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
    if (state.frontTemplate) {
        frontCtx.drawImage(state.frontTemplate, 0, 0, frontCanvas.width, frontCanvas.height);
    } else {
        frontCtx.fillStyle = '#e0e0e0';
        frontCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);
    }

    if (state.photoImage) {
        const { x, y, width, height } = CONFIG.photo;
        frontCtx.save();
        frontCtx.beginPath();
        frontCtx.rect(x, y, width, height);
        frontCtx.clip();
        const imgRatio = state.photoImage.width / state.photoImage.height;
        const boxRatio = width / height;
        let dw = width, dh = height, dx = x, dy = y;
        if (imgRatio > boxRatio) { dw = height * imgRatio; dx = x - (dw - width) / 2; }
        else { dh = width / imgRatio; dy = y - (dh - height) / 2; }
        frontCtx.drawImage(state.photoImage, dx, dy, dw, dh);
        frontCtx.restore();
    }

    if (state.signatureImage) {
        const { x, y, width, height } = CONFIG.signature;
        frontCtx.drawImage(state.signatureImage, x, y, width, height);
    }

    renderText(frontCtx, CONFIG.text.name,     state.formData.name     || 'JOHN DOE');
    renderText(frontCtx, CONFIG.text.idNumber, state.formData.idNumber  || '2026-0001');
    renderText(frontCtx, CONFIG.text.course,   formatCourseText(state.formData.course || 'BACHELOR OF SCIENCE IN COMPUTER SCIENCE'));

    // ── Back ──
    backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);
    if (state.backTemplate) {
        backCtx.drawImage(state.backTemplate, 0, 0, backCanvas.width, backCanvas.height);
    } else {
        backCtx.fillStyle = '#ffffff';
        backCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
    }

    backCtx.fillStyle = '#ffffff';
    backCtx.fillRect(60, 170, 500, 120);

    renderText(backCtx, CONFIG.text.parentName, state.formData.parentName || 'JANE DOE');
    renderText(backCtx, CONFIG.text.address,    'Address: '        + (state.formData.address    || '123 MAIN ST, ANYCITY'));
    renderText(backCtx, CONFIG.text.telephone,  'Telephone No.: '  + (state.formData.telephone  || '+1 234 567 8900'));
    renderText(backCtx, CONFIG.text.dob,        'Birth Date: '     + (state.formData.dob ? state.formData.dob.split('-').reverse().join('-') : '01-01-2000'));

    // ── Mini preview (mobile) ──
    updateMiniCanvas();
}

function updateMiniCanvas() {
    if (!miniCanvas || !miniCtx) return;
    miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
    miniCtx.drawImage(frontCanvas, 0, 0, miniCanvas.width, miniCanvas.height);
}


// ─── A4 Print Export ──────────────────────────────────────────────────────────
document.getElementById('download-btn').addEventListener('click', () => {
    const exportCanvas  = document.getElementById('export-canvas');
    exportCanvas.width  = 2480;
    exportCanvas.height = 3508;
    const ctx = exportCanvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    const printWidth  = 638;
    const printHeight = 1011;
    const xPos        = (exportCanvas.width - printWidth) / 2;
    const yPosFront   = 400;
    const yPosBack    = yPosFront + printHeight + 200;

    ctx.drawImage(frontCanvas, xPos, yPosFront, printWidth, printHeight);
    ctx.drawImage(backCanvas,  xPos, yPosBack,  printWidth, printHeight);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth   = 3;
    ctx.setLineDash([15, 15]);
    const p = 2;
    ctx.strokeRect(xPos - p, yPosFront - p, printWidth + p * 2, printHeight + p * 2);
    ctx.strokeRect(xPos - p, yPosBack  - p, printWidth + p * 2, printHeight + p * 2);

    const link    = document.createElement('a');
    link.download = 'ISU_ID_Print_Ready.png';
    link.href     = exportCanvas.toDataURL('image/png');
    link.click();
});


// ════════════════════════════════════════════════════════════════════════════
//  MOBILE STEPPER SYSTEM
// ════════════════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 9;
const STEP_TITLES = [
    'Upload Photo',       // 1
    'Full Name',          // 2
    'ID Number',          // 3
    'Course',             // 4
    'Date of Birth',      // 5
    'Parent / Guardian',  // 6
    'Address',            // 7
    'Telephone',          // 8
    'Signature'           // 9
];

let currentStep = 1;

/** Returns true if we are in mobile stepper mode */
function isStepperMode() {
    return window.innerWidth <= 768;
}

/** Build the dot indicators once on load */
function buildStepperDots() {
    const container = document.getElementById('stepper-dots');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= TOTAL_STEPS; i++) {
        const dot = document.createElement('span');
        dot.className = 'stepper-dot';
        dot.dataset.step = i;
        dot.title = STEP_TITLES[i - 1];
        dot.addEventListener('click', () => goToStep(i));
        container.appendChild(dot);
    }
}

/** Show only the step matching `n`, hide all others */
function goToStep(n) {
    if (n < 1 || n > TOTAL_STEPS) return;
    currentStep = n;

    // Show/hide form groups
    document.querySelectorAll('.steps-wrapper .form-group').forEach(el => {
        const step = parseInt(el.dataset.step);
        if (step === currentStep) {
            el.classList.add('active-step');
            // Auto-focus the first input in the step
            const firstInput = el.querySelector('input, textarea');
            if (firstInput && firstInput.type !== 'file') {
                setTimeout(() => firstInput.focus(), 350);
            }
        } else {
            el.classList.remove('active-step');
        }
    });

    // Update header text
    const nameEl  = document.getElementById('stepper-step-name');
    const countEl = document.getElementById('stepper-count');
    if (nameEl)  nameEl.textContent  = STEP_TITLES[currentStep - 1];
    if (countEl) countEl.textContent = `${currentStep} / ${TOTAL_STEPS}`;

    // Update progress bar
    const fill = document.getElementById('stepper-progress');
    if (fill) fill.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;

    // Update dots
    document.querySelectorAll('.stepper-dot').forEach(dot => {
        const s = parseInt(dot.dataset.step);
        dot.classList.toggle('active', s === currentStep);
        dot.classList.toggle('done',   s < currentStep);
    });

    // Update Back / Next / Done buttons
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

    // Scroll the form section into view smoothly
    const formSection = document.querySelector('.form-section');
    if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Next button handler */
function stepperNext() {
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
}

/** Back button handler */
function stepperBack() {
    if (currentStep > 1) goToStep(currentStep - 1);
}

/** On resize, switch between stepper and full-form mode cleanly */
function handleResize() {
    if (!isStepperMode()) {
        // Desktop: make all steps visible (remove any active-step hiding)
        document.querySelectorAll('.steps-wrapper .form-group').forEach(el => {
            el.classList.remove('active-step');
        });
    } else {
        // Re-enter stepper mode at the current step
        goToStep(currentStep);
    }
}

window.addEventListener('resize', handleResize);

/** Boot the stepper on DOM ready */
function initStepper() {
    buildStepperDots();
    if (isStepperMode()) {
        goToStep(1);
    }
}


// ─── Boot ─────────────────────────────────────────────────────────────────────
window.onload = () => {
    loadTemplates();
    initStepper();
};
