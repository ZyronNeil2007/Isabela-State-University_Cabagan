package com.isu.id.rendering

import android.graphics.Paint

/**
 * Pixel coordinate configuration for both ID templates.
 * Ported 1:1 from CONFIG and CONFIG_2026 in app.js.
 */

// ── Shared config types ───────────────────────────────────────────────────────

data class PhotoBox(
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val cornerRadius: Float = 0f   // 0 = rect clip (Old ID), >0 = rounded (2026)
)

data class SigBox(
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float
)

enum class TextAlign { LEFT, CENTER, RIGHT }

data class TextConfig(
    val x: Float,
    val y: Float,
    val fontSizePx: Float,           // Logical font size in template pixels
    val bold: Boolean = false,
    val align: TextAlign = TextAlign.CENTER,
    val fillColor: Int = android.graphics.Color.BLACK,
    val strokeColor: Int = android.graphics.Color.TRANSPARENT,
    val strokeThicknessScaled: Float = 0f, // pre-scaled stroke width
    val maxWidth: Float = 0f,        // 0 = no limit
    val lineHeight: Float = 0f,      // 0 = auto (fontSize * 1.15)
    val scaleByMultiplier: Boolean = false // true for Old ID (apply 4.17x)
)

// ── Old ID Configuration ──────────────────────────────────────────────────────
/**
 * CONFIG from app.js — Old ID template.
 * scaleMultiplier = 4.17 is applied to all logical coordinates when rendering.
 * Template dimensions are derived from the loaded bitmap (≈638×1013 px).
 */
object OldIdConfig {
    const val SCALE = 4.17f

    val photo = PhotoBox(x = 161f, y = 213f, width = 315f, height = 355f, cornerRadius = 0f)
    val signature = SigBox(x = 160f, y = 575f, width = 319f, height = 120f)

    object Text {
        // Front face fields
        val name = TextConfig(
            x = 319f, y = 710f, fontSizePx = 11.2f, bold = true,
            align = TextAlign.CENTER, fillColor = android.graphics.Color.BLACK,
            scaleByMultiplier = true
        )
        val idNumber = TextConfig(
            x = 319f, y = 795f, fontSizePx = 9.8f, bold = true,
            align = TextAlign.CENTER, fillColor = android.graphics.Color.BLACK,
            scaleByMultiplier = true
        )
        val course = TextConfig(
            x = 319f, y = 915f, fontSizePx = 10.8f, bold = true,
            align = TextAlign.CENTER, fillColor = android.graphics.Color.BLACK,
            maxWidth = 550f, scaleByMultiplier = true
        )

        // Back face fields
        val parentName = TextConfig(
            x = 64f, y = 145f, fontSizePx = 7.7f, bold = true,
            align = TextAlign.LEFT, fillColor = android.graphics.Color.BLACK,
            strokeThicknessScaled = 10f * SCALE / 10f, scaleByMultiplier = true
        )
        val address = TextConfig(
            x = 64f, y = 185f, fontSizePx = 4.9f, bold = true,
            align = TextAlign.LEFT, fillColor = android.graphics.Color.BLACK,
            strokeThicknessScaled = 16f * SCALE / 10f, maxWidth = 500f,
            scaleByMultiplier = true
        )
        val telephone = TextConfig(
            x = 64f, y = 205f, fontSizePx = 4.9f, bold = true,
            align = TextAlign.LEFT, fillColor = android.graphics.Color.BLACK,
            strokeThicknessScaled = 16f * SCALE / 10f, scaleByMultiplier = true
        )
        val dob = TextConfig(
            x = 64f, y = 250f, fontSizePx = 5.7f, bold = false,
            align = TextAlign.LEFT, fillColor = android.graphics.Color.BLACK,
            scaleByMultiplier = true
        )
    }
}

// ── 2026 New ID Configuration ─────────────────────────────────────────────────
/**
 * CONFIG_2026 from app.js — 2026 New ID template.
 * scaleMultiplier = 1 (no scaling — all coords are native px).
 * Front canvas: 675×1050 px  |  Back canvas: 704×1050 px
 */
object NewIdConfig {
    const val SCALE = 1f

    // Front face
    val photo = PhotoBox(x = 181f, y = 249f, width = 336f, height = 315f, cornerRadius = 14f)
    val signature = SigBox(x = 176f, y = 565f, width = 328f, height = 100f)

    object Text {
        // Front face fields
        val name = TextConfig(
            x = 337.5f, y = 690f, fontSizePx = 42f, bold = true,
            align = TextAlign.CENTER, fillColor = android.graphics.Color.BLACK
        )
        val idNumber = TextConfig(
            x = 337.5f, y = 780f, fontSizePx = 52f, bold = true,
            align = TextAlign.CENTER, fillColor = android.graphics.Color.BLACK
        )
        val department = TextConfig(
            x = 337.5f, y = 890f, fontSizePx = 26f, bold = true,
            align = TextAlign.CENTER, fillColor = android.graphics.Color.BLACK,
            maxWidth = 600f, lineHeight = 34f
        )

        // Back face fields (canvas 704×1050)
        val parentName = TextConfig(
            x = 240f, y = 120f, fontSizePx = 26f, bold = true,
            align = TextAlign.LEFT, fillColor = android.graphics.Color.BLACK
        )
        val address = TextConfig(
            x = 135f, y = 180f, fontSizePx = 26f, bold = true,
            align = TextAlign.LEFT, fillColor = android.graphics.Color.BLACK,
            maxWidth = 380f
        )
        val telephone = TextConfig(
            x = 175f, y = 240f, fontSizePx = 26f, bold = true,
            align = TextAlign.LEFT, fillColor = android.graphics.Color.BLACK
        )
        val dob = TextConfig(
            x = 170f, y = 300f, fontSizePx = 26f, bold = true,
            align = TextAlign.LEFT, fillColor = android.graphics.Color.BLACK
        )
    }
}

// ── QR code positions ─────────────────────────────────────────────────────────
data class QrPosition(val x: Float, val y: Float, val size: Float)

object QrPositions {
    val old2026 = QrPosition(x = 510f, y = 60f, size = 140f)  // 2026 back
    val oldId   = QrPosition(x = 460f, y = 70f, size = 120f)  // Old ID back
}
