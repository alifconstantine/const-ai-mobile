package com.constai.mobile.device

import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract
import android.util.Log

/**
 * ContactsHelper - Manages device contacts via Android ContactsContract.
 * Supports querying, full-text searching, adding, and deleting contacts.
 */
class ContactsHelper(private val context: Context) {

    companion object {
        private const val TAG = "ConstAI_ContactsHelper"
    }

    private val contentResolver: ContentResolver
        get() = context.contentResolver

    /**
     * Retrieves contacts with optional query filtering and result limit.
     */
    fun getContacts(query: String? = null, limit: Int = 100): List<Map<String, Any>> {
        val contactsMap = LinkedHashMap<String, MutableMap<String, Any>>()

        val selection = if (!query.isNullOrBlank()) {
            "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} LIKE ? OR ${ContactsContract.CommonDataKinds.Phone.NUMBER} LIKE ?"
        } else {
            null
        }

        val selectionArgs = if (!query.isNullOrBlank()) {
            val q = "%$query%"
            arrayOf(q, q)
        } else {
            null
        }

        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.PHOTO_URI
        )

        val sortOrder = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} ASC LIMIT $limit"

        var cursor: Cursor? = null
        try {
            cursor = contentResolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )

            cursor?.let {
                val idIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                val nameIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                val numberIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                val photoIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_URI)

                while (it.moveToNext()) {
                    val id = if (idIdx != -1) it.getString(idIdx) ?: "" else ""
                    val name = if (nameIdx != -1) it.getString(nameIdx) ?: "Unknown" else "Unknown"
                    val number = if (numberIdx != -1) it.getString(numberIdx) ?: "" else ""
                    val photoUri = if (photoIdx != -1) it.getString(photoIdx) else null

                    if (id.isNotEmpty()) {
                        if (!contactsMap.containsKey(id)) {
                            val contactEntry = mutableMapOf<String, Any>(
                                "id" to id,
                                "displayName" to name,
                                "phoneNumbers" to mutableListOf<String>(),
                                "emails" to mutableListOf<String>()
                            )
                            if (photoUri != null) {
                                contactEntry["photoUri"] = photoUri
                            }
                            contactsMap[id] = contactEntry
                        }

                        if (number.isNotEmpty()) {
                            @Suppress("UNCHECKED_CAST")
                            val phoneList = contactsMap[id]?.get("phoneNumbers") as? MutableList<String>
                            if (phoneList != null && !phoneList.contains(number)) {
                                phoneList.add(number)
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching phone contacts", e)
        } finally {
            cursor?.close()
        }

        // Fetch corresponding emails for found contacts
        if (contactsMap.isNotEmpty()) {
            fetchEmailsForContacts(contactsMap)
        }

        return contactsMap.values.toList()
    }

    /**
     * Search contacts by display name or phone number.
     */
    fun searchContacts(query: String): List<Map<String, Any>> {
        return getContacts(query = query, limit = 50)
    }

    /**
     * Adds a new contact to device storage.
     * Returns the created Raw Contact ID as String.
     */
    fun addContact(name: String, phoneNumber: String, email: String? = null): String {
        val ops = ArrayList<ContentProviderOperation>()

        // 1. Insert RawContact
        val rawContactInsertIndex = ops.size
        ops.add(
            ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI)
                .withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null)
                .withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null)
                .build()
        )

        // 2. Insert Display Name
        ops.add(
            ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, rawContactInsertIndex)
                .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE)
                .withValue(ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME, name)
                .build()
        )

        // 3. Insert Phone Number
        ops.add(
            ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, rawContactInsertIndex)
                .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE)
                .withValue(ContactsContract.CommonDataKinds.Phone.NUMBER, phoneNumber)
                .withValue(ContactsContract.CommonDataKinds.Phone.TYPE, ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE)
                .build()
        )

        // 4. Insert Email if provided
        if (!email.isNullOrBlank()) {
            ops.add(
                ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                    .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, rawContactInsertIndex)
                    .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE)
                    .withValue(ContactsContract.CommonDataKinds.Email.ADDRESS, email)
                    .withValue(ContactsContract.CommonDataKinds.Email.TYPE, ContactsContract.CommonDataKinds.Email.TYPE_WORK)
                    .build()
            )
        }

        try {
            val results = contentResolver.applyBatch(ContactsContract.AUTHORITY, ops)
            if (results.isNotEmpty() && results[0].uri != null) {
                return results[0].uri?.lastPathSegment ?: "created"
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add contact: $name", e)
            throw RuntimeException("Failed to add contact: ${e.message}", e)
        }

        return "created"
    }

    /**
     * Deletes a contact by Contact ID or by Display Name.
     */
    fun deleteContact(contactId: String? = null, contactName: String? = null): Boolean {
        if (contactId.isNullOrBlank() && contactName.isNullOrBlank()) {
            throw IllegalArgumentException("Either contactId or contactName must be provided to delete a contact.")
        }

        try {
            var deletedRows = 0

            if (!contactId.isNullOrBlank()) {
                // Delete from RawContacts first
                deletedRows += contentResolver.delete(
                    ContactsContract.RawContacts.CONTENT_URI,
                    "${ContactsContract.RawContacts.CONTACT_ID} = ? OR ${ContactsContract.RawContacts._ID} = ?",
                    arrayOf(contactId, contactId)
                )

                // Also attempt direct delete on Contacts URI if needed
                if (deletedRows == 0) {
                    val uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_URI, contactId)
                    deletedRows = contentResolver.delete(uri, null, null)
                }
            } else if (!contactName.isNullOrBlank()) {
                // Look up contact IDs matching the given name
                val cursor = contentResolver.query(
                    ContactsContract.Contacts.CONTENT_URI,
                    arrayOf(ContactsContract.Contacts._ID),
                    "${ContactsContract.Contacts.DISPLAY_NAME} = ?",
                    arrayOf(contactName),
                    null
                )

                val idsToDelete = mutableListOf<String>()
                cursor?.use {
                    val idIdx = it.getColumnIndex(ContactsContract.Contacts._ID)
                    while (it.moveToNext()) {
                        if (idIdx != -1) {
                            it.getString(idIdx)?.let { id -> idsToDelete.add(id) }
                        }
                    }
                }

                for (id in idsToDelete) {
                    deletedRows += contentResolver.delete(
                        ContactsContract.RawContacts.CONTENT_URI,
                        "${ContactsContract.RawContacts.CONTACT_ID} = ? OR ${ContactsContract.RawContacts._ID} = ?",
                        arrayOf(id, id)
                    )
                }
            }

            return deletedRows > 0
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete contact: id=$contactId, name=$contactName", e)
            throw RuntimeException("Failed to delete contact: ${e.message}", e)
        }
    }

    private fun fetchEmailsForContacts(contactsMap: MutableMap<String, MutableMap<String, Any>>) {
        var cursor: Cursor? = null
        try {
            cursor = contentResolver.query(
                ContactsContract.CommonDataKinds.Email.CONTENT_URI,
                arrayOf(
                    ContactsContract.CommonDataKinds.Email.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Email.ADDRESS
                ),
                null,
                null,
                null
            )

            cursor?.let {
                val idIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Email.CONTACT_ID)
                val emailIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Email.ADDRESS)

                while (it.moveToNext()) {
                    val id = if (idIdx != -1) it.getString(idIdx) ?: "" else ""
                    val email = if (emailIdx != -1) it.getString(emailIdx) ?: "" else ""

                    if (id.isNotEmpty() && email.isNotEmpty() && contactsMap.containsKey(id)) {
                        @Suppress("UNCHECKED_CAST")
                        val emailList = contactsMap[id]?.get("emails") as? MutableList<String>
                        if (emailList != null && !emailList.contains(email)) {
                            emailList.add(email)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error querying emails", e)
        } finally {
            cursor?.close()
        }
    }
}
