package com.isu.id.ui.preview

import android.graphics.Bitmap
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp

/**
 * Flippable card preview composable.
 * Tap to flip between front and back face.
 * Mirrors the interactive card flip in the web app's preview panel.
 */
@Composable
fun CardPreviewComposable(
    frontBitmap: Bitmap?,
    backBitmap: Bitmap?,
    modifier: Modifier = Modifier,
    initialShowFront: Boolean = true,
    isRendering: Boolean = false
) {
    var showFront by remember { mutableStateOf(initialShowFront) }
    val rotY by animateFloatAsState(
        targetValue = if (showFront) 0f else 180f,
        animationSpec = tween(durationMillis = 500, easing = FastOutSlowInEasing),
        label = "card_flip"
    )

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .clickable { showFront = !showFront }
            .graphicsLayer { rotationY = rotY; cameraDistance = 12f * density },
        contentAlignment = Alignment.Center
    ) {
        if (isRendering) {
            CircularProgressIndicator(modifier = Modifier.size(40.dp))
        } else {
            val bitmap = if (rotY <= 90f) frontBitmap else backBitmap
            if (bitmap != null) {
                Image(
                    bitmap = bitmap.asImageBitmap(),
                    contentDescription = if (showFront) "Front face" else "Back face",
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer {
                            // Mirror the back face so it reads correctly after flip
                            if (rotY > 90f) scaleX = -1f
                        },
                    contentScale = ContentScale.Fit
                )
            } else {
                Text(
                    "Tap to flip",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}
