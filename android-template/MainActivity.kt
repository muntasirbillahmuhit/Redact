package com.redact.app

import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.DownloadListener
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request POST_NOTIFICATIONS on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                    1001
                )
            }
        }

        setupBridge()
    }

    override fun onStart() {
        super.onStart()
        setupBridge()
    }

    override fun onResume() {
        super.onResume()
        setupBridge()
    }

    private var bridgeRegistered = false

    private fun setupBridge() {
        val webView = bridge?.webView ?: return
        if (bridgeRegistered) return
        bridgeRegistered = true

        runOnUiThread {
            try {
                webView.settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    allowFileAccess = true
                }

                val downloadBridge = AndroidDownloadBridge(this, webView)
                webView.addJavascriptInterface(downloadBridge, "AndroidDownloadBridge")

                webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
                    downloadBridge.handleHttpDownload(url, userAgent, contentDisposition, mimetype)
                })

                Log.d("RedactDownload", "AndroidDownloadBridge registered on WebView successfully")
            } catch (e: Exception) {
                Log.e("RedactDownload", "Error attaching AndroidDownloadBridge", e)
            }
        }
    }
}
