package com.isu.id

import com.isu.id.data.model.DEPARTMENT_LABELS
import com.isu.id.ui.ocr.ocrExtract
import com.isu.id.util.CsvParser
import org.junit.Assert.*
import org.junit.Test
import java.io.ByteArrayInputStream

class UnitTests {

    @Test
    fun testDepartmentLabelsCompleteness() {
        assertEquals(9, DEPARTMENT_LABELS.size)
        assertTrue(DEPARTMENT_LABELS.containsKey("CCSICT"))
        assertTrue(DEPARTMENT_LABELS.containsKey("CBM"))
        assertTrue(DEPARTMENT_LABELS.containsKey("CCJE"))
        assertTrue(DEPARTMENT_LABELS["CCSICT"]!!.contains("COMPUTING"))
    }

    @Test
    fun testCsvParserWithEscapedQuotesAndCommas() {
        val csv = """
            name,idNumber,course,department,dob,parentName,address,telephone
            "DELA CRUZ, JUAN",25-00001,"BS, COMPUTER SCIENCE",CCSICT,2002-05-14,"DELA CRUZ, MARIA","BARUCBOC, QUEZON, ISABELA",09123456789
            "SANTOS, PEDRO",25-00002,BSIT,CCSICT,2003-08-20,JOSE SANTOS,CABAGAN,09987654321
        """.trimIndent()

        val stream = ByteArrayInputStream(csv.toByteArray())
        val students = CsvParser.parse(stream)

        assertEquals(2, students.size)
        assertEquals("DELA CRUZ, JUAN", students[0].formData.name)
        assertEquals("25-00001", students[0].formData.idNumber)
        assertEquals("BS, COMPUTER SCIENCE", students[0].formData.course)
        assertEquals("BARUCBOC, QUEZON, ISABELA", students[0].formData.address)

        assertEquals("SANTOS, PEDRO", students[1].formData.name)
        assertEquals("25-00002", students[1].formData.idNumber)
    }

    @Test
    fun testOcrExtractionRegex() {
        val sampleOcrText = """
            Republic of the Philippines
            ISABELA STATE UNIVERSITY
            Name: DELA CRUZ, JUAN P.
            Student ID: 2025-12345
            Course: Bachelor of Science in Information Technology
            Birth Date: 05/14/2002
            Emergency Contact: 09123456789
        """.trimIndent()

        val extracted = ocrExtract(sampleOcrText)

        assertEquals("DELA CRUZ, JUAN P.", extracted.name)
        assertEquals("2025-12345", extracted.idNumber)
        assertTrue(extracted.course.contains("Bachelor of Science in Information Technology"))
        assertEquals("2002-05-14", extracted.dob) // normalized ISO YYYY-MM-DD
    }
}
