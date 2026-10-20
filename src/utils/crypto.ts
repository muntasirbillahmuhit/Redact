/**
 * Real local zero-trace privacy cryptographic and file manipulation engine.
 * Runs completely in client memory — zero external server uploads.
 */

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function generateSessionFingerprint(): string {
  const chars = '0123456789ABCDEF';
  let str = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) str += '-';
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

/**
 * Calculates SHA-256 checksum of an ArrayBuffer
 */
export async function calculateSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Real client-side image compressor using HTMLCanvasElement
 */
export async function compressImage(
  file: File,
  quality: number = 0.7,
  targetFormat: 'image/jpeg' | 'image/webp' = 'image/webp'
): Promise<{ blob: Blob; dataUrl: string; originalSize: number; newSize: number; savingsPct: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down very large images proportionally to save memory
        const maxDim = 2560;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Clean white background for transparency conversion
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression blob creation failed'));
              return;
            }
            const dataUrl = canvas.toDataURL(targetFormat, quality);
            const savingsPct = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));
            resolve({
              blob,
              dataUrl,
              originalSize: file.size,
              newSize: blob.size,
              savingsPct,
            });
          },
          targetFormat,
          quality
        );
      };
      img.onerror = () => reject(new Error('Invalid image data'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Real client-side image resizer using HTMLCanvasElement
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality: number = 0.9,
  maintainAspectRatio: boolean = true
): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
  originalWidth: number;
  originalHeight: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const origWidth = img.width;
        const origHeight = img.height;
        let finalWidth = targetWidth;
        let finalHeight = targetHeight;

        if (maintainAspectRatio && origWidth > 0 && origHeight > 0) {
          const ratio = origWidth / origHeight;
          if (finalWidth / finalHeight > ratio) {
            finalWidth = Math.round(finalHeight * ratio);
          } else {
            finalHeight = Math.round(finalWidth / ratio);
          }
        }

        finalWidth = Math.max(1, Math.min(finalWidth, 10000));
        finalHeight = Math.max(1, Math.min(finalHeight, 10000));

        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, finalWidth, finalHeight);
        }

        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Resize blob failed'));
              return;
            }
            const dataUrl = canvas.toDataURL(format, quality);
            resolve({
              blob,
              dataUrl,
              width: finalWidth,
              height: finalHeight,
              originalWidth: origWidth,
              originalHeight: origHeight,
              originalSize: file.size,
              newSize: blob.size,
            });
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * AES-GCM 256-bit encryption with PBKDF2 key derivation
 */
export async function encryptFileBuffer(
  buffer: ArrayBuffer,
  passphrase: string,
  fileName: string
): Promise<{ encryptedBlob: Blob; downloadName: string }> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    buffer
  );

  // Envelope header: REDACT_V1 [magic 9 bytes] + metadata JSON length [4 bytes] + metadata + salt [16] + iv [12] + encrypted data
  const metaObj = {
    v: 1,
    name: fileName,
    date: new Date().toISOString(),
    cipher: 'AES-GCM-256',
  };
  const metaBytes = enc.encode(JSON.stringify(metaObj));
  const metaLen = new Uint32Array([metaBytes.byteLength]);

  const magic = enc.encode('REDACT_V1');

  const combined = new Uint8Array(
    magic.byteLength +
    metaLen.byteLength +
    metaBytes.byteLength +
    salt.byteLength +
    iv.byteLength +
    encryptedContent.byteLength
  );

  let offset = 0;
  combined.set(magic, offset); offset += magic.byteLength;
  combined.set(new Uint8Array(metaLen.buffer), offset); offset += metaLen.byteLength;
  combined.set(metaBytes, offset); offset += metaBytes.byteLength;
  combined.set(salt, offset); offset += salt.byteLength;
  combined.set(iv, offset); offset += iv.byteLength;
  combined.set(new Uint8Array(encryptedContent), offset);

  const encryptedBlob = new Blob([combined], { type: 'application/octet-stream' });
  const downloadName = `${fileName}.redact`;

  return { encryptedBlob, downloadName };
}

/**
 * Split an ArrayBuffer into N even chunk Blobs
 */
export function splitBufferIntoParts(
  buffer: ArrayBuffer,
  baseFileName: string,
  partsCount: number = 2
): Array<{ partNumber: number; totalParts: number; blob: Blob; fileName: string; size: number }> {
  const totalBytes = buffer.byteLength;
  const chunkSize = Math.ceil(totalBytes / partsCount);
  const results = [];

  for (let i = 0; i < partsCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalBytes);
    const slice = buffer.slice(start, end);
    const blob = new Blob([slice], { type: 'application/octet-stream' });
    const partNum = i + 1;
    const extMatch = baseFileName.match(/\.[^/.]+$/);
    const ext = extMatch ? extMatch[0] : '';
    const nameWithoutExt = baseFileName.replace(/\.[^/.]+$/, '');
    const fileName = `${nameWithoutExt}.part${partNum}of${partsCount}${ext}`;

    results.push({
      partNumber: partNum,
      totalParts: partsCount,
      blob,
      fileName,
      size: slice.byteLength,
    });
  }

  return results;
}

/**
 * Triggers browser download for a Blob
 */
export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
