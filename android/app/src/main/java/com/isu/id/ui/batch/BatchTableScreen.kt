package com.isu.id.ui.batch

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.isu.id.data.model.Student
import com.isu.id.ui.wizard.WizardViewModel

/**
 * Batch management bottom sheet.
 * Mirrors renderBatchTable() + initBatchModal() from app.js.
 *
 * Shows all students in a table with:
 *  - Index, Name, ID Number, Course/Dept, Photo ✓/✗, Signature ✓/✗, Actions
 * Plus CSV import / export actions in the header.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BatchTableScreen(
    viewModel: WizardViewModel,
    onDismiss: () -> Unit
) {
    val context     = LocalContext.current
    val students    by viewModel.students.collectAsState()
    val activeIndex by viewModel.activeStudentIndex.collectAsState()

    var searchQuery by remember { mutableStateOf("") }

    // CSV import launcher
    val csvImportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        uri?.let { viewModel.importCsv(context, it) }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxHeight(0.9f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
        ) {
            // Header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Batch Students", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Row {
                    IconButton(onClick = { csvImportLauncher.launch(arrayOf("text/comma-separated-values", "text/csv", "application/csv")) }) {
                        Icon(Icons.Default.Upload, contentDescription = "Import CSV")
                    }
                    IconButton(onClick = { viewModel.exportCsv(context) }) {
                        Icon(Icons.Default.Download, contentDescription = "Export CSV")
                    }
                    IconButton(onClick = { viewModel.addStudent() }) {
                        Icon(Icons.Default.PersonAdd, contentDescription = "Add Student")
                    }
                }
            }

            // Search
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search students") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                trailingIcon = if (searchQuery.isNotBlank()) {
                    { IconButton(onClick = { searchQuery = "" }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear")
                    }}
                } else null
            )

            // Column headers
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("#",     style = MaterialTheme.typography.labelMedium, modifier = Modifier.width(28.dp))
                Text("Name", style = MaterialTheme.typography.labelMedium, modifier = Modifier.weight(2f))
                Text("ID",   style = MaterialTheme.typography.labelMedium, modifier = Modifier.weight(1.5f))
                Text("📷",  style = MaterialTheme.typography.labelMedium, modifier = Modifier.width(24.dp))
                Text("✍",   style = MaterialTheme.typography.labelMedium, modifier = Modifier.width(24.dp))
                Spacer(Modifier.width(48.dp)) // Actions
            }

            HorizontalDivider()

            // Student rows
            val filtered = students.filterIndexed { _, s ->
                if (searchQuery.isBlank()) true
                else s.formData.name.contains(searchQuery, ignoreCase = true) ||
                     s.formData.idNumber.contains(searchQuery, ignoreCase = true)
            }

            LazyColumn(modifier = Modifier.weight(1f)) {
                itemsIndexed(filtered) { index, student ->
                    val isActive = students.indexOf(student) == activeIndex
                    BatchStudentRow(
                        index         = students.indexOf(student),
                        student       = student,
                        isActive      = isActive,
                        onSelect      = {
                            viewModel.switchStudent(students.indexOf(student))
                            onDismiss()
                        },
                        onDelete      = { viewModel.removeStudent(students.indexOf(student)) },
                        campusTheme   = viewModel.campusTheme.value
                    )
                }
            }

            // Footer stats
            Spacer(Modifier.height(8.dp))
            Text(
                "${students.size} student(s) | ${students.count { it.photoBitmap != null }} with photos | " +
                "${students.count { it.signatureBitmap != null }} with signatures",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun BatchStudentRow(
    index: Int, student: Student,
    isActive: Boolean,
    onSelect: () -> Unit, onDelete: () -> Unit,
    campusTheme: com.isu.id.data.model.CampusTheme
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Remove Student?") },
            text  = { Text("Remove ${student.formData.name.ifBlank { "this student" }}?") },
            confirmButton = {
                TextButton(onClick = { onDelete(); showDeleteConfirm = false }) { Text("Remove", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Cancel") }
            }
        )
    }

    val bgColor = if (isActive) campusTheme.primaryColor.copy(alpha = 0.1f)
                  else androidx.compose.ui.graphics.Color.Transparent

    Surface(color = bgColor) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onSelect)
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("${index + 1}", style = MaterialTheme.typography.bodySmall, modifier = Modifier.width(28.dp))
            Text(
                student.formData.name.ifBlank { "—" },
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                modifier = Modifier.weight(2f),
                maxLines = 1, overflow = TextOverflow.Ellipsis
            )
            Text(
                student.formData.idNumber.ifBlank { "—" },
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.weight(1.5f),
                maxLines = 1, overflow = TextOverflow.Ellipsis
            )
            Text(
                if (student.photoBitmap != null) "✓" else "✗",
                color = if (student.photoBitmap != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                modifier = Modifier.width(24.dp)
            )
            Text(
                if (student.signatureBitmap != null) "✓" else "✗",
                color = if (student.signatureBitmap != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                modifier = Modifier.width(24.dp)
            )
            IconButton(onClick = { showDeleteConfirm = true }, modifier = Modifier.size(40.dp)) {
                Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
    HorizontalDivider(thickness = 0.5.dp)
}
