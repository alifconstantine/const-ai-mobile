package com.constai.mobile.shizuku

import android.content.pm.PackageManager
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import rikka.shizuku.Shizuku
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit

/**
 * ShizukuBridgeModule - React Native Bridge for privileged ADB operations without Root.
 * Provides access to protected directories (/Android/data, /Android/obb),
 * silent uninstallation/disabling of apps, deep cache trimming, and raw privileged shell execution.
 */
class ShizukuBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var permissionListener: Shizuku.OnRequestPermissionResultListener? = null
    private var pendingPermissionPromise: Promise? = null

    init {
        setupShizukuListeners()
    }

    override fun getName(): String = "ShizukuBridge"

    private fun setupShizukuListeners() {
        try {
            permissionListener = Shizuku.OnRequestPermissionResultListener { requestCode, grantResult ->
                if (requestCode == SHIZUKU_PERMISSION_REQUEST_CODE) {
                    val isGranted = grantResult == PackageManager.PERMISSION_GRANTED
                    pendingPermissionPromise?.resolve(Arguments.createMap().apply {
                        putBoolean("isAvailable", isShizukuAvailable())
                        putBoolean("isPermissionGranted", isGranted)
                        putInt("version", getShizukuVersion())
                        putInt("uid", getShizukuUid())
                    })
                    pendingPermissionPromise = null
                }
            }
            Shizuku.addRequestPermissionResultListener(permissionListener!!)
        } catch (e: Throwable) {
            // Shizuku provider may not be initialized yet on non-Android or unsupported environments
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        permissionListener?.let {
            try {
                Shizuku.removeRequestPermissionResultListener(it)
            } catch (e: Throwable) {
                // Ignore cleanup error
            }
        }
        moduleScope.cancel()
    }

    // ==========================================
    // 1. Connection & Permission Management
    // ==========================================

    private fun isShizukuAvailable(): Boolean {
        return try {
            Shizuku.pingBinder()
        } catch (e: Throwable) {
            false
        }
    }

    private fun hasShizukuPermission(): Boolean {
        return try {
            if (!isShizukuAvailable()) return false
            if (Shizuku.isPre_V11()) {
                false
            } else {
                Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
            }
        } catch (e: Throwable) {
            false
        }
    }

    private fun getShizukuVersion(): Int {
        return try {
            if (isShizukuAvailable()) Shizuku.getVersion() else -1
        } catch (e: Throwable) {
            -1
        }
    }

    private fun getShizukuUid(): Int {
        return try {
            if (isShizukuAvailable()) Shizuku.getUid() else -1
        } catch (e: Throwable) {
            -1
        }
    }

    @ReactMethod
    fun checkStatus(promise: Promise) {
        moduleScope.launch {
            try {
                val available = isShizukuAvailable()
                val granted = hasShizukuPermission()
                val version = getShizukuVersion()
                val uid = getShizukuUid()

                val result = Arguments.createMap().apply {
                    putBoolean("isAvailable", available)
                    putBoolean("isPermissionGranted", granted)
                    putInt("version", version)
                    putInt("uid", uid)
                    if (!available) {
                        putString("error", "Shizuku service is not running. Please start Shizuku via Wireless Debugging or ADB.")
                    } else if (!granted) {
                        putString("error", "Shizuku permission has not been granted by user.")
                    }
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("isAvailable", false)
                    putBoolean("isPermissionGranted", false)
                    putInt("version", -1)
                    putInt("uid", -1)
                    putString("error", e.message ?: "Unknown Shizuku check error")
                })
            }
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        moduleScope.launch(Dispatchers.Main) {
            try {
                if (!isShizukuAvailable()) {
                    promise.resolve(Arguments.createMap().apply {
                        putBoolean("isAvailable", false)
                        putBoolean("isPermissionGranted", false)
                        putString("error", "Shizuku service is not active. Start Shizuku first.")
                    })
                    return@launch
                }

                if (hasShizukuPermission()) {
                    promise.resolve(Arguments.createMap().apply {
                        putBoolean("isAvailable", true)
                        putBoolean("isPermissionGranted", true)
                        putInt("version", getShizukuVersion())
                        putInt("uid", getShizukuUid())
                    })
                    return@launch
                }

                pendingPermissionPromise = promise
                Shizuku.requestPermission(SHIZUKU_PERMISSION_REQUEST_CODE)
            } catch (e: Exception) {
                promise.reject("PERMISSION_REQUEST_FAILED", e.message, e)
            }
        }
    }

    // ==========================================
    // 2. Privileged ADB Shell Command Execution
    // ==========================================

    @ReactMethod
    fun executeCommand(command: String, workingDir: String?, timeoutMs: Int, promise: Promise) {
        moduleScope.launch {
            try {
                if (!isShizukuAvailable() || !hasShizukuPermission()) {
                    promise.reject(
                        "SHIZUKU_NOT_READY",
                        "Shizuku service is unavailable or permission is not granted."
                    )
                    return@launch
                }

                val startTime = System.currentTimeMillis()
                val workDirFile = workingDir?.let { File(it) }

                val process = try {
                    Shizuku.newProcess(arrayOf("sh", "-c", command), null, workDirFile?.path)
                } catch (e: Throwable) {
                    throw IllegalStateException("Failed to spawn Shizuku process: ${e.message}", e)
                }

                val stdout = StringBuilder()
                val stderr = StringBuilder()

                val stdoutJob = launch(Dispatchers.IO) {
                    BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                        var line: String?
                        while (reader.readLine().also { line = it } != null) {
                            if (stdout.length < MAX_OUTPUT_BUFFER) {
                                stdout.append(line).append("\n")
                            }
                        }
                    }
                }

                val stderrJob = launch(Dispatchers.IO) {
                    BufferedReader(InputStreamReader(process.errorStream)).use { reader ->
                        var line: String?
                        while (reader.readLine().also { line = it } != null) {
                            if (stderr.length < MAX_OUTPUT_BUFFER) {
                                stderr.append(line).append("\n")
                            }
                        }
                    }
                }

                val effectiveTimeout = if (timeoutMs > 0) timeoutMs.toLong() else DEFAULT_TIMEOUT_MS
                val finished = withContext(Dispatchers.IO) {
                    try {
                        process.waitFor(effectiveTimeout, TimeUnit.MILLISECONDS)
                    } catch (e: Exception) {
                        false
                    }
                }

                if (!finished) {
                    process.destroy()
                    stdoutJob.cancel()
                    stderrJob.cancel()
                    promise.reject("EXECUTION_TIMEOUT", "Command timed out after ${effectiveTimeout}ms: $command")
                    return@launch
                }

                stdoutJob.join()
                stderrJob.join()

                val duration = System.currentTimeMillis() - startTime
                val exitCode = process.exitValue()

                val result = Arguments.createMap().apply {
                    putInt("exitCode", exitCode)
                    putString("stdout", stdout.toString().trimEnd())
                    putString("stderr", stderr.toString().trimEnd())
                    putDouble("durationMs", duration.toDouble())
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("COMMAND_ERROR", e.message, e)
            }
        }
    }

    // ==========================================
    // 3. Protected Folder Access (/Android/data & /Android/obb)
    // ==========================================

    @ReactMethod
    fun accessFolder(args: ReadableMap, promise: Promise) {
        moduleScope.launch {
            try {
                if (!isShizukuAvailable() || !hasShizukuPermission()) {
                    promise.reject("SHIZUKU_NOT_READY", "Shizuku is required for accessing locked system folders.")
                    return@launch
                }

                val action = args.getString("action") ?: "list"
                val targetPath = args.getString("targetPath") ?: "/sdcard/Android/data"
                val recursive = if (args.hasKey("recursive")) args.getBoolean("recursive") else false

                when (action) {
                    "list" -> {
                        // Safe listing via ls command in shell
                        val escapedPath = targetPath.replace("'", "'\\''")
                        val cmd = if (recursive) "ls -lR '$escapedPath'" else "ls -la '$escapedPath'"
                        val execResult = runPrivilegedShellCommand(cmd)

                        val fileList = Arguments.createArray()
                        val lines = execResult.stdout.lines()
                        for (line in lines) {
                            val trimmed = line.trim()
                            if (trimmed.isEmpty() || trimmed.startsWith("total")) continue
                            val parts = trimmed.split(Regex("\\s+"))
                            if (parts.size >= 8) {
                                val isDir = parts[0].startsWith("d")
                                val size = parts[4].toLongOrNull() ?: 0L
                                val name = parts.subList(7, parts.size).joinToString(" ")
                                if (name != "." && name != "..") {
                                    fileList.pushMap(Arguments.createMap().apply {
                                        putString("name", name)
                                        putString("path", "$targetPath/$name")
                                        putBoolean("isDirectory", isDir)
                                        putDouble("sizeBytes", size.toDouble())
                                    })
                                }
                            }
                        }

                        val res = Arguments.createMap().apply {
                            putString("path", targetPath)
                            putBoolean("success", execResult.exitCode == 0)
                            putArray("files", fileList)
                            if (execResult.exitCode != 0) {
                                putString("error", execResult.stderr)
                            }
                        }
                        promise.resolve(res)
                    }

                    "calculate_size" -> {
                        val escapedPath = targetPath.replace("'", "'\\''")
                        val cmd = "du -sk '$escapedPath'"
                        val execResult = runPrivilegedShellCommand(cmd)
                        val output = execResult.stdout.trim()
                        val sizeKb = output.split(Regex("\\s+")).firstOrNull()?.toLongOrNull() ?: 0L
                        val sizeBytes = sizeKb * 1024L

                        val res = Arguments.createMap().apply {
                            putString("path", targetPath)
                            putBoolean("success", execResult.exitCode == 0)
                            putDouble("totalSizeBytes", sizeBytes.toDouble())
                            if (execResult.exitCode != 0) {
                                putString("error", execResult.stderr)
                            }
                        }
                        promise.resolve(res)
                    }

                    "delete" -> {
                        val escapedPath = targetPath.replace("'", "'\\''")
                        // Safety protection: do not allow deletion of root sdcard or system roots
                        if (targetPath.trim() in listOf("/", "/sdcard", "/sdcard/", "/storage/emulated/0", "/storage/emulated/0/")) {
                            promise.reject("CRITICAL_SECURITY_BLOCK", "Deleting root storage directories is forbidden.")
                            return@launch
                        }

                        val cmd = "rm -rf '$escapedPath'"
                        val execResult = runPrivilegedShellCommand(cmd)

                        val res = Arguments.createMap().apply {
                            putString("path", targetPath)
                            putBoolean("success", execResult.exitCode == 0)
                            if (execResult.exitCode != 0) {
                                putString("error", execResult.stderr)
                            }
                        }
                        promise.resolve(res)
                    }

                    "clear_cache" -> {
                        // Clears cache subdirectories inside Android/data
                        val escapedPath = targetPath.replace("'", "'\\''")
                        val cmd = "find '$escapedPath' -maxdepth 2 -type d -name cache -exec rm -rf {} + 2>/dev/null || rm -rf '$escapedPath/cache'"
                        val execResult = runPrivilegedShellCommand(cmd)

                        val res = Arguments.createMap().apply {
                            putString("path", targetPath)
                            putBoolean("success", execResult.exitCode == 0)
                            putString("output", execResult.stdout)
                            if (execResult.exitCode != 0) {
                                putString("error", execResult.stderr)
                            }
                        }
                        promise.resolve(res)
                    }

                    else -> promise.reject("INVALID_ACTION", "Unknown folder action: $action")
                }
            } catch (e: Exception) {
                promise.reject("FOLDER_ACCESS_ERROR", e.message, e)
            }
        }
    }

    // ==========================================
    // 4. Silent Uninstaller & Privileged App Management
    // ==========================================

    @ReactMethod
    fun manageAppPrivileged(args: ReadableMap, promise: Promise) {
        moduleScope.launch {
            try {
                if (!isShizukuAvailable() || !hasShizukuPermission()) {
                    promise.reject("SHIZUKU_NOT_READY", "Shizuku is required for silent app management.")
                    return@launch
                }

                val action = args.getString("action") ?: "uninstall"
                val packageName = args.getString("packageName")
                    ?: throw IllegalArgumentException("Package name is required.")
                val keepData = if (args.hasKey("keepData")) args.getBoolean("keepData") else false

                val cmd = when (action) {
                    "uninstall" -> if (keepData) "pm uninstall -k $packageName" else "pm uninstall $packageName"
                    "disable" -> "pm disable-user --user 0 $packageName"
                    "enable" -> "pm enable $packageName"
                    "force_stop" -> "am force-stop $packageName"
                    "clear_data" -> "pm clear $packageName"
                    else -> throw IllegalArgumentException("Unsupported privileged app action: $action")
                }

                val execResult = runPrivilegedShellCommand(cmd)
                val success = execResult.exitCode == 0 && (
                    execResult.stdout.contains("Success", ignoreCase = true) ||
                    execResult.stdout.isEmpty()
                )

                val result = Arguments.createMap().apply {
                    putString("packageName", packageName)
                    putString("action", action)
                    putBoolean("success", success)
                    putString("output", (execResult.stdout + "\n" + execResult.stderr).trim())
                    if (!success) {
                        putString("error", execResult.stderr.ifEmpty { execResult.stdout })
                    }
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("APP_ACTION_ERROR", e.message, e)
            }
        }
    }

    // ==========================================
    // 5. Deep System Cache Trimming
    // ==========================================

    @ReactMethod
    fun trimCaches(desiredFreeBytes: Double, promise: Promise) {
        moduleScope.launch {
            try {
                if (!isShizukuAvailable() || !hasShizukuPermission()) {
                    promise.reject("SHIZUKU_NOT_READY", "Shizuku is required for deep system cache trimming.")
                    return@launch
                }

                // If desiredFreeBytes is 0 or negative, default to 4096M (4GB trim request)
                val trimArg = if (desiredFreeBytes > 0) {
                    val mb = (desiredFreeBytes / (1024 * 1024)).toLong()
                    "${mb}M"
                } else {
                    "4096M"
                }

                val cmd = "pm trim-caches $trimArg"
                val execResult = runPrivilegedShellCommand(cmd)

                val success = execResult.exitCode == 0
                val result = Arguments.createMap().apply {
                    putDouble("desiredFreeBytes", desiredFreeBytes)
                    putBoolean("success", success)
                    putString("output", execResult.stdout.ifEmpty { "System caches trimmed successfully." })
                    if (!success) {
                        putString("error", execResult.stderr)
                    }
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("TRIM_CACHE_ERROR", e.message, e)
            }
        }
    }

    // ==========================================
    // 6. Helper Functions & Shell Exec
    // ==========================================

    private data class ShellResult(val exitCode: Int, val stdout: String, val stderr: String)

    private fun runPrivilegedShellCommand(command: String, timeoutMs: Long = 10000L): ShellResult {
        val process = Shizuku.newProcess(arrayOf("sh", "-c", command), null, null)
        val stdout = StringBuilder()
        val stderr = StringBuilder()

        val stdoutThread = Thread {
            BufferedReader(InputStreamReader(process.inputStream)).use { r ->
                var l: String?
                while (r.readLine().also { l = it } != null) {
                    stdout.append(l).append("\n")
                }
            }
        }
        val stderrThread = Thread {
            BufferedReader(InputStreamReader(process.errorStream)).use { r ->
                var l: String?
                while (r.readLine().also { l = it } != null) {
                    stderr.append(l).append("\n")
                }
            }
        }

        stdoutThread.start()
        stderrThread.start()

        val finished = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS)
        if (!finished) {
            process.destroy()
            return ShellResult(-1, stdout.toString().trim(), "Timed out after ${timeoutMs}ms")
        }

        stdoutThread.join(1000)
        stderrThread.join(1000)

        return ShellResult(process.exitValue(), stdout.toString().trim(), stderr.toString().trim())
    }

    companion object {
        private const val SHIZUKU_PERMISSION_REQUEST_CODE = 4001
        private const val DEFAULT_TIMEOUT_MS = 15000L
        private const val MAX_OUTPUT_BUFFER = 512 * 1024 // 512 KB
    }
}
