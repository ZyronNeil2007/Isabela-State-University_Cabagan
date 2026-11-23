// Static checks for the ES-module graph (dev-only; the app itself has no build step).
//   npm i -g eslint globals && eslint -c scripts/validation/eslint.config.mjs web/src
// Catches: missing imports (no-undef), assignment to imports, duplicate declarations, const reassignment.
import globals from 'globals';
export default [{
  files: ['**/*.js'],
  languageOptions: {
    ecmaVersion: 2022, sourceType: 'module',
    globals: { ...globals.browser, jspdf: 'readonly', jsPDF: 'readonly', QRCode: 'readonly', Tesseract: 'readonly', VanillaTilt: 'readonly', THREE: 'readonly', gsap: 'readonly', ScrollTrigger: 'readonly', anime: 'readonly' }
  },
  rules: { 'no-undef': 'error', 'no-import-assign': 'error', 'no-const-assign': 'error', 'no-redeclare': 'error', 'no-dupe-keys': 'error', 'no-func-assign': 'error' }
}];
