import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  RefreshCw,
  Layers,
  Sparkles,
  Sliders,
  ChevronRight,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppFile } from '../types';
import { formatBytes, triggerDownload } from '../utils/crypto';
import { playHaptic } from '../utils/audio';
import {
  convertPdfToImages,
  convertImagesToPdf,
  PdfPageImage,
  ImageToPdfOptions
} from '../utils/pdfConverter';

interface PdfToolsProps {
  darkMode: boolean;
  initialFile: AppFile | null;
  onClose?: () => void;
  onFileChange?: (file: File) => void;
}

export const PdfTools: React.FC<PdfToolsProps> = ({
  darkMode,
  initialFile,
  onClose,
  onFileChange,
}) => {
  // Mode switcher: 'pdf-to-img' vs 'img-to-pdf'
  const [activeMode, setActiveMode] = useState<'pdf-to-img' | 'img-to-pdf'>(
    initialFile && initialFile.isPdf ? 'pdf-to-img' : 'img-to-pdf'
  );

  // File Inputs
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // --- PDF to Image state ---
  const [pdfFile, setPdfFile] = useState<File | null>(
    initialFile && initialFile.isPdf ? initialFile.fileObject : null
  );
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [pdfPages, setPdfPages] = useState<PdfPageImage[]>([]);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // --- Image to PDF state ---
  const [imageQueue, setImageQueue] = useState<File[]>(
    initialFile && initialFile.isImage ? [initialFile.fileObject] : []
  );
  const [pdfOptions, setPdfOptions] = useState<ImageToPdfOptions>({
    pageSize: 'a4',
    orientation: 'auto',
    marginMm: 8,
  });
  const [isBuildingPdf, setIsBuildingPdf] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<{ blob: Blob; fileName: string; pageCount: number } | null>(null);

  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Auto convert PDF if a PDF file is present
  useEffect(() => {
    if (activeMode === 'pdf-to-img' && pdfFile) {
      handleRenderPdf();
    }
  }, [pdfFile, activeMode]);

  const handleRenderPdf = async () => {
    if (!pdfFile) return;
    setIsRenderingPdf(true);
    setPdfError(null);
    setPdfPages([]);
    playHaptic('pop');

    try {
      const pages = await convertPdfToImages(pdfFile, 1.5);
      setPdfPages(pages);
      playHaptic('success');
      confetti({ particleCount: 40, spread: 55, origin: { y: 0.8 } });
      setSuccessNote(`Extracted ${pages.length} high-resolution image pages from PDF!`);
    } catch (err) {
      console.error(err);
      setPdfError('Could not render PDF pages: ' + String(err));
      playHaptic('delete');
    } finally {
      setIsRenderingPdf(false);
    }
  };

  const handleBuildPdf = async () => {
    if (imageQueue.length === 0) return;
    setIsBuildingPdf(true);
    setGeneratedPdf(null);
    playHaptic('pop');

    try {
      const result = await convertImagesToPdf(imageQueue, pdfOptions);
      setGeneratedPdf(result);
      playHaptic('success');
      confetti({ particleCount: 50, spread: 65, origin: { y: 0.8 } });
      triggerDownload(result.blob, result.fileName);
      setSuccessNote(`Generated PDF with ${result.pageCount} pages (${formatBytes(result.blob.size)})`);
    } catch (err) {
      console.error(err);
      playHaptic('delete');
    } finally {
      setIsBuildingPdf(false);
    }
  };

  // Add more images to queue
  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added = Array.from(files).filter((f) => f.type.startsWith('image/'));
    playHaptic('pop');
    setImageQueue((prev) => [...prev, ...added]);
  };

  // Handle PDF picked
  const handlePdfPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const f = files[0];
    playHaptic('pop');
    setPdfFile(f);
    if (onFileChange) onFileChange(f);
  };

  return (
    <div className="flex flex-col h-full px-4 pt-2 pb-6 space-y-4">
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handlePdfPicked}
      />
      <input
        ref={imgInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleAddImages}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              darkMode ? 'bg-[#3D2527]' : 'bg-[#F9E4E3]'
            }`}
          >
            <FileText className="w-5 h-5 text-[#DF3D30]" />
          </div>
          <div>
            <h2
              className={`font-black text-[20px] tracking-tight leading-tight ${
                darkMode ? 'text-white' : 'text-[#121212]'
              }`}
            >
              PDF & Image Engine
            </h2>
            <p className="text-[10px] font-bold text-[#8A8A8A] tracking-[0.16em] uppercase mt-0.5">
              PDF TO IMG • IMG TO PDF
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={() => {
              playHaptic('tap');
              onClose();
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Switcher Pill */}
      <div
        className={`p-1 rounded-2xl flex items-center border transition-all ${
          darkMode ? 'bg-black/30 border-white/10' : 'bg-white/60 border-black/5 shadow-xs'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            playHaptic('tap');
            setActiveMode('img-to-pdf');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'img-to-pdf'
              ? 'bg-[#CA4639] text-white shadow-sm'
              : darkMode
              ? 'text-white/70 hover:text-white'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Image → PDF</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playHaptic('tap');
            setActiveMode('pdf-to-img');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'pdf-to-img'
              ? 'bg-[#CA4639] text-white shadow-sm'
              : darkMode
              ? 'text-white/70 hover:text-white'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>PDF → Image</span>
        </button>
      </div>

      {/* Notifications */}
      {successNote && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate">{successNote}</span>
        </div>
      )}

      {pdfError && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in">
          {pdfError}
        </div>
      )}

      {/* ================= MODE 1: IMAGE TO PDF ================= */}
      {activeMode === 'img-to-pdf' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-[26px] space-y-3.5 ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block">
                  Source Images ({imageQueue.length})
                </span>
                <span className="text-[10px] text-[#8A8A8A]">
                  Each image becomes an individual PDF page
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playHaptic('tap');
                  imgInputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-full bg-[#CA4639] hover:bg-[#B53C30] text-white text-[11px] font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Photos</span>
              </button>
            </div>

            {/* Images List */}
            {imageQueue.length === 0 ? (
              <div
                onClick={() => {
                  playHaptic('tap');
                  imgInputRef.current?.click();
                }}
                className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-white/15 rounded-2xl p-6 text-center hover:border-[#CA4639] transition-colors"
              >
                <ImageIcon className="w-7 h-7 text-[#DF3D30] mx-auto mb-2" />
                <p className="text-xs font-bold">Select images to convert into a PDF document</p>
                <p className="text-[10px] text-[#8A8A8A] mt-0.5">JPG, PNG, WebP or HEIC photos</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {imageQueue.map((file, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl flex items-center justify-between border ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-6 h-6 rounded-lg bg-[#CA4639]/10 text-[#CA4639] text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{file.name}</p>
                        <p className="text-[9px] text-[#8A8A8A]">{formatBytes(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playHaptic('delete');
                        setImageQueue((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF Page Settings */}
          <div
            className={`p-4 rounded-[26px] space-y-3 ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block">
              Page Layout Settings
            </span>

            {/* Page Size */}
            <div>
              <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1">
                Document Size
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'a4', label: 'A4 Standard' },
                  { id: 'letter', label: 'US Letter' },
                  { id: 'fit', label: 'Fit to Image' },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => {
                      playHaptic('tap');
                      setPdfOptions((prev) => ({ ...prev, pageSize: sz.id as any }));
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      pdfOptions.pageSize === sz.id
                        ? 'bg-[#CA4639] text-white border-[#CA4639]'
                        : darkMode
                        ? 'bg-white/5 border-white/10 text-white/80'
                        : 'bg-white/60 border-black/5 text-[#121212]'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div>
              <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1">
                Orientation
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'auto', label: 'Auto Detect' },
                  { id: 'portrait', label: 'Portrait' },
                  { id: 'landscape', label: 'Landscape' },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      playHaptic('tap');
                      setPdfOptions((prev) => ({ ...prev, orientation: o.id as any }));
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      pdfOptions.orientation === o.id
                        ? 'bg-[#CA4639] text-white border-[#CA4639]'
                        : darkMode
                        ? 'bg-white/5 border-white/10 text-white/80'
                        : 'bg-white/60 border-black/5 text-[#121212]'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Convert and Download Button */}
          <button
            type="button"
            onClick={handleBuildPdf}
            disabled={imageQueue.length === 0 || isBuildingPdf}
            className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 ${
              imageQueue.length > 0 && !isBuildingPdf
                ? 'bg-[#CA4639] hover:bg-[#B53C30] text-white active:scale-95'
                : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed'
            }`}
          >
            {isBuildingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Compiling PDF Document...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Compile & Download {imageQueue.length} Images as PDF</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ================= MODE 2: PDF TO IMAGE ================= */}
      {activeMode === 'pdf-to-img' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-[26px] ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block">
                Target PDF Document
              </span>
              <button
                type="button"
                onClick={() => {
                  playHaptic('tap');
                  pdfInputRef.current?.click();
                }}
                className="text-xs font-bold text-[#CA4639] hover:underline"
              >
                {pdfFile ? 'Change PDF' : 'Select PDF'}
              </button>
            </div>

            {!pdfFile ? (
              <div
                onClick={() => {
                  playHaptic('tap');
                  pdfInputRef.current?.click();
                }}
                className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-white/15 rounded-2xl p-6 text-center hover:border-[#CA4639] transition-colors"
              >
                <FileText className="w-7 h-7 text-[#DF3D30] mx-auto mb-2" />
                <p className="text-xs font-bold">Select PDF to render pages into images</p>
                <p className="text-[10px] text-[#8A8A8A] mt-0.5">Extracts crisp individual PNG pages</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#DF3D30] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                      {pdfFile.name}
                    </p>
                    <p className="text-[10px] text-[#8A8A8A] font-semibold">
                      {formatBytes(pdfFile.size)} • {pdfPages.length > 0 ? `${pdfPages.length} Pages Extracted` : 'Ready'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRenderPdf}
                  disabled={isRenderingPdf}
                  className="px-3 py-1.5 rounded-full bg-[#CA4639] text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                >
                  <RefreshCw className={`w-3 h-3 ${isRenderingPdf ? 'animate-spin' : ''}`} />
                  <span>Re-render</span>
                </button>
              </div>
            )}
          </div>

          {/* Rendered Pages Gallery */}
          {pdfPages.length > 0 && (
            <div
              className={`p-4 rounded-[26px] space-y-3 ${
                darkMode ? 'liquid-glass-dark' : 'liquid-glass'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block">
                  Extracted Pages ({pdfPages.length})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  PNG Lossless
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto no-scrollbar pt-1">
                {pdfPages.map((page) => (
                  <div
                    key={page.pageNumber}
                    className={`rounded-2xl p-2.5 flex flex-col justify-between border ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-black/5 shadow-xs'
                    }`}
                  >
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-white mb-2 shadow-xs border border-black/5 flex items-center justify-center">
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold">Page {page.pageNumber}</span>
                      <button
                        type="button"
                        onClick={() => {
                          playHaptic('success');
                          triggerDownload(page.blob, page.fileName);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-[#CA4639] hover:bg-[#B53C30] text-white text-[10px] font-bold flex items-center gap-1"
                        title="Download page"
                      >
                        <Download className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
