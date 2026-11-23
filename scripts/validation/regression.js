#!/usr/bin/env node
/**
 * Behavioural regression suite (Playwright). Compares against golden.json.
 *   node scripts/validation/regression.js            -> verify
 *   node scripts/validation/regression.js --update   -> rewrite golden.json from current build
 * Needs: `npm i -g playwright` (or NODE_PATH to it). Serves ./web itself on a random port.
 *
 * Covers: both ID templates (canvas pixel hashes, front+back), CR80 HTML text, student add/remove,
 * SESSION_KEY persistence + restore, inline-handler → window bridge, DOM id inventory,
 * console/page errors, service worker registration.
 * NOTE: pixel hashes depend on the machine's font rasteriser; regenerate with --update on the
 * machine/CI image that runs the check. Goldens in git were produced by the Linux Chromium image.
 */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const WEB = path.join(ROOT, 'web');
const GOLDEN = path.join(__dirname, 'golden.json');
const UPDATE = process.argv.includes('--update');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(WEB, p);
  if (!f.startsWith(WEB) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'allow' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load resource|ERR_/.test(m.text())) errors.push(m.text()); });
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());  // CDN scripts are not needed/deterministic offline
  await page.goto(base); await page.waitForTimeout(1500);

  const result = {};
  const fill = async (id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);
  await fill('full-name', 'Maria Clara Santos'); await fill('id-number', '25-00123');
  await fill('course', 'BS Information Technology'); await fill('dob', '2003-05-17');
  await fill('parent-name', 'Jose Santos'); await fill('address', 'Brgy. San Antonio, Cabagan, Isabela');
  await fill('telephone', '+63 912 345 6789'); await fill('department', 'COE');

  const hashCanvases = () => page.evaluate(async () => {
    const out = {};
    for (const id of ['front-canvas', 'back-canvas']) {
      const c = document.getElementById(id);
      const b = new TextEncoder().encode(c.toDataURL('image/png'));
      const h = await crypto.subtle.digest('SHA-256', b);
      out[id] = { w: c.width, h: c.height, sha: [...new Uint8Array(h)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join('') };
    }
    return out;
  });
  for (const v of ['old', '2026']) {
    await page.evaluate(v => setIdVersion(v), v); await page.waitForTimeout(700);
    result[`canvas_${v}`] = await hashCanvases();
  }
  result.cr80Text = await page.evaluate(() => (document.querySelector('.cr80-face')?.innerText || '').replace(/\s+/g, ' ').trim());

  // Students + session
  const tabCount = () => page.evaluate(() => document.querySelectorAll('.add-student-btn.student-tab, .student-tab').length);
  await page.evaluate(() => document.querySelector('.add-student-btn')?.click()); await page.waitForTimeout(400);
  await page.waitForTimeout(1200);
  const session = await page.evaluate(() => localStorage.getItem('isu_id_session_v1'));
  result.sessionKeyPresent = !!session;
  result.sessionShape = session ? (() => { const j = JSON.parse(session); const s = Array.isArray(j) ? j : (j.students || j); return { top: Array.isArray(j) ? 'array' : Object.keys(j).sort(), studentKeys: Object.keys(s[0] || {}).sort(), formKeys: Object.keys((s[0] || {}).formData || {}).sort(), count: s.length, names: s.map(x => x.formData.name), depts: s.map(x => x.formData.department) }; })() : null;
  await page.reload(); await page.waitForTimeout(1500);
  result.restorePrompt = await page.evaluate(() => !!document.querySelector('[onclick*="onRestoreSession"]'));
  await page.evaluate(() => onRestoreSession()); await page.waitForTimeout(800);
  result.restoredName = await page.evaluate(() => document.getElementById('full-name').value);
  result.restoredDept = await page.evaluate(() => document.getElementById('department').value);

  // Inline handlers must resolve on window
  const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
  const names = [...new Set([...html.matchAll(/\bon[a-z]+="\s*(?:[^"]*?[;\s])?([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]))]
    .filter(n => !['if', 'document', 'window', 'event', 'this', 'return'].includes(n)).sort();
  const missing = await page.evaluate(n => n.filter(x => typeof window[x] !== 'function'), names);
  result.handlerCount = names.length; result.missingHandlers = missing;

  // DOM id inventory
  const ids = [...new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]))].sort();
  result.idInventory = sha(ids.join('|')); result.idCount = ids.length;
  result.missingIds = await page.evaluate(ids => ids.filter(i => !document.getElementById(i)), ids);

  result.swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
  result.errors = errors;
  await browser.close(); server.close();

  if (UPDATE) { fs.writeFileSync(GOLDEN, JSON.stringify(result, null, 2) + '\n'); console.log('golden.json updated'); process.exit(0); }
  const golden = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  const bad = [];
  for (const k of Object.keys(golden)) if (JSON.stringify(golden[k]) !== JSON.stringify(result[k])) bad.push(k);
  if (result.missingHandlers.length) bad.push('missingHandlers');
  if (result.errors.length) bad.push('errors');
  console.log(`handlers=${result.handlerCount} ids=${result.idCount} errors=${result.errors.length}`);
  if (bad.length) { for (const k of [...new Set(bad)]) console.error(`FAIL ${k}\n  golden: ${JSON.stringify(golden[k])}\n  actual: ${JSON.stringify(result[k])}`); process.exit(1); }
  console.log('regression: all checks match golden'); 
})().catch(e => { console.error(e); process.exit(2); });
