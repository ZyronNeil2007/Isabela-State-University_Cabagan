package com.isu.id.data.model

import androidx.compose.ui.graphics.Color

/**
 * Data model for ISU Campus themes, derived from the Spatial Edition 2026 config.
 */
data class CampusTheme(
    val id: String,
    val displayName: String,
    val headerText: String,
    val primaryColor: Color,
    val accentColor: Color,
    val particleColor: Int
) {
    // Enum-like properties for compatibility
    val name: String get() = id
    val primary: Color get() = primaryColor
    val accent: Color get() = accentColor

    companion object {
        val CABAGAN = CampusTheme(
            id = "CABAGAN",
            displayName = "Cabagan Main Campus",
            headerText = "ISABELA STATE UNIVERSITY · CABAGAN",
            primaryColor = Color(0xFF0F5132),
            accentColor = Color(0xFFD4AF37),
            particleColor = 0x15B915
        )
        val ECHAGUE = CampusTheme(
            id = "ECHAGUE",
            displayName = "Echague Main Campus",
            headerText = "ISABELA STATE UNIVERSITY · ECHAGUE",
            primaryColor = Color(0xFF1B365D),
            accentColor = Color(0xFFEAAA00),
            particleColor = 0x3B82F6
        )
        val CAUAYAN = CampusTheme(
            id = "CAUAYAN",
            displayName = "Cauayan Campus",
            headerText = "ISABELA STATE UNIVERSITY · CAUAYAN",
            primaryColor = Color(0xFF800020),
            accentColor = Color(0xFFDFB15B),
            particleColor = 0xEF4444
        )
        val ILAGAN = CampusTheme(
            id = "ILAGAN",
            displayName = "Ilagan Campus",
            headerText = "ISABELA STATE UNIVERSITY · ILAGAN",
            primaryColor = Color(0xFF4A154B),
            accentColor = Color(0xFFC0C0C0),
            particleColor = 0xA855F7
        )
        val ROXAS = CampusTheme(
            id = "ROXAS",
            displayName = "Roxas Campus",
            headerText = "ISABELA STATE UNIVERSITY · ROXAS",
            primaryColor = Color(0xFF008080),
            accentColor = Color(0xFFFFBF00),
            particleColor = 0x14B8A6
        )
        val ANGADANAN = CampusTheme(
            id = "ANGADANAN",
            displayName = "Angadanan Campus",
            headerText = "ISABELA STATE UNIVERSITY · ANGADANAN",
            primaryColor = Color(0xFF1E4D2B),
            accentColor = Color(0xFFB87333),
            particleColor = 0x10B981
        )
        val SAN_MATEO = CampusTheme(
            id = "SAN_MATEO",
            displayName = "San Mateo Campus",
            headerText = "ISABELA STATE UNIVERSITY · SAN MATEO",
            primaryColor = Color(0xFF92400E),
            accentColor = Color(0xFFF59E0B),
            particleColor = 0xF59E0B
        )
        val JONES = CampusTheme(
            id = "JONES",
            displayName = "Jones Campus",
            headerText = "ISABELA STATE UNIVERSITY · JONES",
            primaryColor = Color(0xFF0F172A),
            accentColor = Color(0xFF06B6D4),
            particleColor = 0x06B6D4
        )
        val PALANAN = CampusTheme(
            id = "PALANAN",
            displayName = "Palanan Campus",
            headerText = "ISABELA STATE UNIVERSITY · PALANAN",
            primaryColor = Color(0xFF0284C7),
            accentColor = Color(0xFFF97316),
            particleColor = 0x0284C7
        )
        val SAN_MARIANO = CampusTheme(
            id = "SAN_MARIANO",
            displayName = "San Mariano Campus",
            headerText = "ISABELA STATE UNIVERSITY · SAN MARIANO",
            primaryColor = Color(0xFF047857),
            accentColor = Color(0xFFEAB308),
            particleColor = 0x047857
        )
        val SANTIAGO = CampusTheme(
            id = "SANTIAGO",
            displayName = "Santiago City Extension",
            headerText = "ISABELA STATE UNIVERSITY · SANTIAGO",
            primaryColor = Color(0xFF581C87),
            accentColor = Color(0xFFF43F5E),
            particleColor = 0xF43F5E
        )

        val All = listOf(
            CABAGAN, ECHAGUE, CAUAYAN, ILAGAN, ROXAS,
            ANGADANAN, SAN_MATEO, JONES, PALANAN, SAN_MARIANO, SANTIAGO
        )

        val entries = All

        fun values() = All.toTypedArray()
        fun valueOf(value: String): CampusTheme = All.first { it.id == value }
    }
}
