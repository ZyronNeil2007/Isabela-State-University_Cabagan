package com.isu.id.ui.wizard.steps

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Draw
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.isu.id.data.model.Student
import com.isu.id.imaging.SignaturePad
import com.isu.id.imaging.SignatureProcessor
import kotlinx.coroutines.launch

/**
 * Step 10: Signature capture.
 *
 * Two tabs:
 *  • Draw — finger-drawn SignaturePad (default)
 *  • Upload — pick a photo → SignatureProcessor (Otsu + white removal)
 *
 * Mirrors the signature-draw-tab / signature-upload-tab from app.js.
 */
@Composable
fun Step10Signature(
    student: Student,
    onSignatureSet: (Bitmap?) -> Unit
) {
    val context = LocalContext.current
    val scope   = rememberCoroutineScope()

    var selectedTab by remember { mutableStateOf(0) }
    var isProcessing by remember { mutableStateOf(false) }
    var processingError by remember { mutableStateOf<String?>(null) }

    // Gallery picker for "Upload" tab
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        scope.launch {
            isProcessing = true
            processingError = null
            try {
                val stream = context.contentResolver.openInputStream(uri)
                val raw = BitmapFactory.decodeStream(stream)
                if (raw != null) {
                    val processed = SignatureProcessor.process(raw)
                    onSignatureSet(processed)
                } else {
                    processingError = "Could not read image file."
                }
            } catch (e: Exception) {
                processingError = "Processing failed: ${e.message}"
            } finally {
                isProcessing = false
            }
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            "Signature",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            "Draw your signature below, or upload a photo of your handwritten signature.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // Tab selector
        TabRow(selectedTabIndex = selectedTab) {
            Tab(
                selected = selectedTab == 0,
                onClick  = { selectedTab = 0 },
                icon     = { Icon(Icons.Default.Draw, contentDescription = null) },
                text     = { Text("Draw") }
            )
            Tab(
                selected = selectedTab == 1,
                onClick  = { selectedTab = 1 },
                icon     = { Icon(Icons.Default.Upload, contentDescription = null) },
                text     = { Text("Upload") }
            )
        }

        Spacer(Modifier.height(8.dp))

        when (selectedTab) {
            0 -> {
                // Draw tab
                SignaturePad(
                    modifier           = Modifier.fillMaxWidth().height(220.dp),
                    initialBitmap      = student.signatureBitmap,
                    onSignatureChanged = onSignatureSet
                )
            }
            1 -> {
                // Upload tab
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "Upload a photo of your handwritten signature on a white background.\n" +
                        "The background will be automatically removed.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Button(
                        onClick  = { galleryLauncher.launch("image/*") },
                        enabled  = !isProcessing,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (isProcessing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(Modifier.width(8.dp))
                            Text("Processing…")
                        } else {
                            Icon(Icons.Default.Upload, contentDescription = null)
                            Spacer(Modifier.width(4.dp))
                            Text("Choose Signature Photo")
                        }
                    }

                    processingError?.let { err ->
                        Text(err, color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall)
                    }

                    student.signatureBitmap?.let {
                        Text(
                            "✓ Signature uploaded and processed",
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}
