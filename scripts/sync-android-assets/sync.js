#!/usr/bin/env node
/**
 * Sync web/ -> android/app/src/main/assets/www/ (the copy the Android WebView loads).
 *   node scripts/sync-android-assets/sync.js           mirror (copy changed files, delete stale ones)
 *   node scripts/sync-android-assets/sync.js --check   exit 1 if www/ has drifted (use in CI), changes nothing
 *   node scripts/sync-android-assets/sync.js --dry     print what would change
 *
 * Not shipped inside the APK: sw.js / manifest (a service worker would cache stale assets across app updates),
 * dev tools, README screenshots, source/brand logos and unused legacy design-reference overlays.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'web');
const DST = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'www');
const CHECK = process.argv.includes('--check'), DRY = process.argv.includes('--dry');

const EXCLUDE = [
  /^sw\.js$/, /^manifest\.webmanifest$/, /^\.nojekyll$/,
  /^tools\//, /^assets\/images\/screenshots\//,
  /^assets\/images\/logos\/(isu_logo|zn_logo)\.png$/,
  /^assets\/images\/templates\/legacy\/.*_reference\.png$/, /^assets\/fonts\/.*\.md$/,
];
const excluded = rel => EXCLUDE.some(r => r.test(rel));
const walk = (dir, base = dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out); else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
};
const hash = f => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');

const want = walk(SRC).filter(r => !excluded(r));
const have = walk(DST);
const add = [], change = [], stale = have.filter(r => !want.includes(r));
for (const r of want) {
  const d = path.join(DST, r);
  if (!fs.existsSync(d)) add.push(r); else if (hash(path.join(SRC, r)) !== hash(d)) change.push(r);
}
const drift = add.length + change.length + stale.length;
const list = (t, a) => a.length && console.log(`${t} (${a.length}):\n` + a.map(x => '  ' + x).join('\n'));
list('add', add); list('update', change); list('remove', stale);
if (CHECK) { console.log(drift ? `\nDRIFT: ${drift} file(s) differ. Run: node scripts/sync-android-assets/sync.js` : 'android assets in sync'); process.exit(drift ? 1 : 0); }
if (DRY) { console.log(`\n(dry run) ${drift} change(s)`); process.exit(0); }
for (const r of [...add, ...change]) { const d = path.join(DST, r); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(SRC, r), d); }
for (const r of stale) fs.unlinkSync(path.join(DST, r));
// prune empty directories
const prune = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) { prune(path.join(dir, e.name)); if (!fs.readdirSync(path.join(dir, e.name)).length) fs.rmdirSync(path.join(dir, e.name)); } };
prune(DST);
console.log(`\nsynced: ${add.length} added, ${change.length} updated, ${stale.length} removed`);
