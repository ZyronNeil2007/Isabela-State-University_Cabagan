#!/usr/bin/env node
/**
 * ISU ID Generator — Responsive QA harness
 * ----------------------------------------
 * Loads the app at every target viewport (portrait + landscape for phones/tablets) and measures:
 *   • horizontal overflow of the page + the elements that cause it
 *   • touch-target sizes (interactive elements smaller than 44 px on touch viewports)
 *   • layout mode of the generator (single column / two columns) and sticky preview
 *   • modal + drawer + export-sheet fit (inside the viewport, actions reachable)
 *   • the 2026 CR80 card scale, console errors
 *
 * Dev-only tool (not part of the PWA, not precached). Requires Playwright.
 *
 *   cd web && python3 -m http.server 8000 &
 *   node scripts/responsive_qa.js --base http://localhost:8000 --out /tmp/qa --label after [--shots]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
    if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return a;
}, []));
const BASE = args.base || 'http://localhost:8000';
const OUT = args.out || '/tmp/qa';
const LABEL = args.label || 'run';
const SHOTS = !!args.shots;
fs.mkdirSync(OUT, { recursive: true });

const PROFILES = [
    { name: 'Small phone',    w: 320,  h: 568,  touch: true,  orient: ['portrait', 'landscape'] },
    { name: 'Standard phone', w: 375,  h: 812,  touch: true,  orient: ['portrait', 'landscape'] },
    { name: 'Large phone',    w: 430,  h: 932,  touch: true,  orient: ['portrait', 'landscape'] },
    { name: 'Small tablet',   w: 768,  h: 1024, touch: true,  orient: ['portrait', 'landscape'] },
    { name: 'Large tablet',   w: 1024, h: 768,  touch: true,  orient: ['landscape', 'portrait'] },
    { name: 'Laptop',         w: 1366, h: 768,  touch: false, orient: ['landscape'] },
    { name: 'Desktop',        w: 1440, h: 900,  touch: false, orient: ['landscape'] },
    { name: 'Large desktop',  w: 1920, h: 1080, touch: false, orient: ['landscape'] }
];

const MODALS = [
    { id: 'ocr-modal',          open: "openOcrModal()" },
    { id: 'batch-modal',        open: "openBatchModal()" },
    { id: 'card-inspect-modal', open: "openCardInspectModal()" },
    { id: 'cropper-modal',      open: "document.getElementById('cropper-modal').classList.add('active')" }
];

/** Runs inside the page: returns overflow offenders + small tap targets */
function pageProbe(isTouch) {
    const vw = document.documentElement.clientWidth;
    const sel = el => {
        let s = el.tagName.toLowerCase();
        if (el.id) s += '#' + el.id;
        else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
        return s;
    };
    const visible = el => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const clippedByAncestor = el => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const cs = getComputedStyle(p);
            if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) return true;
            if (cs.position === 'fixed' && (cs.visibility === 'hidden' || +cs.opacity === 0)) return true;
        }
        return false;
    };
    const offenders = [];
    document.querySelectorAll('body *').forEach(el => {
        if (el.closest('[aria-hidden="true"]') || el.closest('.mobile-drawer') || el.closest('.cropper-modal-overlay') || el.closest('.mobile-export-sheet')) return;
        if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.right > vw + 1 || r.left < -1) {
            if (!visible(el) || clippedByAncestor(el)) return;
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' && r.left >= vw) return;
            offenders.push({ el: sel(el), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
        }
    });
    offenders.sort((a, b) => b.right - a.right);

    const small = [];
    if (isTouch) {
        document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"]), label[for]').forEach(el => {
            if (!visible(el)) return;
            if (el.closest('[aria-hidden="true"]') || el.closest('.mobile-drawer') || el.closest('.cropper-modal-overlay') || el.closest('.mobile-export-sheet')) return;
            if (el.tagName === 'INPUT' && /(file|checkbox|radio)/.test(el.type)) return;
            const r = el.getBoundingClientRect();
            const m = Math.min(r.width, r.height);
            if (m < 44) small.push({ el: sel(el), w: Math.round(r.width), h: Math.round(r.height) });
        });
    }
    const gen = document.getElementById('generator');
    const form = document.querySelector('.form-section');
    const prev = document.querySelector('.preview-section');
    let layout = 'n/a', sticky = 'n/a', previewVisible = false;
    if (form && prev) {
        const f = form.getBoundingClientRect(), p = prev.getBoundingClientRect();
        layout = Math.abs(f.top - p.top) < 40 && (p.left > f.right - 10) ? 'two-column' : 'stacked';
        sticky = getComputedStyle(prev).position;
        previewVisible = visible(prev);
    }
    const card = document.querySelector('.cr80-stage');
    return {
        scrollW: document.documentElement.scrollWidth, clientW: vw,
        overflowPx: Math.max(0, document.documentElement.scrollWidth - vw),
        bodyOverflowX: getComputedStyle(document.body).overflowX,
        offenders: offenders.slice(0, 6), offenderCount: offenders.length,
        smallTargets: small.length, smallSamples: small.slice(0, 30),
        layout, previewPosition: sticky, previewVisible,
        cardScale: card ? +parseFloat(getComputedStyle(card).getPropertyValue('--cr80-scale')).toFixed(3) : null,
        cardWidth: card ? Math.round(card.getBoundingClientRect().width) : null
    };
}

