package com.constai.mobile.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.DisplayMetrics
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.util.concurrent.atomic.AtomicInteger

/**
 * Data class representing a parsed interactive UI element with spatial coordinates.
 */
data class ParsedUIElement(
    val id: Int,
    val text: String,
    val contentDescription: String,
    val className: String,
    val packageName: String,
    val viewIdResourceName: String?,
    val bounds: List<Int>, // [left, top, right, bottom]
    val centerX: Int,
    val centerY: Int,
    val isClickable: Boolean,
    val isEditable: Boolean,
    val isScrollable: Boolean,
    val isCheckable: Boolean,
    val isChecked: Boolean,
    val isEnabled: Boolean
)

/**
 * Data class representing a complete spatial UI hierarchy snapshot.
 */
data class HierarchySnapshot(
    val timestamp: Long,
    val packageName: String,
    val activityName: String?,
    val screenWidth: Int,
    val screenHeight: Int,
    val interactiveElements: List<ParsedUIElement>
)

/**
 * ConstAccessibilityService — Native Android Accessibility Service
 * Provides UI perception (hierarchical tree parsing) and autonomous spatial gesture control.
 */
class ConstAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ConstAccessService"
        private var instance: ConstAccessibilityService? = null

        /**
         * Returns the running instance of ConstAccessibilityService, or null if disabled.
         */
        fun getInstance(): ConstAccessibilityService? = instance

        /**
         * Checks if the Accessibility Service is currently active in the system.
         */
        fun isServiceRunning(): Boolean = instance != null

        /**
         * Opens Android Accessibility Settings page.
         */
        fun openAccessibilitySettings(context: Context) {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }

    private var currentPackageName: String = ""
    private var currentActivityName: String? = null
    private val idCounter = AtomicInteger(1)

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "ConstAccessibilityService connected successfully.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                event.packageName?.let { currentPackageName = it.toString() }
                event.className?.let { currentActivityName = it.toString() }
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                event.packageName?.let { currentPackageName = it.toString() }
            }
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "ConstAccessibilityService interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        Log.i(TAG, "ConstAccessibilityService destroyed.")
    }

    // =========================================================================
    // 1. Spatial UI Hierarchy Extraction
    // =========================================================================

    /**
     * Captures a complete snapshot of the active window's UI hierarchy with spatial coordinate mapping.
     */
    fun captureHierarchySnapshot(): HierarchySnapshot {
        val rootNode = rootInActiveWindow
        val metrics = resources.displayMetrics
        val screenWidth = metrics.widthPixels
        val screenHeight = metrics.heightPixels

        idCounter.set(1)
        val elements = mutableListOf<ParsedUIElement>()

        if (rootNode != null) {
            val activePkg = rootNode.packageName?.toString() ?: currentPackageName
            traverseNode(rootNode, elements, screenWidth, screenHeight, 0, 30)
            return HierarchySnapshot(
                timestamp = System.currentTimeMillis(),
                packageName = activePkg,
                activityName = currentActivityName,
                screenWidth = screenWidth,
                screenHeight = screenHeight,
                interactiveElements = elements
            )
        }

        return HierarchySnapshot(
            timestamp = System.currentTimeMillis(),
            packageName = currentPackageName,
            activityName = currentActivityName,
            screenWidth = screenWidth,
            screenHeight = screenHeight,
            interactiveElements = emptyList()
        )
    }

    private fun traverseNode(
        node: AccessibilityNodeInfo?,
        elements: mutableListOf<ParsedUIElement>,
        screenWidth: Int,
        screenHeight: Int,
        depth: Int,
        maxDepth: Int
    ) {
        if (node == null || depth > maxDepth) return

        if (node.isVisibleToUser) {
            val rect = Rect()
            node.getBoundsInScreen(rect)

            // Validate that the node has non-zero size and is at least partially on screen
            val hasValidDimensions = rect.width() > 0 && rect.height() > 0
            val isOnScreen = rect.right > 0 && rect.bottom > 0 && rect.left < screenWidth && rect.top < screenHeight

            val text = node.text?.toString()?.trim() ?: ""
            val desc = node.contentDescription?.toString()?.trim() ?: ""
            val isInteractive = node.isClickable || node.isEditable || node.isScrollable || node.isCheckable ||
                    text.isNotEmpty() || desc.isNotEmpty()

            if (hasValidDimensions && isOnScreen && isInteractive) {
                val elementId = idCounter.getAndIncrement()
                val centerX = rect.centerX().coerceIn(0, screenWidth)
                val centerY = rect.centerY().coerceIn(0, screenHeight)

                elements.add(
                    ParsedUIElement(
                        id = elementId,
                        text = text,
                        contentDescription = desc,
                        className = node.className?.toString() ?: "",
                        packageName = node.packageName?.toString() ?: currentPackageName,
                        viewIdResourceName = node.viewIdResourceName,
                        bounds = listOf(rect.left, rect.top, rect.right, rect.bottom),
                        centerX = centerX,
                        centerY = centerY,
                        isClickable = node.isClickable,
                        isEditable = node.isEditable,
                        isScrollable = node.isScrollable,
                        isCheckable = node.isCheckable,
                        isChecked = node.isChecked,
                        isEnabled = node.isEnabled
                    )
                )
            }
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                traverseNode(child, elements, screenWidth, screenHeight, depth + 1, maxDepth)
            }
        }
    }

    // =========================================================================
    // 2. Gesture Dispatching & Simulation
    // =========================================================================

    /**
     * Performs a tap at screen coordinates (x, y).
     */
    fun performTap(
        x: Float,
        y: Float,
        onComplete: () -> Unit,
        onError: (String) -> Unit
    ) {
        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0, 50)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                onComplete()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                onError("Tap gesture cancelled by system at ($x, $y)")
            }
        }, null)
    }

    /**
     * Performs a swipe gesture from (startX, startY) to (endX, endY).
     */
    fun performSwipe(
        startX: Float,
        startY: Float,
        endX: Float,
        endY: Float,
        durationMs: Long = 300L,
        onComplete: () -> Unit,
        onError: (String) -> Unit
    ) {
        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs.coerceIn(50L, 2000L))
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                onComplete()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                onError("Swipe gesture cancelled by system from ($startX, $startY) to ($endX, $endY)")
            }
        }, null)
    }

    // =========================================================================
    // 3. Text Input & Focus
    // =========================================================================

    /**
     * Injects text into an editable view or the currently focused input field.
     */
    fun inputText(text: String, targetNodeId: Int? = null): Boolean {
        val root = rootInActiveWindow ?: return false

        // If targetNodeId is specified, search for the target node
        if (targetNodeId != null && targetNodeId > 0) {
            val targetNode = findNodeByIndex(root, targetNodeId)
            if (targetNode != null && targetNode.isEditable) {
                val arguments = Bundle().apply {
                    putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
                }
                val success = targetNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
                if (success) return true
            }
        }

        // Fallback 1: Find focused editable node
        val focusedNode = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        if (focusedNode != null && focusedNode.isEditable) {
            val arguments = Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
            }
            val success = focusedNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
            if (success) return true
        }

        // Fallback 2: Search any editable node in window
        val editableNodes = mutableListOf<AccessibilityNodeInfo>()
        findEditableNodes(root, editableNodes)
        if (editableNodes.isNotEmpty()) {
            val target = editableNodes.first()
            val arguments = Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
            }
            return target.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
        }

        // Fallback 3: Clipboard paste
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        if (clipboard != null) {
            clipboard.setPrimaryClip(ClipData.newPlainText("const_ai_input", text))
            focusedNode?.performAction(AccessibilityNodeInfo.ACTION_PASTE)
            return true
        }

        return false
    }

    private fun findNodeByIndex(root: AccessibilityNodeInfo, targetId: Int): AccessibilityNodeInfo? {
        val counter = AtomicInteger(1)
        return searchNodeRecursive(root, targetId, counter)
    }

    private fun searchNodeRecursive(
        node: AccessibilityNodeInfo?,
        targetId: Int,
        counter: AtomicInteger
    ): AccessibilityNodeInfo? {
        if (node == null) return null

        val isInteractive = node.isClickable || node.isEditable || node.isScrollable ||
                !node.text.isNullOrEmpty() || !node.contentDescription.isNullOrEmpty()

        if (node.isVisibleToUser && isInteractive) {
            val currentId = counter.getAndIncrement()
            if (currentId == targetId) return node
        }

        for (i in 0 until node.childCount) {
            val result = searchNodeRecursive(node.getChild(i), targetId, counter)
            if (result != null) return result
        }
        return null
    }

    private fun findEditableNodes(node: AccessibilityNodeInfo?, list: MutableList<AccessibilityNodeInfo>) {
        if (node == null) return
        if (node.isVisibleToUser && node.isEditable) {
            list.add(node)
        }
        for (i in 0 until node.childCount) {
            findEditableNodes(node.getChild(i), list)
        }
    }

    // =========================================================================
    // 4. Global Navigation Actions
    // =========================================================================

    /**
     * Executes global system button actions (Back, Home, Recents, Notifications, Quick Settings, Screenshot).
     */
    fun pressGlobalAction(actionName: String): Boolean {
        val actionCode = when (actionName.lowercase()) {
            "back", "press_back" -> GLOBAL_ACTION_BACK
            "home", "press_home" -> GLOBAL_ACTION_HOME
            "recents", "press_recents" -> GLOBAL_ACTION_RECENTS
            "notifications" -> GLOBAL_ACTION_NOTIFICATIONS
            "quick_settings" -> GLOBAL_ACTION_QUICK_SETTINGS
            "screenshot", "take_screenshot" -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    GLOBAL_ACTION_TAKE_SCREENSHOT
                } else {
                    return false
                }
            }
            else -> return false
        }
        return performGlobalAction(actionCode)
    }

    /**
     * Performs scroll forward or backward on scrollable active nodes.
     */
    fun scroll(direction: String, targetNodeId: Int? = null): Boolean {
        val root = rootInActiveWindow ?: return false
        val action = if (direction.equals("backward", ignoreCase = true) || direction.equals("up", ignoreCase = true)) {
            AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
        } else {
            AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
        }

        if (targetNodeId != null && targetNodeId > 0) {
            val target = findNodeByIndex(root, targetNodeId)
            if (target != null && target.isScrollable) {
                return target.performAction(action)
            }
        }

        // Find any scrollable node
        val scrollableNodes = mutableListOf<AccessibilityNodeInfo>()
        fun findScrollables(node: AccessibilityNodeInfo?) {
            if (node == null) return
            if (node.isVisibleToUser && node.isScrollable) {
                scrollableNodes.add(node)
            }
            for (i in 0 until node.childCount) {
                findScrollables(node.getChild(i))
            }
        }
        findScrollables(root)

        for (node in scrollableNodes) {
            if (node.performAction(action)) {
                return true
            }
        }
        return false
    }
}
