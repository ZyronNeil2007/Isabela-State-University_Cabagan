/* ── module: features/photo-editor/cropper.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { renderCanvases } from '../id-generator/render-engine.js';
import { renderStudentTabs } from '../student-management/student-tabs.js';

/* ═══════════════════════════════════════════════════════════════════════════
   14. INTERACTIVE PHOTO CROPPER LOGIC
═══════════════════════════════════════════════════════════════════════════ */
let cropZoom = 1;
let baseScale = 1;
let isDraggingCrop = false;
let startDragX = 0, startDragY = 0;
let imgOffsetX = 0, imgOffsetY = 0;

export function openCropper() {
    const student = state.students[state.activeStudentIndex];
    if (!student.rawSourceImage) return;
    
    document.getElementById('cropper-modal').classList.add('active');
    const imgEl = document.getElementById('cropper-img');
    imgEl.src = student.rawSourceImage.src;
    
    // Calculate base scale after modal is painted
    requestAnimationFrame(() => {
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
    });
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
// Pointer Events: one pointer drags, two pointers pinch-zoom (touch-action:none in CSS)
const cropPointers = new Map();
let pinchStartDist = 0, pinchStartZoom = 1;

function setCropZoom(z) {
    const zoomEl = document.getElementById('cropper-zoom');
    const min = parseFloat(zoomEl?.min) || 1;
    const max = parseFloat(zoomEl?.max) || 3;
    cropZoom = Math.min(max, Math.max(min, z));
    if (zoomEl) zoomEl.value = cropZoom;
    updateCropperTransform();
}

function pinchDistance() {
    const [a, b] = [...cropPointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
}

if (viewport) {
    viewport.addEventListener('pointerdown', startCropDrag);
    viewport.addEventListener('pointermove', doCropDrag);
    viewport.addEventListener('pointerup', endCropDrag);
    viewport.addEventListener('pointercancel', endCropDrag);
    viewport.addEventListener('wheel', e => {
        e.preventDefault();
        setCropZoom(cropZoom * (e.deltaY < 0 ? 1.08 : 0.92));
    }, { passive: false });
}

function startCropDrag(e) {
    cropPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { viewport.setPointerCapture(e.pointerId); } catch (_) { /* synthetic */ }
    if (cropPointers.size === 2) {
        pinchStartDist = pinchDistance();
        pinchStartZoom = cropZoom;
        isDraggingCrop = false;
    } else {
        isDraggingCrop = true;
        startDragX = e.clientX - imgOffsetX;
        startDragY = e.clientY - imgOffsetY;
    }
    if (e.cancelable) e.preventDefault();
}

function doCropDrag(e) {
    if (!cropPointers.has(e.pointerId)) return;
    cropPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (cropPointers.size === 2 && pinchStartDist) {
        setCropZoom(pinchStartZoom * pinchDistance() / pinchStartDist);
    } else if (isDraggingCrop) {
        imgOffsetX = e.clientX - startDragX;
        imgOffsetY = e.clientY - startDragY;
        updateCropperTransform();
    }
    if (e.cancelable) e.preventDefault();
}

function endCropDrag(e) {
    if (e && e.pointerId !== undefined) cropPointers.delete(e.pointerId);
    else cropPointers.clear();
    isDraggingCrop = false;
    // Lifting one finger of a pinch: resume dragging with the remaining one
    if (cropPointers.size === 1) {
        const [p] = [...cropPointers.values()];
        isDraggingCrop = true;
        startDragX = p.x - imgOffsetX;
        startDragY = p.y - imgOffsetY;
    }
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
