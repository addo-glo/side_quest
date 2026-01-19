package com.sidequest.screenrecorder

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class ScreenRecorderService : Service() {

    companion object {
        const val ACTION_START = "com.sidequest.ACTION_START"
        const val ACTION_STOP = "com.sidequest.ACTION_STOP"
        const val ACTION_PAUSE = "com.sidequest.ACTION_PAUSE"
        const val ACTION_RESUME = "com.sidequest.ACTION_RESUME"

        const val EXTRA_RESULT_CODE = "resultCode"
        const val EXTRA_RESULT_DATA = "resultData"
        const val EXTRA_WIDTH = "width"
        const val EXTRA_HEIGHT = "height"
        const val EXTRA_DENSITY = "density"
        const val EXTRA_FRAME_RATE = "frameRate"
        const val EXTRA_AUDIO_ENABLED = "audioEnabled"
        const val EXTRA_OUTPUT_PATH = "outputPath"

        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "screen_recorder_channel"
    }

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaRecorder: MediaRecorder? = null
    private var outputPath: String? = null
    private var isRecording = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startRecording(intent)
            ACTION_STOP -> stopRecording()
            ACTION_PAUSE -> pauseRecording()
            ACTION_RESUME -> resumeRecording()
        }
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Recording",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when screen recording is active"
                setShowBadge(false)
                lightColor = Color.RED
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val stopIntent = Intent(this, ScreenRecorderService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Recording Screen")
            .setContentText("Tap to stop recording")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_media_pause, "Stop", stopPendingIntent)
            .build()
    }

    private fun startRecording(intent: Intent) {
        val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
        val resultData = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA) ?: return
        val width = intent.getIntExtra(EXTRA_WIDTH, 1920)
        val height = intent.getIntExtra(EXTRA_HEIGHT, 1080)
        val density = intent.getIntExtra(EXTRA_DENSITY, 1)
        val frameRate = intent.getIntExtra(EXTRA_FRAME_RATE, 30)
        val audioEnabled = intent.getBooleanExtra(EXTRA_AUDIO_ENABLED, true)
        outputPath = intent.getStringExtra(EXTRA_OUTPUT_PATH)

        // Start foreground service
        startForeground(NOTIFICATION_ID, createNotification())

        try {
            // Setup MediaProjection
            val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)

            // Setup MediaRecorder
            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            mediaRecorder?.apply {
                if (audioEnabled) {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                }
                setVideoSource(MediaRecorder.VideoSource.SURFACE)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setVideoEncoder(MediaRecorder.VideoEncoder.H264)
                if (audioEnabled) {
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioEncodingBitRate(128000)
                    setAudioSamplingRate(44100)
                }
                setVideoSize(width, height)
                setVideoFrameRate(frameRate)
                setVideoEncodingBitRate(calculateBitrate(width, height, frameRate))
                setOutputFile(outputPath)
                prepare()
            }

            // Create virtual display
            virtualDisplay = mediaProjection?.createVirtualDisplay(
                "ScreenRecorder",
                width, height, density,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                mediaRecorder?.surface,
                null, null
            )

            mediaRecorder?.start()
            isRecording = true

        } catch (e: Exception) {
            e.printStackTrace()
            ScreenRecorderModule.instance?.onRecordingStopped(null, e.message)
            stopSelf()
        }
    }

    private fun stopRecording() {
        try {
            if (isRecording) {
                mediaRecorder?.stop()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        cleanup()
        ScreenRecorderModule.instance?.onRecordingStopped(outputPath, null)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun pauseRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isRecording) {
            mediaRecorder?.pause()
        }
    }

    private fun resumeRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isRecording) {
            mediaRecorder?.resume()
        }
    }

    private fun cleanup() {
        virtualDisplay?.release()
        virtualDisplay = null

        mediaRecorder?.release()
        mediaRecorder = null

        mediaProjection?.stop()
        mediaProjection = null

        isRecording = false
    }

    private fun calculateBitrate(width: Int, height: Int, frameRate: Int): Int {
        // Bitrate calculation based on resolution and frame rate
        val pixels = width * height
        val baseBitrate = when {
            pixels >= 3840 * 2160 -> 35_000_000 // 4K
            pixels >= 2560 * 1440 -> 16_000_000 // 1440p
            pixels >= 1920 * 1080 -> 8_000_000  // 1080p
            pixels >= 1280 * 720 -> 4_000_000   // 720p
            else -> 2_000_000                    // Lower
        }
        
        // Adjust for frame rate
        val frameRateMultiplier = when {
            frameRate >= 60 -> 1.5f
            frameRate >= 30 -> 1.0f
            else -> 0.7f
        }
        
        return (baseBitrate * frameRateMultiplier).toInt()
    }

    override fun onDestroy() {
        cleanup()
        super.onDestroy()
    }
}
