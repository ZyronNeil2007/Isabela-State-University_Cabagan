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
