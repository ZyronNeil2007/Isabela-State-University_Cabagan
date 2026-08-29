package com.isu.id.ui.web

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import com.yalantis.ucrop.UCrop
import java.io.File

/**
 * Full-screen Compose wrapper that hosts the ISU ID web app inside a
 * hardware-accelerated WebView, loading index.html from the app's assets.
 *
 * Assets are served via WebViewAssetLoader over the secure synthetic origin:
 *   https://appassets.androidplatform.net/assets/www/
 *
 * A JS injection block (injected after page load) hooks the Android bridge
 * into the web app so that:
 *   - window.AndroidBridge.saveImagePng()  -> saves to gallery
 *   - window.AndroidBridge.sharePdf()      -> opens share sheet
 *   - window.AndroidBridge.openGallery()   -> native picker -> data URL callback
 *   - window.AndroidBridge.isAndroidApp()  -> true (feature flag for app.js)
 *
 * The gallery picker result goes through uCrop (same as the Compose wizard)
 * and the cropped bitmap is returned to JS as a data URL via
 *   window.__androidPhotoCb(dataUrl)
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebIdScreen() {
    val context = LocalContext.current

    // Holds the JS callback that should receive the picked photo
    var photoCb by remember { mutableStateOf<((String) -> Unit)?>(null) }
    // webView reference so the bridge ctor can capture it
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    // uCrop result
    val cropLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val resultUri = UCrop.getOutput(result.data ?: return@rememberLauncherForActivityResult)
        resultUri?.let { uri ->
            val stream = context.contentResolver.openInputStream(uri)
            val bmp: Bitmap? = BitmapFactory.decodeStream(stream)
            if (bmp != null) {
                val bridge = webViewRef?.let { wv ->
                    WebBridge(context, wv) { cb -> photoCb = cb }
                }
                val dataUrl = bridge?.bitmapToDataUrl(bmp) ?: return@let
                photoCb?.invoke(dataUrl)
                photoCb = null
            }
        }
    }

    // Gallery picker
    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        val destFile = File(context.cacheDir, "webview_photo_${System.currentTimeMillis()}.jpg")
        val destUri  = Uri.fromFile(destFile)
        val cropIntent = UCrop.of(uri, destUri)
            .withAspectRatio(315f, 355f)
            .withMaxResultSize(630, 710)
            .withOptions(UCrop.Options().apply {
                setCompressionQuality(95)
                setFreeStyleCropEnabled(false)
            })
            .getIntent(context)
        cropLauncher.launch(cropIntent)
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            val assetLoader = WebViewAssetLoader.Builder()
                .setDomain("appassets.androidplatform.net")
                .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(ctx))
                .build()

            WebView(ctx).also { wv ->
                webViewRef = wv

                // Hardware-accelerated layer for smooth CSS blur / Three.js
                wv.setLayerType(View.LAYER_TYPE_HARDWARE, null)

                wv.settings.apply {
                    javaScriptEnabled           = true
                    domStorageEnabled           = true
                    allowFileAccess             = true
                    loadWithOverviewMode        = true
                    useWideViewPort             = true
                    builtInZoomControls         = false
                    displayZoomControls         = false
                    mixedContentMode            = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                    cacheMode                   = WebSettings.LOAD_DEFAULT
                    mediaPlaybackRequiresUserGesture = false
                }

                wv.webChromeClient = WebChromeClient()

                wv.webViewClient = object : WebViewClientCompat() {
                    override fun shouldInterceptRequest(
                        view: WebView,
                        request: WebResourceRequest
                    ) = assetLoader.shouldInterceptRequest(request.url)

                    override fun onPageFinished(view: WebView, url: String) {
                        super.onPageFinished(view, url)
                        // Inject bridge hooks after the page is ready
                        view.evaluateJavascript(BRIDGE_INJECTION_JS, null)
                    }
                }

                // Attach the JS bridge
                val bridge = WebBridge(ctx, wv) { cb ->
                    photoCb = cb
                    galleryLauncher.launch("image/*")
                }
                wv.addJavascriptInterface(bridge, "AndroidBridge")

                wv.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
            }
        }
    )
}

/**
 * JavaScript injected after every page load.
 *
 * 1. Patches the web app's download buttons to call AndroidBridge instead of
 *    creating an <a download> element (which doesn't work in WebView).
 * 2. Patches the photo upload <input> to open the native gallery picker.
 * 3. Adds window.__androidPhotoCb placeholder so app.js can call it.
 */
private val BRIDGE_INJECTION_JS = """
(function() {
  if (!window.AndroidBridge || !AndroidBridge.isAndroidApp()) return;

  // ── Photo picker hook ────────────────────────────────────────────────────
  // Called by AndroidBridge.openGallery() result — feeds a data URL into
  // the existing handlePhotoUpload() pipeline via a synthetic File input.
  window.__androidPhotoCb = function(dataUrl) {
    try {
      fetch(dataUrl)
        .then(function(r){ return r.blob(); })
        .then(function(blob) {
          var file = new File([blob], 'photo.png', {type: 'image/png'});
          var dt   = new DataTransfer();
          dt.items.add(file);
          var inputs = document.querySelectorAll('input[type=file][accept*=image]');
          if (inputs.length > 0) {
            inputs[0].files = dt.files;
            inputs[0].dispatchEvent(new Event('change', {bubbles:true}));
          }
        });
    } catch(e) { console.warn('AndroidPhotoCb error:', e); }
  };

  // ── Intercept file inputs to open native gallery ─────────────────────────
  document.querySelectorAll('input[type=file][accept*=image]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      AndroidBridge.openGallery();
    }, true);
  });

  // ── Intercept canvas download links ──────────────────────────────────────
  // The download buttons call canvas.toDataURL() and create <a download> links.
  // In WebView those are silently ignored, so we patch them.
  var _origCreateElement = document.createElement.bind(document);
  document.createElement = function(tag) {
    var el = _origCreateElement(tag);
    if (tag.toLowerCase() === 'a') {
      var _origClick = el.click.bind(el);
      el.click = function() {
        if (el.download && el.href && el.href.startsWith('data:image')) {
          AndroidBridge.saveImagePng(el.href, el.download.replace(/\.png$/i,'').replace(/\.jpg$/i,''));
          return;
        }
        if (el.download && el.href && el.href.startsWith('data:application/pdf')) {
          AndroidBridge.sharePdf(el.href);
          return;
        }
        _origClick();
      };
    }
    return el;
  };

  console.log('[ISU-Android] Bridge injection complete.');
})();
""".trimIndent()
