package com.isu.id.rendering

import android.content.Context
import android.graphics.*
import com.isu.id.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream

/**
 * Core ID card rendering engine.
 *
 * Faithfully ports renderCanvases() / renderText() / renderText2026()
 * from app.js (lines 632–964) to Android Canvas + Bitmap compositing.
 *
 * Usage:
 *   val renderer = IdCardRenderer(context)
 *   renderer.loadTemplates()          // call once at startup
 *   val front: Bitmap = renderer.renderFront(student, IdVersion.NEW_2026, CampusTheme.CABAGAN)
 *   val back:  Bitmap = renderer.renderBack(student, IdVersion.NEW_2026, CampusTheme.CABAGAN)
 */
class IdCardRenderer(private val context: Context) {

    // Template bitmaps loaded from assets
    private var oldFront: Bitmap? = null
    private var oldBack: Bitmap? = null
    private var newFront: Bitmap? = null
    private var newBack: Bitmap? = null

    private val hologramRenderer = HologramRenderer()
    private val qrRenderer = QrRenderer()

    /** Load all four template PNGs from assets (call once on init). */
    suspend fun loadTemplates() = withContext(Dispatchers.IO) {
        oldFront = loadAssetBitmap("templates/old_front.png")
        oldBack  = loadAssetBitmap("templates/old_back.png")
        newFront = loadAssetBitmap("templates/new_front.png")
        newBack  = loadAssetBitmap("templates/new_back.png")
    }

    fun areTemplatesLoaded(): Boolean =
        oldFront != null && oldBack != null && newFront != null && newBack != null

    // ── Front face ────────────────────────────────────────────────────────────

    /**
     * Render the front face of the ID card and return a Bitmap.
     * Mirrors the front-face section of renderCanvases() in app.js.
     */
    suspend fun renderFront(
        student: Student,
        version: IdVersion,
        campusTheme: CampusTheme,
        hologramEnabled: Boolean = true
    ): Bitmap = withContext(Dispatchers.Default) {
        val is2026 = version == IdVersion.NEW_2026

        // Determine canvas size from template
        val template = if (is2026) newFront else oldFront
        val w = template?.width  ?: if (is2026) 675 else 638
        val h = template?.height ?: if (is2026) 1050 else 1013

        val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        if (is2026) {
            renderFront2026(canvas, bitmap, student, template, hologramEnabled, campusTheme)
        } else {
            renderFrontOld(canvas, bitmap, student, template, hologramEnabled, campusTheme)
        }

        bitmap
    }

    /** 2026 ID front: template first (solid background), then photo on top */
    private fun renderFront2026(
        canvas: Canvas, bitmap: Bitmap, student: Student,
        template: Bitmap?, hologramEnabled: Boolean, campusTheme: CampusTheme
    ) {
        val cfg = NewIdConfig
        val w = bitmap.width.toFloat()
        val h = bitmap.height.toFloat()

        // 1. White base
        canvas.drawColor(Color.WHITE)

        // 2. Draw template (it has a solid background with the green header/border)
        template?.let { canvas.drawBitmap(it, null, RectF(0f, 0f, w, h), null) }

        // 3. Draw photo inside the rounded-rect clip (green border is part of template PNG)
        student.photoBitmap?.let { photo ->
            drawPhotoClipped(canvas, photo, cfg.photo)
        }

        // 4. Draw signature
        student.signatureBitmap?.let { sig ->
            drawSignature(canvas, sig, cfg.signature)
        }

        // 5. Text (2026 doesn't use scaleMultiplier)
        val name = student.formData.name.ifBlank { "JUAN DELA CRUZ" }
        drawTextField2026(canvas, NewIdConfig.Text.name, name)

        val idNum = student.formData.idNumber.ifBlank { "25-00001" }
        drawTextField2026(canvas, NewIdConfig.Text.idNumber, idNum)

        val deptKey   = student.formData.department
        val deptLabel = if (deptKey.isNotBlank()) {
            DEPARTMENT_LABELS[deptKey] ?: deptKey
        } else "COLLEGE / DEPARTMENT"
        drawTextField2026(canvas, NewIdConfig.Text.department, deptLabel)

        // 6. Hologram
        if (hologramEnabled) hologramRenderer.draw(canvas, w, h, campusTheme)
    }

