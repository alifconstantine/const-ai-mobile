package com.constai.mobile.device

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import java.io.InputStream
import java.security.MessageDigest

/**
 * MediaHelper - Scans and manages device photos, screenshots, and duplicate media.
 * Interacts directly with Android MediaStore.
 */
class MediaHelper(private val context: Context) {

    companion object {
        private const val TAG = "ConstAI_MediaHelper"
    }

    private val contentResolver: ContentResolver
        get() = context.contentResolver

    /**
     * Scans the gallery for duplicate photos based on file size and header checksum.
     * Returns grouped duplicate photos and potential space savings.
     */
    fun scanDuplicatePhotos(): List<Map<String, Any>> {
        val photoList = mutableListOf<Map<String, Any>>()

        val projection = arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.SIZE,
            MediaStore.Images.Media.DATE_ADDED,
            MediaStore.Images.Media.WIDTH,
            MediaStore.Images.Media.HEIGHT
        )

        val sortOrder = "${MediaStore.Images.Media.SIZE} DESC, ${MediaStore.Images.Media.DATE_ADDED} DESC"

        var cursor: Cursor? = null
        try {
            cursor = contentResolver.query(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                projection,
                null,
                null,
                sortOrder
            )

            cursor?.let {
                val idIdx = it.getColumnIndex(MediaStore.Images.Media._ID)
                val nameIdx = it.getColumnIndex(MediaStore.Images.Media.DISPLAY_NAME)
                val sizeIdx = it.getColumnIndex(MediaStore.Images.Media.SIZE)
                val dateIdx = it.getColumnIndex(MediaStore.Images.Media.DATE_ADDED)
                val widthIdx = it.getColumnIndex(MediaStore.Images.Media.WIDTH)
                val heightIdx = it.getColumnIndex(MediaStore.Images.Media.HEIGHT)

                while (it.moveToNext()) {
                    val id = if (idIdx != -1) it.getLong(idIdx).toString() else ""
                    val name = if (nameIdx != -1) it.getString(nameIdx) ?: "Photo" else "Photo"
                    val size = if (sizeIdx != -1) it.getLong(sizeIdx) else 0L
                    val dateAdded = if (dateIdx != -1) it.getLong(dateIdx) else 0L
                    val width = if (widthIdx != -1) it.getInt(widthIdx) else 0
                    val height = if (heightIdx != -1) it.getInt(heightIdx) else 0

                    if (id.isNotEmpty() && size > 1024L) { // Ignore 0/micro files
                        val contentUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id.toLong())
                        photoList.add(
                            mapOf(
                                "id" to id,
                                "uri" to contentUri.toString(),
                                "fileName" to name,
                                "sizeBytes" to size,
                                "dateAdded" to dateAdded,
                                "width" to width,
                                "height" to height
                            )
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scanning photos for duplicates", e)
        } finally {
            cursor?.close()
        }

        // Group photos by size and dimensions first
        val sizeGroupMap = photoList.groupBy {
            val size = it["sizeBytes"] as? Long ?: 0L
            val width = it["width"] as? Int ?: 0
            val height = it["height"] as? Int ?: 0
            "${size}_${width}_${height}"
        }

        val duplicateGroups = mutableListOf<Map<String, Any>>()

        for ((_, group) in sizeGroupMap) {
            if (group.size > 1) {
                // If more than 1 photo has identical size and dimensions, group by content hash
                val hashGroups = group.groupBy { photoItem ->
                    computeFastChecksum(photoItem["uri"] as? String)
                }

                for ((hash, matchingPhotos) in hashGroups) {
                    if (matchingPhotos.size > 1 && hash.isNotEmpty()) {
                        val original = matchingPhotos.first()
                        val duplicates = matchingPhotos.drop(1)
                        val savingsBytes = duplicates.sumOf { (it["sizeBytes"] as? Long) ?: 0L }

                        duplicateGroups.add(
                            mapOf(
                                "originalPhoto" to original,
                                "duplicates" to duplicates,
                                "potentialSavingsBytes" to savingsBytes
                            )
                        )
                    }
                }
            }
        }

        return duplicateGroups
    }

    /**
     * Scans for screenshot photos older than specified days.
     */
    fun scanScreenshots(olderThanDays: Int = 0): List<Map<String, Any>> {
        val screenshots = mutableListOf<Map<String, Any>>()

        val projection = arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.SIZE,
            MediaStore.Images.Media.DATE_ADDED,
            MediaStore.Images.Media.WIDTH,
            MediaStore.Images.Media.HEIGHT
        )

        val currentTimeSec = System.currentTimeMillis() / 1000L
        val cutoffTimeSec = currentTimeSec - (olderThanDays.toLong() * 86400L)

        val selection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            "(${MediaStore.Images.Media.RELATIVE_PATH} LIKE ? OR ${MediaStore.Images.Media.DISPLAY_NAME} LIKE ? OR ${MediaStore.Images.Media.BUCKET_DISPLAY_NAME} LIKE ?) AND ${MediaStore.Images.Media.DATE_ADDED} <= ?"
        } else {
            "(${MediaStore.Images.Media.DATA} LIKE ? OR ${MediaStore.Images.Media.DISPLAY_NAME} LIKE ?) AND ${MediaStore.Images.Media.DATE_ADDED} <= ?"
        }

        val selectionArgs = arrayOf("%Screenshot%", "%Screenshot%", "%Screenshot%", cutoffTimeSec.toString())

        var cursor: Cursor? = null
        try {
            cursor = contentResolver.query(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                "${MediaStore.Images.Media.DATE_ADDED} DESC"
            )

            cursor?.let {
                val idIdx = it.getColumnIndex(MediaStore.Images.Media._ID)
                val nameIdx = it.getColumnIndex(MediaStore.Images.Media.DISPLAY_NAME)
                val sizeIdx = it.getColumnIndex(MediaStore.Images.Media.SIZE)
                val dateIdx = it.getColumnIndex(MediaStore.Images.Media.DATE_ADDED)
                val widthIdx = it.getColumnIndex(MediaStore.Images.Media.WIDTH)
                val heightIdx = it.getColumnIndex(MediaStore.Images.Media.HEIGHT)

                while (it.moveToNext()) {
                    val id = if (idIdx != -1) it.getLong(idIdx).toString() else ""
                    val name = if (nameIdx != -1) it.getString(nameIdx) ?: "Screenshot" else "Screenshot"
                    val size = if (sizeIdx != -1) it.getLong(sizeIdx) else 0L
                    val dateAdded = if (dateIdx != -1) it.getLong(dateIdx) else 0L
                    val width = if (widthIdx != -1) it.getInt(widthIdx) else 0
                    val height = if (heightIdx != -1) it.getInt(heightIdx) else 0

                    if (id.isNotEmpty()) {
                        val contentUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id.toLong())
                        screenshots.add(
                            mapOf(
                                "id" to id,
                                "uri" to contentUri.toString(),
                                "fileName" to name,
                                "sizeBytes" to size,
                                "dateAdded" to dateAdded,
                                "width" to width,
                                "height" to height
                            )
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scanning screenshots", e)
        } finally {
            cursor?.close()
        }

        return screenshots
    }

    /**
     * Deletes specified photos by MediaStore ID.
     */
    fun deletePhotos(photoIds: List<String>): Map<String, Any> {
        if (photoIds.isEmpty()) {
            return mapOf(
                "deletedCount" to 0,
                "freedBytes" to 0L,
                "success" to true
            )
        }

        var deletedCount = 0
        var totalFreedBytes = 0L

        for (id in photoIds) {
            try {
                val uri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id.toLong())
                
                // Get file size before deletion
                val sizeCursor = contentResolver.query(uri, arrayOf(MediaStore.Images.Media.SIZE), null, null, null)
                var fileSize = 0L
                sizeCursor?.use {
                    if (it.moveToFirst()) {
                        val sizeIdx = it.getColumnIndex(MediaStore.Images.Media.SIZE)
                        if (sizeIdx != -1) {
                            fileSize = it.getLong(sizeIdx)
                        }
                    }
                }

                val rows = contentResolver.delete(uri, null, null)
                if (rows > 0) {
                    deletedCount += rows
                    totalFreedBytes += fileSize
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error deleting photo ID: $id", e)
            }
        }

        return mapOf(
            "deletedCount" to deletedCount,
            "freedBytes" to totalFreedBytes,
            "success" to (deletedCount > 0)
        )
    }

    private fun computeFastChecksum(uriString: String?): String {
        if (uriString.isNullOrBlank()) return ""
        var stream: InputStream? = null
        return try {
            val uri = Uri.parse(uriString)
            stream = contentResolver.openInputStream(uri)
            if (stream == null) return ""

            val digest = MessageDigest.getInstance("MD5")
            val buffer = ByteArray(65536) // 64 KB sampling buffer
            var totalRead = 0
            while (totalRead < 65536) {
                val bytesRead = stream.read(buffer, totalRead, buffer.size - totalRead)
                if (bytesRead <= 0) break
                totalRead += bytesRead
            }
            if (totalRead > 0) {
                digest.update(buffer, 0, totalRead)
            }
            digest.digest().joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            ""
        } finally {
            stream?.close()
        }
    }
}
