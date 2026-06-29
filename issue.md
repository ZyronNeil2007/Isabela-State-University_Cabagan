# Features implemented on 2026-06-24

## 1. Support CSV Bulk Import for Unlimited Student IDs

### Problem Description
The premium ID generator was restricted to a maximum of 5 student tabs when adding them manually (`MAX_STUDENTS = 5`). While suitable for small groups, it created a bottleneck for administrators who need to generate cards for large classes or entire batches (e.g., 50+ students) at once. Manually copying and pasting student details into individual forms is tedious and error-prone.

### Implemented Solution
A client-side CSV bulk student import system has been introduced:
1. **CSV File Input**: Added a hidden `<input type="file" accept=".csv">` styled as a CSV file icon button next to the manual "Add Student" `+` button in `index.html`.
2. **Robust Client-Side Parser**: Added a Javascript CSV parser in `app.js` that splits lines and handles fields enclosed in double quotes (preserving commas inside quoted text).
3. **Fuzzy Header Matching**: Matches CSV headers using substring comparisons so columns like `Full Name`, `Student ID`, `Program`, `Date of Birth`, `Guardian`, `Home Address`, and `Contact Number` are correctly mapped to their respective form fields.
4. **Infinite Batches**: Bypasses the manual limit of 5 student tabs specifically for CSV imports, permitting unlimited student records.
5. **State Synchronization**: Automatically updates the tab array, populates values, and switches views to the first imported student so the admin can immediately see the live preview.

---

## 2. Local Signature Scanner & Extractor from White Paper

### Problem Description
Drawing a digital signature using a trackpad or mouse can yield poor, jagged results. Users prefer signing on a physical sheet of white paper and photographing it, but standard photo uploads preserve paper shadows, grey backgrounds, and misaligned margins. Users also want a solution that doesn't rely on costly external AI APIs or require them to download heavy library packages (like 70MB+ WebAssembly models).

### Implemented Solution
An instant, client-side signature scanner has been integrated:
1. **Dual Signature Modes**: Added toggle tabs in `index.html` allowing users to choose between "Draw" (traditional HTML5 canvas signature pad) and "Scan Photo".
2. **Otsu's Binarization (Auto-Thresholding)**: Integrated the classic Otsu computer vision algorithm inside `app.js` to mathematically calculate the optimal threshold for separating ink strokes from paper background. This automatically adapts to different lighting conditions and gets rid of grey paper shadows.
3. **Autocrop (Bounding-Box Detection)**: Implemented a pixel scanner that automatically finds the boundary limits of the dark ink pixels and crops the canvas tightly around the signature, removing all excess white paper margins.
4. **Contrast & Background Removal**: Applies a local contrast booster for sharp ink strokes, strips all white/grey background pixels to transparent, and normalizes the signature ink to a professional black color.

---

## 3. Landscape Print Batch Layout (5 Pairs Max per A4 Page)

### Problem Description
Previously, the PDF print batch engine output was in portrait layout, fitting a maximum of 3 student card pairs per page. For large-scale batch processing (such as after CSV imports), this led to excessive paper waste and unnecessary page breaks.

### Implemented Solution
Optimized the print engine layout to support A4 Landscape format:
1. **A4 Landscape Grid**: Configured `jsPDF` to export in `'landscape'` (297mm x 210mm) format.
2. **5-Column Alignment**: Aligned up to 5 student pairs (10 cards total) side-by-side on a single sheet.
3. **Stacked Pairs**: Placed each student's Front card on Row 1 (top) and their Back card directly below on Row 2 (bottom). This guarantees perfect horizontal alignment for easy cutting, folding, or double-sided printing.
4. **Auto-Pagination**: If the student count exceeds 5, the engine automatically adds a new landscape page for every group of 5 students.

---

## 4. Future Roadmap: College / Campus Color Theme Selector

### Description
Isabela State University (ISU) has multiple campuses across the region (Cabagan, Cauayan, Echague, etc.), each using distinct college color schemes and template accent palettes. Currently, the generator only supports the Cabagan style. Implementing a theme selector that swaps template images and matches accents would make the application useful university-wide.

### Rationale
As a solo, introverted computer science student developing this project, I currently lack official resources, color guidelines, and channels of communication with other ISU campuses. Opening this issue invites student developers and campus admins from Echague, Cauayan, and other sites to contribute assets, color specifications, and feedback to help scale the ID generator for all ISU branches!

---

## 5. v3.4.2 Comprehensive Bug Fixes (2026-06-28)

