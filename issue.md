# Feature: Support CSV Bulk Import for Unlimited Student IDs

## Problem Description
The premium ID generator is currently restricted to a maximum of 5 student tabs when adding them manually (`MAX_STUDENTS = 5`). While this is suitable for small groups, it creates a bottleneck for administrators who need to generate cards for large classes or entire batches (e.g., 50+ students) at once. Manually copying and pasting student details into individual forms is tedious and error-prone.

## Implemented Solution
A new client-side CSV bulk student import system has been introduced:
1. **CSV File Input**: Added a hidden `<input type="file" accept=".csv">` styled as a CSV file icon button next to the manual "Add Student" `+` button in `index.html`.
2. **Robust Client-Side Parser**: Added a Javascript CSV parser in `app.js` that splits lines and handles fields enclosed in double quotes (preserving commas inside quoted text).
3. **Fuzzy Header Matching**: Matches CSV headers using substring comparisons so columns like `Full Name`, `Student ID`, `Program`, `Date of Birth`, `Guardian`, `Home Address`, and `Contact Number` are correctly mapped to their respective form fields.
4. **Infinite Batches**: Bypasses the manual limit of 5 student tabs specifically for CSV imports, permitting unlimited student records.
5. **State Synchronization**: Automatically updates the tab array, populates values, and switches views to the first imported student so the admin can immediately see the live preview.
