/* ── module: features/qr-verification/qr-code.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
/** Memoized QR Code offscreen cache to avoid DOM reflows and repeated encoding */
const _qrCache = {
    payload: '',
    size: 0,
    element: null
};

/** Render QR Code on Canvas */
function renderQrCodeOnCanvas(ctx, student, x, y, size) {
    const studentId = student.formData.idNumber || 'ISU-CAB-00000';
    const name = student.formData.name || 'STUDENT';
    const payload = `ISU-VERIFY:${studentId}:${name.toUpperCase()}`;

    // Fast path: draw from cached offscreen element if payload & size match
    if (_qrCache.payload === payload && _qrCache.size === size && _qrCache.element) {
        ctx.drawImage(_qrCache.element, x, y, size, size);
        return;
    }

    if (typeof QRCode !== 'undefined') {
        const offscreenDiv = document.createElement('div');
        try {
            new QRCode(offscreenDiv, {
                text: payload,
                width: size,
                height: size,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
            const img = offscreenDiv.querySelector('img') || offscreenDiv.querySelector('canvas');
            if (img) {
                _qrCache.payload = payload;
                _qrCache.size = size;
                _qrCache.element = img;
                ctx.drawImage(img, x, y, size, size);
                return;
            }
        } catch (e) {
            drawFallbackQr(ctx, payload, x, y, size);
            return;
        }
    }

    drawFallbackQr(ctx, payload, x, y, size);
}

/** Fallback QR Code matrix generator */
function drawFallbackQr(ctx, payload, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#000000';

    const grid = 15;
    const cell = size / grid;

    // Outer border & positioning finders
    ctx.fillRect(x, y, cell * 5, cell * 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + cell, y + cell, cell * 3, cell * 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + cell * 2, y + cell * 2, cell, cell);

    ctx.fillRect(x + size - cell * 5, y, cell * 5, cell * 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + size - cell * 4, y + cell, cell * 3, cell * 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size - cell * 3, y + cell * 2, cell, cell);

    // Simple deterministic pattern based on char codes
    for (let r = 0; r < grid; r++) {
        for (let c = 0; c < grid; c++) {
            if ((r < 5 && c < 5) || (r < 5 && c > 9)) continue;
            const code = payload.charCodeAt((r * grid + c) % payload.length);
            if ((code + r * 3 + c * 7) % 2 === 0) {
                ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
            }
        }
    }
    ctx.restore();
}
