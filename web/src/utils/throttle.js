/* ── module: utils/throttle.js — extracted verbatim from form-bindings.js ── */
/**
 * Throttle: at most once per `limit` ms.
 * Used for saveSessionToStorage to avoid LocalStorage thrash.
 */
export function throttle(fn, limit = 2000) {
    let lastRun = 0;
    let timer = null;
    return function(...args) {
        const now = Date.now();
        const remaining = limit - (now - lastRun);
        if (remaining <= 0) {
            clearTimeout(timer);
            lastRun = now;
            fn.apply(this, args);
        } else {
            clearTimeout(timer);
            timer = setTimeout(() => {
                lastRun = Date.now();
                fn.apply(this, args);
            }, remaining);
        }
    };
}
