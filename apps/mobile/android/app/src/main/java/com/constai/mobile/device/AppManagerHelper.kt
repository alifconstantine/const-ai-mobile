package com.constai.mobile.device

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.util.Log

/**
 * AppManagerHelper - Lists installed applications and launches applications via PackageManager.
 */
class AppManagerHelper(private val context: Context) {

    companion object {
        private const val TAG = "ConstAI_AppManager"
    }

    private val packageManager: PackageManager
        get() = context.packageManager

    /**
     * Lists installed applications on the device.
     */
    fun getInstalledApps(query: String? = null, includeSystem: Boolean = false): List<Map<String, Any>> {
        val appList = mutableListOf<Map<String, Any>>()

        try {
            val packages = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)

            for (appInfo in packages) {
                val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                if (!includeSystem && isSystem) {
                    continue
                }

                val appName = try {
                    packageManager.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    appInfo.packageName
                }

                val pkgName = appInfo.packageName

                // Filter by search query if provided
                if (!query.isNullOrBlank()) {
                    val q = query.lowercase()
                    if (!appName.lowercase().contains(q) && !pkgName.lowercase().contains(q)) {
                        continue
                    }
                }

                val versionName = try {
                    val pkgInfo = packageManager.getPackageInfo(pkgName, 0)
                    pkgInfo.versionName ?: ""
                } catch (e: Exception) {
                    ""
                }

                appList.add(
                    mapOf(
                        "packageName" to pkgName,
                        "appName" to appName,
                        "versionName" to versionName,
                        "isSystemApp" to isSystem
                    )
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error listing installed packages", e)
        }

        return appList.sortedBy { (it["appName"] as? String)?.lowercase() ?: "" }
    }

    /**
     * Launches an application given its package name.
     */
    fun launchApp(packageName: String): Boolean {
        if (packageName.isBlank()) {
            throw IllegalArgumentException("Package name cannot be blank.")
        }

        try {
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                return true
            } else {
                Log.w(TAG, "No launch intent found for package: $packageName")
                return false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch package: $packageName", e)
            throw RuntimeException("Failed to launch app $packageName: ${e.message}", e)
        }
    }
}
