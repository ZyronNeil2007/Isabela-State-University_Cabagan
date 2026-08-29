package com.isu.id.ui.wizard

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.isu.id.data.model.*
import com.isu.id.data.repository.StudentRepository
import com.isu.id.rendering.IdCardRenderer
import com.isu.id.util.CsvParser
import com.isu.id.util.CsvExporter
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

private const val MAX_STUDENTS = 5
private const val TOTAL_STEPS  = 10
private const val AUTO_SAVE_DELAY_MS = 2000L

/**
 * Central ViewModel for the 10-step wizard.
 *
 * Mirrors the STATE object and all module functions from app.js, rewritten
 * as reactive Kotlin flows with proper coroutine-based async rendering.
 *
 * Key equivalences:
 *   state.students[]          → students StateFlow
 *   state.activeStudentIndex  → activeStudentIndex StateFlow
 *   state.idVersion           → idVersion StateFlow
 *   state.campusTheme         → campusTheme StateFlow
 *   renderCanvases()          → triggerRender() → emits frontBitmap / backBitmap
 *   saveSessionToStorage()    → throttled auto-save via debounced coroutine
 *   switchStudent()           → switchStudent()
 *   addStudent()              → addStudent()
 *   goToStep()                → goToStep()
 */
class WizardViewModel(
    private val repository: StudentRepository,
    private val renderer: IdCardRenderer
) : ViewModel() {

    // ── Wizard state ──────────────────────────────────────────────────────────
    private val _currentStep = MutableStateFlow(1)
    val currentStep: StateFlow<Int> = _currentStep.asStateFlow()

    private val _students = MutableStateFlow<List<Student>>(
        listOf(Student())
    )
    val students: StateFlow<List<Student>> = _students.asStateFlow()

    private val _activeIndex = MutableStateFlow(0)
    val activeStudentIndex: StateFlow<Int> = _activeIndex.asStateFlow()

    private val _idVersion = MutableStateFlow(IdVersion.NEW_2026)
    val idVersion: StateFlow<IdVersion> = _idVersion.asStateFlow()

    private val _campusTheme = MutableStateFlow(CampusTheme.CABAGAN)
    val campusTheme: StateFlow<CampusTheme> = _campusTheme.asStateFlow()

    private val _hologramEnabled = MutableStateFlow(true)
    val hologramEnabled: StateFlow<Boolean> = _hologramEnabled.asStateFlow()

    private val _audioEnabled = MutableStateFlow(true)
    val audioEnabled: StateFlow<Boolean> = _audioEnabled.asStateFlow()

    // ── Rendered preview bitmaps ──────────────────────────────────────────────
    private val _frontBitmap = MutableStateFlow<Bitmap?>(null)
    val frontBitmap: StateFlow<Bitmap?> = _frontBitmap.asStateFlow()

    private val _backBitmap = MutableStateFlow<Bitmap?>(null)
    val backBitmap: StateFlow<Bitmap?> = _backBitmap.asStateFlow()

    private val _isRendering = MutableStateFlow(false)
    val isRendering: StateFlow<Boolean> = _isRendering.asStateFlow()

    // ── Session state ─────────────────────────────────────────────────────────
    private val _showRestoreDialog = MutableStateFlow(false)
    val showRestoreDialog: StateFlow<Boolean> = _showRestoreDialog.asStateFlow()

    private val _toastMessage = MutableStateFlow<Pair<String, String>?>(null)
    val toastMessage: StateFlow<Pair<String, String>?> = _toastMessage.asStateFlow()

    // Auto-save job (debounced)
    private var autoSaveJob: Job? = null

    // Render job (cancelable — last write wins)
    private var renderJob: Job? = null

    init {
        viewModelScope.launch { initSession() }
    }

    // ── Session init ──────────────────────────────────────────────────────────

    private suspend fun initSession() {
        // Load templates (async, once)
        renderer.loadTemplates()

        // Load settings from DataStore
        val settings = repository.appSettings.first()
        _idVersion.value     = settings.idVersion
        _campusTheme.value   = settings.campusTheme
        _hologramEnabled.value = settings.hologramEnabled
        _audioEnabled.value    = settings.audioEnabled

        // Check for saved session
        if (repository.hasExistingSession()) {
            _showRestoreDialog.value = true
        } else {
            triggerRender()
        }
    }

    /** Called when the user taps "Restore" on the session dialog */
    fun restoreSession() {
        viewModelScope.launch {
            _showRestoreDialog.value = false
            val saved = repository.loadAllStudents()
            if (saved.isNotEmpty()) {
                _students.value = saved
                _activeIndex.value = 0
                showToast("Session restored", "success")
            }
            triggerRender()
        }
    }

    /** Called when the user taps "Start Fresh" */
    fun discardSession() {
        viewModelScope.launch {
            _showRestoreDialog.value = false
            repository.clearAllStudents()
            _students.value = listOf(Student())
            triggerRender()
        }
    }

    fun playAudio(type: com.isu.id.util.AudioFxHelper.SoundType) {
        com.isu.id.util.AudioFxHelper.play(type, _audioEnabled.value)
    }

    // ── Stepper navigation ────────────────────────────────────────────────────

    fun goToStep(n: Int) {
        if (n in 1..TOTAL_STEPS && n != _currentStep.value) {
            playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
            _currentStep.value = n
        }
    }

    fun nextStep() {
        if (_currentStep.value < TOTAL_STEPS) {
            playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
            _currentStep.value++
        }
    }
    fun prevStep() {
        if (_currentStep.value > 1) {
            playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
            _currentStep.value--
        }
    }

    val isLastStep get() = _currentStep.value == TOTAL_STEPS

    /** Steps 1–5 show front face; steps 6–10 show back face */
    val showFront get() = _currentStep.value <= 5

    // ── Form field updates ────────────────────────────────────────────────────

    fun updateName(value: String)        = updateField { it.copy(name = value.uppercase()) }
    fun updateIdNumber(value: String)    = updateField { it.copy(idNumber = value.uppercase()) }
    fun updateCourse(value: String)      = updateField { it.copy(course = value.uppercase()) }
    fun updateDepartment(value: String)  = updateField { it.copy(department = value) }
    fun updateDob(value: String)         = updateField { it.copy(dob = value) }
    fun updateParentName(value: String)  = updateField { it.copy(parentName = value.uppercase()) }
    fun updateAddress(value: String)     = updateField { it.copy(address = value.uppercase()) }
    fun updateTelephone(value: String)   = updateField { it.copy(telephone = value.uppercase()) }

    private fun updateField(transform: (FormData) -> FormData) {
        val idx = _activeIndex.value
        val list = _students.value.toMutableList()
        if (idx !in list.indices) return
        list[idx] = list[idx].copy(formData = transform(list[idx].formData))
        _students.value = list
        triggerRender()
        scheduleAutoSave()
    }

    fun setPhoto(bitmap: Bitmap) {
        val idx = _activeIndex.value
        val list = _students.value.toMutableList()
        if (idx !in list.indices) return
        list[idx] = list[idx].copy(photoBitmap = bitmap)
        _students.value = list
        playAudio(com.isu.id.util.AudioFxHelper.SoundType.SUCCESS)
        triggerRender()
        scheduleAutoSave()
    }

    fun setSignature(bitmap: Bitmap?) {
        val idx = _activeIndex.value
        val list = _students.value.toMutableList()
        if (idx !in list.indices) return
        list[idx] = list[idx].copy(signatureBitmap = bitmap)
        _students.value = list
        triggerRender()
        scheduleAutoSave()
    }

    // ── ID version / campus theme ─────────────────────────────────────────────

    fun setIdVersion(version: IdVersion) {
        playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
        _idVersion.value = version
        triggerRender()
        saveSettings()
    }

    fun setCampusTheme(theme: CampusTheme) {
        playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
        _campusTheme.value = theme
        triggerRender()
        saveSettings()
    }

    fun toggleHologram() {
        playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
        _hologramEnabled.value = !_hologramEnabled.value
        triggerRender()
        saveSettings()
    }

    fun toggleAudio() {
        val newState = !_audioEnabled.value
        _audioEnabled.value = newState
        if (newState) {
            com.isu.id.util.AudioFxHelper.play(com.isu.id.util.AudioFxHelper.SoundType.CLICK, true)
        }
        showToast(if (newState) "Sound FX Enabled" else "Sound Muted", "info")
        saveSettings()
    }

    // ── Student batch management ──────────────────────────────────────────────

    fun addStudent() {
        if (_students.value.size >= MAX_STUDENTS) {
            playAudio(com.isu.id.util.AudioFxHelper.SoundType.ERROR)
            showToast("Maximum $MAX_STUDENTS students reached", "warning")
            return
        }
        playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
        val list = _students.value.toMutableList()
        list.add(Student())
        _students.value = list
        _activeIndex.value = list.size - 1
        triggerRender()
    }

    fun removeStudent(index: Int) {
        val list = _students.value.toMutableList()
        if (list.size <= 1) return
        playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
        list.removeAt(index)
        val newActive = if (_activeIndex.value >= list.size) list.size - 1
                        else _activeIndex.value
        _students.value = list
        _activeIndex.value = newActive
        triggerRender()
        scheduleAutoSave()
    }

    fun switchStudent(index: Int) {
        if (index !in _students.value.indices) return
        playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
        _activeIndex.value = index
        triggerRender()
    }

    val activeStudent get() = _students.value.getOrNull(_activeIndex.value) ?: Student()

    // ── CSV Import / Export ────────────────────────────────────────────────────

    fun importCsv(context: Context, uri: Uri) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val inputStream = context.contentResolver.openInputStream(uri) ?: return@launch
                val imported = CsvParser.parse(inputStream)
                if (imported.isEmpty()) {
                    showToast("No valid rows found in CSV", "error")
                    return@launch
                }
                val list = _students.value.toMutableList()
                // Replace first empty student if it's pristine
                val isFirstEmpty = list.size == 1 &&
                    list[0].formData.name.isEmpty() &&
                    list[0].formData.idNumber.isEmpty() &&
                    list[0].photoBitmap == null
                if (isFirstEmpty) list.clear()

                for (s in imported) {
                    if (list.size >= MAX_STUDENTS) break
                    list.add(s)
                }
                _students.value = list
                _activeIndex.value = 0
                showToast("Imported ${imported.size} student(s)", "success")
                triggerRender()
                scheduleAutoSave()
            } catch (e: Exception) {
                showToast("CSV import failed: ${e.message}", "error")
            }
        }
    }

    fun exportCsv(context: Context) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                CsvExporter.export(context, _students.value)
                showToast("CSV exported to Downloads", "success")
            } catch (e: Exception) {
                showToast("CSV export failed", "error")
            }
        }
    }

    // ── OCR autofill ──────────────────────────────────────────────────────────

    fun applyOcrResult(result: OcrResult) {
        val idx = _activeIndex.value
        val list = _students.value.toMutableList()
        if (idx !in list.indices) return
        var form = list[idx].formData
        if (result.name.isNotBlank())   form = form.copy(name = result.name.uppercase())
        if (result.idNumber.isNotBlank()) form = form.copy(idNumber = result.idNumber.uppercase())
        if (result.course.isNotBlank())  form = form.copy(course = result.course.uppercase())
        if (result.dob.isNotBlank())     form = form.copy(dob = result.dob)
        list[idx] = list[idx].copy(formData = form)
        _students.value = list
        triggerRender()
        scheduleAutoSave()
    }

    // ── Render trigger ────────────────────────────────────────────────────────

    /**
     * Cancel any in-flight render and start a new one.
     * Mirrors the rafDebounce(renderCanvases) pattern from app.js —
     * only the last requested render actually runs.
     */
    fun triggerRender() {
        renderJob?.cancel()
        renderJob = viewModelScope.launch(Dispatchers.Default) {
            _isRendering.value = true
            try {
                val student = _students.value.getOrElse(_activeIndex.value) { Student() }
                val version = _idVersion.value
                val theme   = _campusTheme.value
                val hologram = _hologramEnabled.value

                val front = renderer.renderFront(student, version, theme, hologram)
                val back  = renderer.renderBack(student, version, theme)

                _frontBitmap.value = front
                _backBitmap.value  = back
            } catch (e: CancellationException) {
                // Normal — superseded by a newer render request
            } finally {
                _isRendering.value = false
            }
        }
    }

    // ── Session auto-save (throttled) ─────────────────────────────────────────

    private fun scheduleAutoSave() {
        autoSaveJob?.cancel()
        autoSaveJob = viewModelScope.launch {
            delay(AUTO_SAVE_DELAY_MS)
            saveStudentsToDb()
        }
    }

    private suspend fun saveStudentsToDb() {
        try {
            repository.saveAllStudents(_students.value)
        } catch (e: Exception) {
            // Silently ignore — same as localStorage quota handling in app.js
        }
    }

    private fun saveSettings() {
        viewModelScope.launch {
            repository.saveSettings(
                AppSettings(
                    idVersion      = _idVersion.value,
                    campusTheme    = _campusTheme.value,
                    hologramEnabled = _hologramEnabled.value,
                    audioEnabled   = _audioEnabled.value,
                    activeStudentIndex = _activeIndex.value
                )
            )
        }
    }

    // ── Toast helper ──────────────────────────────────────────────────────────

    fun showToast(message: String, type: String = "success") {
        _toastMessage.value = Pair(message, type)
    }

    fun clearToast() { _toastMessage.value = null }

    // ── ViewModel Factory ─────────────────────────────────────────────────────

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            val repo = StudentRepository(context.applicationContext)
            val renderer = IdCardRenderer(context.applicationContext)
            return WizardViewModel(repo, renderer) as T
        }
    }
}

// ── OCR result container ──────────────────────────────────────────────────────
data class OcrResult(
    val name: String = "",
    val idNumber: String = "",
    val course: String = "",
    val dob: String = ""
)
