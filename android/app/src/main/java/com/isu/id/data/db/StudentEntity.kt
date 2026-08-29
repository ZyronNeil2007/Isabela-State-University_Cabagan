package com.isu.id.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room entity for persisting a single student's data.
 *
 * Images (photo, signature) are stored as PNG byte arrays (BLOB).
 * FormData fields are stored as individual columns so queries / CSV export
 * don't require JSON parsing.
 */
@Entity(tableName = "students")
data class StudentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    // ── Text fields ─────────────────────────────────────────────────────────
    val name: String = "",
    val idNumber: String = "",
    val course: String = "",
    val department: String = "",
    val dob: String = "",
    val parentName: String = "",
    val address: String = "",
    val telephone: String = "",

    // ── Image BLOBs ─────────────────────────────────────────────────────────
    val photoPng: ByteArray? = null,
    val signaturePng: ByteArray? = null
) {
    // ByteArray equality must be structural, not referential
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is StudentEntity) return false
        return id == other.id &&
                name == other.name &&
                idNumber == other.idNumber &&
                course == other.course &&
                department == other.department &&
                dob == other.dob &&
                parentName == other.parentName &&
                address == other.address &&
                telephone == other.telephone &&
                photoPng.contentEquals(other.photoPng) &&
                signaturePng.contentEquals(other.signaturePng)
    }

    override fun hashCode(): Int {
        var result = id.hashCode()
        result = 31 * result + name.hashCode()
        result = 31 * result + idNumber.hashCode()
        result = 31 * result + photoPng.contentHashCode()
        result = 31 * result + signaturePng.contentHashCode()
        return result
    }
}

private fun ByteArray?.contentEquals(other: ByteArray?): Boolean =
    (this == null && other == null) || (this != null && other != null && this.contentEquals(other))

private fun ByteArray?.contentHashCode(): Int = this?.contentHashCode() ?: 0
