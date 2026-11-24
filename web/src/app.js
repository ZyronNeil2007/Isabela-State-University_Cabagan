/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ISU PREMIUM ID GENERATOR — app.js
 *  Isabela State University · Spatial Edition 2026
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  MODULES:
 *  1.  CONFIG         — canvas coordinates & text layout
 *  2.  STATE          — reactive data store
 *  3.  CANVAS REFS    — DOM element references
 *  4.  SIGNATURE PAD  — freehand drawing on canvas
 *  5.  FORM BINDINGS  — real-time input → state → render
 *  6.  TEMPLATE LOAD  — async image loading
 *  7.  RENDER ENGINE  — front / back canvas draw calls
 *  8.  STEPPER        — step navigation, progress, dots
 *  9.  TILT EFFECT    — VanillaTilt 3D card hover
 * 10.  NAVBAR         — scroll-shrink behaviour
 * 11.  EXPORT         — jsPDF A4 landscape batch print
 * 12.  BOOT           — initialise everything on load
 * 13.  STUDENT TABS   — multi-student batch management
 * 14.  PHOTO CROPPER  — interactive crop & zoom modal
 * 15.  SAVE AS IMAGE  — PNG front/back export
 * 16.  CSV IMPORT     — bulk student import from CSV
 * 17.  AI SIGNATURE   — photo scan → background removal
 * 18.  SESSION SAVE   — localStorage auto-save & restore
 * 19.  OCR AUTOFILL   — Tesseract.js scan existing ID/form
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*  Entry point — ES module graph.  Import order mirrors the original single-file order so
 *  top-level side effects (listener registration, initial renders) run in the same sequence.
 *  Inline-handler functions are exposed on window by core/initialization/expose-globals.js. */
import './core/config/card-config.js';
import './core/state/state.js';
import './core/state/canvas-refs.js';
import './features/signature/signature-pad.js';
import './features/id-generator/form-bindings.js';
import './features/id-generator/templates.js';
import './features/id-generator/render-engine.js';
import './features/card-preview/cr80-preview.js';
import './features/id-generator/stepper.js';
import './features/card-preview/tilt.js';
import './core/initialization/navbar.js';
import './utils/toast.js';
import './services/export/pdf-export.js';
import './core/initialization/boot.js';
import './features/student-management/student-tabs.js';
import './features/photo-editor/cropper.js';
import './services/export/image-export.js';
import './features/csv-import/csv-import.js';
import './features/signature/ai-signature.js';
import './services/storage/session.js';
import './features/ocr/ocr.js';
import './features/campus-theme/campus-theme.js';
import './features/card-preview/security-fx.js';
import './features/qr-verification/qr-code.js';
import './features/batch-manager/batch-manager.js';
import './features/card-preview/card-inspect.js';
import './core/initialization/expose-globals.js';
