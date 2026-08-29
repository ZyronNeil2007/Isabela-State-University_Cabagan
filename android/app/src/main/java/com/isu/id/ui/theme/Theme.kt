package com.isu.id.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.isu.id.data.model.CampusTheme

/**
 * Dynamic Material 3 theme provider that swaps primary + secondary colours
 * based on the selected campus theme.
 *
 * Mirrors the CSS custom property swap (--green-600, --gold-400) from app.js
 * setCampusTheme() (lines 2720–2741) — the entire Compose UI recomposes
 * with the new colors when campusTheme changes.
 */
@Composable
fun ISUIDTheme(
    campusTheme: CampusTheme = CampusTheme.CABAGAN,
    content: @Composable () -> Unit
) {
    val colorScheme = darkColorScheme(
        primary         = campusTheme.primaryColor,
        onPrimary       = Color.White,
        primaryContainer = campusTheme.primaryColor.copy(alpha = 0.2f),
        secondary       = campusTheme.accentColor,
        onSecondary     = Color.Black,
        secondaryContainer = campusTheme.accentColor.copy(alpha = 0.15f),
        background      = Color(0xFF0D1117),   // Deep dark — premium feel
        onBackground    = Color(0xFFE6EDF3),
        surface         = Color(0xFF161B22),
        onSurface       = Color(0xFFE6EDF3),
        surfaceVariant  = Color(0xFF21262D),
        onSurfaceVariant = Color(0xFF8B949E),
        outline         = Color(0xFF30363D),
        error           = Color(0xFFF87171),
        onError         = Color.White
    )

    MaterialTheme(
        colorScheme = colorScheme,
        typography  = AppTypography,
        content     = content
    )
}
