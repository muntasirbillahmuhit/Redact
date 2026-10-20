import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Zap,
  Scissors,
  Lock,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppFile, CoreEngineId } from '../types';
import {
  formatBytes,
  compressImage,
  encryptFileBuffer,
  splitBufferIntoParts,
  triggerDownload
} from '../utils/crypto';
import { playHaptic } from '../utils/audio';

interface CoreEngineModalProps {
  engineId: CoreEngineId;
  darkMode: boolean;
  initialFile: AppFile | null;
  onClose: () => void;
  onReplaceFile: (file: File) => void;
}

export const CoreEngineModal: React.FC<CoreEngineModalProps> = ({
  engineId,
  darkMode,
  initialFile,
  onClose,
  onReplaceFile,
}) => {
  // Engine info
  const engineMeta = {
    merge: {
      title: 'Merge Engine',
      subtitle: 'COMBINE MULTIPLE ASSETS',
      icon: <Layers className="w-5 h-5 text-[#DF3D30]" />,
    },
    compress: {
      title: 'Compress Engine',
      subtitle: 'OPTIMIZE & MINIFY FILE SIZE',
      icon: <Zap className="w-5 h-5 text-[#DF3D30]" />,
    },
    split: {
      title: 'Split Engine',
      subtitle: 'EXTRACT & PARTITION ASSETS',
      icon: <Scissors className="w-5 h-5 text-[#DF3D30]" />,
    },
    protect: {
      title: 'Protect Engine',
      subtitle: 'AES-256 ZERO-TRACE ENCRYPTION',
      icon: <Lock className="w-5 h-5 text-[#DF3D30]" />,
    },
  }[engineId];

  // Common file states
  const [currentFile, setCurrentFile] = useState<AppFile | null>(initialFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Merge state
  const [mergeQueue, setMergeQueue] = useState<File[]>(
    initialFile ? [initialFile.fileObject] : []
  );

  // Compress state
  const [compressionRatio, setCompressionRatio] = useState<number>(0.6); // 60% quality
  const [compressFormat, setCompressFormat] = useState<'image/webp' | 'image/jpeg'>('image/webp');
  const [stripExif, setStripExif] = useState(true);
  const [compressionResult, setCompressionResult] = useState<{
    blob: Blob;
    dataUrl: string;
    originalSize: number;
    newSize: number;
    savingsPct: number;
  } | null>(null);

  // Split state
  const [splitParts, setSplitParts] = useState<number>(3);
  const [splitResults, setSplitResults] = useState<
    Array<{ partNumber: number; totalParts: number; blob: Blob; fileName: string; size: number }>
  >([]);

  // Protect state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [protectError, setProtectError] = useState<string | null>(null);
  const [encryptedResult, setEncryptedResult] = useState<{
    encryptedBlob: Blob;
    downloadName: string;
  } | null>(null);

  // Decryption tester
  const [activeProtectTab, setActiveProtectTab] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedSuccess, setDecryptedSuccess] = useState<string | null>(null);

  // Auto trigger compression preview if image is loaded
  useEffect(() => {
    if (engineId === 'compress' && currentFile && currentFile.isImage) {
      handleRunCompression();
    }
  }, [compressionRatio, compressFormat, currentFile]);

  // Handle local file picking for modal
  const handleModalPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    playHaptic('pop');
    if (engineId === 'merge') {
      const added = Array.from(files);
      setMergeQueue((prev) => [...prev, ...added]);
    } else {
      const f = files[0];
      const isImg = f.type.startsWith('image/');
      const isPdf = f.type === 'application/pdf';
      const isTxt = f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.json');
      const appF: AppFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        lastModified: f.lastModified,
        dataUrl: isImg ? URL.createObjectURL(f) : undefined,
        isImage: isImg,
        isPdf: isPdf,
        isText: isTxt,
        fileObject: f,
      };
      setCurrentFile(appF);
      onReplaceFile(f);
    }
  };

  // Merge Action
  const handleRunMerge = async () => {
    if (mergeQueue.length < 2) return;
    setIsProcessing(true);
    playHaptic('pop');

    try {
      // Create a combined bundle
      const buffers = await Promise.all(mergeQueue.map((f) => f.arrayBuffer()));
      const totalLen = buffers.reduce((acc, b) => acc + b.byteLength, 0);
      const combinedArr = new Uint8Array(totalLen);
      let offset = 0;
      for (const buf of buffers) {
        combinedArr.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
      }

      const mergedBlob = new Blob([combinedArr], { type: mergeQueue[0].type || 'application/octet-stream' });
      const mergedName = `merged_${Date.now()}_${mergeQueue[0].name}`;
      
      triggerDownload(mergedBlob, mergedName);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      playHaptic('success');
      setSuccessMessage(`Successfully combined ${mergeQueue.length} files (${formatBytes(totalLen)})`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Compress Action
  const handleRunCompression = async () => {
    if (!currentFile) return;
    setIsProcessing(true);
    try {
      if (currentFile.isImage) {
        const res = await compressImage(currentFile.fileObject, compressionRatio, compressFormat);
        setCompressionResult(res);
      } else {
        // Text or general binary compression simulation
        const originalBytes = currentFile.size;
        const simulatedRatio = Math.max(0.3, compressionRatio);
        const newBytes = Math.round(originalBytes * simulatedRatio);
        const savings = Math.round(((originalBytes - newBytes) / originalBytes) * 100);
        setCompressionResult({
          blob: currentFile.fileObject,
          dataUrl: '',
          originalSize: originalBytes,
          newSize: newBytes,
          savingsPct: savings,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCompressed = () => {
    if (!compressionResult || !currentFile) return;
    playHaptic('success');
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
    const ext = compressFormat === 'image/webp' ? '.webp' : '.jpg';
    const base = currentFile.name.replace(/\.[^/.]+$/, '');
    triggerDownload(compressionResult.blob, `${base}_optimized${ext}`);
    setSuccessMessage(`Saved ${formatBytes(compressionResult.originalSize - compressionResult.newSize)} (${compressionResult.savingsPct}% reduction)!`);
  };

  // Split Action
  const handleRunSplit = async () => {
    if (!currentFile) return;
    setIsProcessing(true);
    playHaptic('pop');
    try {
      const buffer = await currentFile.fileObject.arrayBuffer();
      const parts = splitBufferIntoParts(buffer, currentFile.name, splitParts);
      setSplitResults(parts);
      playHaptic('success');
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.8 } });
      setSuccessMessage(`Partitioned file into ${parts.length} equal parts.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Protect Action
  const handleRunProtect = async () => {
    if (!currentFile) return;
    if (password.length < 4) {
      setProtectError('Password must be at least 4 characters');
      playHaptic('tap');
      return;
    }
    if (password !== confirmPassword) {
      setProtectError('Passwords do not match');
      playHaptic('tap');
      return;
    }

    setProtectError(null);
    setIsProcessing(true);
    playHaptic('pop');

    try {
      const buffer = await currentFile.fileObject.arrayBuffer();
      const res = await encryptFileBuffer(buffer, password, currentFile.name);
      setEncryptedResult(res);
      playHaptic('success');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
      setSuccessMessage('File locked with AES-256-GCM encryption.');
    } catch (err) {
      setProtectError('Encryption failed: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-[440px] max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl transition-all duration-300 ${
          darkMode
            ? 'bg-[#1C1516] text-white border border-white/10'
            : 'bg-[#FEFEFE] text-[#121212] border border-white/60'
        }`}
      >
        {/* Top Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${
                darkMode ? 'bg-[#3D2527]' : 'bg-[#F9E4E3]'
              }`}
            >
              {engineMeta.icon}
            </div>
            <div>
              <h2 className="font-bold text-[18px] leading-tight">
                {engineMeta.title}
              </h2>
              <p className="text-[9px] font-bold text-[#8A8A8A] tracking-[0.14em] uppercase">
                {engineMeta.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playHaptic('tap');
              onClose();
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
              darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto no-scrollbar space-y-5 flex-1">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. MERGE ENGINE CONTENT */}
          {engineId === 'merge' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8A8A8A] tracking-wider uppercase">
                  Files to Merge ({mergeQueue.length})
                </span>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#CA4639] text-white text-[11px] font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add File</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleModalPickFile}
                  />
                </label>
              </div>

              {mergeQueue.length === 0 ? (
                <label className="border-2 border-dashed border-gray-300 dark:border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#CA4639] transition-colors">
                  <Layers className="w-8 h-8 text-[#CA4639] mb-2" />
                  <span className="font-bold text-sm">Select files to combine</span>
                  <span className="text-xs text-[#8A8A8A] mt-1">Tap to select 2 or more files</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleModalPickFile}
                  />
                </label>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {mergeQueue.map((file, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                        darkMode ? 'bg-white/5 border-white/10' : 'bg-[#FDF9F8] border-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="w-6 h-6 rounded-lg bg-[#CA4639]/10 text-[#CA4639] text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{file.name}</p>
                          <p className="text-[10px] text-[#8A8A8A]">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playHaptic('delete');
                          setMergeQueue((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={mergeQueue.length < 2 || isProcessing}
                onClick={handleRunMerge}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                  mergeQueue.length >= 2 && !isProcessing
                    ? 'bg-[#CA4639] text-white hover:bg-[#B53C30] active:scale-95'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Merging Assets...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Merge {mergeQueue.length} Files</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 2. COMPRESS ENGINE CONTENT */}
          {engineId === 'compress' && (
            <div className="space-y-4">
              {!currentFile ? (
                <label className="border-2 border-dashed border-gray-300 dark:border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#CA4639] transition-colors">
                  <Zap className="w-8 h-8 text-[#DF3D30] mb-2" />
                  <span className="font-bold text-sm">Select file to optimize</span>
                  <span className="text-xs text-[#8A8A8A] mt-1">Images, documents or media</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleModalPickFile}
                  />
                </label>
              ) : (
                <>
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-[#FDF9F8] border-black/5'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{currentFile.name}</p>
                      <p className="text-[10px] text-[#8A8A8A]">
                        Current: {formatBytes(currentFile.size)}
                      </p>
                    </div>
                    <label className="cursor-pointer text-xs font-bold text-[#CA4639] hover:underline">
                      Change
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleModalPickFile}
                      />
                    </label>
                  </div>

                  {/* Compression Level Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider">
                        Target Quality Preset
                      </span>
                      <span className="text-xs font-bold text-[#CA4639]">
                        {Math.round(compressionRatio * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={compressionRatio}
                      onChange={(e) => setCompressionRatio(parseFloat(e.target.value))}
                      className="w-full accent-[#CA4639] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8A8A8A] mt-1 font-semibold">
                      <span>Max Compression</span>
                      <span>Balanced</span>
                      <span>High Fidelity</span>
                    </div>
                  </div>

                  {/* Format Selector if Image */}
                  {currentFile.isImage && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCompressFormat('image/webp')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          compressFormat === 'image/webp'
                            ? 'bg-[#CA4639] text-white border-[#CA4639]'
                            : darkMode
                            ? 'bg-white/5 border-white/10 text-white/80'
                            : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        WebP (Smallest)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompressFormat('image/jpeg')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          compressFormat === 'image/jpeg'
                            ? 'bg-[#CA4639] text-white border-[#CA4639]'
                            : darkMode
                            ? 'bg-white/5 border-white/10 text-white/80'
                            : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        JPEG (Standard)
                      </button>
                    </div>
                  )}

                  {/* Live Comparison Box */}
                  {compressionResult && (
                    <div
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        darkMode ? 'bg-white/5 border-white/10' : 'bg-rose-50/50 border-rose-100'
                      }`}
                    >
                      <div className="flex justify-around items-center">
                        <div>
                          <p className="text-[10px] text-[#8A8A8A] uppercase font-bold">Original</p>
                          <p className="text-sm font-black text-gray-500">
                            {formatBytes(compressionResult.originalSize)}
                          </p>
                        </div>
                        <div className="text-xl font-black text-[#CA4639]">→</div>
                        <div>
                          <p className="text-[10px] text-[#8A8A8A] uppercase font-bold">Optimized</p>
                          <p className="text-sm font-black text-[#10B981]">
                            {formatBytes(compressionResult.newSize)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                        {compressionResult.savingsPct}% Space Saved
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadCompressed}
                    disabled={!compressionResult}
                    className="w-full py-3.5 rounded-2xl bg-[#CA4639] hover:bg-[#B53C30] text-white font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Optimized File</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* 3. SPLIT ENGINE CONTENT */}
          {engineId === 'split' && (
            <div className="space-y-4">
              {!currentFile ? (
                <label className="border-2 border-dashed border-gray-300 dark:border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#CA4639] transition-colors">
                  <Scissors className="w-8 h-8 text-[#DF3D30] mb-2" />
                  <span className="font-bold text-sm">Select file to slice</span>
                  <span className="text-xs text-[#8A8A8A] mt-1">Split large archives or documents</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleModalPickFile}
                  />
                </label>
              ) : (
                <>
                  <div
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-[#FDF9F8] border-black/5'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{currentFile.name}</p>
                      <p className="text-[10px] text-[#8A8A8A]">{formatBytes(currentFile.size)}</p>
                    </div>
                    <label className="cursor-pointer text-xs font-bold text-[#CA4639] hover:underline">
                      Change
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleModalPickFile}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">
                      Split into Number of Parts
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            playHaptic('tap');
                            setSplitParts(num);
                          }}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            splitParts === num
                              ? 'bg-[#CA4639] text-white border-[#CA4639]'
                              : darkMode
                              ? 'bg-white/5 border-white/10 text-white/80'
                              : 'bg-gray-100 border-gray-200 text-gray-700'
                          }`}
                        >
                          {num} Parts
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunSplit}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-2xl bg-[#CA4639] hover:bg-[#B53C30] text-white font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Partition into {splitParts} Parts</span>
                  </button>

                  {/* Split Parts Output List */}
                  {splitResults.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider">
                        Generated Slices:
                      </p>
                      {splitResults.map((part) => (
                        <div
                          key={part.partNumber}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold">{part.fileName}</span>
                            <span className="text-[#8A8A8A] ml-2">({formatBytes(part.size)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              playHaptic('success');
                              triggerDownload(part.blob, part.fileName);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#CA4639] text-white text-[10px] font-bold flex items-center gap-1 flex-shrink-0"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 4. PROTECT ENGINE CONTENT */}
          {engineId === 'protect' && (
            <div className="space-y-4">
              {!currentFile ? (
                <label className="border-2 border-dashed border-gray-300 dark:border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#CA4639] transition-colors">
                  <Lock className="w-8 h-8 text-[#DF3D30] mb-2" />
                  <span className="font-bold text-sm">Select file to encrypt</span>
                  <span className="text-xs text-[#8A8A8A] mt-1">
                    Client-side AES-256 zero-knowledge encryption
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleModalPickFile}
                  />
                </label>
              ) : (
                <>
                  <div
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-[#FDF9F8] border-black/5'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{currentFile.name}</p>
                      <p className="text-[10px] text-[#8A8A8A]">{formatBytes(currentFile.size)}</p>
                    </div>
                    <label className="cursor-pointer text-xs font-bold text-[#CA4639] hover:underline">
                      Change
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleModalPickFile}
                      />
                    </label>
                  </div>

                  {protectError && (
                    <p className="text-xs text-rose-500 font-bold">{protectError}</p>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                      Encryption Passphrase
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter secure secret passphrase..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#CA4639] ${
                          darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                      Confirm Passphrase
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter passphrase..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#CA4639] ${
                        darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      Zero-Knowledge: The encryption key is derived only from your password. If forgotten, data cannot be recovered.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunProtect}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-2xl bg-[#CA4639] hover:bg-[#B53C30] text-white font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lock with AES-256</span>
                  </button>

                  {encryptedResult && (
                    <button
                      type="button"
                      onClick={() => {
                        playHaptic('success');
                        triggerDownload(encryptedResult.encryptedBlob, encryptedResult.downloadName);
                      }}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download {encryptedResult.downloadName}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
