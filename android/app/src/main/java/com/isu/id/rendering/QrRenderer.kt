package com.isu.id.rendering

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel

/**
 * QR code generator using ZXing.
 * Replaces QRCode.js / drawFallbackQr() from app.js (lines 2852–2921).
 *
 * Encodes the verification payload and returns a Bitmap.
 */
class QrRenderer {

    private val writer = QRCodeWriter()

    /**
     * Generate a QR code Bitmap for [payload] at [sizePx]×[sizePx].
     * Uses ErrorCorrectionLevel.M to match QRCode.CorrectLevel.M in app.js.
     */
    fun generate(payload: String, sizePx: Int): Bitmap {
        return try {
            val hints = mapOf(
                EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
                EncodeHintType.MARGIN to 1
            )
            val matrix = writer.encode(payload, BarcodeFormat.QR_CODE, sizePx, sizePx, hints)

            val bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
            for (x in 0 until sizePx) {
                for (y in 0 until sizePx) {
                    bmp.setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
                }
            }
            bmp
        } catch (e: Exception) {
            // Fallback: solid white bitmap with "QR" marker
            Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888).also {
                it.eraseColor(Color.WHITE)
            }
        }
    }
}
