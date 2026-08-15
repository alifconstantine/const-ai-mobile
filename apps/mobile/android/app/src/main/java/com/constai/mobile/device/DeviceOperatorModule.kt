package com.constai.mobile.device

import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * DeviceOperatorModule - React Native Bridge Module for direct on-device Android operations.
 * Exposes Contacts, MediaStore, Junk Cleaner, PackageManager, and Hardware APIs to JavaScript.
 */
class DeviceOperatorModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.IO)

    private val contactsHelper by lazy { ContactsHelper(reactContext) }
    private val mediaHelper by lazy { MediaHelper(reactContext) }
    private val junkCleanerHelper by lazy { JunkCleanerHelper(reactContext) }
    private val appManagerHelper by lazy { AppManagerHelper(reactContext) }
    private val hardwareHelper by lazy { HardwareHelper(reactContext) }

    override fun getName(): String = "DeviceOperator"

    // ==========================================
    // 1. Unified Dispatcher Methods
    // ==========================================

    @ReactMethod
    fun manageContacts(args: ReadableMap, promise: Promise) {
        moduleScope.launch {
            try {
                val action = args.getString("action") ?: "get_all"
                when (action) {
                    "get_all" -> {
                        val query = if (args.hasKey("query")) args.getString("query") else null
                        val contacts = contactsHelper.getContacts(query)
                        promise.resolve(toWritableArray(contacts))
                    }
                    "search" -> {
                        val query = args.getString("query") ?: ""
                        val contacts = contactsHelper.searchContacts(query)
                        promise.resolve(toWritableArray(contacts))
                    }
                    "add" -> {
                        val contactObj = args.getMap("contact")
                            ?: throw IllegalArgumentException("Contact details missing.")
                        val name = contactObj.getString("name") ?: ""
                        val phone = contactObj.getString("phoneNumber") ?: ""
                        val email = if (contactObj.hasKey("email")) contactObj.getString("email") else null
                        val id = contactsHelper.addContact(name, phone, email)
                        val result = Arguments.createMap().apply {
                            putBoolean("success", true)
                            putString("contactId", id)
                        }
                        promise.resolve(result)
                    }
                    "delete" -> {
                        val targetId = if (args.hasKey("targetContactId")) args.getString("targetContactId") else null
                        val targetName = if (args.hasKey("targetContactName")) args.getString("targetContactName") else null
                        val success = contactsHelper.deleteContact(targetId, targetName)
                        val result = Arguments.createMap().apply {
                            putBoolean("success", success)
                        }
                        promise.resolve(result)
                    }
                    else -> promise.reject("INVALID_ACTION", "Unknown contact action: $action")
                }
            } catch (e: Exception) {
                promise.reject("CONTACTS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun manageStorage(args: ReadableMap, promise: Promise) {
        moduleScope.launch {
            try {
                val action = args.getString("action") ?: "scan_junk"
                when (action) {
                    "scan_junk" -> {
                        val scanResult = junkCleanerHelper.scanJunkStorage()
                        promise.resolve(toWritableMap(scanResult))
                    }
                    "clean_junk" -> {
                        val targetPaths = if (args.hasKey("targetPaths")) {
                            val arr = args.getArray("targetPaths")
                            (0 until (arr?.size() ?: 0)).mapNotNull { arr?.getString(it) }
                        } else null
                        val cleanResult = junkCleanerHelper.cleanJunkFiles(targetPaths)
                        promise.resolve(toWritableMap(cleanResult))
                    }
                    "scan_duplicates" -> {
                        val duplicates = mediaHelper.scanDuplicatePhotos()
                        promise.resolve(toWritableArray(duplicates))
                    }
                    "scan_screenshots" -> {
                        val days = if (args.hasKey("olderThanDays")) args.getInt("olderThanDays") else 0
                        val screenshots = mediaHelper.scanScreenshots(days)
                        promise.resolve(toWritableArray(screenshots))
                    }
                    "delete_photos" -> {
                        val targetIds = if (args.hasKey("targetPhotoIds")) {
                            val arr = args.getArray("targetPhotoIds")
                            (0 until (arr?.size() ?: 0)).mapNotNull { arr?.getString(it) }
                        } else emptyList()
                        val deleteResult = mediaHelper.deletePhotos(targetIds)
                        promise.resolve(toWritableMap(deleteResult))
                    }
                    else -> promise.reject("INVALID_ACTION", "Unknown storage action: $action")
                }
            } catch (e: Exception) {
                promise.reject("STORAGE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun manageApps(args: ReadableMap, promise: Promise) {
        moduleScope.launch {
            try {
                val action = args.getString("action") ?: "list_installed"
                when (action) {
                    "list_installed" -> {
                        val query = if (args.hasKey("query")) args.getString("query") else null
                        val apps = appManagerHelper.getInstalledApps(query, includeSystem = false)
                        promise.resolve(toWritableArray(apps))
                    }
                    "launch" -> {
                        val packageName = args.getString("packageName") ?: ""
                        val launched = appManagerHelper.launchApp(packageName)
                        val result = Arguments.createMap().apply {
                            putBoolean("success", launched)
                        }
                        promise.resolve(result)
                    }
                    else -> promise.reject("INVALID_ACTION", "Unknown app action: $action")
                }
            } catch (e: Exception) {
                promise.reject("APPS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun controlHardware(args: ReadableMap, promise: Promise) {
        moduleScope.launch {
            try {
                val target = args.getString("target") ?: ""
                val action = args.getString("action") ?: "get_status"
                when (target) {
                    "flashlight" -> {
                        when (action) {
                            "turn_on" -> {
                                val state = hardwareHelper.toggleFlashlight(true)
                                promise.resolve(Arguments.createMap().apply { putBoolean("flashlightOn", state) })
                            }
                            "turn_off" -> {
                                val state = hardwareHelper.toggleFlashlight(false)
                                promise.resolve(Arguments.createMap().apply { putBoolean("flashlightOn", state) })
                            }
                            "toggle" -> {
                                val state = hardwareHelper.toggleFlashlight(null)
                                promise.resolve(Arguments.createMap().apply { putBoolean("flashlightOn", state) })
                            }
                            else -> promise.reject("INVALID_ACTION", "Flashlight action: $action")
                        }
                    }
                    "volume" -> {
                        val level = if (args.hasKey("level")) args.getInt("level") else 50
                        val res = hardwareHelper.setVolume("music", level)
                        promise.resolve(toWritableMap(res))
                    }
                    "battery" -> {
                        val res = hardwareHelper.getBatteryLevel()
                        promise.resolve(toWritableMap(res))
                    }
                    "wifi" -> {
                        val res = hardwareHelper.getWifiStatus()
                        promise.resolve(toWritableMap(res))
                    }
                    else -> promise.reject("INVALID_TARGET", "Unknown hardware target: $target")
                }
            } catch (e: Exception) {
                promise.reject("HARDWARE_ERROR", e.message, e)
            }
        }
    }

    // ==========================================
    // 2. Granular Direct Methods
    // ==========================================

    @ReactMethod
    fun getContacts(query: String?, promise: Promise) {
        moduleScope.launch {
            try {
                val contacts = contactsHelper.getContacts(query)
                promise.resolve(toWritableArray(contacts))
            } catch (e: Exception) {
                promise.reject("CONTACTS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun searchContacts(query: String, promise: Promise) {
        moduleScope.launch {
            try {
                val contacts = contactsHelper.searchContacts(query)
                promise.resolve(toWritableArray(contacts))
            } catch (e: Exception) {
                promise.reject("CONTACTS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun addContact(name: String, phoneNumber: String, email: String?, promise: Promise) {
        moduleScope.launch {
            try {
                val id = contactsHelper.addContact(name, phoneNumber, email)
                val result = Arguments.createMap().apply {
                    putBoolean("success", true)
                    putString("contactId", id)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("CONTACTS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun deleteContact(contactId: String?, contactName: String?, promise: Promise) {
        moduleScope.launch {
            try {
                val success = contactsHelper.deleteContact(contactId, contactName)
                val result = Arguments.createMap().apply {
                    putBoolean("success", success)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("CONTACTS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun scanDuplicatePhotos(promise: Promise) {
        moduleScope.launch {
            try {
                val duplicates = mediaHelper.scanDuplicatePhotos()
                promise.resolve(toWritableArray(duplicates))
            } catch (e: Exception) {
                promise.reject("MEDIA_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun scanScreenshots(olderThanDays: Int, promise: Promise) {
        moduleScope.launch {
            try {
                val screenshots = mediaHelper.scanScreenshots(olderThanDays)
                promise.resolve(toWritableArray(screenshots))
            } catch (e: Exception) {
                promise.reject("MEDIA_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun deletePhotos(photoIds: ReadableArray, promise: Promise) {
        moduleScope.launch {
            try {
                val ids = (0 until photoIds.size()).mapNotNull { photoIds.getString(it) }
                val result = mediaHelper.deletePhotos(ids)
                promise.resolve(toWritableMap(result))
            } catch (e: Exception) {
                promise.reject("MEDIA_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun scanJunkStorage(promise: Promise) {
        moduleScope.launch {
            try {
                val result = junkCleanerHelper.scanJunkStorage()
                promise.resolve(toWritableMap(result))
            } catch (e: Exception) {
                promise.reject("STORAGE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun cleanJunkFiles(targetPaths: ReadableArray?, promise: Promise) {
        moduleScope.launch {
            try {
                val paths = if (targetPaths != null) {
                    (0 until targetPaths.size()).mapNotNull { targetPaths.getString(it) }
                } else null
                val result = junkCleanerHelper.cleanJunkFiles(paths)
                promise.resolve(toWritableMap(result))
            } catch (e: Exception) {
                promise.reject("STORAGE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getInstalledApps(query: String?, includeSystem: Boolean, promise: Promise) {
        moduleScope.launch {
            try {
                val apps = appManagerHelper.getInstalledApps(query, includeSystem)
                promise.resolve(toWritableArray(apps))
            } catch (e: Exception) {
                promise.reject("APPS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun launchApp(packageName: String, promise: Promise) {
        moduleScope.launch {
            try {
                val success = appManagerHelper.launchApp(packageName)
                val result = Arguments.createMap().apply {
                    putBoolean("success", success)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("APPS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun toggleFlashlight(state: Boolean?, promise: Promise) {
        moduleScope.launch {
            try {
                val isOn = hardwareHelper.toggleFlashlight(state)
                val result = Arguments.createMap().apply {
                    putBoolean("flashlightOn", isOn)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("HARDWARE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun setVolume(streamType: String?, level: Int, promise: Promise) {
        moduleScope.launch {
            try {
                val res = hardwareHelper.setVolume(streamType, level)
                promise.resolve(toWritableMap(res))
            } catch (e: Exception) {
                promise.reject("HARDWARE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getBatteryLevel(promise: Promise) {
        moduleScope.launch {
            try {
                val res = hardwareHelper.getBatteryLevel()
                promise.resolve(toWritableMap(res))
            } catch (e: Exception) {
                promise.reject("HARDWARE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getWifiStatus(promise: Promise) {
        moduleScope.launch {
            try {
                val res = hardwareHelper.getWifiStatus()
                promise.resolve(toWritableMap(res))
            } catch (e: Exception) {
                promise.reject("HARDWARE_ERROR", e.message, e)
            }
        }
    }

    // ==========================================
    // 3. React Native Type Conversion Helpers
    // ==========================================

    @Suppress("UNCHECKED_CAST")
    private fun toWritableMap(map: Map<String, Any?>): WritableMap {
        val writableMap = Arguments.createMap()
        for ((key, value) in map) {
            when (value) {
                null -> writableMap.putNull(key)
                is Boolean -> writableMap.putBoolean(key, value)
                is Int -> writableMap.putInt(key, value)
                is Long -> writableMap.putDouble(key, value.toDouble())
                is Double -> writableMap.putDouble(key, value)
                is Float -> writableMap.putDouble(key, value.toDouble())
                is String -> writableMap.putString(key, value)
                is Map<*, *> -> writableMap.putMap(key, toWritableMap(value as Map<String, Any?>))
                is List<*> -> writableMap.putArray(key, toWritableArray(value as List<Any?>))
                else -> writableMap.putString(key, value.toString())
            }
        }
        return writableMap
    }

    @Suppress("UNCHECKED_CAST")
    private fun toWritableArray(list: List<Any?>): WritableArray {
        val writableArray = Arguments.createArray()
        for (value in list) {
            when (value) {
                null -> writableArray.pushNull()
                is Boolean -> writableArray.pushBoolean(value)
                is Int -> writableArray.pushInt(value)
                is Long -> writableArray.pushDouble(value.toDouble())
                is Double -> writableArray.pushDouble(value)
                is Float -> writableArray.pushDouble(value.toDouble())
                is String -> writableArray.pushString(value)
                is Map<*, *> -> writableArray.pushMap(toWritableMap(value as Map<String, Any?>))
                is List<*> -> writableArray.pushArray(toWritableArray(value as List<Any?>))
                else -> writableArray.pushString(value.toString())
            }
        }
        return writableArray
    }
}
