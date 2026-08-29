package com.isu.id.imaging

import android.graphics.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * Signature photo processing pipeline.
 *
 * Faithful Kotlin port of:
 *  - getOtsuThreshold()         (app.js lines 1981–2033)
 *  - getContentBoundingBox()    (app.js lines 2042–2086)
 *  - removeWhiteBackground()    (app.js lines 1947–1973)
 *  - enhanceSignatureWithAI()   (app.js lines 2097–2218) — the full pipeline
 *
 * Input:  A photo of a handwritten signature on white paper.
 * Output: A processed Bitmap with transparent background, ink preserved,
 *         auto-cropped to content bounding box, scaled to OUT_W×OUT_H.
 */
object SignatureProcessor {

    private const val OUT_W = 638
    private const val OUT_H = 240
    private const val MAX_SCAN_DIM = 1200

    suspend fun process(source: Bitmap): Bitmap = withContext(Dispatchers.Default) {
        // Step 1 — Downscale for analysis if needed
        val (scanW, scanH) = computeScanDimensions(source.width, source.height)
        val scanBitmap = if (scanW != source.width || scanH != source.height) {
            Bitmap.createScaledBitmap(source, scanW, scanH, true)
        } else {
            source.copy(Bitmap.Config.ARGB_8888, false)
        }

        // Step 2 — Compute Otsu's optimal threshold
        val threshold = getOtsuThreshold(scanBitmap)

        // Step 3 — Find tight content bounding box
        val box = getContentBoundingBox(scanBitmap, threshold)

        // Step 4 — Crop to bounding box
        val croppedBitmap = Bitmap.createBitmap(
            scanBitmap, box.left, box.top, box.width(), box.height()
        )

        // Step 5 — Scale-fit into OUT_W × OUT_H with 90% fill (centered)
        val workBitmap = Bitmap.createBitmap(OUT_W, OUT_H, Bitmap.Config.ARGB_8888)
        val workCanvas = Canvas(workBitmap)

        // White background for contrast boost
        workCanvas.drawColor(Color.WHITE)

        val scale = min(OUT_W.toFloat() / box.width(), OUT_H.toFloat() / box.height()) * 0.9f
        val destW = box.width() * scale
        val destH = box.height() * scale
        val destX = (OUT_W - destW) / 2f
        val destY = (OUT_H - destH) / 2f

        val srcRect  = Rect(0, 0, croppedBitmap.width, croppedBitmap.height)
        val dstRectF = RectF(destX, destY, destX + destW, destY + destH)
        workCanvas.drawBitmap(croppedBitmap, srcRect, dstRectF, null)

        // Step 6 — Contrast boost (45%, mirrors app.js lines 2174–2183)
        applyContrastBoost(workBitmap, 0.45f)

        // Step 7 — Remove white background at threshold 220
        removeWhiteBackground(workBitmap, 220)

        workBitmap
    }

    // ── Otsu's method ─────────────────────────────────────────────────────────

    /**
     * Compute optimal binarization threshold using Otsu's method.
     * Exact port of getOtsuThreshold() from app.js (lines 1981–2033).
     */
    fun getOtsuThreshold(bitmap: Bitmap): Int {
        val pixels = IntArray(bitmap.width * bitmap.height)
        bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        val histogram = IntArray(256)
        var totalPixels = 0

        for (pixel in pixels) {
            val a = Color.alpha(pixel)
            if (a < 50) continue  // Skip transparent pixels
            val r = Color.red(pixel)
            val g = Color.green(pixel)
            val b = Color.blue(pixel)
            val gray = (0.299 * r + 0.587 * g + 0.114 * b).roundToInt().coerceIn(0, 255)
            histogram[gray]++
            totalPixels++
        }

        if (totalPixels == 0) return 128

        // Otsu's between-class variance maximization
        var sum = 0.0
        for (i in 0 until 256) sum += i * histogram[i]

        var sumB = 0.0
        var wB = 0
        var wF: Int
        var varMax = 0.0
        var threshold = 128

        for (t in 0 until 256) {
            wB += histogram[t]
            if (wB == 0) continue
            wF = totalPixels - wB
            if (wF == 0) break

            sumB += t * histogram[t]
            val mB = sumB / wB
            val mF = (sum - sumB) / wF
            val varBetween = wB.toDouble() * wF.toDouble() * (mB - mF) * (mB - mF)

            if (varBetween > varMax) {
                varMax = varBetween
                threshold = t
            }
        }

        return threshold
    }

    // ── Content bounding box ──────────────────────────────────────────────────

