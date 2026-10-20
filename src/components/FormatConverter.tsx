import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftRight,
  Download,
  Upload,
  CheckCircle,
  FileImage,
  RefreshCw,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppFile } from '../types';
import { formatBytes, triggerDownload } from '../utils/crypto';
import { playHaptic } from '../utils/audio';
import {
  convertImageFile,
  detectFormat,
  isHeic,
  TargetFormat,
  ConversionResult
} from '../utils/converter';

interface FormatConverterProps {
  darkMode: boolean;
  initialFile: AppFile | null;
  onClose?: () => void;
  onFileChange?: (file: File) => void;
}

export const FormatConverter: React.FC<FormatConverterProps> = ({
  darkMode,
  initialFile,
  onClose,
  onFileChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFile, setActiveFile] = useState<File | null>(
    initialFile ? initialFile.fileObject : null
  );

  const [targetFormat, setTargetFormat] = useState<TargetFormat>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.92);
  const [fillColor, setFillColor] = useState<string>('#FFFFFF');

  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Auto select complementary target format based on source file
  useEffect(() => {
    if (activeFile) {
      const detected = detectFormat(activeFile);
      if (detected === 'PNG') {
        setTargetFormat('image/jpeg');
      } else if (detected === 'JPG' || detected === 'HEIC' || detected === 'HEIF') {
        setTargetFormat('image/png');
      } else if (detected === 'WEBP') {
        setTargetFormat('image/png');
      }
    }
  }, [activeFile]);

  // Run conversion
  const handleRunConversion = async () => {
    if (!activeFile) return;
    setIsConverting(true);
    setErrorMsg(null);
    setSuccessNote(null);
    playHaptic('pop');

    try {
      const res = await convertImageFile(activeFile, targetFormat, quality, fillColor);
      setConversionResult(res);
      playHaptic('success');
      setSuccessNote(`Successfully converted to ${res.targetExtension.toUpperCase()}!`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Conversion error: ' + String(err));
      playHaptic('delete');
    } finally {
      setIsConverting(false);
    }
  };

  // Auto run conversion when file or target format changes
  useEffect(() => {
    if (activeFile) {
      handleRunConversion();
    }
  }, [activeFile, targetFormat, quality, fillColor]);

  // Handle local file picking
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const f = files[0];
    playHaptic('pop');
    setActiveFile(f);
    if (onFileChange) onFileChange(f);
  };

  // Download converted result
  const handleDownload = () => {
    if (!conversionResult) return;
    playHaptic('success');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#CA4639', '#DF3D30', '#F9E4E3', '#FFFFFF'],
    });

    triggerDownload(conversionResult.blob, conversionResult.fileName);
    setSuccessNote(`Saved ${conversionResult.fileName}`);
  };

  const detectedSource = activeFile ? detectFormat(activeFile) : '';

  return (
    <div className="flex flex-col h-full px-4 pt-2 pb-6 space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
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
            <ArrowLeftRight className="w-5 h-5 text-[#DF3D30]" />
          </div>
          <div>
            <h2
              className={`font-black text-[20px] tracking-tight leading-tight ${
                darkMode ? 'text-white' : 'text-[#121212]'
              }`}
            >
              Format Converter
            </h2>
            <p className="text-[10px] font-bold text-[#8A8A8A] tracking-[0.16em] uppercase mt-0.5">
              PNG • JPG • HEIC • WEBP TRANSITIONS
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

      {/* Notifications */}
      {successNote && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate">{successNote}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in">
          {errorMsg}
        </div>
      )}

      {/* Upload Dropzone if no file */}
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
            <FileImage className="w-7 h-7 text-[#DF3D30]" />
          </div>
          <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            Select Image to Convert
          </h3>
          <p className="text-xs text-[#8A8A8A] mt-1 max-w-xs mb-4">
            Supports PNG, JPG, Apple HEIC / HEIF, WebP, SVG, and BMP.
          </p>

          {/* Quick presets badges */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-4 max-w-xs">
            {['PNG to JPG', 'HEIC to PNG', 'HEIC to JPG', 'JPG to PNG', 'WebP to PNG'].map((pill) => (
              <span
                key={pill}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#CA4639]/10 text-[#CA4639]"
              >
                {pill}
              </span>
            ))}
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-full bg-[#CA4639] hover:bg-[#B53C30] text-white text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
          >
            Load File to Convert
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Source File Badge & Transition Preview */}
          <div
            className={`p-4 rounded-[26px] ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                Current Asset
              </span>
              <button
                type="button"
                onClick={() => {
                  playHaptic('tap');
                  fileInputRef.current?.click();
                }}
                className="text-xs font-bold text-[#CA4639] hover:underline"
              >
                Change File
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* Left: Source Tag */}
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="w-10 h-10 rounded-xl bg-[#F9E4E3] dark:bg-[#3D2527] text-[#DF3D30] font-black text-xs flex items-center justify-center flex-shrink-0">
                  {detectedSource}
                </span>
                <div className="overflow-hidden truncate">
                  <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                    {activeFile.name}
                  </p>
                  <p className="text-[10px] text-[#8A8A8A] font-semibold">
                    {formatBytes(activeFile.size)}
                  </p>
                </div>
              </div>

              {/* Center Transition Arrow */}
              <div className="text-gray-400 font-bold px-1">→</div>

              {/* Right: Target Tag */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-[#CA4639] text-white font-black text-xs">
                  {targetFormat === 'image/jpeg' ? 'JPG' : targetFormat === 'image/png' ? 'PNG' : 'WEBP'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Target Format Selectors */}
          <div
            className={`p-4 rounded-[26px] space-y-3 ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block">
              Choose Target Format
            </span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'image/jpeg', label: 'JPG / JPEG', note: 'Universal compatibility' },
                { id: 'image/png', label: 'PNG', note: 'Lossless & Transparency' },
                { id: 'image/webp', label: 'WebP', note: 'High compression' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    playHaptic('tap');
                    setTargetFormat(fmt.id as TargetFormat);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-center border transition-all ${
                    targetFormat === fmt.id
                      ? 'bg-[#CA4639] text-white border-[#CA4639] shadow-sm'
                      : darkMode
                      ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                      : 'bg-white/60 border-black/5 text-[#121212] hover:bg-white'
                  }`}
                >
                  <span className="block text-xs font-black">{fmt.label}</span>
                  <span className="block text-[9px] opacity-75 mt-0.5">{fmt.note}</span>
                </button>
              ))}
            </div>

            {/* Quality Slider for JPEG / WebP */}
            {targetFormat !== 'image/png' && (
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                    Output Quality
                  </span>
                  <span className="text-[11px] font-bold text-[#CA4639]">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-[#CA4639] cursor-pointer"
                />
              </div>
            )}

            {/* Background Fill for JPG (to prevent black backgrounds on transparent PNGs) */}
            {targetFormat === 'image/jpeg' && (
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                  Transparent Matte Fill
                </span>
                <div className="flex gap-1.5">
                  {[
                    { label: 'White', color: '#FFFFFF' },
                    { label: 'Black', color: '#000000' },
                    { label: 'Beige', color: '#EDD4CF' },
                  ].map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setFillColor(c.color)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                        fillColor === c.color
                          ? 'bg-[#CA4639] text-white border-[#CA4639]'
                          : darkMode
                          ? 'bg-white/5 border-white/10 text-white/70'
                          : 'bg-white border-black/10 text-gray-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Result & Download Card */}
          {conversionResult && (
            <div
              className={`p-4 rounded-[26px] border text-center transition-all ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white/60 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-[#8A8A8A] font-bold uppercase tracking-wider">
                  Conversion Summary
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Converted</span>
                </span>
              </div>

              {/* Preview Thumbnail */}
              {conversionResult.dataUrl && (
                <div className="w-24 h-24 mx-auto mb-3 rounded-2xl overflow-hidden border border-black/10 dark:border-white/20 shadow-inner bg-checkerboard flex items-center justify-center">
                  <img
                    src={conversionResult.dataUrl}
                    alt="Converted output"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="flex items-center justify-around py-2 border-y border-black/5 dark:border-white/10">
                <div>
                  <p className="text-[10px] text-[#8A8A8A] font-bold uppercase">Original</p>
                  <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                    {conversionResult.sourceFormat} • {formatBytes(conversionResult.originalSize)}
                  </p>
                </div>
                <div className="text-gray-300 dark:text-white/20 font-bold">→</div>
                <div>
                  <p className="text-[10px] text-[#8A8A8A] font-bold uppercase">Converted</p>
                  <p className="text-xs font-black text-[#10B981]">
                    {conversionResult.targetExtension.toUpperCase().replace('.', '')} • {formatBytes(conversionResult.newSize)}
                  </p>
                </div>
              </div>

              {/* Download Action */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isConverting}
                className="mt-4 w-full py-3.5 rounded-2xl bg-[#CA4639] hover:bg-[#B53C30] text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Conversion...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download {conversionResult.fileName}</span>
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
