## Summary
<!-- What changed and why -->

## Type
- [ ] feat  - [ ] fix  - [ ] refactor  - [ ] docs  - [ ] chore

## Checklist
- [ ] `node scripts/validation/check-references.js` passes
- [ ] `node scripts/validation/regression.js` passes (or goldens updated with justification)
- [ ] No changes to ID card dimensions/coordinates, `SESSION_KEY`, or student data shape (or approved)
- [ ] Service-worker cache name bumped if cached assets changed
- [ ] Android `assets/www` synced (`scripts/sync-android-assets`)
- [ ] Tested on mobile + tablet + desktop widths
- [ ] Docs updated (README / CHANGELOG / architecture)
