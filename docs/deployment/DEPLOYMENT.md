# Deployment

## Web (GitHub Pages)
`.github/workflows/deploy-pages.yml` publishes the **`web/`** directory as the site root on every push to `main`
(or `beta`). Everything the app needs at runtime must therefore live inside `web/`. The repository-root `index.html`
and `404.html` only redirect to `./web/` for project-site URLs.

Release checklist: bump the service-worker cache name (`web/sw.js`), the `style.css?v=` query string(s) in
`web/index.html`/`web/sw.js`, the Android `versionName/versionCode`, update `CHANGELOG.md`, run the validation scripts,
and sync the Android assets.

## Android
The Android app embeds the web build under `android/app/src/main/assets/www/` and serves it through
`WebViewAssetLoader` at `https://appassets.androidplatform.net/assets/www/`. Run `scripts/sync-android-assets`
before building a release.

## Local serving
ES modules need HTTP(S): `cd web && python3 -m http.server 8000`.
