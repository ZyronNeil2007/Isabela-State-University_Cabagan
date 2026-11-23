/* ── module: features/card-preview/security-fx.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { renderCanvases } from '../id-generator/render-engine.js';
import { showToast } from '../../utils/toast.js';
import { CAMPUS_CONFIG } from '../campus-theme/campus-theme.js';

/** Toggle Security Hologram & Watermark Overlay */
export function toggleHologramOverlay() {
    state.showHologram = !state.showHologram;
    playAudioFx('click');
    const btn = document.getElementById('btn-toggle-hologram');
    if (btn) btn.classList.toggle('active', state.showHologram);
    showToast(state.showHologram ? 'Security Watermark & Hologram Enabled' : 'Hologram Overlay Disabled', 'info');
    renderCanvases();
}

/** Web Audio API Synthesizer */
export function playAudioFx(type) {
    if (!state.audioEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!window._appAudioCtx) {
            window._appAudioCtx = new AudioCtx();
        }
        const ctx = window._appAudioCtx;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;

        if (type === 'flip') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'chime' || type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.06);
            osc.frequency.setValueAtTime(783.99, now + 0.12);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'click' || type === 'tab') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.03);
            osc.start(now);
            osc.stop(now + 0.03);
        }
    } catch (e) {}
}

/** Toggle Web Audio FX Mute */
export function toggleAudioFx() {
    state.audioEnabled = !state.audioEnabled;
    const btn = document.getElementById('btn-toggle-audio');
    const icon = document.getElementById('audio-icon');
    if (btn) btn.classList.toggle('active', state.audioEnabled);
    if (icon) icon.className = state.audioEnabled ? 'ph ph-speaker-high' : 'ph ph-speaker-slash';
    showToast(state.audioEnabled ? 'Sound FX Enabled' : 'Sound Muted', 'info');
    if (state.audioEnabled) playAudioFx('click');
}

/** Render Hologram Security Watermark on Canvas */
export function drawHologramWatermark(ctx, width, height) {
    if (!state.showHologram) return;
    ctx.save();

    // Subtle official seal watermark pattern in center
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // UV Guilloche security curves across card
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = CAMPUS_CONFIG[state.campusTheme]?.accent || '#d4af37';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const yOffset = height * (0.18 + i * 0.16);
        for (let x = 0; x <= width; x += 10) {
            const y = yOffset + Math.sin(x * 0.02 + i * 1.5) * 15;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Iridescent ribbon sheen reflection
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.02)');
    grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
    grad.addColorStop(0.6, 'rgba(0, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
}
