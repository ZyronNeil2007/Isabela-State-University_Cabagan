# Security Policy

## Privacy model
The ISU Premium ID Generator is a fully client-side app: names, ID numbers, photos and signatures never leave the
user's device (no backend, no analytics, no cookies). Session data is stored in the browser's `localStorage`
(`isu_id_session_v1`) and, in the Android app, in an on-device Room database.

## Reporting a vulnerability
Please **do not** open a public issue for security problems. Use GitHub's private vulnerability reporting
(*Security → Report a vulnerability*) on this repository, or contact the maintainer listed in the README.
Include steps to reproduce, affected version, and impact. We aim to acknowledge reports within 7 days.

## Scope notes
- Third-party scripts are loaded from CDNs; see `docs/security/THIRD_PARTY.md` for the inventory and SRI status.
- The service worker only caches same-origin GET requests.
