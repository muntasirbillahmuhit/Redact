import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// In-memory cache for temporary download delivery (survives sandboxed iframe download blocks)
const downloadStore = new Map();

// Clean up expired items after 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of downloadStore.entries()) {
    if (now - item.created > 5 * 60 * 1000) {
      downloadStore.delete(id);
    }
  }
}, 60 * 1000);

// Parse binary/raw bodies for file uploads up to 50MB
app.use('/api/prepare-download', express.raw({ type: '*/*', limit: '50mb' }));

app.post('/api/prepare-download', (req, res) => {
  try {
    const rawFilename = req.headers['x-filename'] || 'redacted-image.png';
    const filename = decodeURIComponent(rawFilename);
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const id = crypto.randomUUID();

    downloadStore.set(id, {
      buffer: req.body,
      filename,
      contentType,
      created: Date.now()
    });

    res.json({ id, downloadUrl: `/api/download/${id}/${encodeURIComponent(filename)}` });
  } catch (err) {
    console.error('Error preparing download:', err);
    res.status(500).json({ error: 'Failed to prepare download' });
  }
});

app.get('/api/download/:id/:filename?', (req, res) => {
  const { id } = req.params;
  const item = downloadStore.get(id);
  if (!item) {
    return res.status(404).send('Download link has expired or does not exist. Please download from the app again.');
  }

  const safeFilename = item.filename.replace(/[\\/:*?"<>|]/g, '_');
  res.setHeader('Content-Type', item.contentType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.send(item.buffer);
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