    /** Old ID front: template first, photo clip rect (no border radius) */
    private fun renderFrontOld(
        canvas: Canvas, bitmap: Bitmap, student: Student,
        template: Bitmap?, hologramEnabled: Boolean, campusTheme: CampusTheme
    ) {
        val cfg = OldIdConfig
        val m   = cfg.SCALE
        val w   = bitmap.width.toFloat()
        val h   = bitmap.height.toFloat()

        // 1. Draw template (or green fallback)
        if (template != null) {
            canvas.drawBitmap(template, null, RectF(0f, 0f, w, h), null)
        } else {
            canvas.drawColor(Color.argb(255, 212, 232, 212))
        }

        // 2. Photo (rect clip — no border radius on Old ID)
        student.photoBitmap?.let { photo ->
            drawPhotoRect(canvas, photo, cfg.photo)
        }

        // 3. Signature
        student.signatureBitmap?.let { sig ->
            drawSignature(canvas, sig, cfg.signature)
        }

        // 4. Text (all scaled by scaleMultiplier 4.17)
        val name = student.formData.name.ifBlank { "JUAN DELA CRUZ" }
        drawTextFieldOld(canvas, OldIdConfig.Text.name, name, m)

        val idNum = student.formData.idNumber.ifBlank { "25-00001" }
        drawTextFieldOld(canvas, OldIdConfig.Text.idNumber, idNum, m)

        val course = student.formData.course.ifBlank { "Bachelor of Science in Computer Science" }
        drawTextFieldOld(canvas, OldIdConfig.Text.course, formatCourseText(course), m)

        // 5. Hologram
        if (hologramEnabled) hologramRenderer.draw(canvas, w, h, campusTheme)
    }

    // ── Back face ─────────────────────────────────────────────────────────────

    /**
     * Render the back face and return a Bitmap.
     * Mirrors the back-face section of renderCanvases() in app.js.
     */
    suspend fun renderBack(
        student: Student,
        version: IdVersion,
        campusTheme: CampusTheme,
        hologramEnabled: Boolean = false
    ): Bitmap = withContext(Dispatchers.Default) {
        val is2026 = version == IdVersion.NEW_2026
        val template = if (is2026) newBack else oldBack
        val w = template?.width  ?: if (is2026) 704 else 638
        val h = template?.height ?: if (is2026) 1050 else 1013

        val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        if (is2026) renderBack2026(canvas, bitmap, student, template)
        else        renderBackOld(canvas, bitmap, student, template)

        // QR code
        val qrPos = if (is2026) QrPositions.old2026 else QrPositions.oldId
        val payload = "ISU-VERIFY:${student.formData.idNumber}:${student.formData.name.uppercase()}"
        val qrBitmap = qrRenderer.generate(payload, qrPos.size.toInt())
        val qrPaint  = Paint(Paint.ANTI_ALIAS_FLAG)
        canvas.drawBitmap(qrBitmap, qrPos.x, qrPos.y, qrPaint)

        bitmap
    }

    /** 2026 ID back: template + text overlaid at label positions */
    private fun renderBack2026(
        canvas: Canvas, bitmap: Bitmap,
        student: Student, template: Bitmap?
    ) {
        val cfg = NewIdConfig
        val w = bitmap.width.toFloat()
        val h = bitmap.height.toFloat()

        template?.let { canvas.drawBitmap(it, null, RectF(0f, 0f, w, h), null) }
            ?: canvas.drawColor(Color.WHITE)

        drawTextField2026(canvas, NewIdConfig.Text.parentName,
            student.formData.parentName.ifBlank { "JANE DELA CRUZ" })
        drawTextField2026(canvas, NewIdConfig.Text.address,
            student.formData.address.ifBlank { "BARUCBOC, QUEZON, ISABELA" })
        drawTextField2026(canvas, NewIdConfig.Text.telephone,
            student.formData.telephone.ifBlank { "09123456789" })
        drawTextField2026(canvas, NewIdConfig.Text.dob, formatDob2026(student.formData.dob))
    }

