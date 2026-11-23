/* ── module: features/batch-manager/batch-manager.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { renderCanvases } from '../id-generator/render-engine.js';
import { showToast } from '../../utils/toast.js';
import { renderStudentTabs, switchStudent } from '../student-management/student-tabs.js';
import { playAudioFx } from '../card-preview/security-fx.js';

/** Batch Data Table Manager Modal */
export function openBatchModal() {
    playAudioFx('click');
    const modal = document.getElementById('batch-modal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
    renderBatchTable();
}

export function closeBatchModal() {
    playAudioFx('click');
    const modal = document.getElementById('batch-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function renderBatchTable() {
    const tbody = document.getElementById('batch-table-body');
    const statsBadge = document.getElementById('batch-stats-badge');
    if (!tbody) return;

    if (statsBadge) {
        statsBadge.textContent = `${state.students.length} Student${state.students.length === 1 ? '' : 's'}`;
    }

    tbody.innerHTML = '';
    state.students.forEach((st, idx) => {
        const tr = document.createElement('tr');
        if (idx === state.activeStudentIndex) tr.classList.add('active-row');

        const hasPhoto = !!st.photoDataUrl;
        const hasSig = !!st.signatureDataUrl;
        const name = st.formData.name || '—';
        const idNum = st.formData.idNumber || '—';
        const course = st.formData.course || st.formData.department || '—';

        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td>${name}</td>
            <td><code>${idNum}</code></td>
            <td>${course}</td>
            <td><span class="badge-status ${hasPhoto ? 'yes' : 'no'}">${hasPhoto ? '✓ Yes' : '✗ Missing'}</span></td>
            <td><span class="badge-status ${hasSig ? 'yes' : 'no'}">${hasSig ? '✓ Yes' : '✗ Missing'}</span></td>
            <td>
                <div style="display:flex; gap:4px;">
                    <button class="batch-btn-sm" onclick="selectBatchStudent(${idx})">Select</button>
                    <button class="batch-btn-sm danger" onclick="deleteBatchStudent(${idx})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function selectBatchStudent(index) {
    if (typeof switchStudent === 'function') {
        switchStudent(index);
        closeBatchModal();
        showToast(`Switched to Student #${index + 1}`, 'info');
    }
}

export function deleteBatchStudent(index) {
    if (state.students.length <= 1) {
        showToast('Cannot delete the last student tab', 'warning');
        return;
    }
    if (confirm(`Remove Student #${index + 1} from batch?`)) {
        state.students.splice(index, 1);
        if (state.activeStudentIndex >= state.students.length) {
            state.activeStudentIndex = state.students.length - 1;
        }
        renderStudentTabs();
        renderCanvases();
        renderBatchTable();
        showToast('Student removed', 'info');
    }
}

export function filterBatchTable() {
    const q = (document.getElementById('batch-search-input')?.value || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#batch-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

export function exportBatchCsv() {
    if (!state.students || !state.students.length) return;
    const headers = ['Full Name', 'Student ID', 'Course', 'Department', 'Date of Birth', 'Guardian', 'Address', 'Contact Number'];
    const rows = state.students.map(st => [
        `"${st.formData.name || ''}"`,
        `"${st.formData.idNumber || ''}"`,
        `"${st.formData.course || ''}"`,
        `"${st.formData.department || ''}"`,
        `"${st.formData.dob || ''}"`,
        `"${st.formData.parentName || ''}"`,
        `"${st.formData.address || ''}"`,
        `"${st.formData.telephone || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `isu_students_batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playAudioFx('chime');
    showToast('Exported student batch CSV', 'success');
}
