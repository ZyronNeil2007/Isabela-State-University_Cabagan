/* ── module: utils/toast.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
/**
 * Display a temporary glassmorphism toast notification.
 * @param {string} message 
 * @param {'success'|'error'|'warning'} type 
 */
export function showToast(message, type = 'success') {
    let toast = document.getElementById('isu-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'isu-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(20, 20, 20, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
            padding: 12px 24px;
            border-radius: 50px;
            z-index: 9999;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        `;
        document.body.appendChild(toast);
    }
    
    let icon = 'ph-info';
    let color = '#fff';
    if (type === 'success') { icon = 'ph-check-circle'; color = '#4ade80'; }
    if (type === 'error') { icon = 'ph-x-circle'; color = '#f87171'; }
    if (type === 'warning') { icon = 'ph-warning'; color = '#fbbf24'; }
    
    toast.innerHTML = `<i class="ph ${icon}" style="color: ${color}; font-size: 18px;"></i> <span>${message}</span>`;
    
    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });
    
    // Auto-hide
    if (toast._timer) clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
    }, 3000);
}
