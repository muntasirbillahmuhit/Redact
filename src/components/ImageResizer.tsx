import React, { useState, useEffect, useRef } from 'react';
import {
  Scaling,
  Download,
  Lock,
  Unlock,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Maximize2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppFile } from '../types';
import { formatBytes, resizeImage, triggerDownload } from '../utils/crypto';
import { playHaptic } from '../utils/audio';

interface ImageResizerProps {
  darkMode: boolean;
  initialFile: AppFile | null;
  onClose?: () => void;
  onFileChange?: (file: File) => void;
}

export const ImageResizer: React.FC<ImageResizerProps> = ({
  darkMode,
  initialFile,
  onClose,
  onFileChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFile, setActiveFile] = useState<AppFile | null>(
    initialFile && initialFile.isImage ? initialFile : null
  );

  // Dimension states
  const [origDimensions, setOrigDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  // Format & Quality states
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState<number>(0.9);

  // Result state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resizeResult, setResizeResult] = useState<{
    blob: Blob;
    dataUrl: string;
    width: number;
    height: number;
    originalSize: number;
    newSize: number;
  } | null>(null);

  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Inspect loaded image to get natural dimensions
  useEffect(() => {
    if (activeFile && activeFile.fileObject) {
      const img = new Image();
      img.onload = () => {
        const w = img.width || 800;
        const h = img.height || 600;
        setOrigDimensions({ width: w, height: h });
        setWidth(w);
        setHeight(h);
        setAspectRatio(w / h);
      };
      if (activeFile.dataUrl) {
        img.src = activeFile.dataUrl;
      } else {
        img.src = URL.createObjectURL(activeFile.fileObject);
      }
    }
  }, [activeFile]);

  // Trigger resize computation
  useEffect(() => {
    if (!activeFile || width <= 0 || height <= 0) return;

    let isMounted = true;
    const timeout = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const res = await resizeImage(
          activeFile.fileObject,
          width,
          height,
          outputFormat,
          quality,
          lockAspectRatio
        );
        if (isMounted) {
          setResizeResult(res);
        }
      } catch (err) {
        console.error('Resize failed', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [activeFile, width, height, outputFormat, quality, lockAspectRatio]);

  // Handle width change
  const handleWidthChange = (val: number) => {
    const newW = Math.max(1, Math.min(val, 8000));
    setWidth(newW);
    if (lockAspectRatio && aspectRatio > 0) {
      setHeight(Math.round(newW / aspectRatio));
    }
  };

  // Handle height change
  const handleHeightChange = (val: number) => {
    const newH = Math.max(1, Math.min(val, 8000));
    setHeight(newH);
    if (lockAspectRatio && aspectRatio > 0) {
      setWidth(Math.round(newH * aspectRatio));
    }
  };

  // Quick scale percentage presets
  const handleScalePreset = (percent: number) => {
    if (origDimensions.width <= 0) return;
    playHaptic('tap');
    const factor = percent / 100;
    const newW = Math.round(origDimensions.width * factor);
    const newH = Math.round(origDimensions.height * factor);
    setWidth(newW);
    setHeight(newH);
  };

  // Preset resolutions
  const presets = [
    { label: 'Square (1:1)', w: 1080, h: 1080 },
    { label: 'Story (9:16)', w: 1080, h: 1920 },
    { label: 'Full HD (16:9)', w: 1920, h: 1080 },
    { label: 'Avatar (400x400)', w: 400, h: 400 },
  ];

  const handleApplyPreset = (w: number, h: number) => {
    playHaptic('pop');
    setLockAspectRatio(false);
    setWidth(w);
    setHeight(h);
    setAspectRatio(w / h);
  };

  // Handle local file picking
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) return;

    playHaptic('pop');
    const appF: AppFile = {
      id: Math.random().toString(36).substring(2, 9),
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
      dataUrl: URL.createObjectURL(f),
      isImage: true,
      isPdf: false,
      isText: false,
      fileObject: f,
    };
    setActiveFile(appF);
    if (onFileChange) onFileChange(f);
  };

  // Download Action
  const handleDownload = () => {
    if (!resizeResult || !activeFile) return;
    playHaptic('success');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#CA4639', '#DF3D30', '#F9E4E3', '#FFFFFF'],
    });

    const ext = outputFormat === 'image/webp' ? '.webp' : outputFormat === 'image/png' ? '.png' : '.jpg';
    const baseName = activeFile.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}_${resizeResult.width}x${resizeResult.height}${ext}`;

    triggerDownload(resizeResult.blob, outName);
    setSuccessNote(`Saved ${outName} (${formatBytes(resizeResult.newSize)})`);
  };

  return (
    <div className="flex flex-col h-full px-4 pt-2 pb-6 space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              darkMode ? 'bg-[#3D2527]' : 'bg-[#F9E4E3]'
            }`}
          >
            <Scaling className="w-5 h-5 text-[#DF3D30]" />
          </div>
          <div>
            <h2
              className={`font-black text-[20px] tracking-tight leading-tight ${
                darkMode ? 'text-white' : 'text-[#121212]'
              }`}
            >
              Image Resizer
            </h2>
            <p className="text-[10px] font-bold text-[#8A8A8A] tracking-[0.16em] uppercase mt-0.5">
              PIXEL & RATIO SCALING ENGINE
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

      {/* Success Notification */}
      {successNote && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate">{successNote}</span>
        </div>
      )}

      {/* Upload Dropzone if no active image */}
      {!activeFile ? (
        <div
          onClick={() => {
            playHaptic('tap');
            fileInputRef.current?.click();
          }}
          className={`cursor-pointer border-2 border-dashed rounded-[28px] p-8 text-center flex flex-col items-center justify-center transition-all ${
            darkMode
              ? 'border-white/20 bg-white/5 hover:border-[#CA4639]'
              : 'border-[#CA4639]/30 bg-white/70 hover:border-[#CA4639] shadow-sm'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F9E4E3] dark:bg-[#3D2527] flex items-center justify-center mb-3">
            <ImageIcon className="w-7 h-7 text-[#DF3D30]" />
          </div>
          <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            Select Image to Resize
          </h3>
          <p className="text-xs text-[#8A8A8A] mt-1 max-w-xs mb-4">
            Supports PNG, JPG, WebP, GIF, and modern image formats with zero memory leakage.
          </p>
          <button
            type="button"
            className="px-5 py-2.5 rounded-full bg-[#CA4639] hover:bg-[#B53C30] text-white text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
          >
            Choose Image File
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Image Card & Preview */}
          <div
            className={`p-4 rounded-[26px] flex items-center justify-between ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {activeFile.dataUrl ? (
                <img
                  src={activeFile.dataUrl}
                  alt="Original"
                  className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-xs flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#F9E4E3] flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-[#DF3D30]" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                  {activeFile.name}
                </p>
                <p className="text-[10px] text-[#8A8A8A] font-semibold tracking-wider uppercase mt-0.5">
                  Original: {origDimensions.width} × {origDimensions.height} px • {formatBytes(activeFile.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playHaptic('tap');
                fileInputRef.current?.click();
              }}
              className="text-xs font-bold text-[#CA4639] hover:underline px-2 flex-shrink-0"
            >
              Replace
            </button>
          </div>

          {/* Dimension Controls */}
          <div
            className={`p-4 rounded-[26px] space-y-3.5 ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider">
                Target Resolution (Pixels)
              </span>
              <button
                type="button"
                onClick={() => {
                  playHaptic('toggle');
                  setLockAspectRatio(!lockAspectRatio);
                }}
                className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  lockAspectRatio ? 'text-[#CA4639]' : 'text-gray-400'
                }`}
              >
                {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{lockAspectRatio ? 'Ratio Locked' : 'Ratio Free'}</span>
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="8000"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#CA4639] ${
                    darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/80 border-black/10 text-[#121212]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="8000"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#CA4639] ${
                    darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/80 border-black/10 text-[#121212]'
                  }`}
                />
              </div>
            </div>

            {/* Quick Scale Presets (% of original) */}
            <div>
              <span className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                Scale Percentage
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[25, 50, 75, 100, 150].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleScalePreset(pct)}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      origDimensions.width > 0 && Math.round(origDimensions.width * (pct / 100)) === width
                        ? 'bg-[#CA4639] text-white border-[#CA4639]'
                        : darkMode
                        ? 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                        : 'bg-white/60 border-black/5 text-gray-700 hover:text-black'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Aspect Ratios */}
            <div>
              <span className="block text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                Standard Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.w, p.h)}
                    className={`py-2 px-2.5 rounded-xl text-left border text-xs font-semibold transition-all ${
                      width === p.w && height === p.h
                        ? 'bg-[#CA4639] text-white border-[#CA4639]'
                        : darkMode
                        ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        : 'bg-white/60 border-black/5 text-[#121212] hover:bg-white'
                    }`}
                  >
                    <span className="block text-[11px] font-bold">{p.label}</span>
                    <span className="block text-[9px] opacity-75">{p.w} × {p.h} px</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Format & Compression Quality */}
          <div
            className={`p-4 rounded-[26px] space-y-3 ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block">
              Export Format
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'image/webp', label: 'WebP', note: 'Smallest' },
                { id: 'image/jpeg', label: 'JPEG', note: 'Universal' },
                { id: 'image/png', label: 'PNG', note: 'Lossless' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    playHaptic('tap');
                    setOutputFormat(fmt.id as any);
                  }}
                  className={`py-2 px-2 rounded-xl text-center border transition-all ${
                    outputFormat === fmt.id
                      ? 'bg-[#CA4639] text-white border-[#CA4639]'
                      : darkMode
                      ? 'bg-white/5 border-white/10 text-white/80'
                      : 'bg-white/60 border-black/5 text-[#121212]'
                  }`}
                >
                  <span className="block text-xs font-bold">{fmt.label}</span>
                  <span className="block text-[9px] opacity-75">{fmt.note}</span>
                </button>
              ))}
            </div>

            {/* Quality Slider (for WebP and JPEG) */}
            {outputFormat !== 'image/png' && (
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                    Quality
                  </span>
                  <span className="text-[11px] font-bold text-[#CA4639]">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-[#CA4639] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          {resizeResult && (
            <div
              className={`p-4 rounded-[26px] border text-center transition-all ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white/60 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-[#8A8A8A] font-bold uppercase tracking-wider">
                  Output Summary
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              </div>

              <div className="flex items-center justify-around py-2 border-y border-black/5 dark:border-white/10">
                <div>
                  <p className="text-[10px] text-[#8A8A8A] font-bold uppercase">Dimensions</p>
                  <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                    {resizeResult.width} × {resizeResult.height}
                  </p>
                </div>
                <div className="text-gray-300 dark:text-white/20">|</div>
                <div>
                  <p className="text-[10px] text-[#8A8A8A] font-bold uppercase">Est. File Size</p>
                  <p className="text-sm font-black text-[#CA4639]">
                    {formatBytes(resizeResult.newSize)}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isProcessing}
                className="mt-4 w-full py-3.5 rounded-2xl bg-[#CA4639] hover:bg-[#B53C30] text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Canvas...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Resized Image</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
