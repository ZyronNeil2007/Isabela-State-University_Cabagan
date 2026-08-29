package com.isu.id.ui.web

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.content.FileProvider
import com.isu.id.util.MediaStoreHelper
import java.io.ByteArrayOutputStream
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * JavaScript <-> Android bridge for the WebView hybrid shell.
 *
 * The web app (app.js) calls these via:
 *   window.AndroidBridge.saveImagePng(base64, filename)
 *   window.AndroidBridge.sharePdf(base64)
 *   window.AndroidBridge.openGallery()
 *   window.AndroidBridge.isAndroidApp()  <- feature detection
 *
 * Mirrors:
 *   - saveBtn click   -> exportCurrentImage()   [app.js ~line 1190]
 *   - printBtn click  -> downloadBatch()        [app.js ~line 1278]
 *   - uploadLabel     -> handlePhotoUpload()    [app.js ~line 460]
 */
class WebBridge(
    private val context: Context,
    private val webView: WebView,
    private val onPhotoPickRequest: (callback: (String) -> Unit) -> Unit
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun isAndroidApp(): Boolean = true

    @JavascriptInterface
    fun saveImagePng(base64Data: String, filename: String) {
        try {
            val pureBase64 = base64Data
                .removePrefix("data:image/png;base64,")
                .removePrefix("data:image/jpeg;base64,")
                .trim()
            val bytes  = Base64.decode(pureBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return
            val ts     = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.getDefault()).format(Date())
            val savedUri = MediaStoreHelper.saveBitmapToGallery(context, bitmap, "${filename}-$ts")
            val ok  = savedUri != null
            val msg = if (ok) "Image saved to gallery!" else "Failed to save image."
            mainHandler.post {
                webView.evaluateJavascript("showToast('$msg','${if (ok) "success" else "error"}')", null)
            }
        } catch (e: Exception) {
            val safeMsg = e.message?.take(60)?.replace("'", "") ?: "Unknown error"
            mainHandler.post {
                webView.evaluateJavascript("showToast('Save failed: $safeMsg','error')", null)
            }
        }
    }

    @JavascriptInterface
    fun sharePdf(base64Data: String) {
        try {
            val pureBase64 = base64Data.removePrefix("data:application/pdf;base64,").trim()
            val bytes = Base64.decode(pureBase64, Base64.DEFAULT)
            val ts    = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.getDefault()).format(Date())
            val dir   = File(context.cacheDir, "pdfs").also { it.mkdirs() }
            val file  = File(dir, "ISU-ID-Batch-$ts.pdf")
            file.writeBytes(bytes)
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            mainHandler.post {
                context.startActivity(
                    Intent.createChooser(intent, "Share / Print PDF").apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                )
            }
        } catch (e: Exception) {
            val safeMsg = e.message?.take(60)?.replace("'", "") ?: "Unknown error"
            mainHandler.post {
                webView.evaluateJavascript("showToast('PDF share failed: $safeMsg','error')", null)
            }
        }
    }

    @JavascriptInterface
    fun openGallery() {
        mainHandler.post {
            onPhotoPickRequest { dataUrl ->
                webView.evaluateJavascript(
                    "if(typeof window.__androidPhotoCb==='function'){window.__androidPhotoCb('$dataUrl');}",
                    null
                )
            }
        }
    }

    fun bitmapToDataUrl(bitmap: Bitmap): String {
        val out = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 95, out)
        val b64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
        return "data:image/png;base64,$b64"
    }
}