/** Runs inside the page: how does an open modal/sheet fit the viewport? */
function fitProbe(id) {
    const ov = document.getElementById(id);
    if (!ov) return { missing: true };
    const panel = ov.querySelector('.cropper-modal, .mobile-drawer, .sheet-content') || ov.firstElementChild || ov;
    const r = panel.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight;
    const actions = [...ov.querySelectorAll('button, [role=button], a[href]')].filter(b => {
        const br = b.getBoundingClientRect(); const cs = getComputedStyle(b);
        return br.width > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    });
    const lastBtn = actions[actions.length - 1];
    const lb = lastBtn ? lastBtn.getBoundingClientRect() : null;
    const scrollable = ['.cropper-body', '.ocr-body', '.batch-table-wrapper', '.sheet-content', '.mobile-drawer-nav'].some(s => { const e = ov.querySelector(s); return e && e.scrollHeight > e.clientHeight; })
        || panel.scrollHeight > panel.clientHeight || ov.scrollHeight > ov.clientHeight;
    return {
        panelW: Math.round(r.width), panelH: Math.round(r.height), vw, vh,
        fitsW: r.left >= -1 && r.right <= vw + 1, fitsH: r.top >= -1 && r.bottom <= vh + 1,
        radiusTop: getComputedStyle(panel).borderTopLeftRadius, anchoredBottom: Math.abs(r.bottom - vh) < 2,
        lastActionVisible: lb ? (lb.bottom <= vh + 1 && lb.top >= 0) : null,
        scrollable
    };
}

