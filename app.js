/**
         * ==========================================
         * CONFIGURATION
         * Adjust X, Y coordinates, fonts, and box sizes here.
         * The coordinates assume the canvas dimensions match the uploaded templates.
         * Default high-res canvas scale assumed (adjust multiplier if sizes are too big).
         * ==========================================
         */
const CONFIG = {
    // Scale multiplier to convert the user's tiny font sizes (based on a ~153x250 coordinate space)
    // to our high-res 638x1011 canvas space. 638 / 153 ≈ 4.17
    scaleMultiplier: 4.17,

    photo: {
        // Exact white box bounds: x=162, y=214, w=313, h=353
        // We add 1px bleed to ensure no white edges show due to anti-aliasing
        x: 161,
        y: 213,
        width: 315,
        height: 355
    },
    signature: {
        x: 160,
        y: 575, // Lowered so it doesn't overlap the photo bounds (which end at y:568)
        width: 319,
        height: 120
    },

    // Text Elements Configuration
    text: {
        name: {
            x: 319, y: 710, align: 'center',
            font: "11.2px 'Roboto Condensed'", isBold: true,
            strokeThickness: 0, fillStyle: "#000000", strokeStyle: "transparent"
        },
        idNumber: {
            x: 319, y: 795, align: 'center',
            font: "9.8px 'Nourd', sans-serif", isBold: true,
            strokeThickness: 0, fillStyle: "#000000", strokeStyle: "transparent"
        },
        course: {
            x: 319, y: 915, align: 'center',
            font: "10.8px 'Roboto Condensed'", isBold: true,
            strokeThickness: 0, fillStyle: "#000000", strokeStyle: "transparent",
            maxWidth: 550 // Constrain course name if too long
        },
        parentName: {
            x: 64, y: 145, align: 'left',
            font: "7.7px 'Arial'", isBold: true,
            strokeThickness: 10, fillStyle: "#000000", strokeStyle: "transparent"
        },
        address: {
            x: 64, y: 185, align: 'left',
            font: "4.9px 'Arial Nova Condensed', sans-serif", isBold: true,
            strokeThickness: 16, fillStyle: "#000000", strokeStyle: "transparent",
            maxWidth: 500
        },
        telephone: {
            x: 64, y: 205, align: 'left',
            font: "4.9px 'Arial Nova Condensed', sans-serif", isBold: true,
            strokeThickness: 16, fillStyle: "#000000", strokeStyle: "transparent"
        },
        dob: {
            x: 64, y: 250, align: 'left',
            font: "5.7px 'Arial MT Pro', sans-serif", isBold: false,
            strokeThickness: 0, fillStyle: "#000000", strokeStyle: "transparent"
        }
    }
};

// State & Elements
const state = {
    frontTemplate: null,
    backTemplate: null,
    photoImage: null,
    signatureImage: null,
    formData: {
        name: '', idNumber: '', course: '', dob: '', parentName: '', address: '', telephone: ''
    }
};

const frontCanvas = document.getElementById('front-canvas');
const frontCtx = frontCanvas.getContext('2d');
const backCanvas = document.getElementById('back-canvas');
const backCtx = backCanvas.getContext('2d');

// Signature Pad setup
const sigCanvas = document.getElementById('signature-pad');
const sigCtx = sigCanvas.getContext('2d');
let isDrawing = false;
let lastX = 0, lastY = 0;

// Initialize Signature Pad Resolution
function initSignaturePad() {
    const rect = sigCanvas.parentElement.getBoundingClientRect();
    sigCanvas.width = rect.width;
    sigCanvas.height = 150;
    sigCtx.lineWidth = 3;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    sigCtx.strokeStyle = '#000000';
}
window.addEventListener('resize', initSignaturePad);
initSignaturePad();

// Signature Logic
function getPointerPos(e) {
    const rect = sigCanvas.getBoundingClientRect();
    let clientX = e.clientX, clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getPointerPos(e);
    lastX = pos.x; lastY = pos.y;
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(lastX, lastY);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
    lastX = pos.x; lastY = pos.y;
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        updateSignatureImage();
    }
}

function updateSignatureImage() {
    const dataURL = sigCanvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
        state.signatureImage = img;
        renderCanvases();
    };
    img.src = dataURL;
}

sigCanvas.addEventListener('mousedown', startDrawing);
sigCanvas.addEventListener('mousemove', draw);
sigCanvas.addEventListener('mouseup', stopDrawing);
sigCanvas.addEventListener('mouseout', stopDrawing);
sigCanvas.addEventListener('touchstart', startDrawing, { passive: false });
sigCanvas.addEventListener('touchmove', draw, { passive: false });
sigCanvas.addEventListener('touchend', stopDrawing);

