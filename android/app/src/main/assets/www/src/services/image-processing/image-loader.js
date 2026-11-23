/* ── module: services/image-processing/image-loader.js — image loading helpers (moved from templates.js and session.js) ── */

/** Load a template/asset image by URL. Resolves to null (with a warning) on failure — never rejects. */
export function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => { console.warn(`[ISU ID] Template not found: ${src}`); resolve(null); };
        img.src = src;
    });
}

/** Promise-wrapper to create an Image from a data URL */
export function loadImageFromDataUrl(dataUrl) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
}