    /** Old ID back: white rect area + text */
    private fun renderBackOld(
        canvas: Canvas, bitmap: Bitmap,
        student: Student, template: Bitmap?
    ) {
        val cfg = OldIdConfig
        val m   = cfg.SCALE
        val w   = bitmap.width.toFloat()
        val h   = bitmap.height.toFloat()

        template?.let { canvas.drawBitmap(it, null, RectF(0f, 0f, w, h), null) }
            ?: canvas.drawColor(Color.WHITE)

        // White area for text (matches app.js line 879)
        val clearPaint = Paint().apply { color = Color.WHITE }
        canvas.drawRect(60f, 170f, 560f, 290f, clearPaint)

        drawTextFieldOld(canvas, OldIdConfig.Text.parentName,
            student.formData.parentName.ifBlank { "JANE DELA CRUZ" }, m)
        drawTextFieldOld(canvas, OldIdConfig.Text.address,
            "Address: " + student.formData.address.ifBlank { "123 MAIN ST, CAUAYAN CITY, ISABELA" }, m)
        drawTextFieldOld(canvas, OldIdConfig.Text.telephone,
            "Telephone No.: " + student.formData.telephone.ifBlank { "+63 912 345 6789" }, m)
        drawTextFieldOld(canvas, OldIdConfig.Text.dob,
            "Birth Date: " + formatDobOld(student.formData.dob), m)
    }

    // ── Text drawing helpers ──────────────────────────────────────────────────

    /**
     * Draw text for the OLD ID (scaleMultiplier applied).
     * Mirrors renderText() in app.js (lines 642–684).
     * Handles multi-line ('\n') and optional maxWidth constraint.
     */
    private fun drawTextFieldOld(canvas: Canvas, cfg: TextConfig, value: String, scale: Float) {
        if (value.isBlank()) return

        val scaledSize = cfg.fontSizePx * scale
        val paint = buildPaint(cfg, scaledSize)

        val lines = value.split("\n")
        val lineHeight = scaledSize * 1.15f
        // Center the multi-line block vertically around cfg.y * scale
        val centerY = cfg.y * scale
        val startY  = centerY - ((lines.size - 1) * lineHeight) / 2f

        lines.forEachIndexed { i, line ->
            val y = startY + i * lineHeight + (scaledSize / 2f) // textBaseline = middle approx
            val drawX = cfg.x * scale
            if (cfg.maxWidth > 0f) {
                drawTextWithMaxWidth(canvas, line, drawX, y, cfg.maxWidth * scale, paint)
            } else {
                canvas.drawText(line, drawX, y, paint)
            }
        }
    }

    /**
     * Draw text for the 2026 NEW ID (no scale multiplier — native px).
     * Mirrors renderText2026() in app.js (lines 918–952).
     */
    private fun drawTextField2026(canvas: Canvas, cfg: TextConfig, value: String) {
        if (value.isBlank()) return

        val paint = buildPaint(cfg, cfg.fontSizePx)
        val lines = value.split("\n")
        val lineHeight = if (cfg.lineHeight > 0f) cfg.lineHeight else cfg.fontSizePx * 1.35f

        // Center the full block on cfg.y
        val totalHeight = (lines.size - 1) * lineHeight
        val startY = cfg.y - totalHeight / 2f

        lines.forEachIndexed { i, line ->
            val y = startY + i * lineHeight
            if (cfg.maxWidth > 0f) {
                drawTextWithMaxWidth(canvas, line, cfg.x, y, cfg.maxWidth, paint)
            } else {
                canvas.drawText(line, cfg.x, y, paint)
            }
        }
    }