document.getElementById('clear-signature').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    state.signatureImage = null;
    renderCanvases();
});

// Form Inputs Logic
const inputs = ['full-name', 'id-number', 'course', 'dob', 'parent-name', 'address', 'telephone'];
inputs.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', (e) => {
        // Map hyphenated ID to camelCase state key
        const key = id.replace(/-([a-z])/g, g => g[1].toUpperCase()).replace('fullN', 'n');
        state.formData[key] = e.target.value.toUpperCase();
        renderCanvases();
    });
});

document.getElementById('profile-pic').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.photoImage = img;
                renderCanvases();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Load Templates
function loadTemplates() {
    const p1 = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { state.frontTemplate = img; resolve(); };
        img.onerror = () => { console.error("Missing images/template_front.id.png"); resolve(); }; // Resolve anyway to avoid breaking
        img.src = 'images/template_front.id.png';
    });
    const p2 = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { state.backTemplate = img; resolve(); };
        img.onerror = () => { console.error("Missing images/template_back.id.png"); resolve(); };
        img.src = 'images/template_back.id.png';
    });

    Promise.all([p1, p2]).then(() => {
        // Initialize canvas dimensions to match templates (or fallback)
        frontCanvas.width = state.frontTemplate ? state.frontTemplate.width : 638;
        frontCanvas.height = state.frontTemplate ? state.frontTemplate.height : 1013;

        backCanvas.width = state.backTemplate ? state.backTemplate.width : 638;
        backCanvas.height = state.backTemplate ? state.backTemplate.height : 1013;

        renderCanvases();
    });
}

// --- Core Rendering Engine ---
function renderText(ctx, textConfig, textValue) {
    if (!textValue) return;

    const m = CONFIG.scaleMultiplier;

    // Parse font string to extract size for proportional scaling if needed
    // Example: "11.2px 'Roboto Condensed'"
    let fontString = textConfig.font;
    const sizeMatch = fontString.match(/([\d.]+)px/);
    let fontSize = 10; // fallback
    if (sizeMatch && m !== 1.0) {
        const newSize = parseFloat(sizeMatch[1]) * m;
        fontSize = newSize;
        fontString = fontString.replace(/[\d.]+px/, `${newSize}px`);
    }

    ctx.font = (textConfig.isBold ? "bold " : "") + fontString;
    ctx.textAlign = textConfig.align;
    ctx.textBaseline = "middle";

    const lines = textValue.split('\n');
    const lineHeight = fontSize * 1.15; // 15% line gap
    // If there are multiple lines, adjust starting Y so they are centered vertically around textConfig.y
    const startY = textConfig.y - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
        const currentY = startY + (index * lineHeight);

        // Draw Outline First (so it goes behind the fill)
        if (textConfig.strokeThickness > 0) {
            // The provided stroke thicknesses (e.g., 20) are disproportionately large for the font sizes.
            // We scale them down by a factor of 10 so they form a nice, readable outline without blobbing.
            ctx.lineWidth = (textConfig.strokeThickness / 10) * m;
            ctx.strokeStyle = textConfig.strokeStyle;
            ctx.lineJoin = 'round'; // Prevents sharp spikes on thick borders
            ctx.miterLimit = 2;

            if (textConfig.maxWidth) {
                ctx.strokeText(line, textConfig.x, currentY, textConfig.maxWidth);
            } else {
                ctx.strokeText(line, textConfig.x, currentY);
            }
        }

        // Draw Fill
        ctx.fillStyle = textConfig.fillStyle;
        if (textConfig.maxWidth) {
            ctx.fillText(line, textConfig.x, currentY, textConfig.maxWidth);
        } else {
            ctx.fillText(line, textConfig.x, currentY);
        }
    });
}

function formatCourseText(course) {
    if (!course) return '';
    const upper = course.toUpperCase().trim();
    if (upper.startsWith("BACHELOR OF SCIENCE IN ")) {
        return "BACHELOR OF SCIENCE\nIN " + course.substring(23).trim();
    } else if (upper.startsWith("BACHELOR OF SCIENCE ")) {
        return "BACHELOR OF SCIENCE\n" + course.substring(20).trim();
    } else if (upper.includes(" IN ")) {
        const index = upper.indexOf(" IN ");
        return course.substring(0, index).trim() + "\nIN " + course.substring(index + 4).trim();
    }
    return course;
}