(async () => {
    const browser = await chromium.launch();
    const results = [];
    for (const prof of PROFILES) {
        for (const orient of prof.orient) {
            const land = orient === 'landscape';
            const w = land ? Math.max(prof.w, prof.h) : Math.min(prof.w, prof.h);
            const h = land ? Math.min(prof.w, prof.h) : Math.max(prof.w, prof.h);
            if (prof.w >= 1366 && orient !== 'landscape') continue;
            const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: prof.touch && w < 1100, hasTouch: prof.touch });
            const page = await ctx.newPage();
            const errs = [];
            page.on('pageerror', e => errs.push(e.message));
            page.on('console', m => { if (m.type() === 'error' && !/ERR_|net::|Failed to load resource|fonts\.g/.test(m.text())) errs.push(m.text()); });
            const t0 = Date.now();
            await page.goto(BASE + '/index.html', { waitUntil: 'load' });
            const loadMs = Date.now() - t0;
            await page.waitForTimeout(2200);
            const row = { profile: prof.name, orient, viewport: `${w}×${h}`, loadMs };
            row.page = await page.evaluate(pageProbe, prof.touch && w <= 1024);
            // generator-focused probe (scrolled to the generator)
            await page.evaluate(() => document.getElementById('generator').scrollIntoView());
            await page.waitForTimeout(500);
            row.generator = await page.evaluate(pageProbe, prof.touch && w <= 1024);
            if (SHOTS) {
                await page.screenshot({ path: path.join(OUT, `${LABEL}_${prof.name.replace(/ /g, '')}_${orient}_generator.png`) });
                await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(250);
                await page.screenshot({ path: path.join(OUT, `${LABEL}_${prof.name.replace(/ /g, '')}_${orient}_top.png`) });
            }
            // modals
            row.modals = {};
            for (const m of MODALS) {
                await page.evaluate(m.open).catch(() => {});
                await page.waitForTimeout(450);
                row.modals[m.id] = await page.evaluate(fitProbe, m.id);
                if (SHOTS && ['batch-modal', 'ocr-modal'].includes(m.id)) await page.screenshot({ path: path.join(OUT, `${LABEL}_${prof.name.replace(/ /g, '')}_${orient}_${m.id}.png`) });
                await page.evaluate(id => { document.getElementById(id)?.classList.remove('active'); document.body.style.overflow = ''; }, m.id);
                await page.waitForTimeout(150);
            }
            // mobile drawer + export sheet
            const burger = await page.$('#nav-hamburger');
            if (burger && await burger.isVisible()) {
                await burger.click().catch(() => {}); await page.waitForTimeout(450);
                row.drawer = await page.evaluate(fitProbe, 'mobile-drawer');
                if (SHOTS) await page.screenshot({ path: path.join(OUT, `${LABEL}_${prof.name.replace(/ /g, '')}_${orient}_drawer.png`) });
                await page.evaluate(() => document.getElementById('mobile-drawer-close')?.click()); await page.waitForTimeout(300);
            } else row.drawer = { hamburgerHidden: true };
            await page.evaluate(() => showMobileExportMenu && showMobileExportMenu()).catch(() => {}); await page.waitForTimeout(400);
            row.exportSheet = await page.evaluate(() => { const s = document.getElementById('mobile-export-sheet'); if (!s) return { missing: true }; const r = s.getBoundingClientRect(); return { shown: s.classList.contains('show'), top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, fits: r.top >= 0 && r.bottom <= innerHeight + 1 }; });
            row.errors = errs;
            results.push(row);
            await ctx.close();
        }
    }
    await browser.close();
    fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(results, null, 2));

    // ── summary ──
    const pad = (s, n) => String(s).padEnd(n);
    console.log(pad('viewport', 22) + pad('overflow', 10) + pad('layout', 12) + pad('sticky', 9) + pad('small tap', 10) + pad('modals(fit W/H)', 26) + 'drawer/sheet  errs');
    for (const r of results) {
        const mod = Object.entries(r.modals).map(([k, v]) => (v.fitsW && v.fitsH) ? '✓' : (v.fitsW ? 'H' : 'W')).join('');
        const dr = r.drawer.hamburgerHidden ? '–' : ((r.drawer.fitsW && r.drawer.fitsH) ? '✓' : 'x');
        console.log(pad(`${r.profile} ${r.orient[0].toUpperCase()} ${r.viewport}`, 22) + pad(r.page.overflowPx + 'px/' + r.generator.overflowPx + 'px', 10) + pad(r.generator.layout, 12) + pad(r.generator.previewPosition, 9) + pad(r.generator.smallTargets, 10) + pad(mod + ' (ocr,batch,insp,crop)', 26) + dr + '/' + (r.exportSheet.fits ? '✓' : 'x') + '   ' + r.errors.length);
    }
})();
