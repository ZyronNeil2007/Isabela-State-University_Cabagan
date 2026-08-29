package com.isu.id.ui.export

import android.graphics.pdf.PdfDocument
import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import com.isu.id.data.model.ExportSide
import com.isu.id.ui.wizard.WizardViewModel
import com.isu.id.util.MediaStoreHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Export bottom sheet — mirrors the Export modal from app.js.
 *
 * Options:
 *  • Save Image (Front / Back / Both)
 *  • Print PDF (batch A4 landscape)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExportBottomSheet(
    viewModel: WizardViewModel,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val scope   = rememberCoroutineScope()
    var isExporting by remember { mutableStateOf(false) }

    val frontBitmap by viewModel.frontBitmap.collectAsState()
    val backBitmap  by viewModel.backBitmap.collectAsState()
    val idVersion   by viewModel.idVersion.collectAsState()
    val campusTheme by viewModel.campusTheme.collectAsState()
    val hologram    by viewModel.hologramEnabled.collectAsState()

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Export ID Card", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Save as image or generate a print-ready PDF.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)

            HorizontalDivider()

            // ── Save Image section ────────────────────────────────────────────
            Text("Save as Image", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = {
                        frontBitmap?.let { bmp ->
                            scope.launch {
                                isExporting = true
                                withContext(Dispatchers.IO) {
                                    val ts = java.text.SimpleDateFormat("yyyyMMdd-HHmmss", java.util.Locale.getDefault()).format(java.util.Date())
                                    MediaStoreHelper.saveBitmapToGallery(context, bmp, "ISU-ID-FRONT-$ts")
                                }
                                viewModel.showToast("Front saved to gallery", "success")
                                isExporting = false
                            }
                        } ?: viewModel.showToast("Render the card first", "error")
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !isExporting
                ) { Text("Front") }

                OutlinedButton(
                    onClick = {
                        backBitmap?.let { bmp ->
                            scope.launch {
                                isExporting = true
                                withContext(Dispatchers.IO) {
                                    val ts = java.text.SimpleDateFormat("yyyyMMdd-HHmmss", java.util.Locale.getDefault()).format(java.util.Date())
                                    MediaStoreHelper.saveBitmapToGallery(context, bmp, "ISU-ID-BACK-$ts")
                                }
                                viewModel.showToast("Back saved to gallery", "success")
                                isExporting = false
                            }
                        } ?: viewModel.showToast("Render the card first", "error")
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !isExporting
                ) { Text("Back") }

                Button(
                    onClick = {
                        val fb = frontBitmap; val bb = backBitmap
                        if (fb != null && bb != null) {
                            scope.launch {
                                isExporting = true
                                withContext(Dispatchers.IO) {
                                    val ts = java.text.SimpleDateFormat("yyyyMMdd-HHmmss", java.util.Locale.getDefault()).format(java.util.Date())
                                    MediaStoreHelper.saveBitmapToGallery(context, fb, "ISU-ID-FRONT-$ts")
                                    MediaStoreHelper.saveBitmapToGallery(context, bb, "ISU-ID-BACK-$ts")
                                }
                                viewModel.showToast("Both sides saved to gallery", "success")
                                isExporting = false
                            }
                        } else viewModel.showToast("Render the card first", "error")
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !isExporting
                ) { Text("Both") }
            }

            HorizontalDivider()

            // ── PDF section ───────────────────────────────────────────────────
            Text("Print-Ready PDF", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Text("Generates A4 landscape with all student cards, front and back. " +
                "Standard 54×85.6mm card size with cut guides.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)

            Button(
                onClick = {
                    scope.launch {
                        isExporting = true
                        try {
                            val pdfFile = generateBatchPdf(context, viewModel)
                            val uri = FileProvider.getUriForFile(
                                context,
                                "${context.packageName}.fileprovider",
                                pdfFile
                            )
                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW).apply {
                                setDataAndType(uri, "application/pdf")
                                addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            }
                            context.startActivity(android.content.Intent.createChooser(intent, "Open PDF"))
                        } catch (e: Exception) {
                            viewModel.showToast("PDF export failed: ${e.message}", "error")
                        } finally {
                            isExporting = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled  = !isExporting,
                colors   = ButtonDefaults.buttonColors(
                    containerColor = campusTheme.primaryColor
                )
            ) {
                if (isExporting) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                    Spacer(Modifier.width(8.dp))
                    Text("Generating PDF…")
                } else {
                    Icon(Icons.Default.PictureAsPdf, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Generate & Open PDF")
                }
            }
        }
    }
}

// ── PDF generation (port of jsPDF batch layout from app.js lines 1278–1355) ──

private suspend fun generateBatchPdf(
    context: Context,
    viewModel: WizardViewModel
): File = withContext(Dispatchers.IO) {
    val students    = viewModel.students.value
    val version     = viewModel.idVersion.value
    val theme       = viewModel.campusTheme.value
    val hologram    = viewModel.hologramEnabled.value
    val renderer    = com.isu.id.rendering.IdCardRenderer(context)
    renderer.loadTemplates()

    // A4 landscape: 297mm × 210mm → points (1mm = 72/25.4 pts ≈ 2.8346)
    val MM_TO_PT = 72f / 25.4f
    val pageW_pt = (297f * MM_TO_PT).toInt()
    val pageH_pt = (210f * MM_TO_PT).toInt()

    // Card size: 54mm × 85.6mm landscape → 85.6mm × 54mm (rotated)
    val cardW_pt = (85.6f * MM_TO_PT).toInt()
    val cardH_pt = (54f * MM_TO_PT).toInt()
    val gapX_pt  = (3f * MM_TO_PT).toInt()
    val gapY_pt  = (6f * MM_TO_PT).toInt()

    val doc = PdfDocument()

    // Two rows of cards per page: front row + back row
    val cols = ((pageW_pt) / (cardW_pt + gapX_pt)).coerceAtLeast(1)

    var pageIndex = 0
    var studentIndex = 0

    while (studentIndex < students.size) {
        val pageInfo = PdfDocument.PageInfo.Builder(pageW_pt, pageH_pt, ++pageIndex).create()
        val page = doc.startPage(pageInfo)
        val canvas = page.canvas

        // Header
        val headerPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
            textSize = 8f
            color    = android.graphics.Color.DKGRAY
        }
        canvas.drawText("ISU Premium ID Generator • Page $pageIndex • ${java.util.Date()}", 10f, 14f, headerPaint)

        // Draw up to [cols] students per page
        for (col in 0 until cols) {
            if (studentIndex >= students.size) break
            val s = students[studentIndex++]

            val frontBmp = renderer.renderFront(s, version, theme, hologram)
            val backBmp  = renderer.renderBack(s, version, theme)

            val x = gapX_pt + col * (cardW_pt + gapX_pt).toFloat()
            // Row 1: front face
            val frontScaled = android.graphics.Bitmap.createScaledBitmap(frontBmp, cardW_pt, cardH_pt, true)
            canvas.drawBitmap(frontScaled, x, gapY_pt.toFloat(), null)

            // Row 2: back face (below)
            val backScaled = android.graphics.Bitmap.createScaledBitmap(backBmp, cardW_pt, cardH_pt, true)
            canvas.drawBitmap(backScaled, x, (gapY_pt * 2 + cardH_pt).toFloat(), null)

            // Cut guides (dashed rect)
            val dashPaint = android.graphics.Paint().apply {
                style = android.graphics.Paint.Style.STROKE
                color = android.graphics.Color.LTGRAY
                strokeWidth = 0.5f
                pathEffect = android.graphics.DashPathEffect(floatArrayOf(4f, 4f), 0f)
            }
            val front_r = android.graphics.RectF(x, gapY_pt.toFloat(), x + cardW_pt, (gapY_pt + cardH_pt).toFloat())
            val back_r  = android.graphics.RectF(x, (gapY_pt * 2 + cardH_pt).toFloat(), x + cardW_pt, (gapY_pt * 2 + 2 * cardH_pt).toFloat())
            canvas.drawRect(front_r, dashPaint)
            canvas.drawRect(back_r, dashPaint)
        }

        doc.finishPage(page)
    }

    // Save to cache/pdfs/
    val pdfDir = File(context.cacheDir, "pdfs").also { it.mkdirs() }
    val ts = java.text.SimpleDateFormat("yyyyMMdd-HHmmss", java.util.Locale.getDefault()).format(java.util.Date())
    val file = File(pdfDir, "ISU-ID-Batch-$ts.pdf")
    file.outputStream().use { doc.writeTo(it) }
    doc.close()
    file
}
