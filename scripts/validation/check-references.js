#!/usr/bin/env node
/**
 * Reference checker — verifies that every local file referenced by the web app exists.
 * Scans index.html (src/href), CSS url(), JS string literals that look like asset paths,
 * sw.js PRECACHE_ASSETS, manifest icons, and root redirect pages.
 * No dependencies. Usage: node scripts/validation/check-references.js [--web web] [--www android/app/src/main/assets/www]
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const ROOT = path.resolve(__dirname, '..', '..');
const WEB = path.resolve(ROOT, opt('--web', 'web'));

let failures = 0, checked = 0;
const strip = u => u.split('#')[0].split('?')[0];
const isLocal = u => u && !/^(https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(u);

function check(from, ref, base) {
  if (!isLocal(ref)) return;
  const clean = strip(ref);
  if (!clean || clean === './') return;
  const target = path.resolve(base, clean);
  checked++;
  if (!fs.existsSync(target)) {
    failures++;
    console.error(`MISSING  ${path.relative(ROOT, from)} -> ${ref}`);
  }
}

const read = p => fs.readFileSync(p, 'utf8');
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walk(p, out); } else out.push(p);
  }
  return out;
};

// HTML files
for (const f of walk(WEB).filter(f => f.endsWith('.html'))) {
  const s = read(f);
  for (const m of s.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) check(f, m[1], path.dirname(f));
}
// CSS url()
for (const f of walk(WEB).filter(f => f.endsWith('.css'))) {
  for (const m of read(f).matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) check(f, m[1], path.dirname(f));
  for (const m of read(f).matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) check(f, m[1], path.dirname(f));
}
// JS: asset path literals + static ES imports (resolved from the file; asset literals from web root)
for (const f of walk(WEB).filter(f => f.endsWith('.js') && !f.includes('/tools/'))) {
  const s = read(f);
  for (const m of s.matchAll(/['"`]((?:\.{0,2}\/)?(?:images|assets|fonts)\/[A-Za-z0-9_./-]+\.(?:png|jpg|jpeg|webp|svg|woff2?))(?:\?[^'"`]*)?['"`]/g)) {
    check(f, m[1], WEB);
  }
  for (const m of s.matchAll(/(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)|import\s*['"](\.[^'"]+)['"]/g)) {
    check(f, m[1] || m[2] || m[3], path.dirname(f));
  }
}
// Service worker precache
const sw = path.join(WEB, 'sw.js');
if (fs.existsSync(sw)) {
  const block = (read(sw).match(/PRECACHE_ASSETS\s*=\s*\[([\s\S]*?)\]/) || [])[1] || '';
  for (const m of block.matchAll(/['"]([^'"]+)['"]/g)) check(sw, m[1], WEB);
}
// Manifest
const mf = path.join(WEB, 'manifest.webmanifest');
if (fs.existsSync(mf)) {
  const j = JSON.parse(read(mf));
  for (const i of j.icons || []) check(mf, i.src, WEB);
  if (j.start_url) check(mf, j.start_url, WEB);
}
// Root redirect pages
for (const n of ['index.html', '404.html']) {
  const f = path.join(ROOT, n);
  if (!fs.existsSync(f)) continue;
  for (const m of read(f).matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) check(f, m[1], ROOT);
}

console.log(`${checked} references checked, ${failures} missing`);
process.exit(failures ? 1 : 0);
