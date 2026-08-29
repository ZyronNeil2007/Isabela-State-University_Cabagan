package com.isu.id.ui.wizard

import android.graphics.Bitmap
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isu.id.data.model.*
import com.isu.id.ui.batch.BatchTableScreen
import com.isu.id.ui.export.ExportBottomSheet
import com.isu.id.ui.ocr.OcrBottomSheet
import com.isu.id.ui.preview.CardPreviewComposable
import com.isu.id.ui.wizard.steps.*

private val STEP_TITLES = listOf(
    "Choose ID Version",    // 1
    "Upload Photo",          // 2
    "Full Name",             // 3
    "ID Number",             // 4
    "Course / Department",   // 5
    "Date of Birth",         // 6
    "Parent / Guardian",     // 7
    "Home Address",          // 8
    "Telephone",             // 9
    "Signature"              // 10
)

/**
 * Root wizard screen — the entire app UI.
 *
 * Structure:
 *   ┌─────────────────────────────────────────┐
 *   │ WizardTopBar (campus selector, actions) │
 *   │ BatchTabRow (student tabs)              │
 *   │ LinearProgressIndicator                 │
 *   │ StepHeader (Step N of 10 + title)       │
 *   │ MiniPreview (card thumbnail, flippable) │
 *   │ AnimatedContent → StepContent           │
 *   │ WizardNavRow (Back / Next / Done)       │
 *   └─────────────────────────────────────────┘
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WizardScreen(viewModel: WizardViewModel) {
    val context = LocalContext.current

    val step          by viewModel.currentStep.collectAsState()
    val students      by viewModel.students.collectAsState()
    val activeIdx     by viewModel.activeStudentIndex.collectAsState()
    val idVersion     by viewModel.idVersion.collectAsState()
    val campusTheme   by viewModel.campusTheme.collectAsState()
    val hologram      by viewModel.hologramEnabled.collectAsState()
    val audioEnabled  by viewModel.audioEnabled.collectAsState()
    val frontBitmap   by viewModel.frontBitmap.collectAsState()
    val backBitmap    by viewModel.backBitmap.collectAsState()
    val isRendering   by viewModel.isRendering.collectAsState()
    val toastMsg      by viewModel.toastMessage.collectAsState()
    val showRestore   by viewModel.showRestoreDialog.collectAsState()

    // Sheet / dialog visibility
    var showExportSheet   by remember { mutableStateOf(false) }
    var showBatchTable    by remember { mutableStateOf(false) }
    var showOcrSheet      by remember { mutableStateOf(false) }
    var showInspectModal  by remember { mutableStateOf(false) }

    // Snackbar
    val snackbarHost = remember { SnackbarHostState() }
    LaunchedEffect(toastMsg) {
        toastMsg?.let { (msg, _) ->
            snackbarHost.showSnackbar(msg, duration = SnackbarDuration.Short)
            viewModel.clearToast()
        }
    }

    // Session restore dialog
    if (showRestore) {
        AlertDialog(
            onDismissRequest = { viewModel.discardSession() },
            title   = { Text("Restore Previous Session?") },
            text    = { Text("You have a saved session. Would you like to restore it?") },
            confirmButton = {
                TextButton(onClick = { viewModel.restoreSession() }) { Text("Restore") }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.discardSession() }) { Text("Start Fresh") }
            }
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHost) },
        topBar = {
            WizardTopBar(
                campusTheme     = campusTheme,
                onCampusChange  = viewModel::setCampusTheme,
                onBatchTable    = {
                    viewModel.playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
                    showBatchTable = true
                },
                onExport        = {
                    viewModel.playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
                    showExportSheet = true
                },
                onOcr           = {
                    viewModel.playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
                    showOcrSheet = true
                },
                onInspect       = {
                    viewModel.playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
                    showInspectModal = true
                },
                onAudioToggle   = viewModel::toggleAudio,
                audioEnabled    = audioEnabled,
                onHologramToggle = viewModel::toggleHologram,
                hologramEnabled = hologram
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            // ── Batch student tabs ───────────────────────────────────────────
            StudentTabRow(
                students      = students,
                activeIndex   = activeIdx,
                onSelect      = viewModel::switchStudent,
                onAdd         = viewModel::addStudent,
                onRemove      = viewModel::removeStudent,
                campusTheme   = campusTheme
            )

            // ── Progress bar ─────────────────────────────────────────────────
            LinearProgressIndicator(
                progress = step.toFloat() / 10f,
                modifier = Modifier.fillMaxWidth(),
                color    = campusTheme.accentColor,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            // ── Step header ──────────────────────────────────────────────────
            StepHeader(
                step        = step,
                title       = STEP_TITLES.getOrElse(step - 1) { "" },
                frontBitmap = if (step <= 5) frontBitmap else backBitmap,
                showFront   = step <= 5,
                isRendering = isRendering,
                onInspect   = {
                    viewModel.playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
                    showInspectModal = true
                }
            )

            // ── Step content ─────────────────────────────────────────────────
            AnimatedContent(
                targetState = step,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                transitionSpec = {
                    val dir = if (targetState > initialState) 1 else -1
                    (slideInHorizontally { it * dir } + fadeIn()) togetherWith
                    (slideOutHorizontally { -it * dir } + fadeOut())
                },
                label = "wizard_step"
            ) { currentStep ->
                val activeStudent = students.getOrElse(activeIdx) { com.isu.id.data.model.Student() }
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    when (currentStep) {
                        1  -> Step1IdVersion(idVersion, viewModel::setIdVersion)
                        2  -> Step2Photo(activeStudent, viewModel::setPhoto, context)
                        3  -> Step3Name(activeStudent.formData.name, viewModel::updateName)
                        4  -> Step4IdNumber(activeStudent.formData.idNumber, viewModel::updateIdNumber)
                        5  -> Step5CourseOrDept(activeStudent.formData, idVersion,
                                viewModel::updateCourse, viewModel::updateDepartment)
                        6  -> Step6Dob(activeStudent.formData.dob, viewModel::updateDob)
                        7  -> Step7Parent(activeStudent.formData.parentName, viewModel::updateParentName)
                        8  -> Step8Address(activeStudent.formData.address, viewModel::updateAddress)
                        9  -> Step9Telephone(activeStudent.formData.telephone, viewModel::updateTelephone)
                        10 -> Step10Signature(activeStudent, viewModel::setSignature)
                        else -> {}
                    }
                }
            }

            // ── Navigation buttons ───────────────────────────────────────────
            WizardNavRow(
                step       = step,
                totalSteps = 10,
                onBack     = viewModel::prevStep,
                onNext     = viewModel::nextStep,
                onDone     = {
                    viewModel.playAudio(com.isu.id.util.AudioFxHelper.SoundType.CLICK)
                    showExportSheet = true
                },
                campusTheme = campusTheme
            )
        }
    }

    // ── Bottom sheets & Dialogs ───────────────────────────────────────────────
    if (showInspectModal) {
        com.isu.id.ui.preview.CardInspectorDialog(
            frontBitmap = frontBitmap,
            backBitmap  = backBitmap,
            campusTheme = campusTheme,
            audioEnabled = audioEnabled,
            onDismiss   = { showInspectModal = false },
            onExportRequested = {
                showInspectModal = false
                showExportSheet = true
            }
        )
    }
    if (showExportSheet) {
        ExportBottomSheet(
            viewModel   = viewModel,
            onDismiss   = { showExportSheet = false }
        )
    }
    if (showBatchTable) {
        BatchTableScreen(
            viewModel = viewModel,
            onDismiss = { showBatchTable = false }
        )
    }
    if (showOcrSheet) {
        OcrBottomSheet(
            onResult  = { result -> viewModel.applyOcrResult(result) },
            onDismiss = { showOcrSheet = false }
        )
    }
}

// ── Step header with mini preview ─────────────────────────────────────────────

@Composable
private fun StepHeader(
    step: Int, title: String, frontBitmap: Bitmap?,
    showFront: Boolean, isRendering: Boolean, onInspect: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text  = "Step $step of 10",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text  = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Mini preview thumbnail (tap to inspect in full-res zoomable modal)
        Box(
            modifier = Modifier
                .width(55.dp)
                .height(88.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .clickable(onClick = onInspect),
            contentAlignment = Alignment.Center
        ) {
            if (isRendering || frontBitmap == null) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp
                )
            } else {
                Image(
                    bitmap = frontBitmap.asImageBitmap(),
                    contentDescription = if (showFront) "Front face preview (tap to inspect)" else "Back face preview (tap to inspect)",
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }
}

// ── Nav row (Back / Next / Done) ─────────────────────────────────────────────

@Composable
private fun WizardNavRow(
    step: Int, totalSteps: Int,
    onBack: () -> Unit, onNext: () -> Unit, onDone: () -> Unit,
    campusTheme: CampusTheme
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Back
        OutlinedButton(
            onClick  = onBack,
            enabled  = step > 1,
            modifier = Modifier.weight(1f)
        ) {
            Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            Spacer(Modifier.width(4.dp))
            Text("Back")
        }

        Spacer(Modifier.width(12.dp))

        // Next or Done
        if (step < totalSteps) {
            Button(
                onClick  = onNext,
                modifier = Modifier.weight(1f),
                colors   = ButtonDefaults.buttonColors(
                    containerColor = campusTheme.primaryColor
                )
            ) {
                Text("Next")
                Spacer(Modifier.width(4.dp))
                Icon(Icons.Default.ArrowForward, contentDescription = "Next")
            }
        } else {
            Button(
                onClick  = onDone,
                modifier = Modifier.weight(1f),
                colors   = ButtonDefaults.buttonColors(
                    containerColor = campusTheme.accentColor
                )
            ) {
                Icon(Icons.Default.Check, contentDescription = "Done")
                Spacer(Modifier.width(4.dp))
                Text("Export", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ── Top bar ──────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WizardTopBar(
    campusTheme: CampusTheme,
    onCampusChange: (CampusTheme) -> Unit,
    onBatchTable: () -> Unit,
    onExport: () -> Unit,
    onOcr: () -> Unit,
    onInspect: () -> Unit,
    onAudioToggle: () -> Unit,
    audioEnabled: Boolean,
    onHologramToggle: () -> Unit,
    hologramEnabled: Boolean
) {
    var showCampusMenu by remember { mutableStateOf(false) }

    TopAppBar(
        title = {
            Text(
                "ISU ID Generator",
                style     = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        },
        actions = {
            // Audio toggle (Sound FX on/off)
            IconButton(onClick = onAudioToggle) {
                Icon(
                    if (audioEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                    contentDescription = if (audioEnabled) "Mute Sound FX" else "Enable Sound FX",
                    tint = if (audioEnabled) campusTheme.accentColor
                           else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            // High-res card inspector
            IconButton(onClick = onInspect) {
                Icon(Icons.Default.ZoomIn, contentDescription = "Inspect Card")
            }
            // OCR scan button
            IconButton(onClick = onOcr) {
                Icon(Icons.Default.CameraAlt, contentDescription = "OCR Scan")
            }
            // Hologram toggle
            IconButton(onClick = onHologramToggle) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = "Toggle Hologram",
                    tint = if (hologramEnabled) campusTheme.accentColor
                           else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                )
            }
            // Batch table
            IconButton(onClick = onBatchTable) {
                Icon(Icons.Default.TableChart, contentDescription = "Batch Table")
            }
            // Campus theme picker
            IconButton(onClick = { showCampusMenu = true }) {
                Icon(Icons.Default.Palette, contentDescription = "Campus Theme")
            }
            // Export
            IconButton(onClick = onExport) {
                Icon(Icons.Default.FileDownload, contentDescription = "Export")
            }

            // Campus dropdown
            DropdownMenu(
                expanded = showCampusMenu,
                onDismissRequest = { showCampusMenu = false }
            ) {
                for (theme in CampusTheme.values()) {
                    DropdownMenuItem(
                        text = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(12.dp)
                                        .clip(RoundedCornerShape(2.dp))
                                        .background(theme.primaryColor)
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(theme.displayName)
                            }
                        },
                        onClick = {
                            onCampusChange(theme)
                            showCampusMenu = false
                        },
                        trailingIcon = if (theme == campusTheme) {
                            { Icon(Icons.Default.Check, contentDescription = null, tint = campusTheme.accentColor) }
                        } else null
                    )
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}
