# Contributing

Thanks for helping improve the ISU Premium ID Generator! Please read [`AGENTS.md`](AGENTS.md) first — it is the
rule set for every contributor (human or AI).

## Ground rules
- Vanilla HTML/CSS/JS only: **no framework, no bundler, no backend** (see `AGENTS.md` §2).
- Update `state` first, then call `renderCanvases()` — never draw to the canvases directly.
- Do not change `CONFIG` / `CONFIG_2026` coordinates, `SESSION_KEY`, or the student data shape without discussion.
- Keep `web/` and `android/app/src/main/assets/www/` in sync (`scripts/sync-android-assets`).
- Bump the service-worker cache name (`isu-id-vX.Y.Z`) whenever a cached asset changes.

## Local development
The app uses ES modules, which browsers refuse to load from `file://`. Serve `web/` over HTTP:

```bash
cd web
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```

## Before opening a PR
```bash
node scripts/validation/check-references.js          # every referenced file exists
NODE_PATH=$(npm root -g) node scripts/validation/regression.js   # needs: npm i -g playwright
```
Then walk through the manual checklist in `AGENTS.md` §13 and fill in the PR template.

Commit style: `type(scope): summary` (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`). Keep commits small and logically separate.

## Adding a new ID template (e.g. 2027)
The 2026 template is the reference implementation: a blank template PNG pair, a `CONFIG_2026`-style coordinate map, a
renderer branch in the canvas render engine, and (optionally) a live HTML preview card. See
`docs/architecture/ARCHITECTURE.md` for the module that owns each part and `docs/design/DESIGN_SYSTEM.md` for styling.

## Reporting bugs / requesting features
Open a GitHub issue using the templates. Include browser, device/screen size and steps to reproduce. Known open items
are listed in [`docs/development/KNOWN_ISSUES.md`](docs/development/KNOWN_ISSUES.md).
