package com.constai.mobile.device

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.util.Log

/**
 * HardwareHelper - Direct hardware control for Flashlight, Volume, Battery, and WiFi.
 */
class HardwareHelper(private val context: Context) {

    companion object {
        private const val TAG = "ConstAI_HardwareHelper"
        private var isFlashlightOn: Boolean = false
    }

    private val cameraManager: CameraManager?
        get() = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager

    private val audioManager: AudioManager?
        get() = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

    private val wifiManager: WifiManager?
        get() = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager

    /**
     * Toggles or explicitly sets flashlight (torch) state.
     */
    fun toggleFlashlight(state: Boolean? = null): Boolean {
        val cm = cameraManager ?: throw IllegalStateException("CameraManager not available on this device.")

        try {
            val cameraId = cm.cameraIdList.firstOrNull { id ->
                val characteristics = cm.getCameraCharacteristics(id)
                characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            } ?: throw IllegalStateException("No camera with flash unit found.")

            val targetState = state ?: !isFlashlightOn
            cm.setTorchMode(cameraId, targetState)
            isFlashlightOn = targetState
            return isFlashlightOn
        } catch (e: Exception) {
            Log.e(TAG, "Error setting flashlight torch mode", e)
            throw RuntimeException("Flashlight error: ${e.message}", e)
        }
    }

    /**
     * Sets volume level for audio streams (music, ring, alarm, notification, voice_call).
     * Accepts volume percentage (0-100) or index.
     */
    fun setVolume(streamTypeStr: String? = "music", level: Int): Map<String, Any> {
        val am = audioManager ?: throw IllegalStateException("AudioManager not available.")

        val streamType = when (streamTypeStr?.lowercase()) {
            "ring", "ringer" -> AudioManager.STREAM_RING
            "notification" -> AudioManager.STREAM_NOTIFICATION
            "alarm" -> AudioManager.STREAM_ALARM
            "voice", "call", "voice_call" -> AudioManager.STREAM_VOICE_CALL
            else -> AudioManager.STREAM_MUSIC
        }

        val maxVolume = am.getStreamMaxVolume(streamType)
        val minVolume = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            am.getStreamMinVolume(streamType)
        } else {
            0
        }

        // Normalize level: if provided 0-100 percentage, map to minVolume..maxVolume
        val targetVolume = if (level in 0..100 && maxVolume > 0) {
            val scaled = (level.toFloat() / 100f) * (maxVolume - minVolume) + minVolume
            scaled.toInt().coerceIn(minVolume, maxVolume)
        } else {
            level.coerceIn(minVolume, maxVolume)
        }

        am.setStreamVolume(streamType, targetVolume, AudioManager.FLAG_SHOW_UI)
        val currentVolume = am.getStreamVolume(streamType)
        val percentage = if (maxVolume > 0) ((currentVolume.toFloat() / maxVolume.toFloat()) * 100).toInt() else 0

        return mapOf(
            "streamType" to (streamTypeStr ?: "music"),
            "currentVolume" to currentVolume,
            "maxVolume" to maxVolume,
            "volumePercentage" to percentage
        )
    }

    /**
     * Retrieves battery percentage, charging state, and health.
     */
    fun getBatteryLevel(): Map<String, Any> {
        val batteryStatusIntent = context.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )

        var batteryPct = 0
        var isCharging = false

        if (batteryStatusIntent != null) {
            val level = batteryStatusIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = batteryStatusIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            if (level >= 0 && scale > 0) {
                batteryPct = ((level.toFloat() / scale.toFloat()) * 100).toInt()
            }

            val status = batteryStatusIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
            isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                    status == BatteryManager.BATTERY_STATUS_FULL
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val bm = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
            batteryPct = bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 0
            isCharging = bm?.isCharging ?: false
        }

        return mapOf(
            "batteryLevel" to batteryPct,
            "isCharging" to isCharging,
            "status" to (if (isCharging) "charging" else "discharging")
        )
    }

    /**
     * Checks WiFi enabled and active connection state.
     */
    fun getWifiStatus(): Map<String, Any> {
        val isEnabled = wifiManager?.isWifiEnabled ?: false
        var isConnected = false

        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        if (cm != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val activeNetwork = cm.activeNetwork
                val capabilities = cm.getNetworkCapabilities(activeNetwork)
                isConnected = capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true
            } else {
                @Suppress("DEPRECATION")
                val wifiInfo = cm.getNetworkInfo(ConnectivityManager.TYPE_WIFI)
                @Suppress("DEPRECATION")
                isConnected = wifiInfo?.isConnected == true
            }
        }

        return mapOf(
            "wifiEnabled" to isEnabled,
            "wifiConnected" to isConnected
        )
    }
}
