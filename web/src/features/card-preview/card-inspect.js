/* ── module: features/card-preview/card-inspect.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { backCanvas, frontCanvas } from '../../core/state/canvas-refs.js';
import { playAudioFx } from './security-fx.js';

/** High-Res Card Inspector Modal */
export function openCardInspectModal() {
    playAudioFx('click');
    const modal = document.getElementById('card-inspect-modal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
    renderInspectCanvas();
}

export function closeCardInspectModal() {
    playAudioFx('click');
    const modal = document.getElementById('card-inspect-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

export function switchInspectFace(face) {
    state.inspectFace = face;
    playAudioFx('click');
    document.getElementById('inspect-btn-front')?.classList.toggle('active', face === 'front');
    document.getElementById('inspect-btn-back')?.classList.toggle('active', face === 'back');
    renderInspectCanvas();
}

function renderInspectCanvas() {
    const cvs = document.getElementById('inspect-canvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const srcCvs = state.inspectFace === 'back' ? backCanvas : frontCanvas;

    cvs.width = srcCvs.width;
    cvs.height = srcCvs.height;
    ctx.drawImage(srcCvs, 0, 0);
}
