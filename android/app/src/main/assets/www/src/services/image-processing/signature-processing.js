/* ── module: services/image-processing/signature-processing.js — pure pixel algorithms for signature clean-up (moved from ai-signature.js) ── */

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
export function removeWhiteBackground(canvas, threshold = 210) {
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
 * Calculates the optimal threshold to separate foreground (ink) from background (paper)
 * using Otsu's binarization method.
 * @param {ImageData} imgData
 * @returns {number} Optimal threshold (0-255)
 */
export function getOtsuThreshold(imgData) {
    const d = imgData.data;
    const len = d.length;
    
    // 1. Convert to grayscale and compute histogram
    const histogram = new Array(256).fill(0);
    let totalPixels = 0;
    
    for (let i = 0; i < len; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];
        if (a < 50) continue; // Skip transparent
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        histogram[gray]++;
        totalPixels++;
    }

    if (totalPixels === 0) return 128;

    // 2. Run Otsu's algorithm
    let sum = 0;
    for (let i = 0; i < 256; i++) {
        sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 128;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;

        wF = totalPixels - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];

        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;

        // Calculate Between Class Variance
        const varBetween = wB * wF * (mB - mF) * (mB - mF);

        if (varBetween > varMax) {
            varMax = varBetween;
            threshold = t;
        }
    }
    
    return threshold;
}

/**
 * Scans the canvas pixels and detects the tight bounding box of ink content
 * (pixels whose luminance is below the threshold).
 * @param {HTMLCanvasElement} canvas
 * @param {number} threshold
 * @returns {{x: number, y: number, w: number, h: number}} Bounding box
 */
export function getContentBoundingBox(canvas, threshold = 210) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const w = canvas.width;
    const h = canvas.height;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = d[idx], g = d[idx + 1], b = d[idx + 2], a = d[idx + 3];
            if (a < 50) continue; // Skip transparent
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            
            if (lum < threshold) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
            }
        }
    }

    if (!found) {
        return { x: 0, y: 0, w, h };
    }

    // Add padding to prevent clipping signature strokes
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w - 1, maxX + padding);
    maxY = Math.min(h - 1, maxY + padding);

    return {
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1
    };
}