function renderCanvases() {
    // --- FRONT CANVAS ---
    frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);

    // 1. Draw Template Background
    if (state.frontTemplate) {
        frontCtx.drawImage(state.frontTemplate, 0, 0, frontCanvas.width, frontCanvas.height);
    } else {
        frontCtx.fillStyle = '#e0e0e0';
        frontCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);
    }

    // 2. Draw Profile Picture (with object-fit cover logic inside clipping path)
    if (state.photoImage) {
        const { x, y, width, height } = CONFIG.photo;
        frontCtx.save();

        // Create clipping path (rectangle with rounded corners optional, but standard is rect)
        frontCtx.beginPath();
        frontCtx.rect(x, y, width, height);
        frontCtx.clip();

        // Object-fit: cover math
        const imgRatio = state.photoImage.width / state.photoImage.height;
        const boxRatio = width / height;
        let drawWidth = width;
        let drawHeight = height;
        let drawX = x;
        let drawY = y;

        if (imgRatio > boxRatio) {
            // Image is wider than box
            drawWidth = height * imgRatio;
            drawX = x - (drawWidth - width) / 2;
        } else {
            // Image is taller than box
            drawHeight = width / imgRatio;
            drawY = y - (drawHeight - height) / 2;
        }

        frontCtx.drawImage(state.photoImage, drawX, drawY, drawWidth, drawHeight);
        frontCtx.restore();
    }

    // 3. Draw Signature
    if (state.signatureImage) {
        const { x, y, width, height } = CONFIG.signature;
        frontCtx.drawImage(state.signatureImage, x, y, width, height);
    }

    // 4. Draw Front Text
    renderText(frontCtx, CONFIG.text.name, state.formData.name || 'JOHN DOE');
    renderText(frontCtx, CONFIG.text.idNumber, state.formData.idNumber || '2026-0001');

    const rawCourse = state.formData.course || 'BACHELOR OF SCIENCE IN COMPUTER SCIENCE';
    const formattedCourse = formatCourseText(rawCourse);
    renderText(frontCtx, CONFIG.text.course, formattedCourse);


    // --- BACK CANVAS ---
    backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);

    // 1. Draw Template Background
    if (state.backTemplate) {
        backCtx.drawImage(state.backTemplate, 0, 0, backCanvas.width, backCanvas.height);
    } else {
        backCtx.fillStyle = '#ffffff';
        backCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
    }

    // Draw a white rectangle to mask any baked-in text on the template for Address/Phone/DOB
    // This ensures our dynamically drawn text with labels is clean and doesn't overlap baked text
    backCtx.fillStyle = '#ffffff';
    backCtx.fillRect(60, 170, 500, 120);

    // 2. Draw Back Text with specific labels to perfectly match the reference
    const formattedParent = state.formData.parentName || 'JANE DOE';
    const formattedAddress = "Address: " + (state.formData.address || '123 MAIN ST, ANYCITY');
    const formattedPhone = "Telephone No.: " + (state.formData.telephone || '+1 234 567 8900');
    const formattedDob = "Birth Date: " + (state.formData.dob ? state.formData.dob.split('-').reverse().join('-') : '01-01-2000');

    renderText(backCtx, CONFIG.text.parentName, formattedParent);
    renderText(backCtx, CONFIG.text.address, formattedAddress);
    renderText(backCtx, CONFIG.text.telephone, formattedPhone);
    renderText(backCtx, CONFIG.text.dob, formattedDob);
}

// --- A4 Print Export Logic ---
document.getElementById('download-btn').addEventListener('click', () => {
    const exportCanvas = document.getElementById('export-canvas');
    // A4 dimensions at 300 DPI
    exportCanvas.width = 2480;
    exportCanvas.height = 3508;
    const ctx = exportCanvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Calculate ID size based on 5.4cm x 8.56cm at 300 DPI
    // 5.4 cm = 2.12598 inches * 300 = 638 pixels
    // 8.56 cm = 3.37007 inches * 300 = 1011 pixels
    const printWidth = 638;
    const printHeight = 1011;

    // Center horizontally
    const xPos = (exportCanvas.width - printWidth) / 2;

    // Add some spacing vertically
    const yPosFront = 400;
    const yPosBack = yPosFront + printHeight + 200;

    // Draw Front Canvas
    ctx.drawImage(frontCanvas, xPos, yPosFront, printWidth, printHeight);

    // Draw Back Canvas
    ctx.drawImage(backCanvas, xPos, yPosBack, printWidth, printHeight);

    // Add cut lines (light grey border)
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 15]);

    // Stroke slightly outside the image bounds (e.g. 2px padding) to not overlap ID border
    const p = 2;
    ctx.strokeRect(xPos - p, yPosFront - p, printWidth + (p * 2), printHeight + (p * 2));
    ctx.strokeRect(xPos - p, yPosBack - p, printWidth + (p * 2), printHeight + (p * 2));

    // Export logic
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'ISU_ID_Print_Ready.png';
    link.href = dataUrl;
    link.click();
});

// Boot
window.onload = loadTemplates;
