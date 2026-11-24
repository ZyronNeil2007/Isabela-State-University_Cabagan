/* ── module: features/csv-import/csv-import.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { showToast } from '../../utils/toast.js';
import { switchStudent } from '../student-management/student-tabs.js';

/* ═══════════════════════════════════════════════════════════════════════════
   16. CSV BULK IMPORT
═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('csv-upload')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
            showToast('CSV file is empty or missing headers.', 'error');
            return;
        }

        // Simple CSV parser supporting quotes
        function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"' && line[i+1] === '"') {
                    current += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        }

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        
        // Find indices for common headers
        const getIndex = (possibleNames) => {
            for (const name of possibleNames) {
                const idx = headers.findIndex(h => new RegExp(`\\b${name}\\b`, 'i').test(h));
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const idxName = getIndex(['name', 'full']);
        const idxId = getIndex(['id', 'student', 'number']);
        const idxCourse = getIndex(['course', 'program', 'degree']);
        const idxDob = getIndex(['dob', 'birth', 'date']);
        const idxParent = getIndex(['parent', 'guardian']);
        const idxAddress = getIndex(['address', 'home']);
        const idxTel = getIndex(['tel', 'phone', 'mobile', 'contact']);

        let addedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length < 2) continue; // Skip empty/malformed rows

            const newStudent = {
                photoImage: null,
                photoDataUrl: null,
                rawSourceImage: null,
                signatureImage: null,
                signatureDataUrl: null,
                formData: {
                    name: idxName !== -1 ? (row[idxName] || '').toUpperCase() : '',
                    idNumber: idxId !== -1 ? (row[idxId] || '').toUpperCase() : '',
                    course: idxCourse !== -1 ? (row[idxCourse] || '').toUpperCase() : '',
                    department: '',
                    dob: idxDob !== -1 ? (row[idxDob] || '') : '', // Expected YYYY-MM-DD
                    parentName: idxParent !== -1 ? (row[idxParent] || '').toUpperCase() : '',
                    address: idxAddress !== -1 ? (row[idxAddress] || '').toUpperCase() : '',
                    telephone: idxTel !== -1 ? (row[idxTel] || '').toUpperCase() : ''
                }
            };
            
            // If the first tab is empty and it's our first add, replace it
            if (state.students.length === 1 && state.students[0].formData.name === '' && state.students[0].formData.idNumber === '' && !state.students[0].photoDataUrl) {
                state.students[0] = newStudent;
            } else {
                state.students.push(newStudent);
            }
            addedCount++;
        }

        if (addedCount > 0) {
            // Update Max Batch stats if exceeded
            const batchLimitEl = document.getElementById('hero-batch-limit');
            if (batchLimitEl && state.students.length > 5) {
                batchLimitEl.textContent = state.students.length + '+';
            }
            
            // Switch to the first newly added student
            switchStudent(state.students.length - addedCount);
            showToast(`Successfully imported ${addedCount} student(s) from CSV.`, 'success');
        } else {
            showToast('No valid student rows found in the CSV.', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
});
