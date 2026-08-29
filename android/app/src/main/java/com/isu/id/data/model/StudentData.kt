package com.isu.id.data.model

import android.graphics.Bitmap
import androidx.compose.ui.graphics.Color

// ── Form Fields ──────────────────────────────────────────────────────────────
data class FormData(
    val name: String = "",
    val idNumber: String = "",
    val course: String = "",        // Used by Old ID
    val department: String = "",    // Used by 2026 ID (key: "CBM", "CCJE", etc.)
    val dob: String = "",           // "YYYY-MM-DD"
    val parentName: String = "",
    val address: String = "",
    val telephone: String = ""
)

// ── Student Container ────────────────────────────────────────────────────────
data class Student(
    val dbId: Long = 0,
    val formData: FormData = FormData(),
    val photoBitmap: Bitmap? = null,
    val signatureBitmap: Bitmap? = null
)

// ── ID Template Version ──────────────────────────────────────────────────────
enum class IdVersion { OLD, NEW_2026 }

// ── Export Mode ──────────────────────────────────────────────────────────────
enum class ExportSide { FRONT, BACK, BOTH }

// ── Department Map ────────────────────────────────────────────────────────────
/**
 * Maps department abbreviation → full college name used for rendering.
 * Multi-line names use '\n' for line breaks.
 * Ported directly from DEPARTMENT_LABELS in app.js.
 */
val DEPARTMENT_LABELS: Map<String, String> = mapOf(
    "CBM"    to "COLLEGE OF BUSINESS AND MANAGEMENT",
    "CCJE"   to "COLLEGE OF CRIMINAL JUSTICE EDUCATION",
    "CAST"   to "COLLEGE OF AGRICULTURAL,\nSCIENCE AND TECHNOLOGY",
    "CCSICT" to "COLLEGE OF COMPUTING STUDIES,\nINFORMATION COMMUNICATION\nTECHNOLOGY",
    "COE"    to "COLLEGE OF EDUCATION",
    "CED"    to "COLLEGE OF EDUCATION",
    "CFEM"   to "COLLEGE OF FORESTRY AND\nENVIRONMENTAL MANAGEMENT",
    "CCSS"   to "COLLEGE OF COMMUNICATION\nAND SOCIAL SCIENCES",
    "CS"     to "COLLEGE OF SCIENCE"
)

// ── App Settings (stored in DataStore) ───────────────────────────────────────
data class AppSettings(
    val idVersion: IdVersion = IdVersion.NEW_2026,
    val campusTheme: CampusTheme = CampusTheme.CABAGAN,
    val hologramEnabled: Boolean = true,
    val audioEnabled: Boolean = true,
    val activeStudentIndex: Int = 0
)
