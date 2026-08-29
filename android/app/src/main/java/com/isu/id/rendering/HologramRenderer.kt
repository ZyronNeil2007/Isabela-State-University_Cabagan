package com.isu.id.rendering

import android.graphics.*
import com.isu.id.data.model.CampusTheme
import kotlin.math.sin

/**
 * Holographic security watermark renderer.
 * Ported from drawHologramWatermark() in app.js (lines 2812–2850).
 *
 * Draws three layers:
 *  1. Subtle translucent circle (official seal style)
 *  2. Guilloche sine-wave security curves in campus accent colour
 *  3. Iridescent gradient sheen (gold → cyan)
 */
class HologramRenderer {

    fun draw(canvas: Canvas, width: Float, height: Float, campusTheme: CampusTheme) {
        // 1. Subtle white circle watermark (globalAlpha 0.06 → alpha 15)
        val circlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(15, 255, 255, 255)
            style = Paint.Style.FILL
        }
        canvas.drawCircle(width / 2f, height / 2f, width * 0.25f, circlePaint)

        // 2. Guilloche security curves (globalAlpha 0.07 → alpha 18)
        val accentColorInt = campusTheme.accentColor.toArgb()
        val curvePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(18,
                Color.red(accentColorInt),
                Color.green(accentColorInt),
                Color.blue(accentColorInt)
            )
            style     = Paint.Style.STROKE
            strokeWidth = 2f
        }

        for (i in 0 until 5) {
            val path = Path()
            val yOffset = height * (0.18f + i * 0.16f)
            var firstPoint = true
            var x = 0f
            while (x <= width) {
                val y = yOffset + sin(x * 0.02 + i * 1.5) * 15f
                if (firstPoint) {
                    path.moveTo(x, y.toFloat())
                    firstPoint = false
                } else {
                    path.lineTo(x, y.toFloat())
                }
                x += 10f
            }
            canvas.drawPath(path, curvePaint)
        }

        // 3. Iridescent ribbon sheen (linear gradient, globalAlpha 0.85 → alpha 217)
        val gradient = LinearGradient(
            0f, 0f, width, height,
            intArrayOf(
                Color.argb(0,   255, 255, 255),
                Color.argb(5,   255, 255, 255),
                Color.argb(26,  255, 215, 0  ),
                Color.argb(20,  0,   255, 255),
                Color.argb(0,   255, 255, 255)
            ),
            floatArrayOf(0f, 0.4f, 0.5f, 0.6f, 1.0f),
            Shader.TileMode.CLAMP
        )
        val sheenPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = gradient
            alpha  = 217 // 0.85 * 255
        }
        canvas.drawRect(0f, 0f, width, height, sheenPaint)
    }
}

/** Convert Compose Color to android.graphics.Color int */
private fun androidx.compose.ui.graphics.Color.toArgb(): Int =
    android.graphics.Color.argb(
        (alpha * 255).toInt(),
        (red   * 255).toInt(),
        (green * 255).toInt(),
        (blue  * 255).toInt()
    )
