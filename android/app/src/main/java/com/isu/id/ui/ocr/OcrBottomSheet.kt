package com.isu.id.ui.ocr

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.isu.id.ui.wizard.OcrResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

/**
 * OCR autofill bottom sheet.
 * Replaces Tesseract.js + ocrExtract() from app.js (lines 2477–2630).
 *
 * Uses ML Kit Text Recognition (on-device, fully offline).
 * Same regex patterns as the JS version for extracting name/ID/course/DOB.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OcrBottomSheet(
    onResult: (OcrResult) -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val scope   = rememberCoroutineScope()

    var isScanning  by remember { mutableStateOf(false) }
    var scanError   by remember { mutableStateOf<String?>(null) }
    var ocrResult   by remember { mutableStateOf<OcrResult?>(null) }
    var rawText     by remember { mutableStateOf<String?>(null) }

    // Gallery picker
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        scope.launch {
            isScanning = true
            scanError  = null
            try {
                val bmp = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }
                } ?: run { scanError = "Could not read image."; return@launch }

                val (raw, result) = performOcr(bmp)
                rawText   = raw
                ocrResult = result
            } catch (e: Exception) {
                scanError = "OCR failed: ${e.message}"
            } finally {
                isScanning = false
            }
        }
    }

    // Camera launcher
    var cameraBitmap: Bitmap? = null
    val cameraUri = remember {
        val file = java.io.File(context.cacheDir, "ocr_capture.jpg")
        androidx.core.content.FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    }
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            scope.launch {
                isScanning = true
                try {
                    val bmp = withContext(Dispatchers.IO) {
                        context.contentResolver.openInputStream(cameraUri)?.use { BitmapFactory.decodeStream(it) }
                    } ?: run { scanError = "Camera capture failed."; return@launch }

                    val (raw, result) = performOcr(bmp)
                    rawText   = raw
                    ocrResult = result
                } catch (e: Exception) {
                    scanError = "OCR failed: ${e.message}"
                } finally {
                    isScanning = false
                }
            }
        }
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("OCR Autofill", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Scan an existing ID card to auto-fill the form.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)

            // Capture buttons
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick  = { galleryLauncher.launch("image/*") },
                    enabled  = !isScanning,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Image, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text("From Gallery")
                }
                OutlinedButton(
                    onClick  = { cameraLauncher.launch(cameraUri) },
                    enabled  = !isScanning,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.CameraAlt, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text("Camera")
                }
            }

            // Status
            if (isScanning) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    Text("Scanning…", style = MaterialTheme.typography.bodyMedium)
                }
            }

            scanError?.let { err ->
                Text(err, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            // Results
            ocrResult?.let { result ->
                HorizontalDivider()
                Text("Extracted Fields", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)

                OcrFieldRow("Name",      result.name)
                OcrFieldRow("ID Number", result.idNumber)
                OcrFieldRow("Course",    result.course)
                OcrFieldRow("DOB",       result.dob)

                if (result.name.isBlank() && result.idNumber.isBlank() &&
                    result.course.isBlank() && result.dob.isBlank()) {
                    Text(
                        "No recognizable fields found. Try a clearer image.",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                } else {
                    Button(
                        onClick  = { onResult(result); onDismiss() },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Apply to Form")
                    }
                }
            }
        }
    }
}

@Composable
private fun OcrFieldRow(label: String, value: String) {
    if (value.isBlank()) return
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.width(80.dp))
        Text(value, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
    }
}

// ── OCR engine + regex extraction ─────────────────────────────────────────────

private suspend fun performOcr(bitmap: Bitmap): Pair<String, OcrResult> {
    val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    val inputImage = InputImage.fromBitmap(bitmap, 0)
    val visionResult = recognizer.process(inputImage).await()
    val text = visionResult.textBlocks.joinToString("\n") { it.text }
    return Pair(text, ocrExtract(text))
}

/**
 * Extract structured fields from raw OCR text.
 * Port of ocrExtract() from app.js (lines 2477–2630).
 * Same regex patterns — translated to Kotlin Regex.
 */
internal fun ocrExtract(text: String): OcrResult {
    // Name: "Name:" label followed by capitalized words
    val nameRegex = Regex("""(?:Name|Pangalan)[:\s]+([A-Z][A-Z\s,.\-]{4,60})""", RegexOption.IGNORE_CASE)
    val name = nameRegex.find(text)?.groupValues?.getOrNull(1)?.trim() ?: ""

    // ID number: 4-digit year dash 4-6 digits (e.g. 2025-00001, 25-00001)
    val idRegex = Regex("""\b((?:20)?\d{2}[-–]\d{4,6})\b""")
    val idNumber = idRegex.find(text)?.groupValues?.getOrNull(1)?.trim() ?: ""

    // Course: "Course:" label
    val courseRegex = Regex("""(?:Course|Program)[:\s]+([A-Za-z\s]{5,60})""", RegexOption.IGNORE_CASE)
    val course = courseRegex.find(text)?.groupValues?.getOrNull(1)?.trim() ?: ""

    // DOB: various date formats
    val dobRegex = Regex("""(?:DOB|Birth(?:day|date)?|Born)[:\s]+(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})""", RegexOption.IGNORE_CASE)
    val dob = dobRegex.find(text)?.groupValues?.getOrNull(1)?.trim()?.let { normalizeDob(it) } ?: ""

    return OcrResult(name = name, idNumber = idNumber, course = course, dob = dob)
}

/** Convert various date formats (MM/DD/YYYY or DD/MM/YYYY) to standard ISO YYYY-MM-DD */
private fun normalizeDob(raw: String): String {
    val parts = raw.split(Regex("""[/\-\.]"""))
    if (parts.size < 3) return raw
    val p1 = parts[0].toIntOrNull() ?: 0
    val p2 = parts[1].toIntOrNull() ?: 0
    val yStr = parts[2].trim()
    val y = if (yStr.length == 2) "20$yStr" else yStr

    val mm: String
    val dd: String
    if (p2 > 12) {
        // Definitely MM/DD/YYYY
        mm = String.format("%02d", p1)
        dd = String.format("%02d", p2)
    } else {
        // Default DD/MM/YYYY or MM/DD/YYYY
        mm = String.format("%02d", p2)
        dd = String.format("%02d", p1)
    }
    return "$y-$mm-$dd"
}
