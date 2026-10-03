package com.redact.app

import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.URLUtil
import android.webkit.WebView
import android.widget.Toast
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

/**
 * JavaScript interface bridge for Android WebView / Capacitor to handle system-level downloads
 * via MediaStore (API 29+) or legacy public storage (API < 29) and DownloadManager for HTTP URLs.
 */
class AndroidDownloadBridge(
    private val context: Context,
    private val webView: WebView
) {
    private val tag = "RedactDownload"
    private val mainHandler = Handler(Looper.getMainLooper())
    private var chunkStream: ByteArrayOutputStream? = null
    private var chunkFilename: String = ""
    private var chunkMimeType: String = ""

    /**
     * Called directly from JavaScript to save a single Base64 encoded file.
     */
    @JavascriptInterface
    fun saveBase64(base64Data: String?, filename: String?, mimeType: String?) {
        try {
            if (base64Data.isNullOrEmpty()) {
                Log.e(tag, "saveBase64 received empty data")
                notifyJs("Download failed: empty file data")
                return
            }
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            saveBytesToDownloads(
                bytes = bytes,
                filename = filename ?: "redact_${System.currentTimeMillis()}.png",
                mimeType = mimeType ?: "image/png"
            )
        } catch (e: Exception) {
            Log.e(tag, "Error decoding or saving base64 data", e)
            notifyJs("Failed saving file: ${e.message}")
        }
    }

    /**
     * Prepares for a multi-chunk stream download (useful for large files/ZIPs).
     */
    @JavascriptInterface
    fun startDownload(filename: String?, mimeType: String?, totalChunks: Int) {
        Log.d(tag, "startDownload: $filename ($totalChunks chunks planned)")
        chunkFilename = filename ?: "redact_${System.currentTimeMillis()}.png"
        chunkMimeType = mimeType ?: "application/octet-stream"
        chunkStream = ByteArrayOutputStream()
    }

    /**
     * Appends a Base64 encoded chunk to the in-memory stream.
     */
    @JavascriptInterface
    fun appendChunk(base64Chunk: String?) {
        try {
            if (!base64Chunk.isNullOrEmpty() && chunkStream != null) {
                val bytes = Base64.decode(base64Chunk, Base64.DEFAULT)
                chunkStream?.write(bytes)
            }
        } catch (e: Exception) {
            Log.e(tag, "Error appending chunk", e)
        }
    }

    /**
     * Finalizes chunked download and writes to public Downloads.
     */
    @JavascriptInterface
    fun finishDownload() {
        try {
            val bytes = chunkStream?.toByteArray()
            chunkStream?.close()
            chunkStream = null
            if (bytes != null && bytes.isNotEmpty()) {
                saveBytesToDownloads(bytes, chunkFilename, chunkMimeType)
            } else {
                notifyJs("Download failed: empty stream")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error in finishDownload", e)
            notifyJs("Failed to complete download: ${e.message}")
        }
    }

    /**
     * Handles traditional HTTP/HTTPS downloads via Android DownloadManager.
     */
    fun handleHttpDownload(
        url: String?,
        userAgent: String?,
        contentDisposition: String?,
        mimetype: String?
    ) {
        try {
            if (url == null || url.startsWith("data:") || url.startsWith("blob:")) return

            var filename = URLUtil.guessFileName(url, contentDisposition, mimetype)
            if (filename.isNullOrBlank()) {
                filename = "download_${System.currentTimeMillis()}"
            }

            val request = DownloadManager.Request(Uri.parse(url)).apply {
                if (!mimetype.isNullOrEmpty()) setMimeType(mimetype)
                if (!userAgent.isNullOrEmpty()) addRequestHeader("User-Agent", userAgent)
                setTitle(filename)
                setDescription("Downloading $filename")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
            }

            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as? DownloadManager
            dm?.enqueue(request)

            mainHandler.post {
                Toast.makeText(context, "Download started: $filename", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e(tag, "HTTP download via DownloadManager failed", e)
            mainHandler.post {
                Toast.makeText(context, "Download failed: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    /**
     * Saves raw bytes directly to public Downloads folder.
     * Uses MediaStore.Downloads on Android 10+ (API 29+) with no storage permissions required.
     */
    private fun saveBytesToDownloads(bytes: ByteArray, filename: String, mimeType: String) {
        val safeName = filename.ifBlank { "redact_${System.currentTimeMillis()}.png" }
        val safeMime = mimeType.ifBlank { "application/octet-stream" }

        try {
            var success = false
            var savedPath = ""

            // Android 10+ (API 29+): MediaStore Scoped Storage
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, safeName)
                    put(MediaStore.Downloads.MIME_TYPE, safeMime)
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }

                val collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                val itemUri = context.contentResolver.insert(collection, values)

                if (itemUri != null) {
                    context.contentResolver.openOutputStream(itemUri)?.use { out ->
                        out.write(bytes)
                        out.flush()
                        success = true
                    }
                    values.clear()
                    values.put(MediaStore.Downloads.IS_PENDING, 0)
                    context.contentResolver.update(itemUri, values, null, null)
                    savedPath = "Downloads/$safeName"
                }
            } else {
                // Legacy Android (API < 29)
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs()
                }
                val outFile = File(downloadsDir, safeName)
                FileOutputStream(outFile).use { fos ->
                    fos.write(bytes)
                    fos.flush()
                    success = true
                    savedPath = outFile.absolutePath
                }

                MediaScannerConnection.scanFile(
                    context,
                    arrayOf(outFile.absolutePath),
                    arrayOf(safeMime),
                    null
                )
            }

            if (success) {
                Log.i(tag, "Successfully saved to $savedPath (${bytes.size} bytes)")
                mainHandler.post {
                    Toast.makeText(context, "Saved to Downloads: $safeName", Toast.LENGTH_LONG).show()
                }
                notifyJs("Saved $safeName to Downloads")
            } else {
                Log.e(tag, "Failed to write file stream")
                notifyJs("Failed saving $safeName")
            }
        } catch (e: Exception) {
            Log.e(tag, "Failed saving bytes to Downloads", e)
            mainHandler.post {
                Toast.makeText(context, "Error saving file: ${e.message}", Toast.LENGTH_LONG).show()
            }
            notifyJs("Error saving $safeName: ${e.message}")
        }
    }

    private fun notifyJs(message: String) {
        val escaped = message.replace("'", "\\'")
        webView.post {
            webView.evaluateJavascript("if(typeof toast==='function')toast('$escaped');", null)
        }
    }
}
