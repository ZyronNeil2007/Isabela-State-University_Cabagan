package com.isu.id.ui.preview

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.isu.id.data.model.CampusTheme
import com.isu.id.util.AudioFxHelper

/**
 * High-Resolution Card Inspector Dialog with interactive Pan & Zoom.
 * Equivalent to openCardInspectModal() / renderInspectCanvas() in app.js (lines 3041–3079).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CardInspectorDialog(
    frontBitmap: Bitmap?,
    backBitmap: Bitmap?,
    campusTheme: CampusTheme,
    audioEnabled: Boolean,
    onDismiss: () -> Unit,
    onExportRequested: () -> Unit
) {
    var showFront by remember { mutableStateOf(true) }
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    val transformState = rememberTransformableState { zoomChange, offsetChange, _ ->
        scale = (scale * zoomChange).coerceIn(1f, 5f)
        // If zoom is reset to 1x, reset offset
        offset = if (scale == 1f) Offset.Zero else offset + offsetChange
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            dismissOnBackPress = true
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFF090D12) // Deep dark modal background
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // ── Header Bar ───────────────────────────────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.ZoomIn,
                            contentDescription = null,
                            tint = campusTheme.accentColor
                        )
                        Text(
                            "Card Inspector",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        // Reset Zoom button
                        if (scale > 1f) {
                            IconButton(onClick = {
                                scale = 1f
                                offset = Offset.Zero
                                AudioFxHelper.play(AudioFxHelper.SoundType.CLICK, audioEnabled)
                            }) {
                                Icon(
                                    Icons.Default.RestartAlt,
                                    contentDescription = "Reset Zoom",
                                    tint = Color.White
                                )
                            }
                        }
                        // Close button
                        IconButton(onClick = {
                            AudioFxHelper.play(AudioFxHelper.SoundType.CLICK, audioEnabled)
                            onDismiss()
                        }) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Close",
                                tint = Color.White
                            )
                        }
                    }
                }

                // ── Front / Back Face Segmented Controls ──────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    SingleChoiceSegmentedButtonRow(
                        modifier = Modifier.widthIn(max = 300.dp)
                    ) {
                        SegmentedButton(
                            shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                            onClick = {
                                if (!showFront) {
                                    showFront = true
                                    AudioFxHelper.play(AudioFxHelper.SoundType.CLICK, audioEnabled)
                                }
                            },
                            selected = showFront,
                            icon = { SegmentedButtonDefaults.Icon(active = showFront) }
                        ) {
                            Text("Front Face")
                        }

                        SegmentedButton(
                            shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                            onClick = {
                                if (showFront) {
                                    showFront = false
                                    AudioFxHelper.play(AudioFxHelper.SoundType.CLICK, audioEnabled)
                                }
                            },
                            selected = !showFront,
                            icon = { SegmentedButtonDefaults.Icon(active = !showFront) }
                        ) {
                            Text("Back Face")
                        }
                    }
                }

                // ── Interactive Zoomable Card Viewport ───────────────────────
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFF141A22))
                        .transformable(state = transformState),
                    contentAlignment = Alignment.Center
                ) {
                    val currentBitmap = if (showFront) frontBitmap else backBitmap

                    if (currentBitmap != null) {
                        Image(
                            bitmap = currentBitmap.asImageBitmap(),
                            contentDescription = if (showFront) "Front ID card" else "Back ID card",
                            modifier = Modifier
                                .fillMaxHeight(0.9f)
                                .aspectRatio(currentBitmap.width.toFloat() / currentBitmap.height.toFloat())
                                .graphicsLayer {
                                    scaleX = scale
                                    scaleY = scale
                                    translationX = offset.x
                                    translationY = offset.y
                                },
                            contentScale = ContentScale.Fit
                        )
                    } else {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            CircularProgressIndicator(
                                color = campusTheme.accentColor,
                                strokeWidth = 3.dp
                            )
                            Text(
                                "Rendering High-Res Preview…",
                                color = Color(0xFF8B949E),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }

                    // Zoom indicator badge
                    if (scale > 1f) {
                        Surface(
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .padding(12.dp),
                            shape = RoundedCornerShape(20.dp),
                            color = Color(0xCC000000)
                        ) {
                            Text(
                                text = "${String.format("%.1f", scale)}×",
                                color = Color.White,
                                style = MaterialTheme.typography.labelMedium,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }

                // ── Footer Control Bar ─────────────────────────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Pinch to zoom • Drag to pan",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF8B949E)
                    )

                    Button(
                        onClick = {
                            AudioFxHelper.play(AudioFxHelper.SoundType.CLICK, audioEnabled)
                            onDismiss()
                            onExportRequested()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = campusTheme.primaryColor
                        )
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("Export Card")
                    }
                }
            }
        }
    }
}