    /**
     * Find the tight bounding box of ink content (pixels darker than threshold).
     * Port of getContentBoundingBox() from app.js (lines 2042–2086).
     * @return Rect with 10px padding clamped to bitmap bounds.
     */
    fun getContentBoundingBox(bitmap: Bitmap, threshold: Int): Rect {
        val w = bitmap.width
        val h = bitmap.height
        val pixels = IntArray(w * h)
        bitmap.getPixels(pixels, 0, w, 0, 0, w, h)

        var minX = w; var minY = h; var maxX = 0; var maxY = 0
        var found = false

        for (y in 0 until h) {
            for (x in 0 until w) {
                val pixel = pixels[y * w + x]
                val a = Color.alpha(pixel)
                if (a < 50) continue

                val r = Color.red(pixel)
                val g = Color.green(pixel)
                val b = Color.blue(pixel)
                val lum = (0.299 * r + 0.587 * g + 0.114 * b)

                if (lum < threshold) {
                    if (x < minX) minX = x
                    if (x > maxX) maxX = x
                    if (y < minY) minY = y
                    if (y > maxY) maxY = y
                    found = true
                }
            }
        }

        if (!found) return Rect(0, 0, w, h)

        val padding = 10
        return Rect(
            max(0, minX - padding),
            max(0, minY - padding),
            min(w - 1, maxX + padding),
            min(h - 1, maxY + padding)
        )
    }

    // ── White background removal ──────────────────────────────────────────────

    /**
     * Remove near-white background pixels, keep ink pixels with boosted opacity.
     * Port of removeWhiteBackground() from app.js (lines 1947–1973).
     *
     * Near-white (lum > threshold) → alpha = 0 (transparent).
     * Ink pixels → alpha boosted proportional to darkness; tinted toward black.
     */
    fun removeWhiteBackground(bitmap: Bitmap, threshold: Int = 210) {
        val w = bitmap.width
        val h = bitmap.height
        val pixels = IntArray(w * h)
        bitmap.getPixels(pixels, 0, w, 0, 0, w, h)

        for (i in pixels.indices) {
            val r = Color.red(pixels[i])
            val g = Color.green(pixels[i])
            val b = Color.blue(pixels[i])
            val lum = 0.299 * r + 0.587 * g + 0.114 * b

            if (lum > threshold) {
                // Near-white → transparent
                pixels[i] = Color.TRANSPARENT
            } else {
                // Ink pixel — boost alpha proportional to darkness
                val inkStrength = 1.0 - lum / threshold
                val alpha = min(255, (inkStrength * 320).roundToInt())
                // Tint ink toward black (mix = 0.35)
                val mix = 0.35
                val nr = (r * (1.0 - mix)).roundToInt()
                val ng = (g * (1.0 - mix)).roundToInt()
                val nb = (b * (1.0 - mix)).roundToInt()
                pixels[i] = Color.argb(alpha, nr, ng, nb)
            }
        }

        bitmap.setPixels(pixels, 0, w, 0, 0, w, h)
    }

    // ── Contrast boost ────────────────────────────────────────────────────────

    /**
     * Apply a contrast boost to each pixel.
     * Port of the contrast formula in app.js (lines 2174–2183).
     *
     * factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
     * new = clamp(factor * (old - 128) + 128, 0, 255)
     */
    private fun applyContrastBoost(bitmap: Bitmap, contrast: Float) {
        val adjustedContrast = contrast * 255
        val factor = (259.0 * (adjustedContrast + 255.0)) / (255.0 * (259.0 - adjustedContrast))

        val w = bitmap.width
        val h = bitmap.height
        val pixels = IntArray(w * h)
        bitmap.getPixels(pixels, 0, w, 0, 0, w, h)

        for (i in pixels.indices) {
            val r = Color.red(pixels[i])
            val g = Color.green(pixels[i])
            val b = Color.blue(pixels[i])
            val a = Color.alpha(pixels[i])

            val nr = (factor * (r - 128) + 128).roundToInt().coerceIn(0, 255)
            val ng = (factor * (g - 128) + 128).roundToInt().coerceIn(0, 255)
            val nb = (factor * (b - 128) + 128).roundToInt().coerceIn(0, 255)
            pixels[i] = Color.argb(a, nr, ng, nb)
        }

        bitmap.setPixels(pixels, 0, w, 0, 0, w, h)
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun computeScanDimensions(w: Int, h: Int): Pair<Int, Int> {
        if (w <= MAX_SCAN_DIM && h <= MAX_SCAN_DIM) return Pair(w, h)
        return if (w > h) {
            Pair(MAX_SCAN_DIM, (h * MAX_SCAN_DIM.toFloat() / w).roundToInt())
        } else {
            Pair((w * MAX_SCAN_DIM.toFloat() / h).roundToInt(), MAX_SCAN_DIM)
        }
    }
}
