package com.constai.mobile.device

import android.content.Context
import android.os.Environment
import android.os.StatFs
import android.util.Log
import java.io.File

/**
 * JunkCleanerHelper - Scans and cleans internal and external storage for junk cache,
 * temporary files, obsolete APK installers, and empty folders.
 */
class JunkCleanerHelper(private val context: Context) {

    companion object {
        private const val TAG = "ConstAI_JunkCleaner"
        private val JUNK_EXTENSIONS = setOf("tmp", "temp", "log", "bak", "crdownload", "dmp")
    }

    /**
     * Scans storage for junk files and computes storage metrics.
     */
    fun scanJunkStorage(): Map<String, Any> {
        val junkFiles = mutableListOf<Map<String, Any>>()
        var totalJunkBytes = 0L

        // 1. Calculate Storage Metrics
        val dataDir = Environment.getDataDirectory()
        val stat = StatFs(dataDir.path)
        val totalStorageBytes = stat.totalBytes
        val freeStorageBytes = stat.availableBytes

        // 2. Scan Internal Cache
        context.cacheDir?.let { cacheDir ->
            val (bytes, items) = scanDirectoryForJunk(cacheDir, "cache")
            totalJunkBytes += bytes
            junkFiles.addAll(items)
        }

        // 3. Scan Code Cache
        context.codeCacheDir?.let { codeCacheDir ->
            val (bytes, items) = scanDirectoryForJunk(codeCacheDir, "cache")
            totalJunkBytes += bytes
            junkFiles.addAll(items)
        }

        // 4. Scan External Cache Directories
        context.externalCacheDirs?.filterNotNull()?.forEach { extCache ->
            val (bytes, items) = scanDirectoryForJunk(extCache, "cache")
            totalJunkBytes += bytes
            junkFiles.addAll(items)
        }

        // 5. Scan Downloads Directory for Obsolete APKs and Temporary Files
        try {
            val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (downloadDir != null && downloadDir.exists() && downloadDir.isDirectory) {
                downloadDir.listFiles()?.forEach { file ->
                    if (file.isFile) {
                        val extension = file.extension.lowercase()
                        if (extension == "apk") {
                            totalJunkBytes += file.length()
                            junkFiles.add(
                                mapOf(
                                    "path" to file.absolutePath,
                                    "fileName" to file.name,
                                    "sizeBytes" to file.length(),
                                    "category" to "apk_installer"
                                )
                            )
                        } else if (JUNK_EXTENSIONS.contains(extension)) {
                            totalJunkBytes += file.length()
                            junkFiles.add(
                                mapOf(
                                    "path" to file.absolutePath,
                                    "fileName" to file.name,
                                    "sizeBytes" to file.length(),
                                    "category" to "temp_file"
                                )
                            )
                        }
                    } else if (file.isDirectory && isDirectoryEmpty(file)) {
                        junkFiles.add(
                            mapOf(
                                "path" to file.absolutePath,
                                "fileName" to file.name,
                                "sizeBytes" to 0L,
                                "category" to "empty_folder"
                            )
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scanning download directory", e)
        }

        // 6. Scan DCIM/Thumbnails if accessible
        try {
            val dcimDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM)
            val thumbDir = File(dcimDir, ".thumbnails")
            if (thumbDir.exists() && thumbDir.isDirectory) {
                val (bytes, items) = scanDirectoryForJunk(thumbDir, "cache")
                totalJunkBytes += bytes
                junkFiles.addAll(items)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scanning thumbnails directory", e)
        }

        return mapOf(
            "totalStorageBytes" to totalStorageBytes,
            "freeStorageBytes" to freeStorageBytes,
            "junkTotalBytes" to totalJunkBytes,
            "junkFiles" to junkFiles,
            "scannedAt" to System.currentTimeMillis()
        )
    }

    /**
     * Cleans junk files. If targetPaths is specified, only deletes those files.
     * Otherwise, cleans all scanned app caches and temporary files.
     */
    fun cleanJunkFiles(targetPaths: List<String>? = null): Map<String, Any> {
        var deletedCount = 0
        var totalFreedBytes = 0L

        if (!targetPaths.isNullOrEmpty()) {
            for (path in targetPaths) {
                try {
                    val file = File(path)
                    if (file.exists()) {
                        val size = if (file.isFile) file.length() else getFolderSize(file)
                        if (deleteRecursively(file)) {
                            deletedCount++
                            totalFreedBytes += size
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to delete path: $path", e)
                }
            }
        } else {
            // Clean internal cache
            context.cacheDir?.let { dir ->
                dir.listFiles()?.forEach { file ->
                    val size = if (file.isFile) file.length() else getFolderSize(file)
                    if (deleteRecursively(file)) {
                        deletedCount++
                        totalFreedBytes += size
                    }
                }
            }

            // Clean external cache
            context.externalCacheDirs?.filterNotNull()?.forEach { dir ->
                dir.listFiles()?.forEach { file ->
                    val size = if (file.isFile) file.length() else getFolderSize(file)
                    if (deleteRecursively(file)) {
                        deletedCount++
                        totalFreedBytes += size
                    }
                }
            }
        }

        return mapOf(
            "deletedCount" to deletedCount,
            "freedBytes" to totalFreedBytes,
            "status" to "success"
        )
    }

    private fun scanDirectoryForJunk(directory: File, category: String): Pair<Long, List<Map<String, Any>>> {
        var totalBytes = 0L
        val items = mutableListOf<Map<String, Any>>()

        try {
            if (directory.exists() && directory.isDirectory) {
                directory.listFiles()?.forEach { file ->
                    if (file.isFile) {
                        val len = file.length()
                        totalBytes += len
                        items.add(
                            mapOf(
                                "path" to file.absolutePath,
                                "fileName" to file.name,
                                "sizeBytes" to len,
                                "category" to category
                            )
                        )
                    } else if (file.isDirectory) {
                        val (nestedBytes, nestedItems) = scanDirectoryForJunk(file, category)
                        totalBytes += nestedBytes
                        items.addAll(nestedItems)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scanning directory: ${directory.absolutePath}", e)
        }

        return Pair(totalBytes, items)
    }

    private fun isDirectoryEmpty(directory: File): Boolean {
        return directory.isDirectory && (directory.listFiles()?.isEmpty() == true)
    }

    private fun getFolderSize(directory: File): Long {
        var length = 0L
        try {
            val files = directory.listFiles() ?: return 0L
            for (file in files) {
                length += if (file.isFile) file.length() else getFolderSize(file)
            }
        } catch (e: Exception) {
            // Ignore
        }
        return length
    }

    private fun deleteRecursively(file: File): Boolean {
        return try {
            if (file.isDirectory) {
                file.listFiles()?.forEach { child ->
                    deleteRecursively(child)
                }
            }
            file.delete()
        } catch (e: Exception) {
            false
        }
    }
}
