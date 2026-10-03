package com.redact.app;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class AndroidDownloadBridge {
    private static final String TAG = "RedactDownload";
    private final Context context;
    private final WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private ByteArrayOutputStream chunkStream = null;
    private String chunkFilename = "";
    private String chunkMimeType = "";

    public AndroidDownloadBridge(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
    }

    @JavascriptInterface
    public void saveBase64(String base64Data, String filename, String mimeType) {
        try {
            if (base64Data == null || base64Data.isEmpty()) {
                Log.e(TAG, "saveBase64 received empty data");
                notifyJs("Download failed: empty file data");
                return;
            }
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            saveBytesToDownloads(
                bytes,
                filename != null ? filename : ("redact_" + System.currentTimeMillis() + ".png"),
                mimeType != null ? mimeType : "image/png"
            );
        } catch (Exception e) {
            Log.e(TAG, "Error decoding or saving base64 data", e);
            notifyJs("Failed saving file: " + e.getMessage());
        }
    }

    @JavascriptInterface
    public void startDownload(String filename, String mimeType, int totalChunks) {
        Log.d(TAG, "startDownload: " + filename + " (" + totalChunks + " chunks planned)");
        this.chunkFilename = filename != null ? filename : ("redact_" + System.currentTimeMillis() + ".png");
        this.chunkMimeType = mimeType != null ? mimeType : "application/octet-stream";
        this.chunkStream = new ByteArrayOutputStream();
    }

    @JavascriptInterface
    public void appendChunk(String base64Chunk) {
        try {
            if (base64Chunk != null && !base64Chunk.isEmpty() && chunkStream != null) {
                byte[] bytes = Base64.decode(base64Chunk, Base64.DEFAULT);
                chunkStream.write(bytes);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error appending chunk", e);
        }
    }

    @JavascriptInterface
    public void finishDownload() {
        try {
            if (chunkStream != null) {
                byte[] bytes = chunkStream.toByteArray();
                chunkStream.close();
                chunkStream = null;
                if (bytes != null && bytes.length > 0) {
                    saveBytesToDownloads(bytes, chunkFilename, chunkMimeType);
                } else {
                    notifyJs("Download failed: empty stream");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in finishDownload", e);
            notifyJs("Failed to complete download: " + e.getMessage());
        }
    }

    public void handleHttpDownload(
        String url,
        String userAgent,
        String contentDisposition,
        String mimetype
    ) {
        try {
            if (url == null || url.startsWith("data:") || url.startsWith("blob:")) return;

            String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
            if (filename == null || filename.trim().isEmpty()) {
                filename = "download_" + System.currentTimeMillis();
            }

            final String finalFilename = filename;
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            if (mimetype != null && !mimetype.isEmpty()) {
                request.setMimeType(mimetype);
            }
            if (userAgent != null && !userAgent.isEmpty()) {
                request.addRequestHeader("User-Agent", userAgent);
            }
            request.setTitle(finalFilename);
            request.setDescription("Downloading " + finalFilename);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, finalFilename);

            DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
            }

            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(context, "Download started: " + finalFilename, Toast.LENGTH_SHORT).show();
                }
            });
        } catch (final Exception e) {
            Log.e(TAG, "HTTP download via DownloadManager failed", e);
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(context, "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    private void saveBytesToDownloads(byte[] bytes, String filename, String mimeType) {
        final String safeName = (filename != null && !filename.trim().isEmpty()) ? filename : ("redact_" + System.currentTimeMillis() + ".png");
        final String safeMime = (mimeType != null && !mimeType.trim().isEmpty()) ? mimeType : "application/octet-stream";

        try {
            boolean success = false;
            String savedPath = "";

            // Android 10+ (API 29+): MediaStore Scoped Storage
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                values.put(MediaStore.Downloads.MIME_TYPE, safeMime);
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
                    savedPath = "Downloads/" + safeName;
                }
            } else {
                // Legacy Android (API < 29)
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                File outFile = new File(downloadsDir, safeName);
                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(bytes);
                    fos.flush();
                    success = true;
                    savedPath = outFile.getAbsolutePath();
                }

                MediaScannerConnection.scanFile(
                    context,
                    new String[]{outFile.getAbsolutePath()},
                    new String[]{safeMime},
                    null
                );
            }

            if (success) {
                Log.i(TAG, "Successfully saved to " + savedPath + " (" + bytes.length + " bytes)");
                mainHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(context, "Saved to Downloads: " + safeName, Toast.LENGTH_LONG).show();
                    }
                });
                notifyJs("Saved " + safeName + " to Downloads");
            } else {
                Log.e(TAG, "Failed to write file stream");
                notifyJs("Failed saving " + safeName);
            }
        } catch (final Exception e) {
            Log.e(TAG, "Failed saving bytes to Downloads", e);
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(context, "Error saving file: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
            notifyJs("Error saving " + safeName + ": " + e.getMessage());
        }
    }

    private void notifyJs(String message) {
        final String escaped = message.replace("'", "\\'");
        if (webView != null) {
            webView.post(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript("if(typeof toast==='function')toast('" + escaped + "');", null);
                }
            });
        }
    }
}
