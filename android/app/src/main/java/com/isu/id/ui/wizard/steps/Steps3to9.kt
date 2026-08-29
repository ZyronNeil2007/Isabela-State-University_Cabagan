package com.isu.id.ui.wizard.steps

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.isu.id.data.model.FormData
import com.isu.id.data.model.IdVersion

// ── Step 3: Full Name ─────────────────────────────────────────────────────────

@Composable
fun Step3Name(value: String, onValueChange: (String) -> Unit) {
    AutoUpperTextField(
        value       = value,
        onValue     = onValueChange,
        label       = "Full Name",
        placeholder = "JUAN DELA CRUZ",
        hint        = "Enter student's full name. It will be auto-capitalized.",
        imeAction   = ImeAction.Next
    )
}

// ── Step 4: Student ID Number ─────────────────────────────────────────────────

@Composable
fun Step4IdNumber(value: String, onValueChange: (String) -> Unit) {
    AutoUpperTextField(
        value       = value,
        onValue     = onValueChange,
        label       = "Student ID Number",
        placeholder = "25-00001",
        hint        = "Enter the student number (e.g. 25-00001 or 2025-00001).",
        imeAction   = ImeAction.Next
    )
}

// ── Step 5: Course (Old ID) or Department (2026 ID) ──────────────────────────

private val DEPARTMENT_OPTIONS = listOf(
    "CBM"    to "College of Business and Management",
    "CCJE"   to "College of Criminal Justice Education",
    "CAST"   to "College of Agricultural, Science and Technology",
    "CCSICT" to "College of Computing Studies, Information Communication Technology",
    "COE"    to "College of Education",
    "CED"    to "College of Education (CED)",
    "CFEM"   to "College of Forestry and Environmental Management",
    "CCSS"   to "College of Communication and Social Sciences",
    "CS"     to "College of Science"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Step5CourseOrDept(
    formData: FormData,
    version: IdVersion,
    onCourseChange: (String) -> Unit,
    onDeptChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (version == IdVersion.OLD) {
            // Old ID: free-text course name
            AutoUpperTextField(
                value       = formData.course,
                onValue     = onCourseChange,
                label       = "Course",
                placeholder = "BS COMPUTER SCIENCE",
                hint        = "Full degree name (e.g. Bachelor of Science in Computer Science). Long names are auto-wrapped.",
                imeAction   = ImeAction.Next,
                singleLine  = false
            )
        } else {
            // 2026 ID: dropdown of 9 colleges
            Text(
                "Department / College",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Select the student's college from the list.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            var expanded by remember { mutableStateOf(false) }
            val selectedLabel = DEPARTMENT_OPTIONS.find { it.first == formData.department }?.second
                ?: "Select department…"

            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = it }
            ) {
                OutlinedTextField(
                    value     = selectedLabel,
                    onValueChange = {},
                    readOnly  = true,
                    label     = { Text("Department") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                    modifier  = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    DEPARTMENT_OPTIONS.forEach { (key, label) ->
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text(key, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                                    Text(label, style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            },
                            onClick = {
                                onDeptChange(key)
                                expanded = false
                            }
                        )
                    }
                }
            }
        }
    }
}

// ── Step 6: Date of Birth ─────────────────────────────────────────────────────

@Composable
fun Step6Dob(value: String, onValueChange: (String) -> Unit) {
    var showPicker by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Date of Birth", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("Tap to select using the date picker.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant)

        OutlinedTextField(
            value       = value.ifBlank { "Not set" },
            onValueChange = {},
            readOnly    = true,
            label       = { Text("Date of Birth") },
            placeholder = { Text("YYYY-MM-DD") },
            modifier    = Modifier.fillMaxWidth(),
            trailingIcon = {
                TextButton(onClick = { showPicker = true }) { Text("Pick") }
            }
        )
    }

    if (showPicker) {
        DatePickerDialog(value = value, onDismiss = { showPicker = false }, onDateSelected = {
            onValueChange(it)
            showPicker = false
        })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DatePickerDialog(
    value: String,
    onDismiss: () -> Unit,
    onDateSelected: (String) -> Unit
) {
    val state = rememberDatePickerState()

    androidx.compose.material3.DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = {
                val millis = state.selectedDateMillis
                if (millis != null) {
                    val cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
                    cal.timeInMillis = millis
                    val yyyy = cal.get(java.util.Calendar.YEAR)
                    val mm   = String.format("%02d", cal.get(java.util.Calendar.MONTH) + 1)
                    val dd   = String.format("%02d", cal.get(java.util.Calendar.DAY_OF_MONTH))
                    onDateSelected("$yyyy-$mm-$dd")
                } else {
                    onDismiss()
                }
            }) { Text("OK") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    ) {
        DatePicker(state = state)
    }
}

// ── Steps 7–9: Simple uppercase text fields ───────────────────────────────────

@Composable
fun Step7Parent(value: String, onValueChange: (String) -> Unit) {
    AutoUpperTextField(
        value       = value,
        onValue     = onValueChange,
        label       = "Parent / Guardian Name",
        placeholder = "JANE DELA CRUZ",
        hint        = "Parent or guardian's full name.",
        imeAction   = ImeAction.Next
    )
}

@Composable
fun Step8Address(value: String, onValueChange: (String) -> Unit) {
    AutoUpperTextField(
        value       = value,
        onValue     = onValueChange,
        label       = "Home Address",
        placeholder = "BARUCBOC, QUEZON, ISABELA",
        hint        = "Full home address.",
        imeAction   = ImeAction.Next,
        singleLine  = false,
        maxLines    = 3
    )
}

@Composable
fun Step9Telephone(value: String, onValueChange: (String) -> Unit) {
    AutoUpperTextField(
        value       = value,
        onValue     = onValueChange,
        label       = "Contact Number",
        placeholder = "09123456789",
        hint        = "Mobile or landline number.",
        imeAction   = ImeAction.Done,
        keyboardType = KeyboardType.Phone
    )
}

// ── Shared: auto-uppercase OutlinedTextField ──────────────────────────────────

@Composable
fun AutoUpperTextField(
    value: String,
    onValue: (String) -> Unit,
    label: String,
    placeholder: String = "",
    hint: String = "",
    imeAction: ImeAction = ImeAction.Next,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    maxLines: Int = 1
) {
    val focusRequester = remember { FocusRequester() }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        if (hint.isNotBlank()) {
            Text(hint, style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        OutlinedTextField(
            value          = value,
            onValueChange  = { onValue(it.uppercase()) },
            label          = { Text(label) },
            placeholder    = { Text(placeholder, color = MaterialTheme.colorScheme.onSurfaceVariant) },
            singleLine     = singleLine,
            maxLines       = maxLines,
            modifier       = Modifier.fillMaxWidth().focusRequester(focusRequester),
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Characters,
                keyboardType   = keyboardType,
                imeAction      = imeAction
            )
        )
    }
}
