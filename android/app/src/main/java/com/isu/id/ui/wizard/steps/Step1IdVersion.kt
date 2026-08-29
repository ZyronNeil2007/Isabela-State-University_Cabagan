package com.isu.id.ui.wizard.steps

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.isu.id.data.model.IdVersion

/** Step 1: Choose between Old ID and 2026 New ID */
@Composable
fun Step1IdVersion(
    current: IdVersion,
    onSelect: (IdVersion) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            "Select ID Template",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            "Choose the ID template version to generate.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            IdVersionCard(
                label    = "Old ID",
                subtitle = "Course-based",
                selected = current == IdVersion.OLD,
                onClick  = { onSelect(IdVersion.OLD) },
                modifier = Modifier.weight(1f)
            )
            IdVersionCard(
                label    = "2026 New ID",
                subtitle = "Department-based",
                selected = current == IdVersion.NEW_2026,
                onClick  = { onSelect(IdVersion.NEW_2026) },
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun IdVersionCard(
    label: String, subtitle: String,
    selected: Boolean, onClick: () -> Unit, modifier: Modifier
) {
    val containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer
                         else MaterialTheme.colorScheme.surfaceVariant

    Card(
        onClick  = onClick,
        modifier = modifier.height(100.dp),
        colors   = CardDefaults.cardColors(containerColor = containerColor),
        border   = if (selected)
            androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
        else null
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(label, fontWeight = FontWeight.Bold)
            Text(
                subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (selected) {
                Spacer(Modifier.height(4.dp))
                RadioButton(selected = true, onClick = null)
            }
        }
    }
}
