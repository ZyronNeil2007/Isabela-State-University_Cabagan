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

## 2. AI Signature Scanner & Extractor from White Paper

### Problem Description
Drawing a digital signature using a trackpad or mouse can yield poor results. Users prefer signing on a physical sheet of white paper and photographing it, but standard photo uploads preserve paper shadows, grey backgrounds, and misaligned cropping, making the signature look unprofessional on a clean ID card.

### Implemented Solution
An AI signature extraction pipeline has been introduced:
1. **Dual Signature Modes**: Added toggle tabs in `index.html` allowing users to choose between "Draw" (traditional HTML5 canvas signature pad) and "AI from Photo".
2. **Claude Vision Analyzer**: Integrated an API call to Anthropic's Claude Vision (`claude-sonnet-4-6`) to evaluate a signature photo, return bounding-box coordinates for tight cropping, suggest brightness/contrast boosts, and set luminance thresholds.
3. **Automated Background Removal**: Implemented a client-side canvas-based post-processor that:
   - Crops the signature using the AI-guided percentages.
   - Adjusts contrast/brightness using pixel factor formulas.
   - Truncates gray/white background pixels to transparent, leaving only clean dark ink.
   - Sharpens ink opacity and normalizes color to a professional dark charcoal/black tone.
