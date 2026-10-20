import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Setup pdfjs worker safely for Vite / Browser
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('Could not set pdfjs workerSrc', e);
  }
}

export interface PdfPageImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  fileName: string;
}

/**
 * Converts each page of a PDF document into high-resolution PNG images.
 */
export async function convertPdfToImages(
  file: File,
  scale: number = 1.5
): Promise<PdfPageImage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const results: PdfPageImage[] = [];

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // High quality white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas: canvas,
    }).promise;

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png');
    });

    results.push({
      pageNumber: pageNum,
      blob,
      dataUrl,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      fileName: `${baseName}_page_${pageNum}.png`,
    });
  }

  return results;
}

export interface ImageToPdfOptions {
  pageSize: 'a4' | 'letter' | 'fit';
  orientation: 'portrait' | 'landscape' | 'auto';
  marginMm?: number;
}

/**
 * Converts one or multiple images into a multi-page PDF document.
 */
export async function convertImagesToPdf(
  files: File[],
  options: ImageToPdfOptions = { pageSize: 'a4', orientation: 'auto', marginMm: 10 }
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  if (files.length === 0) {
    throw new Error('No images provided for PDF conversion');
  }

  const { pageSize, orientation, marginMm = 8 } = options;
  let doc: jsPDF | null = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image element'));
      image.src = dataUrl;
    });

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    const isLandscape = imgWidth > imgHeight;

    const pageOrientation =
      orientation === 'auto'
        ? isLandscape
          ? 'landscape'
          : 'portrait'
        : orientation;

    if (i === 0) {
      if (pageSize === 'fit') {
        // Fit exact image dimensions in points
        doc = new jsPDF({
          orientation: pageOrientation,
          unit: 'pt',
          format: [imgWidth, imgHeight],
        });
      } else {
        doc = new jsPDF({
          orientation: pageOrientation,
          unit: 'mm',
          format: pageSize,
        });
      }
    } else if (doc) {
      if (pageSize === 'fit') {
        doc.addPage([imgWidth, imgHeight], pageOrientation);
      } else {
        doc.addPage(pageSize, pageOrientation);
      }
    }

    if (!doc) continue;

    if (pageSize === 'fit') {
      doc.addImage(dataUrl, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const availWidth = pageWidth - marginMm * 2;
      const availHeight = pageHeight - marginMm * 2;

      const imgRatio = imgWidth / imgHeight;
      const pageRatio = availWidth / availHeight;

      let renderWidth = availWidth;
      let renderHeight = availHeight;

      if (imgRatio > pageRatio) {
        renderHeight = availWidth / imgRatio;
      } else {
        renderWidth = availHeight * imgRatio;
      }

      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      doc.addImage(dataUrl, 'JPEG', x, y, renderWidth, renderHeight);
    }
  }

  if (!doc) {
    throw new Error('Failed to initialize PDF document');
  }

  const pdfBlob = doc.output('blob');
  const baseName = files[0].name.replace(/\.[^/.]+$/, '');
  const fileName = files.length === 1 ? `${baseName}.pdf` : `combined_${baseName}_${files.length}_pages.pdf`;

  return {
    blob: pdfBlob,
    fileName,
    pageCount: files.length,
  };
}
