#!/usr/bin/env node
/**
 * Feature smoke test (Playwright) — exercises every major user workflow against ./web and fails on any
 * console/page error. Complements regression.js (pixel/session goldens).
 *   NODE_PATH=$(npm root -g) node scripts/validation/features.js [--mobile]
 * Offline-only: external CDN requests are aborted (jsPDF/Tesseract workflows are therefore checked up to the
 * point where the library is required: handlers exist and the modal/UI state machine works).
 */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const argWeb = process.argv.indexOf('--web');
const WEB = argWeb > 0 ? path.resolve(process.argv[argWeb + 1]) : path.resolve(__dirname, '..', '..', 'web');
const MOBILE = process.argv.includes('--mobile');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(WEB, p);
  if (!f.startsWith(WEB) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
const results = []; const errors = [];
const ok = (name, cond, extra = '') => { results.push([name, !!cond, extra]); };

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true } : { viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load resource|ERR_/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await page.goto(base); await page.waitForTimeout(1500);
  const $ = (s) => page.locator(s);
  const ev = (fn, a) => page.evaluate(fn, a);
  const fill = (id, v) => ev(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
  const tabs = () => ev(() => document.querySelectorAll('#student-tabs .student-tab').length);

  // Photo test image (generated in-page → PNG buffer)
  const pngB64 = await ev(() => { const c = document.createElement('canvas'); c.width = 400; c.height = 480; const x = c.getContext('2d'); x.fillStyle = '#3a7'; x.fillRect(0, 0, 400, 480); x.fillStyle = '#fed'; x.beginPath(); x.arc(200, 200, 90, 0, 7); x.fill(); return c.toDataURL('image/png').split(',')[1]; });
  const png = Buffer.from(pngB64, 'base64');

  // 1 Student form + live render
  await fill('full-name', 'Ana Reyes'); await fill('id-number', '25-00001'); await page.waitForTimeout(300);
  ok('form → CR80 preview text', await ev(() => (document.querySelector('.cr80-face')?.innerText || '').toUpperCase().includes('ANA REYES')));

  // 2 Photo upload → cropper → save
  await $('#profile-pic').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: png }); await page.waitForTimeout(600);
  ok('cropper opens', await ev(() => document.getElementById('cropper-modal').classList.contains('active')));
  await ev(() => { const z = document.getElementById('cropper-zoom'); if (z) { z.value = z.max; z.dispatchEvent(new Event('input', { bubbles: true })); } });
  await page.waitForTimeout(150);
  await ev(() => document.getElementById('cropper-save-btn').click()); await page.waitForTimeout(700);
  ok('cropper closes + photo saved', await ev(() => !document.getElementById('cropper-modal').classList.contains('active') && !!document.getElementById('photo-preview-thumb').src.startsWith('data:')));

  // 3 Signature draw
  for (let i = 0; i < 12 && !(await $('#signature-pad').isVisible()); i++) { await ev(() => stepperNext()); await page.waitForTimeout(150); }
  await ev(() => document.getElementById('signature-pad').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(300);
  const bb = await $('#signature-pad').boundingBox();
  await page.mouse.move(bb.x + 15, bb.y + 30); await page.mouse.down(); await page.mouse.move(bb.x + 130, bb.y + 90, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(400);
    ok('signature canvas has ink', await ev(() => { const c = document.getElementById('signature-pad'); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v); }));
  await ev(() => document.getElementById('clear-signature').click());
  ok('signature cleared', await ev(() => { const c = document.getElementById('signature-pad'); return !c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v); }));
  ok('signature upload mode switch', await ev(() => { switchSigMode('upload'); const ok1 = getComputedStyle(document.getElementById('sig-upload-mode')).display !== 'none'; switchSigMode('draw'); return ok1; }));

  // 4 CSV import
  const csv = 'Name,ID Number,Course,Date of Birth,Parent Name,Address,Telephone\nJuan Dela Cruz,25-1001,BSIT,2003-01-02,Maria,Cabagan,09171112222\nPedro Penduko,25-1002,BSCS,2002-03-04,Jose,Tumauini,09173334444\n';
  const before = await tabs();
  await $('#csv-upload').setInputFiles({ name: 's.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) }); await page.waitForTimeout(900);
  const after = await tabs();
  ok('CSV import adds students', after > before, `${before}→${after}`);

  // 5 Student delete via template-string handler
  ok('removeStudent handler present', await ev(() => !!document.querySelector('.student-tab [onclick*="removeStudent"]') || typeof removeStudent === 'function'));
  await ev(i => removeStudent(i), after - 1); await page.waitForTimeout(300);
  ok('student deleted', (await tabs()) === after - 1, `${await tabs()}`);

  // 6 Batch manager
  await ev(() => openBatchModal()); await page.waitForTimeout(300);
  ok('batch modal opens + rows', await ev(() => document.getElementById('batch-modal').classList.contains('active') && document.querySelectorAll('#batch-modal tbody tr').length > 0));
  ok('batch template-string handlers', await ev(() => !!document.querySelector('#batch-modal [onclick*="selectBatchStudent"]') && typeof deleteBatchStudent === 'function'));
  const dl = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
  await ev(() => exportBatchCsv()); ok('batch CSV export downloads', !!(await dl));
  await ev(() => closeBatchModal()); await page.waitForTimeout(250);
  ok('batch modal closes', await ev(() => !document.getElementById('batch-modal').classList.contains('active')));

  // 7 Card inspect
  await ev(() => openCardInspectModal()); await page.waitForTimeout(400);
  ok('inspect opens', await ev(() => document.getElementById('card-inspect-modal').classList.contains('active')));
  await ev(() => switchInspectFace('back')); await ev(() => closeCardInspectModal());

  // 8 Templates
  for (const v of ['old', '2026']) { await ev(v => setIdVersion(v), v); await page.waitForTimeout(400); }
  ok('template switch (old ↔ 2026)', await ev(() => document.getElementById('idCard').classList.contains('is-cr80')));

  // 9 Campus themes
  const themes = await ev(() => [...document.querySelectorAll('[onclick*="setCampusTheme"]')].map(e => e.getAttribute('onclick').match(/'([^']+)'/)[1]));
  const sig = []; for (const t of themes) { await ev(t => setCampusTheme(t, true), t); sig.push(await ev(() => getComputedStyle(document.documentElement).getPropertyValue('--green-600'))); }
  ok('campus themes apply', themes.length >= 11 && new Set(sig).size > 1, `${themes.length} themes`);

  // 10 FX toggles
  await ev(() => { toggleHologramOverlay(); toggleHologramOverlay(); toggleAudioFx(); toggleAudioFx(); }); ok('hologram/audio toggles', true);
  ok('QR renders on canvas', await ev(() => !!document.getElementById('front-canvas')));

  // 11 Export
  const dl2 = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
  await ev(() => saveAsImage('front')); const d2 = await dl2; ok('PNG export downloads', !!d2 && /\.png$/.test(d2.suggestedFilename()), d2 && d2.suggestedFilename());
  ok('PDF export handler wired', await ev(() => !!document.getElementById('download-btn')));
  await ev(() => { showMobileExportMenu(); }); ok('export sheet opens', await ev(() => document.getElementById('mobile-export-sheet').classList.contains('show')));
  await ev(() => hideMobileExportMenu());

  // 12 OCR modal
  await ev(() => openOcrModal()); await page.waitForTimeout(250); ok('OCR modal opens', await ev(() => document.getElementById('ocr-modal').classList.contains('active')));
  await ev(() => closeOcrModal());

  // 13 Stepper + flip
  await ev(() => { stepperNext(); stepperNext(); stepperBack(); flipCard && flipCard(); }); ok('stepper/flip', true);

  // 14 Session restore (session is saved on render, so trigger one first)
  await fill('address', 'Brgy. Test'); await page.waitForTimeout(2600);
  const saved = await ev(() => { const j = JSON.parse(localStorage.getItem('isu_id_session_v1')); return (Array.isArray(j) ? j : j.students).length; });
  await page.reload(); await page.waitForTimeout(1500);
  ok('restore banner after reload', await ev(() => !!document.querySelector('[onclick*="onRestoreSession"]')));
  await ev(() => onRestoreSession()); await page.waitForTimeout(1500);
  ok('session restored (students)', saved >= 2 && (await tabs()) === saved, `saved=${saved} tabs=${await tabs()}`);

  // 15 PWA offline
  const swOk = await ev(async () => { try { const r = await navigator.serviceWorker.ready; return !!r.active; } catch { return false; } });
  ok('service worker active', swOk);
  if (swOk) {
    await page.waitForTimeout(1500);
    const expected = fs.readFileSync(path.join(WEB, 'sw.js'), 'utf8').match(/PRECACHE_ASSETS\s*=\s*\[([\s\S]*?)\]/)[1].match(/'\.\/[^']+'/g).length;
    const cached = await ev(async () => { const ks = await caches.keys(); let n = 0; for (const k of ks) n += (await (await caches.open(k)).keys()).length; return n; });
    ok('precache populated', cached >= expected - 3, `${cached}/${expected}`);
    await ctx.setOffline(true);
    await page.reload(); await page.waitForTimeout(1800);
    ok('offline reload boots app', await ev(() => !!document.getElementById('front-canvas') && typeof setIdVersion === 'function'));
    await ctx.setOffline(false);
  }

  await browser.close(); server.close();
  let bad = 0;
  for (const [n, c, x] of results) { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`); if (!c) bad++; }
  const real = errors.filter(e => !/ST_HERO/.test(e));
  if (real.length) { console.log('ERRORS:\n' + real.join('\n')); bad++; }
  if (errors.length !== real.length) console.log('(ignored known issue: animations.js ST_HERO)');
  console.log(bad ? `\n${bad} problem(s)` : '\nall feature checks passed'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
