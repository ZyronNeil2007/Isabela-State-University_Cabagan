package com.isu.id.util

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.sin

/**
 * Native synthesizer for UI Audio FX.
 * Direct equivalent of Web Audio API synthesizer in app.js (lines 2753–2798).
 *
 * Synthesizes PCM waveforms on the fly:
 *  - FLIP: 400Hz → 150Hz swoosh pitch-bend (~80ms)
 *  - CHIME / SUCCESS: 3-tone arpeggio (523Hz → 659Hz → 784Hz / C-E-G) (~250ms)
 *  - CLICK / TAB: 800Hz crisp tick (~30ms)
 *  - ERROR: 220Hz low alert tone (~150ms)
 */
object AudioFxHelper {

    private const val SAMPLE_RATE = 44100
    private val scope = CoroutineScope(Dispatchers.Default)

    enum class SoundType {
        CLICK,
        FLIP,
        CHIME,
        SUCCESS,
        ERROR
    }

    fun play(type: SoundType, enabled: Boolean = true) {
        if (!enabled) return
        scope.launch {
            try {
                when (type) {
                    SoundType.CLICK -> playClickTone()
                    SoundType.FLIP -> playFlipSwoosh()
                    SoundType.CHIME, SoundType.SUCCESS -> playSuccessChime()
                    SoundType.ERROR -> playErrorTone()
                }
            } catch (_: Exception) {
                // Ignore audio playback failures gracefully
            }
        }
    }

    private fun playClickTone() {
        val durationMs = 30
        val numSamples = (SAMPLE_RATE * (durationMs / 1000.0)).toInt()
        val buffer = ShortArray(numSamples)
        val freq = 800.0

        for (i in 0 until numSamples) {
            val t = i.toDouble() / SAMPLE_RATE
            // Fast decay envelope
            val decay = 1.0 - (i.toDouble() / numSamples)
            val sample = sin(2.0 * Math.PI * freq * t) * decay * 0.4
            buffer[i] = (sample * Short.MAX_VALUE).toInt().toShort()
        }

        writeAndPlay(buffer)
    }

    private fun playFlipSwoosh() {
        val durationMs = 80
        val numSamples = (SAMPLE_RATE * (durationMs / 1000.0)).toInt()
        val buffer = ShortArray(numSamples)

        for (i in 0 until numSamples) {
            val progress = i.toDouble() / numSamples
            // Exponential pitch ramp from 400Hz down to 150Hz
            val freq = 400.0 * Math.pow(150.0 / 400.0, progress)
            val t = i.toDouble() / SAMPLE_RATE
            val decay = (1.0 - progress) * 0.5
            val sample = sin(2.0 * Math.PI * freq * t) * decay
            buffer[i] = (sample * Short.MAX_VALUE).toInt().toShort()
        }

        writeAndPlay(buffer)
    }

    private fun playSuccessChime() {
        val durationMs = 260
        val numSamples = (SAMPLE_RATE * (durationMs / 1000.0)).toInt()
        val buffer = ShortArray(numSamples)

        val notes = doubleArrayOf(523.25, 659.25, 783.99) // C5, E5, G5
        val noteLength = numSamples / 3

        for (i in 0 until numSamples) {
            val noteIdx = (i / noteLength).coerceAtMost(2)
            val freq = notes[noteIdx]
            val t = i.toDouble() / SAMPLE_RATE
            val noteProgress = (i % noteLength).toDouble() / noteLength
            val decay = (1.0 - (i.toDouble() / numSamples)) * (1.0 - noteProgress * 0.4) * 0.5
            // Triangle/sine blend for warmer chime
            val sine = sin(2.0 * Math.PI * freq * t)
            val tri = (2.0 / Math.PI) * Math.asin(sine)
            val sample = (0.6 * sine + 0.4 * tri) * decay
            buffer[i] = (sample * Short.MAX_VALUE).toInt().toShort()
        }

        writeAndPlay(buffer)
    }

    private fun playErrorTone() {
        val durationMs = 150
        val numSamples = (SAMPLE_RATE * (durationMs / 1000.0)).toInt()
        val buffer = ShortArray(numSamples)
        val freq = 220.0

        for (i in 0 until numSamples) {
            val t = i.toDouble() / SAMPLE_RATE
            val decay = (1.0 - (i.toDouble() / numSamples)) * 0.4
            val sample = sin(2.0 * Math.PI * freq * t) * decay
            buffer[i] = (sample * Short.MAX_VALUE).toInt().toShort()
        }

        writeAndPlay(buffer)
    }

    private fun writeAndPlay(buffer: ShortArray) {
        val audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(buffer.size * 2)
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()

        audioTrack.write(buffer, 0, buffer.size)
        audioTrack.play()
        // Release after playback finishes
        scope.launch {
            kotlinx.coroutines.delay((buffer.size * 1000L / SAMPLE_RATE) + 50)
            try {
                audioTrack.stop()
                audioTrack.release()
            } catch (_: Exception) {}
        }
    }
}
