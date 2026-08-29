package com.isu.id.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.isu.id.data.db.AppDatabase
import com.isu.id.data.db.StudentEntity
import com.isu.id.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

// DataStore singleton extension
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "isu_id_settings")

/**
 * Central repository:
 *  - Room DB for student records (text + image BLOBs)
 *  - DataStore Preferences for global app settings
 *
 * Bridges the database layer with the ViewModels. Handles
 * Bitmap ↔ ByteArray conversion transparently.
 */
class StudentRepository(private val context: Context) {

    private val db = AppDatabase.getInstance(context)
    private val dao = db.studentDao()

    // ── DataStore preference keys ────────────────────────────────────────────
    private object Keys {
        val ID_VERSION = stringPreferencesKey("id_version")
        val CAMPUS_THEME = stringPreferencesKey("campus_theme")
        val HOLOGRAM = booleanPreferencesKey("hologram_enabled")
        val AUDIO = booleanPreferencesKey("audio_enabled")
        val ACTIVE_INDEX = intPreferencesKey("active_student_index")
    }

    // ── Settings flow ─────────────────────────────────────────────────────────
    val appSettings: Flow<AppSettings> = context.dataStore.data.map { prefs ->
        AppSettings(
            idVersion = prefs[Keys.ID_VERSION]
                ?.let { runCatching { IdVersion.valueOf(it) }.getOrNull() }
                ?: IdVersion.NEW_2026,
            campusTheme = prefs[Keys.CAMPUS_THEME]
                ?.let { runCatching { CampusTheme.valueOf(it) }.getOrNull() }
                ?: CampusTheme.CABAGAN,
            hologramEnabled = prefs[Keys.HOLOGRAM] ?: true,
            audioEnabled = prefs[Keys.AUDIO] ?: true,
            activeStudentIndex = prefs[Keys.ACTIVE_INDEX] ?: 0
        )
    }

    suspend fun saveSettings(settings: AppSettings) {
        context.dataStore.edit { prefs ->
            prefs[Keys.ID_VERSION] = settings.idVersion.name
            prefs[Keys.CAMPUS_THEME] = settings.campusTheme.name
            prefs[Keys.HOLOGRAM] = settings.hologramEnabled
            prefs[Keys.AUDIO] = settings.audioEnabled
            prefs[Keys.ACTIVE_INDEX] = settings.activeStudentIndex
        }
    }

    // ── Student CRUD ──────────────────────────────────────────────────────────

    /** Load all students (once, not streaming) and decode image BLOBs to Bitmaps. */
    suspend fun loadAllStudents(): List<Student> = withContext(Dispatchers.IO) {
        dao.getAllStudentsOnce().map { it.toStudent() }
    }

    /** Save (replace) the full student list atomically. */
    suspend fun saveAllStudents(students: List<Student>) = withContext(Dispatchers.IO) {
        dao.deleteAll()
        dao.insertAll(students.map { it.toEntity() })
    }

    suspend fun insertStudent(student: Student): Long = withContext(Dispatchers.IO) {
        dao.insert(student.toEntity())
    }

    suspend fun updateStudent(student: Student) = withContext(Dispatchers.IO) {
        dao.update(student.toEntity())
    }

    suspend fun deleteStudent(student: Student) = withContext(Dispatchers.IO) {
        dao.delete(student.toEntity())
    }

    suspend fun hasExistingSession(): Boolean = withContext(Dispatchers.IO) {
        dao.count() > 0
    }

    suspend fun clearAllStudents() = withContext(Dispatchers.IO) {
        dao.deleteAll()
    }

    // ── Conversion helpers ────────────────────────────────────────────────────

    private fun StudentEntity.toStudent(): Student = Student(
        dbId = id,
        formData = FormData(
            name = name,
            idNumber = idNumber,
            course = course,
            department = department,
            dob = dob,
            parentName = parentName,
            address = address,
            telephone = telephone
        ),
        photoBitmap = photoPng?.let { BitmapFactory.decodeByteArray(it, 0, it.size) },
        signatureBitmap = signaturePng?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
    )

    private fun Student.toEntity(): StudentEntity = StudentEntity(
        id = dbId,
        name = formData.name,
        idNumber = formData.idNumber,
        course = formData.course,
        department = formData.department,
        dob = formData.dob,
        parentName = formData.parentName,
        address = formData.address,
        telephone = formData.telephone,
        photoPng = photoBitmap?.toPng(),
        signaturePng = signatureBitmap?.toPng()
    )

    private fun Bitmap.toPng(): ByteArray {
        val out = ByteArrayOutputStream()
        compress(Bitmap.CompressFormat.PNG, 100, out)
        return out.toByteArray()
    }
}
