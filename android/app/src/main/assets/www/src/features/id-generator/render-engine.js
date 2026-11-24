/* ── module: features/id-generator/render-engine.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { CONFIG, CONFIG_2026, DEPARTMENT_LABELS } from '../../core/config/card-config.js';
import { state } from '../../core/state/state.js';
import { backCanvas, backCtx, frontCanvas, frontCtx, miniCanvasBack, miniCanvasFront } from '../../core/state/canvas-refs.js';
import { renderCr80Preview, updateMiniCanvas } from '../card-preview/cr80-preview.js';
import { saveSessionToStorage } from '../../services/storage/session.js';
import { drawHologramWatermark } from '../card-preview/security-fx.js';

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

    // Matches "BACHELOR OF [ANYTHING] IN " and splits it
    const degreeMatch = upper.match(/^(BACHELOR OF [A-Z\s]+(?:IN)?)\s+(.+)/);
    if (degreeMatch) {
        return `${degreeMatch[1].trim()}\n${degreeMatch[2].trim()}`;
    }

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
export function renderCanvases() {
    const student = state.students[state.activeStudentIndex];
    const is2026  = state.idVersion === '2026';
    const cfg     = is2026 ? CONFIG_2026 : CONFIG;

    // ── Resize canvases only when dimensions change (prevents GPU buffer discarding) ──
    const targetFrontW = is2026 ? (state.front2026Template?.width || 816) : (state.frontTemplate?.width || 638);
    const targetFrontH = is2026 ? (state.front2026Template?.height || 1296) : (state.frontTemplate?.height || 1013);
    const targetBackW  = is2026 ? (state.back2026Template?.width || 816) : (state.backTemplate?.width || 638);
    const targetBackH  = is2026 ? (state.back2026Template?.height || 1296) : (state.backTemplate?.height || 1013);

    if (frontCanvas.width !== targetFrontW)   frontCanvas.width = targetFrontW;
    if (frontCanvas.height !== targetFrontH) frontCanvas.height = targetFrontH;
    if (backCanvas.width !== targetBackW)     backCanvas.width = targetBackW;
    if (backCanvas.height !== targetBackH)   backCanvas.height = targetBackH;

    if (miniCanvasFront) {
        if (miniCanvasFront.width !== targetFrontW)  miniCanvasFront.width = targetFrontW;
        if (miniCanvasFront.height !== targetFrontH) miniCanvasFront.height = targetFrontH;
    }
    if (miniCanvasBack) {
        if (miniCanvasBack.width !== targetBackW)  miniCanvasBack.width = targetBackW;
        if (miniCanvasBack.height !== targetBackH) miniCanvasBack.height = targetBackH;
    }

    // ── Front Face ──────────────────────────────────────────
    frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);

    const frontTpl = is2026 ? state.front2026Template : state.frontTemplate;

    if (is2026) {
        // ── 2026: PHOTO FIRST, then template on top ──────────
        // This ensures the green border (part of the template PNG) draws
        // OVER the photo, so the border is always visible.

        // 1. Draw a white base
        frontCtx.fillStyle = '#ffffff';
        frontCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);

        // 2. Draw the template FIRST (because it has a solid background)
        if (frontTpl) {
            frontCtx.drawImage(frontTpl, 0, 0, frontCanvas.width, frontCanvas.height);
        }

        // 3. Draw photo ON TOP (clipped perfectly inside the frame).
        //    No photo yet → the template's silhouette placeholder, like the HTML preview.
        const photoImg2026 = student.photoImage || state.photoPlaceholder2026;
        if (photoImg2026) {
            const { x, y, width, height, borderRadius: r = 18 } = cfg.photo;
            frontCtx.save();
            frontCtx.beginPath();
            frontCtx.moveTo(x + r, y);
            frontCtx.lineTo(x + width - r, y);
            frontCtx.arcTo(x + width, y,         x + width, y + r,          r);
            frontCtx.lineTo(x + width, y + height - r);
            frontCtx.arcTo(x + width, y + height, x + width - r, y + height, r);
            frontCtx.lineTo(x + r, y + height);
            frontCtx.arcTo(x,        y + height, x, y + height - r,          r);
            frontCtx.lineTo(x, y + r);
            frontCtx.arcTo(x, y,                 x + r, y,                   r);
            frontCtx.closePath();
            frontCtx.clip();

            const imgRatio = photoImg2026.width / photoImg2026.height;
            const boxRatio = width / height;
            let dw = width, dh = height, dx = x, dy = y;
            if (imgRatio > boxRatio) { dw = height * imgRatio; dx = x - (dw - width) / 2; }
            else                    { dh = width / imgRatio;   dy = y - (dh - height) / 2; }

            frontCtx.drawImage(photoImg2026, dx, dy, dw, dh);
            frontCtx.restore();
        }

    } else {
        // ── Old ID: template first, photo on top ─────────────
        if (frontTpl) {
            frontCtx.drawImage(frontTpl, 0, 0, frontCanvas.width, frontCanvas.height);
        } else {
            frontCtx.fillStyle = '#d4e8d4';
            frontCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);
        }

        if (student.photoImage) {
            const { x, y, width, height } = cfg.photo;
            frontCtx.save();
            frontCtx.beginPath();
            frontCtx.rect(x, y, width, height);
            frontCtx.clip();

            const imgRatio = student.photoImage.width / student.photoImage.height;
            const boxRatio = width / height;
            let dw = width, dh = height, dx = x, dy = y;
            if (imgRatio > boxRatio) { dw = height * imgRatio; dx = x - (dw - width) / 2; }
            else                    { dh = width / imgRatio;   dy = y - (dh - height) / 2; }

            frontCtx.drawImage(student.photoImage, dx, dy, dw, dh);
            frontCtx.restore();
        }
    }

    // Signature (drawn for both versions if defined in config)
    if (student.signatureImage && cfg.signature) {
        const { x, y, width, height } = cfg.signature;
        frontCtx.drawImage(student.signatureImage, x, y, width, height);
    }

    try {
        // Text fields on front face
        if (is2026) {
            // 2026: draw text AFTER the template (so text appears above the template image)
            renderText2026(frontCtx, cfg.text.name, student.formData.name || 'JUAN DELA CRUZ');
            renderText2026(frontCtx, cfg.text.idNumber, student.formData.idNumber || '25-00001');
            const deptKey   = student.formData.department || '';
            const deptLabel = deptKey ? (DEPARTMENT_LABELS[deptKey] || deptKey) : 'COLLEGE / DEPARTMENT';
            renderText2026(frontCtx, cfg.text.department, deptLabel);
        } else {
            renderText(frontCtx, CONFIG.text.name,
                student.formData.name || 'JUAN DELA CRUZ');
            renderText(frontCtx, CONFIG.text.idNumber,
                student.formData.idNumber || '25-00001');
            renderText(frontCtx, CONFIG.text.course,
                formatCourseText(student.formData.course || 'Bachelor of Science in Computer Science'));
        }
    } catch (e) {
        console.error('[ISU ID] Error rendering front text:', e);
    }

    // Holographic security watermark overlay on front face
    drawHologramWatermark(frontCtx, frontCanvas.width, frontCanvas.height);

    // ── Back Face ───────────────────────────────────────────
    backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);

    const backTpl = is2026 ? state.back2026Template : state.backTemplate;
    if (backTpl) {
        backCtx.drawImage(backTpl, 0, 0, backCanvas.width, backCanvas.height);
    } else {
        backCtx.fillStyle = '#ffffff';
        backCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
    }

    if (is2026) {
        // 2026 back: render text inline at the label positions
        renderText2026(backCtx, cfg.text.parentName,
            student.formData.parentName || 'JANE DELA CRUZ');
        renderText2026(backCtx, cfg.text.address,
            student.formData.address || 'BARUCBOC, QUEZON, ISABELA');
        renderText2026(backCtx, cfg.text.telephone,
            student.formData.telephone || '09123456789');

        let dobText = '01/01/2000';
        if (student.formData.dob) {
            const d = new Date(student.formData.dob);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getUTCFullYear();
                const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(d.getUTCDate()).padStart(2, '0');
                dobText = `${mm}/${dd}/${yyyy}`;
            } else {
                dobText = student.formData.dob;
            }
        }
        renderText2026(backCtx, cfg.text.dob, dobText);
    } else {
        // Old ID back: white clear rect + text overlay
        backCtx.fillStyle = '#ffffff';
        backCtx.fillRect(60, 170, 500, 120);

        renderText(backCtx, CONFIG.text.parentName,
            student.formData.parentName || 'JANE DELA CRUZ');
        renderText(backCtx, CONFIG.text.address,
            'Address: ' + (student.formData.address || '123 MAIN ST, CAUAYAN CITY, ISABELA'));
        renderText(backCtx, CONFIG.text.telephone,
            'Telephone No.: ' + (student.formData.telephone || '+63 912 345 6789'));
        let dobText = '01-01-2000';
        if (student.formData.dob) {
            const d = new Date(student.formData.dob);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getUTCFullYear();
                const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(d.getUTCDate()).padStart(2, '0');
                dobText = `${dd}-${mm}-${yyyy}`;
            } else {
                dobText = student.formData.dob.split('-').reverse().join('-');
            }
        }
        renderText(backCtx, CONFIG.text.dob, 'Birth Date: ' + dobText);
    }

    // ── CR80 HTML card in the preview section (2026 ID) ─────
    renderCr80Preview();

    // ── Mini preview (mobile stepper header) ────────────────
    updateMiniCanvas();

    // ── Session Auto-Save ─────────────────────────────────────
    saveSessionToStorage();
}

/**
 * Draw text for the 2026 template (no scale multiplier — coordinates are native px).
 * Supports multi-line via '\n'. Uses textConfig.lineHeight if set, otherwise
 * falls back to fontSize × 1.35.
 * The y coordinate is the CENTER of the entire multi-line block.
 */
