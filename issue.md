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
