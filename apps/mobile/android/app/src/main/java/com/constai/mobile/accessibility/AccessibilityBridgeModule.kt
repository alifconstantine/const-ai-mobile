package com.constai.mobile.accessibility

import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * AccessibilityBridgeModule — React Native Bridge Module for Accessibility Spatial Controller.
 * Bridges JavaScript AI Agent requests with native Android ConstAccessibilityService.
 */
class AccessibilityBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.Main)

    override fun getName(): String = "AccessibilityBridge"

    // =========================================================================
    // 1. Status & Settings Management
    // =========================================================================

    @ReactMethod
    fun checkStatus(promise: Promise) {
        val isRunning = ConstAccessibilityService.isServiceRunning()
        val result = Arguments.createMap().apply {
            putBoolean("isServiceRunning", isRunning)
            putBoolean("isPermissionGranted", isRunning)
            putString("serviceName", "ConstAccessibilityService")
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            ConstAccessibilityService.openAccessibilitySettings(reactContext)
            val result = Arguments.createMap().apply {
                putBoolean("success", true)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", e.message, e)
        }
    }

    // =========================================================================
    // 2. Spatial UI Hierarchy Extraction
    // =========================================================================

    @ReactMethod
    fun captureUIHierarchy(promise: Promise) {
        val service = ConstAccessibilityService.getInstance()
        if (service == null) {
            promise.reject(
                "SERVICE_UNAVAILABLE",
                "ConstAccessibilityService is not running. Please enable Accessibility permission in Android Settings."
            )
            return
        }

        moduleScope.launch(Dispatchers.Default) {
            try {
                val snapshot = service.captureHierarchySnapshot()
                val map = Arguments.createMap().apply {
                    putDouble("timestamp", snapshot.timestamp.toDouble())
                    putString("packageName", snapshot.packageName)
                    putString("activityName", snapshot.activityName ?: "")
                    putInt("screenWidth", snapshot.screenWidth)
                    putInt("screenHeight", snapshot.screenHeight)

                    val elementsArray = Arguments.createArray()
                    for (el in snapshot.interactiveElements) {
                        val elMap = Arguments.createMap().apply {
                            putInt("id", el.id)
                            putString("text", el.text)
                            putString("contentDescription", el.contentDescription)
                            putString("className", el.className)
                            putString("packageName", el.packageName)
                            putString("viewIdResourceName", el.viewIdResourceName ?: "")
                            putInt("centerX", el.centerX)
                            putInt("centerY", el.centerY)
                            putBoolean("isClickable", el.isClickable)
                            putBoolean("isEditable", el.isEditable)
                            putBoolean("isScrollable", el.isScrollable)
                            putBoolean("isCheckable", el.isCheckable)
                            putBoolean("isChecked", el.isChecked)
                            putBoolean("isEnabled", el.isEnabled)

                            val boundsArray = Arguments.createArray().apply {
                                for (b in el.bounds) {
                                    pushInt(b)
                                }
                            }
                            putArray("bounds", boundsArray)
                        }
                        elementsArray.pushMap(elMap)
                    }
                    putArray("interactiveElements", elementsArray)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(map)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("CAPTURE_ERROR", e.message, e)
                }
            }
        }
    }

    // =========================================================================
    // 3. Unified Action Dispatcher
    // =========================================================================

    @ReactMethod
    fun performAction(args: ReadableMap, promise: Promise) {
        val service = ConstAccessibilityService.getInstance()
        if (service == null) {
            promise.reject(
                "SERVICE_UNAVAILABLE",
                "ConstAccessibilityService is not running. Please enable Accessibility permission in Android Settings."
            )
            return
        }

        val actionType = args.getString("actionType") ?: "tap_coordinates"

        when (actionType) {
            "tap_coordinates" -> {
                val coords = args.getArray("coordinates")
                if (coords == null || coords.size() < 2) {
                    promise.reject("INVALID_ARGS", "Missing coordinates [x, y] for tap_coordinates action.")
                    return
                }
                val x = coords.getDouble(0).toFloat()
                val y = coords.getDouble(1).toFloat()

                service.performTap(
                    x, y,
                    onComplete = {
                        val res = Arguments.createMap().apply {
                            putBoolean("success", true)
                            putString("actionType", actionType)
                        }
                        promise.resolve(res)
                    },
                    onError = { err ->
                        promise.reject("GESTURE_FAILED", err)
                    }
                )
            }

            "tap_node" -> {
                val targetId = if (args.hasKey("targetNodeId")) args.getInt("targetNodeId") else -1
                val coords = if (args.hasKey("coordinates")) args.getArray("coordinates") else null

                if (coords != null && coords.size() >= 2) {
                    val x = coords.getDouble(0).toFloat()
                    val y = coords.getDouble(1).toFloat()
                    service.performTap(
                        x, y,
                        onComplete = {
                            val res = Arguments.createMap().apply {
                                putBoolean("success", true)
                                putString("actionType", actionType)
                            }
                            promise.resolve(res)
                        },
                        onError = { err ->
                            promise.reject("GESTURE_FAILED", err)
                        }
                    )
                } else {
                    // Fallback to searching the snapshot to find center coordinates of targetNodeId
                    val snapshot = service.captureHierarchySnapshot()
                    val targetElement = snapshot.interactiveElements.find { it.id == targetId }
                    if (targetElement != null) {
                        service.performTap(
                            targetElement.centerX.toFloat(),
                            targetElement.centerY.toFloat(),
                            onComplete = {
                                val res = Arguments.createMap().apply {
                                    putBoolean("success", true)
                                    putString("actionType", actionType)
                                    putInt("targetNodeId", targetId)
                                }
                                promise.resolve(res)
                            },
                            onError = { err ->
                                promise.reject("GESTURE_FAILED", err)
                            }
                        )
                    } else {
                        promise.reject("NODE_NOT_FOUND", "Target node ID $targetId not found in active window.")
                    }
                }
            }

            "swipe" -> {
                val swipeObj = args.getMap("swipeCoordinates")
                val startX = swipeObj?.getDouble("startX")?.toFloat() ?: 500f
                val startY = swipeObj?.getDouble("startY")?.toFloat() ?: 1200f
                val endX = swipeObj?.getDouble("endX")?.toFloat() ?: 500f
                val endY = swipeObj?.getDouble("endY")?.toFloat() ?: 400f
                val durationMs = if (swipeObj?.hasKey("durationMs") == true) {
                    swipeObj.getDouble("durationMs").toLong()
                } else 300L

                service.performSwipe(
                    startX, startY, endX, endY, durationMs,
                    onComplete = {
                        val res = Arguments.createMap().apply {
                            putBoolean("success", true)
                            putString("actionType", actionType)
                        }
                        promise.resolve(res)
                    },
                    onError = { err ->
                        promise.reject("GESTURE_FAILED", err)
                    }
                )
            }

            "input_text" -> {
                val text = args.getString("text") ?: ""
                val targetId = if (args.hasKey("targetNodeId")) args.getInt("targetNodeId") else null
                val success = service.inputText(text, targetId)
                val res = Arguments.createMap().apply {
                    putBoolean("success", success)
                    putString("actionType", actionType)
                }
                promise.resolve(res)
            }

            "press_back", "press_home", "press_recents" -> {
                val success = service.pressGlobalAction(actionType)
                val res = Arguments.createMap().apply {
                    putBoolean("success", success)
                    putString("actionType", actionType)
                }
                promise.resolve(res)
            }

            "scroll_forward" -> {
                val targetId = if (args.hasKey("targetNodeId")) args.getInt("targetNodeId") else null
                val success = service.scroll("forward", targetId)
                val res = Arguments.createMap().apply {
                    putBoolean("success", success)
                    putString("actionType", actionType)
                }
                promise.resolve(res)
            }

            "scroll_backward" -> {
                val targetId = if (args.hasKey("targetNodeId")) args.getInt("targetNodeId") else null
                val success = service.scroll("backward", targetId)
                val res = Arguments.createMap().apply {
                    putBoolean("success", success)
                    putString("actionType", actionType)
                }
                promise.resolve(res)
            }

            else -> promise.reject("INVALID_ACTION", "Unknown accessibility actionType: $actionType")
        }
    }

    // =========================================================================
    // 4. Convenience Direct Native Methods
    // =========================================================================

    @ReactMethod
    fun performTap(x: Double, y: Double, promise: Promise) {
        val service = ConstAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("SERVICE_UNAVAILABLE", "ConstAccessibilityService is not running.")
            return
        }

        service.performTap(
            x.toFloat(), y.toFloat(),
            onComplete = {
                val res = Arguments.createMap().apply {
                    putBoolean("success", true)
                }
                promise.resolve(res)
            },
            onError = { err -> promise.reject("GESTURE_FAILED", err) }
        )
    }

    @ReactMethod
    fun performSwipe(
        startX: Double,
        startY: Double,
        endX: Double,
        endY: Double,
        durationMs: Double,
        promise: Promise
    ) {
        val service = ConstAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("SERVICE_UNAVAILABLE", "ConstAccessibilityService is not running.")
            return
        }

        service.performSwipe(
            startX.toFloat(), startY.toFloat(), endX.toFloat(), endY.toFloat(), durationMs.toLong(),
            onComplete = {
                val res = Arguments.createMap().apply {
                    putBoolean("success", true)
                }
                promise.resolve(res)
            },
            onError = { err -> promise.reject("GESTURE_FAILED", err) }
        )
    }

    @ReactMethod
    fun inputText(text: String, targetNodeId: Double, promise: Promise) {
        val service = ConstAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("SERVICE_UNAVAILABLE", "ConstAccessibilityService is not running.")
            return
        }

        val nodeId = if (targetNodeId > 0) targetNodeId.toInt() else null
        val success = service.inputText(text, nodeId)
        val res = Arguments.createMap().apply {
            putBoolean("success", success)
        }
        promise.resolve(res)
    }

    @ReactMethod
    fun pressGlobalButton(buttonType: String, promise: Promise) {
        val service = ConstAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("SERVICE_UNAVAILABLE", "ConstAccessibilityService is not running.")
            return
        }

        val success = service.pressGlobalAction(buttonType)
        val res = Arguments.createMap().apply {
            putBoolean("success", success)
        }
        promise.resolve(res)
    }

    @ReactMethod
    fun scroll(direction: String, targetNodeId: Double, promise: Promise) {
        val service = ConstAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("SERVICE_UNAVAILABLE", "ConstAccessibilityService is not running.")
            return
        }

        val nodeId = if (targetNodeId > 0) targetNodeId.toInt() else null
        val success = service.scroll(direction, nodeId)
        val res = Arguments.createMap().apply {
            putBoolean("success", success)
        }
        promise.resolve(res)
    }
}