    /** Build a Paint object from a TextConfig */
    private fun buildPaint(cfg: TextConfig, textSizePx: Float): Paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color     = cfg.fillColor
        textSize  = textSizePx
        isFakeBoldText = cfg.bold
        textAlign = when (cfg.align) {
            TextAlign.CENTER -> Paint.Align.CENTER
            TextAlign.RIGHT  -> Paint.Align.RIGHT
            TextAlign.LEFT   -> Paint.Align.LEFT
        }
        typeface = if (cfg.bold) Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                   else Typeface.DEFAULT
    }

    /**
     * Draw text clipped to maxWidth by measuring and scaling down the Paint textSize.
     * Simulates canvas 2D context fillText(text, x, y, maxWidth).
     */
    private fun drawTextWithMaxWidth(
        canvas: Canvas, text: String,
        x: Float, y: Float,
        maxWidth: Float, paint: Paint
    ) {
        val measuredWidth = paint.measureText(text)
        if (measuredWidth > maxWidth) {
            val savedSize = paint.textSize
            paint.textSize = paint.textSize * (maxWidth / measuredWidth)
            canvas.drawText(text, x, y, paint)
            paint.textSize = savedSize
        } else {
            canvas.drawText(text, x, y, paint)
        }
    }

    // ── Photo / Signature helpers ─────────────────────────────────────────────

    /** Draw photo with rounded-rect clip (2026 ID). Mirrors JS arcTo clip path. */
    private fun drawPhotoClipped(canvas: Canvas, photo: Bitmap, box: PhotoBox) {
        val path = Path().apply {
            addRoundRect(
                RectF(box.x, box.y, box.x + box.width, box.y + box.height),
                box.cornerRadius, box.cornerRadius,
                Path.Direction.CW
            )
        }
        canvas.save()
        canvas.clipPath(path)
        val dst = fitBitmapIntoBox(photo, box.x, box.y, box.width, box.height)
        canvas.drawBitmap(photo, null, dst, null)
        canvas.restore()
    }

    /** Draw photo with rect clip (Old ID — no border radius). */
    private fun drawPhotoRect(canvas: Canvas, photo: Bitmap, box: PhotoBox) {
        val scale = OldIdConfig.SCALE
        val x = box.x; val y = box.y
        val w = box.width; val h = box.height
        canvas.save()
        canvas.clipRect(x, y, x + w, y + h)
        val dst = fitBitmapIntoBox(photo, x, y, w, h)
        canvas.drawBitmap(photo, null, dst, null)
        canvas.restore()
    }

    /** Draw signature bitmap at given box position. */
    private fun drawSignature(canvas: Canvas, sig: Bitmap, box: SigBox) {
        val dst = RectF(box.x, box.y, box.x + box.width, box.y + box.height)
        canvas.drawBitmap(sig, null, dst, null)
    }

    /**
     * Compute destination RectF that fits [photo] into a box with cover-fit scaling.
     * Mirrors the imgRatio/boxRatio cover logic in app.js (lines 776–783).
     */
    private fun fitBitmapIntoBox(photo: Bitmap, x: Float, y: Float, w: Float, h: Float): RectF {
        val imgRatio = photo.width.toFloat() / photo.height.toFloat()
        val boxRatio = w / h
        return if (imgRatio > boxRatio) {
            val dw = h * imgRatio
            val dx = x - (dw - w) / 2f
            RectF(dx, y, dx + dw, y + h)
        } else {
            val dh = w / imgRatio
            val dy = y - (dh - h) / 2f
            RectF(x, dy, x + w, dy + dh)
        }
    }

    // ── Date / text formatting ────────────────────────────────────────────────

    /**
     * Format DOB for 2026 ID back: MM/DD/YYYY.
     * Mirrors app.js lines 863–875.
     */
    private fun formatDob2026(dob: String): String {
        if (dob.isBlank()) return "01/01/2000"
        return try {
            val parts = dob.split("-") // expects "YYYY-MM-DD"
            if (parts.size == 3) "${parts[1]}/${parts[2]}/${parts[0]}"
            else dob
        } catch (e: Exception) { dob }
    }

    /** Format DOB for Old ID back: DD-MM-YYYY. Mirrors app.js lines 887–898. */
    private fun formatDobOld(dob: String): String {
        if (dob.isBlank()) return "01-01-2000"
        return try {
            val parts = dob.split("-")
            if (parts.size == 3) "${parts[2]}-${parts[1]}-${parts[0]}"
            else dob
        } catch (e: Exception) { dob }
    }

    /**
     * Smart-wrap long course names: split after degree prefix.
     * Mirrors formatCourseText() in app.js (lines 693–710).
     */
    internal fun formatCourseText(course: String): String {
        if (course.isBlank()) return ""
        val upper = course.uppercase().trim()

        val degreeRegex = Regex("""^(BACHELOR OF [A-Z\s]+(?:IN)?)\s+(.+)""")
        degreeRegex.find(upper)?.let { m ->
            return "${m.groupValues[1].trim()}\n${m.groupValues[2].trim()}"
        }

        val inIdx = upper.indexOf(" IN ")
        if (inIdx >= 0) {
            return upper.substring(0, inIdx).trim() + "\nIN " + upper.substring(inIdx + 4).trim()
        }

        return upper
    }

    // ── Asset loading ─────────────────────────────────────────────────────────

    private fun loadAssetBitmap(path: String): Bitmap? = try {
        context.assets.open(path).use { stream ->
            android.graphics.BitmapFactory.decodeStream(stream)
        }
    } catch (e: Exception) {
        android.util.Log.w("IdCardRenderer", "Template not found: $path")
        null
    }
}
