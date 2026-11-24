/* ── module: services/export/pdf-export.js — extracted verbatim from app.js; see docs/architecture/ARCHITECTURE.md ── */
import { state } from '../../core/state/state.js';
import { backCanvas, frontCanvas } from '../../core/state/canvas-refs.js';
import { renderCanvases } from '../../features/id-generator/render-engine.js';
import { showToast } from '../../utils/toast.js';

/* ═══════════════════════════════════════════════════════════════════════════
   11. EXPORT — Generate A4 print-ready PNG and trigger download
═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('download-btn').addEventListener('click', async () => {
    const btn = document.getElementById('download-btn');

    // ── Loading state feedback ──
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-circle-notch"></i> Generating PDF…';
    btn.classList.add('loading');

    // Yield to browser to paint the loading state before heavy work
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));

    // Declared before `try` so the `finally` block below can restore it
    const originalIndex = state.activeStudentIndex;

    try {
        const { jsPDF } = window.jspdf;
        // Create an A4 landscape PDF (297mm x 210mm)
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const studentCount = state.students.length;
        const cardW = 54;      // CR80 standard width (mm)
        const cardH = 85.6;    // CR80 standard height (mm)
        const gapX = 3;        // Horizontal gap between cards
        const gapY = 6;        // Vertical gap between front and back
        const startX = (297 - (cardW * 5 + gapX * 4)) / 2; // Centered horizontally
        const startY = 20;


        for (let i = 0; i < studentCount; i++) {
            if (i > 0 && i % 5 === 0) {
                pdf.addPage();
            }
            
            const colIndex = i % 5;
            const pageIndex = Math.floor(i / 5);
            const studentsOnThisPage = Math.min(5, studentCount - pageIndex * 5);
            const gridWidth = studentsOnThisPage * cardW + (studentsOnThisPage - 1) * gapX;
            const pageStartX = (297 - gridWidth) / 2;

            const frontX = pageStartX + colIndex * (cardW + gapX);
            const backX = frontX;
            const frontY = startY;
            const backY = startY + cardH + gapY;

            // Print header on each page
            if (colIndex === 0) {
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(12);
                pdf.setTextColor(0, 0, 0);
                const dateStr = new Date().toLocaleDateString();
                pdf.text(`ISU Student IDs — Page ${Math.floor(i / 5) + 1} — ${dateStr}`, 148.5, 12, { align: 'center' });
            }

            state.activeStudentIndex = i;
            renderCanvases(); // render i-th student
            
            pdf.addImage(frontCanvas.toDataURL('image/png', 1.0), 'PNG', frontX, frontY, cardW, cardH);
            pdf.addImage(backCanvas.toDataURL('image/png', 1.0), 'PNG', backX, backY, cardW, cardH);
            
            // Draw cut lines
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.setLineDashPattern([2, 2], 0);
            const p = 1.5; // padding around card
            pdf.rect(frontX - p, frontY - p, cardW + p * 2, cardH + p * 2);
            pdf.rect(backX - p, backY - p, cardW + p * 2, cardH + p * 2);
            
            pdf.setFontSize(6);
            pdf.setTextColor(150, 150, 150);
            pdf.text('✂ Cut', frontX + cardW/2, frontY - p - 1, { align: 'center' });
            pdf.text('✂ Cut', backX + cardW/2, backY + cardH + p + 2, { align: 'center' });
        }

        const filename = studentCount === 1 ? `ISU_ID_${(state.students[0].formData.name || 'Student').replace(/\s+/g, '_')}_Print_Ready.pdf` : `ISU_ID_Batch_${studentCount}_Students.pdf`;
        pdf.save(filename);

    } catch (err) {
        console.error('[ISU ID] PDF Export failed:', err);
        showToast('Export failed. Please try again.', 'error');
    } finally {
        // Restore active state
        state.activeStudentIndex = originalIndex;
        renderCanvases();

        // Restore button state
        btn.innerHTML = originalHTML;
        btn.classList.remove('loading');
    }
});
