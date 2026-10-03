package com.redact.app;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "DownloadPlugin")
public class DownloadPlugin extends Plugin {
    private static final String TAG = "RedactDownload";

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "DownloadPlugin loaded");

        // Request POST_NOTIFICATIONS on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getActivity(), android.Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(getActivity(),
                        new String[]{android.Manifest.permission.POST_NOTIFICATIONS},
                        1001);
            }
        }

        // Configure WebView and register DownloadListener & JS interface
        getActivity().runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.getSettings().setJavaScriptEnabled(true);
                    webView.getSettings().setDomStorageEnabled(true);
                    webView.getSettings().setAllowFileAccess(true);

                    // Register JS Interface
                    webView.addJavascriptInterface(new DownloadBridge(getContext(), webView, getActivity()), "AndroidDownloadBridge");

                    // Register DownloadListener for standard HTTP/HTTPS downloads
                    webView.setDownloadListener(new DownloadListener() {
                        @Override
                        public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                            Log.d(TAG, "onDownloadStart: " + url);
                            handleHttpDownload(url, userAgent, contentDisposition, mimetype);
                        }
                    });
                    Log.d(TAG, "WebView DownloadListener and AndroidDownloadBridge successfully registered");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error configuring WebView in DownloadPlugin.load()", e);
            }
        });
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        String base64Data = call.getString("data");
        String filename = call.getString("filename", "redact_" + System.currentTimeMillis() + ".png");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("No data provided");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            boolean success = saveToPublicDownloads(getContext(), getActivity(), bytes, filename, mimeType);
            if (success) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("filename", filename);
                call.resolve(ret);
            } else {
                call.reject("Failed to save file to Downloads");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in saveFile plugin method", e);
            call.reject("Error saving file: " + e.getMessage());
        }
    }

    public static boolean saveToPublicDownloads(Context context, Context activity, byte[] bytes, String filename, String mimeType) {
        if (bytes == null || bytes.length == 0) return false;
        if (filename == null || filename.trim().isEmpty()) {
            filename = "redact_" + System.currentTimeMillis() + ".png";
        }
        if (mimeType == null || mimeType.trim().isEmpty()) {
            mimeType = "application/octet-stream";
        }

        final String finalFilename = filename;
        final String finalMime = mimeType;

        try {
            boolean success = false;
            String savedPath = "";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, finalFilename);
                values.put(MediaStore.Downloads.MIME_TYPE, finalMime);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                Uri itemUri = context.getContentResolver().insert(collection, values);

                if (itemUri != null) {
                    try (OutputStream out = context.getContentResolver().openOutputStream(itemUri)) {
                        if (out != null) {
                            out.write(bytes);
                            out.flush();
                            success = true;
                        }
                    }
                    values.clear();
                    values.put(MediaStore.Downloads.IS_PENDING, 0);
                    context.getContentResolver().update(itemUri, values, null, null);
                    savedPath = "Downloads/" + finalFilename;
                }
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                File outFile = new File(downloadsDir, finalFilename);
                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(bytes);
                    fos.flush();
                    success = true;
                    savedPath = outFile.getAbsolutePath();
                }
                MediaScannerConnection.scanFile(context, new String[]{outFile.getAbsolutePath()}, new String[]{finalMime}, null);
            }

            if (success) {
                Log.i(TAG, "File successfully saved: " + savedPath);
                final String display = savedPath.isEmpty() ? "Downloads" : savedPath;
                if (activity != null) {
                    new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                        Toast.makeText(context, "Saved to " + display, Toast.LENGTH_LONG).show();
                    });
                }
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed writing file to Downloads", e);
        }
        return false;
    }

    private void handleHttpDownload(String url, String userAgent, String contentDisposition, String mimetype) {
        try {
            if (url == null || url.startsWith("data:") || url.startsWith("blob:")) return;

            String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
            if (filename == null || filename.trim().isEmpty()) {
                filename = "download_" + System.currentTimeMillis();
            }

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            if (mimetype != null && !mimetype.isEmpty()) {
                request.setMimeType(mimetype);
            }
            request.addRequestHeader("User-Agent", userAgent);
            request.setTitle(filename);
            request.setDescription("Downloading " + filename);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);

            DownloadManager dm = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                Toast.makeText(getContext(), "Download started: " + filename, Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Log.e(TAG, "HTTP download failed", e);
        }
    }

    public static class DownloadBridge {
        private final Context context;
        private final WebView webView;
        private final Context activity;
        private ByteArrayOutputStream chunkStream;
        private String chunkFilename;
        private String chunkMimeType;

        public DownloadBridge(Context context, WebView webView, Context activity) {
            this.context = context;
            this.webView = webView;
            this.activity = activity;
        }

        @JavascriptInterface
        public void saveBase64(String base64Data, String filename, String mimeType) {
            try {
                byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                saveToPublicDownloads(context, activity, bytes, filename, mimeType);
            } catch (Exception e) {
                Log.e(TAG, "Error in JS saveBase64", e);
            }
        }

        @JavascriptInterface
        public void startDownload(String filename, String mimeType, int totalChunks) {
            this.chunkFilename = filename;
            this.chunkMimeType = mimeType;
            this.chunkStream = new ByteArrayOutputStream();
        }

        @JavascriptInterface
        public void appendChunk(String base64Chunk) {
            try {
                if (chunkStream != null) {
                    byte[] bytes = Base64.decode(base64Chunk, Base64.DEFAULT);
                    chunkStream.write(bytes);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in appendChunk", e);
            }
        }

        @JavascriptInterface
        public void finishDownload() {
            try {
                if (chunkStream != null) {
                    byte[] bytes = chunkStream.toByteArray();
                    chunkStream.close();
                    chunkStream = null;
                    saveToPublicDownloads(context, activity, bytes, chunkFilename, chunkMimeType);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in finishDownload", e);
            }
        }
    }
}
