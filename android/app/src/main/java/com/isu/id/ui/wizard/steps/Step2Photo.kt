package com.isu.id.ui.wizard.steps

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.isu.id.data.model.Student
import com.yalantis.ucrop.UCrop
import java.io.File

/**
 * Step 2: Photo upload with uCrop crop/zoom.
 *
 * Flow: Gallery picker → uCrop → Bitmap → WizardViewModel.setPhoto()
 * Mirrors the profile-pic input → openCropper() → cropper-save-btn flow in app.js.
 */
@Composable
fun Step2Photo(
    student: Student,
    onPhotoSet: (Bitmap) -> Unit,
    context: Context
) {
    var photoBitmap by remember(student) { mutableStateOf(student.photoBitmap) }

    // uCrop result launcher
    val cropLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val resultUri = UCrop.getOutput(result.data ?: return@rememberLauncherForActivityResult)
        resultUri?.let { uri ->
            val stream = context.contentResolver.openInputStream(uri)
            val bmp = BitmapFactory.decodeStream(stream)
            if (bmp != null) {
                photoBitmap = bmp
                onPhotoSet(bmp)
            }
        }
    }

    // Gallery picker launcher — opens uCrop after selection
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        val destFile = File(context.cacheDir, "cropped_photo_${System.currentTimeMillis()}.jpg")
        val destUri  = Uri.fromFile(destFile)

        val cropIntent = UCrop.of(uri, destUri)
            .withAspectRatio(315f, 355f)      // Old ID photo box ratio (exact px from CONFIG)
            .withMaxResultSize(315, 355)
            .withOptions(UCrop.Options().apply {
                setCompressionQuality(95)
                setHideBottomControls(false)
                setFreeStyleCropEnabled(false)
            })
            .getIntent(context)

        cropLauncher.launch(cropIntent)
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            "Upload Your Photo",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            "Take or select a 2×2 style photo. You can crop and zoom after selecting.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // Photo preview or placeholder
        Box(
            modifier = Modifier
                .size(160.dp, 180.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            if (photoBitmap != null) {
                Image(
                    bitmap = photoBitmap!!.asImageBitmap(),
                    contentDescription = "Student photo",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        "No photo",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Action buttons
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { galleryLauncher.launch("image/*") }) {
                Icon(Icons.Default.CameraAlt, contentDescription = null)
                Spacer(Modifier.width(4.dp))
                Text(if (photoBitmap == null) "Select Photo" else "Change Photo")
            }

            if (photoBitmap != null) {
                OutlinedButton(onClick = { galleryLauncher.launch("image/*") }) {
                    Icon(Icons.Default.Edit, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text("Re-crop")
                }
            }
        }

        Text(
            "• Supported: JPEG, PNG (max 5 MB)\n• Photo will be cropped to ID dimensions automatically",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
