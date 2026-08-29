package com.isu.id.ui.wizard

import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.isu.id.data.model.CampusTheme
import com.isu.id.data.model.Student

/**
 * Horizontal scrollable tab row for batch students (up to 5).
 * Mirrors renderStudentTabs() / addStudent() / removeStudent() from app.js.
 */
@Composable
fun StudentTabRow(
    students: List<Student>,
    activeIndex: Int,
    campusTheme: CampusTheme,
    onSelect: (Int) -> Unit,
    onAdd: () -> Unit,
    onRemove: (Int) -> Unit
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp
    ) {
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            itemsIndexed(students) { index, student ->
                val isActive = index == activeIndex
                StudentTab(
                    student     = student,
                    index       = index,
                    isActive    = isActive,
                    campusTheme = campusTheme,
                    onSelect    = { onSelect(index) },
                    onRemove    = if (students.size > 1) { { onRemove(index) } } else null
                )
            }

            // "+ Add student" button (shown while < 5)
            if (students.size < 5) {
                item {
                    FilledTonalIconButton(
                        onClick = onAdd,
                        modifier = Modifier.size(40.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add student")
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentTab(
    student: Student,
    index: Int,
    isActive: Boolean,
    campusTheme: CampusTheme,
    onSelect: () -> Unit,
    onRemove: (() -> Unit)?
) {
    val containerColor = if (isActive) campusTheme.primaryColor.copy(alpha = 0.2f)
                         else MaterialTheme.colorScheme.surfaceVariant
    val borderColor    = if (isActive) campusTheme.accentColor else Color.Transparent

    Card(
        onClick = onSelect,
        modifier = Modifier.height(40.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        border = if (isActive) BorderStroke(1.5.dp, borderColor) else null
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Thumbnail
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center
            ) {
                val bmp = student.photoBitmap
                if (bmp != null) {
                    Image(
                        bitmap = bmp.asImageBitmap(),
                        contentDescription = "Student photo",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Name (truncated to 10 chars)
            val rawName = student.formData.name
            val displayName = if (rawName.isBlank()) {
                "Student ${index + 1}"
            } else if (rawName.length > 10) {
                rawName.substring(0, 10) + "…"
            } else {
                rawName
            }

            Text(
                text  = displayName,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                color = if (isActive) MaterialTheme.colorScheme.onBackground
                        else MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            // Remove button
            if (onRemove != null) {
                IconButton(
                    onClick  = onRemove,
                    modifier = Modifier.size(20.dp)
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Remove",
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }
    }
}