### Problem Description
The previous versions accumulated 14 minor bugs, UX issues, logic gaps, and performance risks, such as the PDF export not restoring the UI state upon failure, `alert()` dialogs interrupting the flow, Tesseract.js loading without Subresource Integrity hashes, and `localStorage` potentially exceeding quota during auto-saves.

### Implemented Solution
A comprehensive sweep was performed to resolve all 14 issues:
1. **PDF Export State Recovery**: Wrapped the export logic in a `try...finally` block to guarantee restoration of the `activeStudentIndex`.
2. **Date Format Standardization**: Added strict string parsing using `new Date()` to enforce `DD-MM-YYYY` formats globally.
3. **Canvas Resize Integrity**: Signature canvas redraws the stored `signatureImage` when window resizes clear the pixel buffer.
4. **Strict CSV Header Matching**: Upgraded the `includes()` fuzzy match to a word-boundary regex (`\b`) to prevent false-positive column mapping (e.g., "address" matching "id").
5. **Smart OCR Navigation**: `applyOcrResults` checks all fields sequentially before jumping, preserving user progress.
6. **Dynamic Hero Stats**: The Max Batch stat badge now updates dynamically past '5' if a larger CSV is imported.
7. **Destructive Action Protection**: Added a `confirm()` dialog before deleting any student tab containing inputted data.
8. **Broadened Camera Support**: Removed the hardcoded `capture="environment"` attribute to support file gallery uploads for signatures.
9. **Glassmorphism Toasts**: Replaced all jarring native `alert()` calls with an animated, non-blocking `showToast()` notification system.
10. **Card Flip Synchronization**: Enforced tight coupling between `shouldFlip`, `idCard`, and `miniCard` classes to prevent face desyncs when toggling manually.
11. **Codebase Maintenance**: Corrected module header numbers in `app.js`.
12. **Cropper Dimensional Accuracy**: Deferred the `baseScale` calculation via `requestAnimationFrame` to ensure the modal is painted before scaling.
13. **Quota Overflow Protection**: Bounded the `saveSessionToStorage` serialized payload to a safe 4.5MB limit, dropping saves and warning the user if the images are too large.
14. **Security Hardening**: Pinned Tesseract.js to `v5.1.1` and embedded cryptographic `sha384` Subresource Integrity hashes into the dynamic script tags to prevent supply-chain attacks.

---

## 6. Closed Issues (from v3.4.2)

### 🔴 High Priority — Bugs

**#01 - PDF export mutates activeStudentIndex without restoring on error** (Bug)
In the download-btn click handler, the loop sets state.activeStudentIndex = i for each student and calls renderCanvases(). If pdf.addImage() throws mid-loop, the catch block returns immediately — but the restore line (state.activeStudentIndex = originalIndex) is only in the normal flow after the loop. The active student tab will be stuck on whatever index the error occurred at, and the live preview will show the wrong student's card.

**#02 - Date-of-birth displayed in wrong format on back canvas** (Bug)
student.formData.dob.split('-').reverse().join('-') converts YYYY-MM-DD to DD-MM-YYYY. But if the user's browser locale returns the date input's value in a non-ISO format (common on iOS), the stored value may not be a clean YYYY-MM-DD string and the split/reverse will produce garbled output like undefined-undefined-undefined. A safe new Date(dob) parse with explicit formatting is more robust.

**#03 - Signature canvas loses content on window resize** (Bug)
initSignaturePad() is attached to window resize. Setting sigCanvas.width inside it always clears the canvas pixel buffer — the drawn signature disappears. The student's signatureDataUrl in state is intact, but the visual pad is blank. The fix is to re-draw the stored signature dataUrl back onto the canvas after resizing.

**#04 - CSV header fuzzy match collides — "id" matches "address"** (Bug)
The getIndex(['id', 'student', 'number']) call uses h.includes('id'). Many common column names contain the substring "id": address, period, guardian, etc. This silently maps the wrong column to idNumber. Switching to exact header matching (or at minimum checking word boundaries) prevents incorrect field assignments on real-world exports from school information systems.

**#05 - OCR applyOcrResults jumps to step 1 when all fields are filled** (Bug)
The navigation logic at the end of applyOcrResults() checks each field sequentially and calls goToStep(1) when all are present. That takes the user all the way back to the Photo upload step instead of keeping them at their current step or moving to the next unfilled field. The intent was probably to skip to the first empty step, but the fallback goToStep(1) is wrong.

### 🟡 UX Issues

