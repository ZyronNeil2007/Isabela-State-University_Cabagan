/* ── module: features/student-management/student-tabs.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { sigCanvas, sigCtx } from '../signature/signature-pad.js';
import { INPUT_KEY_MAP } from '../id-generator/form-bindings.js';
import { renderCanvases } from '../id-generator/render-engine.js';

/* ═══════════════════════════════════════════════════════════════════════════
   13. STUDENT TABS LOGIC (Batch Print Feature)
═══════════════════════════════════════════════════════════════════════════ */
const MAX_STUDENTS = 5;

export function renderStudentTabs() {
    const container = document.getElementById('student-tabs');
    if (!container) return;
    container.innerHTML = '';
    
    state.students.forEach((student, index) => {
        const tab = document.createElement('div');
        tab.className = 'student-tab' + (index === state.activeStudentIndex ? ' active' : '');
        tab.onclick = (e) => {
            if (!e.target.closest('.btn-remove-student')) {
                switchStudent(index);
            }
        };
        
        let thumbContent = '';
        if (student.photoDataUrl) {
            thumbContent = `<img src="${student.photoDataUrl}" class="student-tab-thumb" alt="thumb">`;
        } else {
            thumbContent = `<div class="student-tab-thumb" style="display:flex;align-items:center;justify-content:center;font-size:10px;"><i class="ph ph-user"></i></div>`;
        }
        
        let name = student.formData.name || `Student ${index + 1}`;
        if (name.length > 12) name = name.substring(0, 10) + '...';
        
        let removeBtn = '';
        if (state.students.length > 1) {
            removeBtn = `<button class="btn-remove-student" onclick="removeStudent(${index})"><i class="ph ph-x"></i></button>`;
        }
        
        tab.innerHTML = `${thumbContent} <span>${name}</span> ${removeBtn}`;
        container.appendChild(tab);
    });
    
    const addBtn = document.getElementById('add-student-btn');
    if (addBtn) {
        addBtn.style.display = state.students.length < MAX_STUDENTS ? 'inline-flex' : 'none';
    }
}

export function switchStudent(index) {
    state.activeStudentIndex = index;
    const student = state.students[index];
    
    // Populate form inputs
    Object.entries(INPUT_KEY_MAP).forEach(([id, stateKey]) => {
        const el = document.getElementById(id);
        if (el) el.value = student.formData[stateKey] || '';
    });

    // Sync department dropdown
    const deptEl = document.getElementById('department');
    if (deptEl) deptEl.value = student.formData.department || '';
    
    // Update photo preview
    const thumb = document.getElementById('photo-preview-thumb');
    const placeholder = document.getElementById('photo-placeholder');
    const wrapper = document.getElementById('photo-preview-wrapper');
    if (student.photoDataUrl) {
        thumb.src = student.photoDataUrl;
        if(wrapper) wrapper.style.display = 'inline-block';
        if(placeholder) placeholder.style.display = 'none';
    } else {
        if(wrapper) wrapper.style.display = 'none';
        if(placeholder) placeholder.style.display = 'flex';
    }
    
    // Update signature pad
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    const watermark = sigCanvas.parentElement.querySelector('.signature-watermark');
    if (student.signatureImage) {
        if (watermark) watermark.style.opacity = '0';
        sigCtx.drawImage(student.signatureImage, 0, 0, sigCanvas.width, sigCanvas.height);
    } else {
        if (watermark) watermark.style.opacity = '1';
    }
    
    renderStudentTabs();
    renderCanvases();
}

function addStudent() {
    if (state.students.length >= MAX_STUDENTS) return;
    
    state.students.push({
        photoImage: null,
        photoDataUrl: null,
        rawSourceImage: null,
        signatureImage: null,
        signatureDataUrl: null,
        formData: { name: '', idNumber: '', course: '', department: '', dob: '', parentName: '', address: '', telephone: '' }
    });
    
    switchStudent(state.students.length - 1);
}

export function removeStudent(index) {
    if (state.students.length <= 1) return;
    
    const s = state.students[index];
    const hasData = s.formData.name || s.formData.idNumber || s.photoDataUrl || s.signatureDataUrl;
    if (hasData && !confirm("Remove student and all their data?")) {
        return;
    }
    
    state.students.splice(index, 1);
    if (state.activeStudentIndex >= state.students.length) {
        switchStudent(state.students.length - 1);
    } else {
        switchStudent(state.activeStudentIndex); // Re-render current
    }
}

document.getElementById('add-student-btn')?.addEventListener('click', addStudent);

// Call initially
setTimeout(renderStudentTabs, 100);
