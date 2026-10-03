package com.redact.app;

import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.DownloadListener;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "RedactDownload";
    private boolean bridgeRegistered = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request POST_NOTIFICATIONS on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{android.Manifest.permission.POST_NOTIFICATIONS},
                        1001);
            }
        }

        setupBridge();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupBridge();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupBridge();
    }

    private void setupBridge() {
        if (bridgeRegistered || bridge == null) return;
        final WebView webView = bridge.getWebView();
        if (webView == null) return;
        bridgeRegistered = true;

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    webView.getSettings().setJavaScriptEnabled(true);
                    webView.getSettings().setDomStorageEnabled(true);
                    webView.getSettings().setAllowFileAccess(true);

                    final AndroidDownloadBridge downloadBridge = new AndroidDownloadBridge(MainActivity.this, webView);
                    webView.addJavascriptInterface(downloadBridge, "AndroidDownloadBridge");

                    webView.setDownloadListener(new DownloadListener() {
                        @Override
                        public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                            downloadBridge.handleHttpDownload(url, userAgent, contentDisposition, mimetype);
                        }
                    });

                    Log.d(TAG, "AndroidDownloadBridge registered on WebView successfully");
                } catch (Exception e) {
                    Log.e(TAG, "Error attaching AndroidDownloadBridge", e);
                }
            }
        });
    }
}
