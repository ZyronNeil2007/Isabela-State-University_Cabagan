package com.isu.id.util

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.isu.id.data.model.Student
import java.io.File
import java.io.InputStream

/**
 * CSV import and export utilities.
 * Mirrors importStudentsFromCSV() / exportStudentsToCSV() from app.js.
 *
 * CSV format:
 *   name,idNumber,course,department,dob,parentName,address,telephone
 */
object CsvParser {
    /**
     * Parse CSV from an InputStream.
     * Skips header row and blank lines.
     * Returns a list of Students with populated FormData.
     */
    fun parse(stream: InputStream): List<Student> {
        val lines = stream.bufferedReader().readLines()
        if (lines.size < 2) return emptyList()

        val students = mutableListOf<Student>()
        // lines[0] is the header
        for (i in 1 until lines.size) {
            val row = parseCsvRow(lines[i])
            if (row.isEmpty() || row.all { it.isBlank() }) continue

            val formData = com.isu.id.data.model.FormData(
                name        = row.getOrElse(0) { "" }.uppercase(),
                idNumber    = row.getOrElse(1) { "" }.uppercase(),
                course      = row.getOrElse(2) { "" }.uppercase(),
                department  = row.getOrElse(3) { "" },
                dob         = row.getOrElse(4) { "" },
                parentName  = row.getOrElse(5) { "" }.uppercase(),
                address     = row.getOrElse(6) { "" }.uppercase(),
                telephone   = row.getOrElse(7) { "" }.uppercase()
            )
            students.add(Student(formData = formData))
        }
        return students
    }

    /** Parse a single CSV row handling quoted fields. */
    private fun parseCsvRow(line: String): List<String> {
        val fields = mutableListOf<String>()
        var current = StringBuilder()
        var inQuotes = false
        for (ch in line) {
            when {
                ch == '"' -> inQuotes = !inQuotes
                ch == ',' && !inQuotes -> { fields.add(current.toString().trim()); current = StringBuilder() }
                else -> current.append(ch)
            }
        }
        fields.add(current.toString().trim())
        return fields
    }
}

object CsvExporter {
    private const val HEADER = "name,idNumber,course,department,dob,parentName,address,telephone"

    /** Export students to a CSV file in Downloads/ISU-ID/. */
    fun export(context: Context, students: List<Student>) {
        val timestamp = java.text.SimpleDateFormat("yyyy-MM-dd_HH-mm", java.util.Locale.getDefault())
            .format(java.util.Date())
        val filename = "ISU-ID_Export_$timestamp.csv"
        val csvContent = buildString {
            appendLine(HEADER)
            for (s in students) {
                val f = s.formData
                appendLine("${f.name.csvEscape()},${f.idNumber.csvEscape()},${f.course.csvEscape()}," +
                    "${f.department.csvEscape()},${f.dob.csvEscape()},${f.parentName.csvEscape()}," +
                    "${f.address.csvEscape()},${f.telephone.csvEscape()}")
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, filename)
                put(MediaStore.Downloads.MIME_TYPE, "text/csv")
                put(MediaStore.Downloads.RELATIVE_PATH, "Download/ISU-ID")
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            val resolver = context.contentResolver
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            uri?.let {
                resolver.openOutputStream(it)?.use { stream -> stream.write(csvContent.toByteArray()) }
                contentValues.clear()
                contentValues.put(MediaStore.Downloads.IS_PENDING, 0)
                resolver.update(uri, contentValues, null, null)
            }
        } else {
            @Suppress("DEPRECATION")
            val dir = File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                "ISU-ID"
            ).also { it.mkdirs() }
            File(dir, filename).writeText(csvContent)
        }
    }

    private fun String.csvEscape(): String {
        return if (contains(',') || contains('"') || contains('\n')) "\"${replace("\"", "\"\"")}\"" else this
    }
}
