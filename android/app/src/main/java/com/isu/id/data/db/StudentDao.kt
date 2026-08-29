package com.isu.id.data.db

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface StudentDao {

    @Query("SELECT * FROM students ORDER BY id ASC")
    fun getAllStudents(): Flow<List<StudentEntity>>

    @Query("SELECT * FROM students ORDER BY id ASC")
    suspend fun getAllStudentsOnce(): List<StudentEntity>

    @Query("SELECT * FROM students WHERE id = :id LIMIT 1")
    suspend fun getById(id: Long): StudentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(student: StudentEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(students: List<StudentEntity>)

    @Update
    suspend fun update(student: StudentEntity)

    @Delete
    suspend fun delete(student: StudentEntity)

    @Query("DELETE FROM students WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM students")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM students")
    suspend fun count(): Int
}
