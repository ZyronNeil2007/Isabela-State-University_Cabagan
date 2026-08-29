package com.isu.id.util

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.io.File
import java.io.FileOutputStream

/**
 * Helper for saving images to the device gallery using scoped storage.
 * Handles both API 29+ (MediaStore API) and API 24–28 (legacy file path).
 */
object MediaStoreHelper {

    /**
     * Save a [bitmap] to Pictures/ISU-ID/<filename>.png in the public gallery.
     * @return The Uri of the saved image, or null on failure.
     */
    fun saveBitmapToGallery(context: Context, bitmap: Bitmap, filename: String): Uri? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveBitmapApi29Plus(context, bitmap, filename)
        } else {
            saveBitmapLegacy(context, bitmap, filename)
        }
    }

    private fun saveBitmapApi29Plus(context: Context, bitmap: Bitmap, filename: String): Uri? {
        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, "$filename.png")
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
            put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/ISU-ID")
            put(MediaStore.Images.Media.IS_PENDING, 1)
        }

        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
            ?: return null

        return try {
            resolver.openOutputStream(uri)?.use { stream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            }
            contentValues.clear()
            contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
            resolver.update(uri, contentValues, null, null)
            uri
        } catch (e: Exception) {
            resolver.delete(uri, null, null)
            null
        }
    }

    @Suppress("DEPRECATION")
    private fun saveBitmapLegacy(context: Context, bitmap: Bitmap, filename: String): Uri? {
        val dir = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
            "ISU-ID"
        )
        dir.mkdirs()
        val file = File(dir, "$filename.png")
        return try {
            FileOutputStream(file).use { stream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            }
            android.media.MediaScannerConnection.scanFile(context, arrayOf(file.absolutePath), null, null)
            Uri.fromFile(file)
        } catch (e: Exception) {
            null
        }
    }
}