**#06 - Hero stats badge still reads "5 Max Batch" even after CSV import of 50+** (UX)
The .hero-stat chip in index.html is hardcoded to 5 for "Max Batch". After a CSV import the app correctly holds unlimited students, but the hero still promises a limit of 5 — confusing for admins who just imported 50+ records and see "5 Max Batch" on the same page.

**#07 - No confirmation dialog before removing a student with data filled in** (UX)
removeStudent(index) splices the student immediately. If the tab has a name, photo, and signature, clicking the small × button destroys all that data with no undo. The session save will overwrite localStorage with the reduced list on the next render tick, so a browser refresh won't help either. A quick confirmation ("Remove student and all their data?") prevents accidental loss.

**#08 - Signature "Scan Photo" mode uses capture="environment", blocking desktop file picker** (UX)
Both #sig-photo-input and #ocr-file-input have capture="environment". On Android Chrome this forces the camera app to open immediately, preventing the user from picking an existing photo from their gallery or file system. For a signature-scan use case, users almost always have a pre-taken photo rather than wanting to snap live. The capture attribute should either be removed or made opt-in.

**#09 - Alert popups for CSV success/error interrupt the render flow** (UX)
CSV import uses alert() for both success and error messages. These are browser-native modal dialogs that block the tab, look inconsistent with the glassmorphism design, and cannot be styled. The existing setAiStatus() / status-bar pattern (already used in signature scanning and OCR) would be a much more polished in-context alternative.

### 🔵 Logic Gaps

**#10 - Card flip auto-logic conflicts with manual flipCard() toggle** (Logic)
goToStep() auto-flips the card based on step number (steps 1–4 = front, 5–9 = back). The user can also manually click the card to call flipCard(), which simply toggles the class. After a manual flip, navigating with Back/Next calls goToStep() which checks idCard.classList.contains('is-flipped') and may skip the transition entirely — leaving the card on the wrong face. The mini-card and the flip title can also get out of sync with the main card.

**#11 - Module comment index skips numbers (13 → 17, two modules both labeled "17")** (Logic)
The file header lists modules 1–13 then jumps to 17 and 18. In the actual code, Session Save is labeled section 17 and OCR is labeled section 18 — but the code also has a section actually named "17. AI SIGNATURE" (line 1345) that is a different block. Two sections share the number 17. This makes navigation confusing and suggests the module numbering was never updated after features were added.

**#12 - Cropper baseScale calculated before the modal is visible — always returns 0** (Logic)
In openCropper(), frame.getBoundingClientRect() is called while the cropper modal still has display:none / no active class (it is added on the line before, but CSS transitions haven't rendered yet). The returned rect dimensions may be 0×0, causing baseScale to be Infinity or NaN. The safest fix is to compute baseScale inside a requestAnimationFrame callback after the modal is painted.

### 🟣 Performance / Risk

**#13 - Session save can exceed localStorage quota after bulk CSV import** (Perf / Risk)
saveSessionToStorage() serialises every student's photoDataUrl and signatureDataUrl as base64 strings. A single cropped photo is ~80–200 KB as base64. With 50 CSV-imported students (even without photos, just form data), the JSON string grows substantially. With photos, 10–20 students can easily push past the typical 5 MB localStorage limit. The current catch silently ignores quota errors. A smarter approach would be to cap the session to the manual limit (5) or warn the user when saving is not possible.

**#14 - Tesseract.js loaded from unpkg.com without SRI hash** (Perf / Risk)
The lazy-loaded Tesseract script tag in ensureTesseractLoaded() uses a bare unpkg.com URL with no integrity attribute. If the CDN is compromised or the package is hijacked, malicious code runs with full access to the student data already in memory (names, ID numbers, DOBs). Adding a Subresource Integrity hash (integrity="sha384-…") to the dynamically created <script> tag mitigates this.

---
**Summary:**
- 5 bugs — the most urgent being the PDF export that permanently corrupts the active student index on any error (#01), and the CSV fuzzy header matcher falsely matching "id" inside "address" (#04).
- 4 UX issues — the capture="environment" on the signature photo input (#08) is probably the most disruptive: on Android it forces the camera to open instead of letting the user pick an existing photo. The raw alert() dialogs in CSV import (#09) are also worth replacing since you already have a styled status bar pattern in the codebase.
- 3 logic gaps — the manual card flip vs. auto-flip conflict (#10) is subtle but reproducible: flip the card by clicking it, then press Next a few times and the card face won't match the current step.
- 2 performance/risk items — the localStorage quota issue (#13) will silently fail for large CSV batches with photos, and the missing SRI hash on the Tesseract CDN script (#14) is a low-effort security improvement worth adding.
