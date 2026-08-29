package com.isu.id.imaging

import android.graphics.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Finger-drawn signature pad — Compose equivalent of the HTML5 canvas
 * signature pad in app.js (lines 337–435).
 *
 * Drawing:
 *  - lineWidth 2.5dp (density-scaled to match web version on ~160dpi screens)
 *  - lineCap = ROUND, lineJoin = ROUND (matches app.js sigCtx settings)
 *  - Ink color #111111 (very dark, not pure black — matches app.js)
 *
 * Stroke model: each completed drag gesture creates a list of Offsets
 * which are rendered as connected line segments.
 *
 * @param initialBitmap  Previously captured signature to show (for tab switching).
 * @param onSignatureChanged  Called with the current Bitmap after every stroke ends.
 * @param onClear  Called when the user taps "Clear".
 */
@Composable
fun SignaturePad(
    modifier: Modifier = Modifier,
    initialBitmap: Bitmap? = null,
    onSignatureChanged: (Bitmap?) -> Unit = {},
    onClear: (() -> Unit)? = null
) {
    val density = LocalDensity.current
    val lineWidthDp = 2.5.dp

    // All completed strokes (list of point lists)
    val strokes = remember { mutableStateListOf<List<Offset>>() }
    val currentStroke = remember { mutableStateListOf<Offset>() }
    val hasDrawn = remember { mutableStateOf(false) }

    // Pre-load initial bitmap's strokes (if resuming)
    // We store strokes as Offset lists — for an existing Bitmap (loaded from DB)
    // we draw it as a background rather than re-vectorizing it.
    var backgroundBitmap by remember { mutableStateOf(initialBitmap) }

    LaunchedEffect(initialBitmap) {
        backgroundBitmap = initialBitmap
        if (initialBitmap != null) hasDrawn.value = true
    }

    // Export current state to Bitmap for the callback
    fun captureAndEmit(canvasWidth: Int, canvasHeight: Int) {
        if (canvasWidth <= 0 || canvasHeight <= 0) return
        val bmp = Bitmap.createBitmap(canvasWidth, canvasHeight, Bitmap.Config.ARGB_8888)
        val androidCanvas = android.graphics.Canvas(bmp)

        // Draw background (existing signature from DB)
        backgroundBitmap?.let {
            androidCanvas.drawBitmap(it, null,
                android.graphics.RectF(0f, 0f, canvasWidth.toFloat(), canvasHeight.toFloat()),
                null)
        }

        val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
            color       = android.graphics.Color.parseColor("#111111")
            style       = android.graphics.Paint.Style.STROKE
            strokeWidth = with(density) { lineWidthDp.toPx() }
            strokeCap   = android.graphics.Paint.Cap.ROUND
            strokeJoin  = android.graphics.Paint.Join.ROUND
        }

        for (stroke in strokes) {
            if (stroke.isEmpty()) continue
            val path = android.graphics.Path()
            path.moveTo(stroke[0].x, stroke[0].y)
            for (k in 1 until stroke.size) path.lineTo(stroke[k].x, stroke[k].y)
            androidCanvas.drawPath(path, paint)
        }

        onSignatureChanged(bmp)
    }

    var canvasWidthPx by remember { mutableStateOf(0) }
    var canvasHeightPx by remember { mutableStateOf(0) }

    Column(modifier = modifier) {
        // ── Drawing surface ──────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Color(0xFFFAFAFA))
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                currentStroke.clear()
                                currentStroke.add(offset)
                                hasDrawn.value = true
                                // Hide background once user starts drawing
                                backgroundBitmap = null
                            },
                            onDrag = { change, _ ->
                                currentStroke.add(change.position)
                            },
                            onDragEnd = {
                                if (currentStroke.size > 1) {
                                    strokes.add(currentStroke.toList())
                                    currentStroke.clear()
                                    captureAndEmit(canvasWidthPx, canvasHeightPx)
                                }
                            },
                            onDragCancel = {
                                currentStroke.clear()
                            }
                        )
                    }
            ) {
                canvasWidthPx  = size.width.toInt()
                canvasHeightPx = size.height.toInt()

                val lineWidth = with(density) { lineWidthDp.toPx() }
                val strokeStyle = Stroke(
                    width = lineWidth,
                    cap   = StrokeCap.Round,
                    join  = StrokeJoin.Round
                )
                val inkColor = Color(0xFF111111)

                // Draw background bitmap (restored session)
                backgroundBitmap?.let { bmp ->
                    drawIntoCanvas { composeCanvas ->
                        composeCanvas.nativeCanvas.drawBitmap(
                            bmp, null,
                            android.graphics.RectF(0f, 0f, size.width, size.height),
                            null
                        )
                    }
                }

                // Draw completed strokes
                for (stroke in strokes) {
                    drawStroke(stroke, inkColor, strokeStyle)
                }

                // Draw in-progress stroke
                if (currentStroke.size > 1) {
                    drawStroke(currentStroke, inkColor, strokeStyle)
                }

                // Watermark hint (shown when nothing has been drawn)
                if (!hasDrawn.value && strokes.isEmpty()) {
                    drawContext.canvas.nativeCanvas.apply {
                        val p = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                            color    = android.graphics.Color.argb(80, 180, 180, 180)
                            textSize = with(density) { 14.sp.toPx() }
                            textAlign = android.graphics.Paint.Align.CENTER
                        }
                        drawText(
                            "Sign here",
                            size.width / 2f,
                            size.height / 2f + p.textSize / 3f,
                            p
                        )
                    }
                }
            }
        }

        // ── Clear button ──────────────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.End
        ) {
            TextButton(
                onClick = {
                    strokes.clear()
                    currentStroke.clear()
                    backgroundBitmap = null
                    hasDrawn.value = false
                    onSignatureChanged(null)
                    onClear?.invoke()
                }
            ) {
                Text("Clear")
            }
        }
    }
}

// ── Draw helper ───────────────────────────────────────────────────────────────

private fun DrawScope.drawStroke(points: List<Offset>, color: Color, stroke: Stroke) {
    if (points.size < 2) return
    for (i in 0 until points.size - 1) {
        drawLine(
            color = color,
            start = points[i],
            end   = points[i + 1],
            strokeWidth = stroke.width,
            cap         = stroke.cap
        )
    }
}

private fun DrawScope.drawIntoCanvas(block: (androidx.compose.ui.graphics.Canvas) -> Unit) {
    block(drawContext.canvas)
}
