import heic2any from 'heic2any';

export type TargetFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ConversionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  newSize: number;
  sourceFormat: string;
  targetFormat: TargetFormat;
  targetExtension: string;
  fileName: string;
  width: number;
  height: number;
}

/**
 * Detects format label from File MIME type or filename extension
 */
export function detectFormat(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.heic') || file.type.includes('heic')) return 'HEIC';
  if (name.endsWith('.heif') || file.type.includes('heif')) return 'HEIF';
  if (name.endsWith('.png') || file.type === 'image/png') return 'PNG';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || file.type === 'image/jpeg') return 'JPG';
  if (name.endsWith('.webp') || file.type === 'image/webp') return 'WEBP';
  if (name.endsWith('.svg') || file.type === 'image/svg+xml') return 'SVG';
  if (name.endsWith('.gif') || file.type === 'image/gif') return 'GIF';
  if (name.endsWith('.bmp') || file.type === 'image/bmp') return 'BMP';
  return file.type.split('/')[1]?.toUpperCase() || 'FILE';
}

export function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif') || file.type.includes('heic') || file.type.includes('heif');
}

/**
 * Converts any image file (including Apple HEIC / HEIF) to JPG, PNG, or WebP in client memory.
 */
export async function convertImageFile(
  file: File,
  targetFormat: TargetFormat,
  quality: number = 0.92,
  fillColor: string = '#FFFFFF'
): Promise<ConversionResult> {
  let sourceBlob: Blob = file;

  // 1. If HEIC / HEIF, convert via heic2any first
  if (isHeic(file)) {
    try {
      const intermediate = await heic2any({
        blob: file,
        toType: 'image/png',
      });
      sourceBlob = Array.isArray(intermediate) ? intermediate[0] : intermediate;
    } catch (e) {
      console.warn('heic2any failed, attempting native browser decode', e);
    }
  }

  // 2. Load blob into Image element
  const objectUrl = URL.createObjectURL(sourceBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width || 1200;
      const height = img.naturalHeight || img.height || 800;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas context could not be created'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill background if converting to JPEG (JPEG lacks alpha channel, avoids black background)
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = fillColor || '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('Conversion failed to produce output blob'));
            return;
          }

          const dataUrl = canvas.toDataURL(targetFormat, quality);
          const ext = targetFormat === 'image/jpeg' ? '.jpg' : targetFormat === 'image/png' ? '.png' : '.webp';
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const outputName = `${baseName}_converted${ext}`;

          resolve({
            blob,
            dataUrl,
            originalSize: file.size,
            newSize: blob.size,
            sourceFormat: detectFormat(file),
            targetFormat,
            targetExtension: ext,
            fileName: outputName,
            width,
            height,
          });
        },
        targetFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to render source image for conversion'));
    };

    img.src = objectUrl;
  });
}
