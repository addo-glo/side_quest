package com.sidequest.screenrecorder

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.util.DisplayMetrics
import android.view.WindowManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.util.*

class ScreenRecorderModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    companion object {
        const val NAME = "ScreenRecorderModule"
        private const val REQUEST_CODE_SCREEN_CAPTURE = 1001
        
        // Static reference for service communication
        var instance: ScreenRecorderModule? = null
    }

    private var permissionPromise: Promise? = null
    private var recordingSettings: ReadableMap? = null
    private var startRecordingPromise: Promise? = null
    private var stopRecordingPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
        instance = this
    }

    override fun getName(): String = NAME

    override fun getConstants(): Map<String, Any> {
        return mapOf(
            "QUALITY_LOW" to "low",
            "QUALITY_MEDIUM" to "medium",
            "QUALITY_HIGH" to "high",
            "QUALITY_ULTRA" to "ultra"
        )
    }

    /**
     * Request screen recording permission from user
     */
    @ReactMethod
    fun requestPermission(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No activity available")
            return
        }

        permissionPromise = promise

        val mediaProjectionManager = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val permissionIntent = mediaProjectionManager.createScreenCaptureIntent()
        activity.startActivityForResult(permissionIntent, REQUEST_CODE_SCREEN_CAPTURE)
    }

    /**
     * Start screen recording with given settings
     */
    @ReactMethod
    fun startRecording(settings: ReadableMap, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No activity available")
            return
        }

        recordingSettings = settings
        startRecordingPromise = promise

        // Request permission first
        val mediaProjectionManager = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val permissionIntent = mediaProjectionManager.createScreenCaptureIntent()
        activity.startActivityForResult(permissionIntent, REQUEST_CODE_SCREEN_CAPTURE)
    }

    /**
     * Stop current recording
     */
    @ReactMethod
    fun stopRecording(promise: Promise) {
        stopRecordingPromise = promise
        
        val serviceIntent = Intent(reactContext, ScreenRecorderService::class.java)
        serviceIntent.action = ScreenRecorderService.ACTION_STOP
        reactContext.startService(serviceIntent)
    }

    /**
     * Pause current recording (Android 7.0+)
     */
    @ReactMethod
    fun pauseRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val serviceIntent = Intent(reactContext, ScreenRecorderService::class.java)
            serviceIntent.action = ScreenRecorderService.ACTION_PAUSE
            reactContext.startService(serviceIntent)
        }
    }

    /**
     * Resume a paused recording
     */
    @ReactMethod
    fun resumeRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val serviceIntent = Intent(reactContext, ScreenRecorderService::class.java)
            serviceIntent.action = ScreenRecorderService.ACTION_RESUME
            reactContext.startService(serviceIntent)
        }
    }

    /**
     * Get list of saved recordings
     */
    @ReactMethod
    fun getRecordings(promise: Promise) {
        try {
            val recordingsDir = getRecordingsDirectory()
            val files = recordingsDir.listFiles { file -> 
                file.extension.lowercase() == "mp4" 
            } ?: emptyArray()

            val recordings = Arguments.createArray()
            files.sortedByDescending { it.lastModified() }.forEach { file ->
                val recording = Arguments.createMap().apply {
                    putString("id", file.nameWithoutExtension)
                    putString("filename", file.name)
                    putString("path", file.absolutePath)
                    putDouble("duration", 0.0) // Would need MediaMetadataRetriever
                    putDouble("size", file.length().toDouble())
                    putDouble("createdAt", file.lastModified().toDouble())
                }
                recordings.pushMap(recording)
            }

            promise.resolve(recordings)
        } catch (e: Exception) {
            promise.reject("GET_RECORDINGS_ERROR", e.message)
        }
    }

    /**
     * Delete a recording by ID
     */
    @ReactMethod
    fun deleteRecording(id: String, promise: Promise) {
        try {
            val recordingsDir = getRecordingsDirectory()
            val file = File(recordingsDir, "$id.mp4")
            if (file.exists()) {
                file.delete()
                promise.resolve(true)
            } else {
                promise.reject("FILE_NOT_FOUND", "Recording not found")
            }
        } catch (e: Exception) {
            promise.reject("DELETE_ERROR", e.message)
        }
    }

    private fun getRecordingsDirectory(): File {
        val dir = File(reactContext.getExternalFilesDir(null), "recordings")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    private fun getScreenMetrics(): DisplayMetrics {
        val windowManager = reactContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        windowManager.defaultDisplay.getRealMetrics(metrics)
        return metrics
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != REQUEST_CODE_SCREEN_CAPTURE) return

        if (resultCode != Activity.RESULT_OK || data == null) {
            permissionPromise?.reject("PERMISSION_DENIED", "Screen recording permission denied")
            startRecordingPromise?.reject("PERMISSION_DENIED", "Screen recording permission denied")
            permissionPromise = null
            startRecordingPromise = null
            return
        }

        // Permission granted
        permissionPromise?.resolve(true)
        permissionPromise = null

        // If we have recording settings, start the service
        if (startRecordingPromise != null && recordingSettings != null) {
            startRecordingService(resultCode, data)
        }
    }

    private fun startRecordingService(resultCode: Int, data: Intent) {
        val metrics = getScreenMetrics()
        val settings = recordingSettings!!

        val quality = settings.getString("quality") ?: "high"
        val frameRate = if (settings.hasKey("frameRate")) settings.getInt("frameRate") else 30
        val audioEnabled = if (settings.hasKey("audioEnabled")) settings.getBoolean("audioEnabled") else true

        // Calculate dimensions based on quality
        val (width, height) = when (quality) {
            "low" -> Pair(640, 480)
            "medium" -> Pair(1280, 720)
            "high" -> Pair(1920, 1080)
            "ultra" -> Pair(metrics.widthPixels, metrics.heightPixels)
            else -> Pair(1920, 1080)
        }

        // Generate filename
        val timestamp = System.currentTimeMillis()
        val filename = "recording_$timestamp.mp4"
        val outputFile = File(getRecordingsDirectory(), filename)

        val serviceIntent = Intent(reactContext, ScreenRecorderService::class.java).apply {
            action = ScreenRecorderService.ACTION_START
            putExtra(ScreenRecorderService.EXTRA_RESULT_CODE, resultCode)
            putExtra(ScreenRecorderService.EXTRA_RESULT_DATA, data)
            putExtra(ScreenRecorderService.EXTRA_WIDTH, width)
            putExtra(ScreenRecorderService.EXTRA_HEIGHT, height)
            putExtra(ScreenRecorderService.EXTRA_DENSITY, metrics.densityDpi)
            putExtra(ScreenRecorderService.EXTRA_FRAME_RATE, frameRate)
            putExtra(ScreenRecorderService.EXTRA_AUDIO_ENABLED, audioEnabled)
            putExtra(ScreenRecorderService.EXTRA_OUTPUT_PATH, outputFile.absolutePath)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(serviceIntent)
        } else {
            reactContext.startService(serviceIntent)
        }

        startRecordingPromise?.resolve(null)
        startRecordingPromise = null
        recordingSettings = null
    }

    fun onRecordingStopped(filePath: String?, error: String?) {
        if (error != null) {
            stopRecordingPromise?.reject("RECORDING_ERROR", error)
        } else if (filePath != null) {
            val file = File(filePath)
            val result = Arguments.createMap().apply {
                putString("id", file.nameWithoutExtension)
                putString("filename", file.name)
                putString("path", file.absolutePath)
                putDouble("duration", 0.0)
                putDouble("size", file.length().toDouble())
                putDouble("createdAt", file.lastModified().toDouble())
            }
            stopRecordingPromise?.resolve(result)
        }
        stopRecordingPromise = null
    }

    fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun onNewIntent(intent: Intent?) {}
}
