package com.constai.mobile.termux

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * TermuxBridgeModule - React Native Bridge for Termux CLI Execution
 * Communicates with Termux's RunCommandService (com.termux.permission.RUN_COMMAND)
 * to run Bash, Python, Node.js, and Git scripts asynchronously with full stdout/stderr capture.
 * Designed with multi-version fallback compatibility across all Termux distributions (F-Droid / GitHub).
 */
class TermuxBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val nextExecutionId = AtomicInteger(1000)
    private val activeReceivers = ConcurrentHashMap<Int, BroadcastReceiver>()

    override fun getName(): String = "TermuxBridge"

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        moduleScope.cancel()
        // Clean up any remaining broadcast receivers
        activeReceivers.forEach { (_, receiver) ->
            try {
                reactContext.unregisterReceiver(receiver)
            } catch (e: Throwable) {
                // Ignore cleanup error
            }
        }
        activeReceivers.clear()
    }

    // ==========================================
    // 1. Status & Installation Checks
    // ==========================================

    private fun isTermuxInstalled(): Boolean {
        return try {
            reactContext.packageManager.getPackageInfo(TERMUX_PACKAGE_NAME, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        } catch (e: Throwable) {
            false
        }
    }

    private fun getTermuxVersion(): String {
        return try {
            val pInfo = reactContext.packageManager.getPackageInfo(TERMUX_PACKAGE_NAME, 0)
            pInfo.versionName ?: "Unknown"
        } catch (e: Throwable) {
            "Not Installed"
        }
    }

    private fun hasRunCommandPermission(): Boolean {
        return try {
            val result = reactContext.checkCallingOrSelfPermission(TERMUX_PERMISSION_RUN_COMMAND)
            result == PackageManager.PERMISSION_GRANTED
        } catch (e: Throwable) {
            false
        }
    }

    @ReactMethod
    fun checkStatus(promise: Promise) {
        moduleScope.launch {
            try {
                val installed = isTermuxInstalled()
                val granted = hasRunCommandPermission()
                val version = getTermuxVersion()

                val result = Arguments.createMap().apply {
                    putBoolean("isInstalled", installed)
                    putBoolean("isPermissionGranted", granted)
                    putString("version", version)
                    if (!installed) {
                        putString("error", "Termux is not installed on this device.")
                    } else if (!granted) {
                        putString("error", "com.termux.permission.RUN_COMMAND is not granted.")
                    }
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("isInstalled", false)
                    putBoolean("isPermissionGranted", false)
                    putString("version", "Unknown")
                    putString("error", e.message ?: "Unknown Termux status check error")
                })
            }
        }
    }

    // ==========================================
    // 2. Termux Command Execution
    // ==========================================

    @ReactMethod
    fun executeScript(
        script: String,
        workingDir: String?,
        inBackground: Boolean,
        sessionAction: String?,
        timeoutMs: Int,
        promise: Promise
    ) {
        moduleScope.launch {
            try {
                if (!isTermuxInstalled()) {
                    promise.reject(
                        "TERMUX_NOT_INSTALLED",
                        "Termux app is not installed on this device. Please install Termux from F-Droid or GitHub."
                    )
                    return@launch
                }

                val execId = nextExecutionId.incrementAndGet()
                val actionResult = "${reactContext.packageName}.TERMUX_RESULT_$execId"
                val startTime = System.currentTimeMillis()
                val effectiveTimeout = if (timeoutMs > 0) timeoutMs.toLong() else DEFAULT_TIMEOUT_MS

                val resultIntent = Intent(actionResult).apply {
                    setPackage(reactContext.packageName)
                }

                // Android 12+ (SDK 31+) requires FLAG_MUTABLE for PendingIntent when extra result bundle is returned by another service
                val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_MUTABLE
                } else {
                    PendingIntent.FLAG_ONE_SHOT
                }

                val pendingIntent = PendingIntent.getBroadcast(
                    reactContext,
                    execId,
                    resultIntent,
                    pendingIntentFlags
                )

                // Timeout cancellation job
                var isCompleted = false
                val timeoutJob = launch {
                    delay(effectiveTimeout)
                    if (!isCompleted) {
                        isCompleted = true
                        val receiver = activeReceivers.remove(execId)
                        receiver?.let {
                            try {
                                reactContext.unregisterReceiver(it)
                            } catch (e: Throwable) {
                                // Ignore
                            }
                        }
                        promise.reject("EXECUTION_TIMEOUT", "Termux command timed out after ${effectiveTimeout}ms: $script")
                    }
                }

                val receiver = object : BroadcastReceiver() {
                    override fun onReceive(context: Context?, intent: Intent?) {
                        if (isCompleted) return
                        isCompleted = true
                        timeoutJob.cancel()
                        activeReceivers.remove(execId)

                        try {
                            reactContext.unregisterReceiver(this)
                        } catch (e: Throwable) {
                            // Ignore unregister error
                        }

                        val resultBundle: Bundle? = intent?.getBundleExtra(EXTRA_PLUGIN_RESULT_BUNDLE)
                            ?: intent?.getBundleExtra("com.termux.RUN_COMMAND_RESULT_BUNDLE")
                            ?: intent?.extras

                        val stdout = resultBundle?.getString(EXTRA_PLUGIN_RESULT_BUNDLE_STDOUT)
                            ?: resultBundle?.getString("com.termux.RUN_COMMAND.RESULT.STDOUT")
                            ?: ""

                        val stderr = resultBundle?.getString(EXTRA_PLUGIN_RESULT_BUNDLE_STDERR)
                            ?: resultBundle?.getString("com.termux.RUN_COMMAND.RESULT.STDERR")
                            ?: ""

                        val exitCode = if (resultBundle?.containsKey(EXTRA_PLUGIN_RESULT_BUNDLE_EXIT_CODE) == true) {
                            resultBundle.getInt(EXTRA_PLUGIN_RESULT_BUNDLE_EXIT_CODE, 0)
                        } else if (resultBundle?.containsKey("com.termux.RUN_COMMAND.RESULT.EXIT_CODE") == true) {
                            resultBundle.getInt("com.termux.RUN_COMMAND.RESULT.EXIT_CODE", 0)
                        } else {
                            0
                        }

                        val errCode = resultBundle?.getInt(EXTRA_PLUGIN_RESULT_BUNDLE_ERR, 0) ?: 0
                        val errmsg = resultBundle?.getString(EXTRA_PLUGIN_RESULT_BUNDLE_ERRMSG)
                            ?: resultBundle?.getString("com.termux.RUN_COMMAND.RESULT.ERRMSG")
                            ?: ""

                        val duration = System.currentTimeMillis() - startTime

                        val combinedOutput = when {
                            stdout.isNotEmpty() && stderr.isNotEmpty() -> "$stdout\n$stderr"
                            stdout.isNotEmpty() -> stdout
                            stderr.isNotEmpty() -> stderr
                            errmsg.isNotEmpty() -> errmsg
                            else -> ""
                        }.trim()

                        val resultMap = Arguments.createMap().apply {
                            putInt("exitCode", if (errCode != 0 && exitCode == 0) errCode else exitCode)
                            putString("stdout", stdout.trimEnd())
                            putString("stderr", stderr.trimEnd())
                            putString("output", combinedOutput)
                            putDouble("durationMs", duration.toDouble())
                            if (errCode != 0 || errmsg.isNotEmpty()) {
                                putString("error", errmsg.ifEmpty { "Termux execution error code $errCode" })
                            }
                        }

                        promise.resolve(resultMap)
                    }
                }

                activeReceivers[execId] = receiver

                // Register receiver with appropriate export flag for Android 14+ (SDK 34)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    reactContext.registerReceiver(
                        receiver,
                        IntentFilter(actionResult),
                        Context.RECEIVER_EXPORTED
                    )
                } else {
                    reactContext.registerReceiver(
                        receiver,
                        IntentFilter(actionResult)
                    )
                }

                // Construct RUN_COMMAND Intent with canonical and alias extras for universal compatibility
                val targetWorkDir = workingDir ?: "/data/data/com.termux/files/home"
                val termuxIntent = Intent().apply {
                    setClassName(TERMUX_PACKAGE_NAME, TERMUX_RUN_COMMAND_SERVICE_NAME)
                    action = ACTION_RUN_COMMAND
                    // Canonical extras
                    putExtra(EXTRA_COMMAND_PATH, "/data/data/com.termux/files/usr/bin/bash")
                    putExtra(EXTRA_ARGUMENTS, arrayOf("-c", script))
                    putExtra(EXTRA_WORKDIR, targetWorkDir)
                    putExtra(EXTRA_BACKGROUND, inBackground)
                    putExtra(EXTRA_SESSION_ACTION, sessionAction ?: "0")
                    putExtra(EXTRA_COMMAND_LABEL, "Const AI CLI Execution")
                    putExtra(EXTRA_COMMAND_DESCRIPTION, "Executed via Const AI Agent Engine")
                    putExtra(EXTRA_PENDING_INTENT, pendingIntent)

                    // Short/alternate documentation extras for legacy/fork support
                    putExtra("com.termux.RUN_COMMAND.EXECUTABLE", "/data/data/com.termux/files/usr/bin/bash")
                    putExtra("com.termux.RUN_COMMAND.ARGUMENTS", arrayOf("-c", script))
                    putExtra("com.termux.RUN_COMMAND.WORKING_DIRECTORY", targetWorkDir)
                    putExtra("com.termux.RUN_COMMAND.PENDING_INTENT", pendingIntent)
                }

                reactContext.startService(termuxIntent)

            } catch (e: Exception) {
                promise.reject("TERMUX_EXEC_FAILED", e.message, e)
            }
        }
    }

    // ==========================================
    // 3. Open Termux App Activity
    // ==========================================

    @ReactMethod
    fun openTermux(promise: Promise) {
        try {
            val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(TERMUX_PACKAGE_NAME)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(launchIntent)
                promise.resolve(true)
            } else {
                promise.reject("APP_NOT_FOUND", "Could not find launch intent for Termux.")
            }
        } catch (e: Exception) {
            promise.reject("OPEN_FAILED", e.message, e)
        }
    }

    companion object {
        private const val TERMUX_PACKAGE_NAME = "com.termux"
        private const val TERMUX_RUN_COMMAND_SERVICE_NAME = "com.termux.app.RunCommandService"
        private const val TERMUX_PERMISSION_RUN_COMMAND = "com.termux.permission.RUN_COMMAND"
        private const val ACTION_RUN_COMMAND = "com.termux.RUN_COMMAND"

        // Intent Request Extras
        private const val EXTRA_COMMAND_PATH = "com.termux.RUN_COMMAND_PATH"
        private const val EXTRA_ARGUMENTS = "com.termux.RUN_COMMAND_ARGUMENTS"
        private const val EXTRA_WORKDIR = "com.termux.RUN_COMMAND_WORKDIR"
        private const val EXTRA_BACKGROUND = "com.termux.RUN_COMMAND_BACKGROUND"
        private const val EXTRA_SESSION_ACTION = "com.termux.RUN_COMMAND_SESSION_ACTION"
        private const val EXTRA_COMMAND_LABEL = "com.termux.RUN_COMMAND_LABEL"
        private const val EXTRA_COMMAND_DESCRIPTION = "com.termux.RUN_COMMAND_DESCRIPTION"
        private const val EXTRA_PENDING_INTENT = "com.termux.RUN_COMMAND_PENDING_INTENT"

        // Intent Result Extras
        private const val EXTRA_PLUGIN_RESULT_BUNDLE = "result_bundle"
        private const val EXTRA_PLUGIN_RESULT_BUNDLE_STDOUT = "stdout"
        private const val EXTRA_PLUGIN_RESULT_BUNDLE_STDERR = "stderr"
        private const val EXTRA_PLUGIN_RESULT_BUNDLE_EXIT_CODE = "exitCode"
        private const val EXTRA_PLUGIN_RESULT_BUNDLE_ERR = "err"
        private const val EXTRA_PLUGIN_RESULT_BUNDLE_ERRMSG = "errmsg"

        private const val DEFAULT_TIMEOUT_MS = 30000L
    }
}