function renderText2026(ctx, textConfig, textValue) {
    if (!textValue) return;
    textValue = String(textValue); // Ensure it's always a string so .split() doesn't fail

    ctx.save();
    // Avoid prepending 'bold' twice when the font string already includes it
    const fontStr = textConfig.font.trim();
    ctx.font        = (textConfig.isBold && !fontStr.startsWith('bold'))
                        ? 'bold ' + fontStr
                        : fontStr;
    ctx.textAlign   = textConfig.align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle   = textConfig.fillStyle;

    const lines      = textValue.split('\n');
    // Parse font-size: handles "bold 16px Arial" and "16px Arial" correctly
    const fontSizeMatch = fontStr.match(/(\d+(\.\d+)?)px/);
    let fontSize     = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 14;
    let lineHeight   = textConfig.lineHeight || (fontSize * 1.35);

    // autoShrink (optional, number = minimum px size): reduce the font until the
    // widest line fits maxWidth, so long names/addresses stay readable instead of
    // being horizontally squeezed. lineHeight shrinks in proportion.
    if (textConfig.autoShrink && textConfig.maxWidth && fontSizeMatch) {
        const baseSize = fontSize;
        const baseFont = ctx.font;
        const widest = () => Math.max(...lines.map(l => ctx.measureText(l).width));
        while (fontSize > textConfig.autoShrink && widest() > textConfig.maxWidth) {
            fontSize -= 1;
            ctx.font = baseFont.replace(/(\d+(\.\d+)?)px/, `${fontSize}px`);
        }
        if (fontSize !== baseSize) lineHeight = lineHeight * (fontSize / baseSize);
    }

    // wrap (optional): if the text still does not fit at the minimum size, word-wrap
    // it into several lines (matches the CR80 HTML preview's two-line values).
    if (textConfig.wrap && textConfig.maxWidth && lines.length === 1 && ctx.measureText(lines[0]).width > textConfig.maxWidth) {
        const source = lines[0];
        const baseFont = ctx.font;
        const wrapAt = () => {
            const wrapped = [];
            let cur = '';
            source.split(' ').forEach(w => {
                const test = cur ? cur + ' ' + w : w;
                if (cur && ctx.measureText(test).width > textConfig.maxWidth) { wrapped.push(cur); cur = w; }
                else cur = test;
            });
            if (cur) wrapped.push(cur);
            return wrapped;
        };
        let wrapped = wrapAt();
        // keep shrinking until the wrapped block fits a 64px row (same rule as the HTML preview)
        while (fontSize > 15 && wrapped.length * fontSize * 1.15 > 64) {
            fontSize -= 1;
            ctx.font = baseFont.replace(/(\d+(\.\d+)?)px/, `${fontSize}px`);
            wrapped = wrapAt();
        }
        lines.splice(0, lines.length, ...wrapped);
        lineHeight = fontSize * 1.15;
    }

    // Center the whole block on textConfig.y
    const totalHeight = (lines.length - 1) * lineHeight;
    const startY      = textConfig.y - totalHeight / 2;

    lines.forEach((line, i) => {
        // Snap each line to a whole pixel (floor, like browsers do for line boxes) so the
        // export matches the HTML card's crisp glyph edges
        const y = Math.floor(startY + i * lineHeight);
        if (textConfig.maxWidth) {
            ctx.fillText(line, textConfig.x, y, textConfig.maxWidth);
        } else {
            ctx.fillText(line, textConfig.x, y);
        }
    });

    ctx.restore();
}
