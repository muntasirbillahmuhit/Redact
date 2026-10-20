import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { AppFile, SecuritySession } from '../types';
import { formatBytes } from '../utils/crypto';
import { playHaptic } from '../utils/audio';

interface HeroCardProps {
  darkMode: boolean;
  selectedFile: AppFile | null;
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
  session: SecuritySession;
  onStartSession: () => void;
  onOpenResizer?: () => void;
  onOpenConverter?: () => void;
  onOpenPdfTools?: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  darkMode,
  selectedFile,
  onFileSelect,
  onClearFile,
  session,
  onStartSession,
  onOpenResizer,
  onOpenConverter,
  onOpenPdfTools,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent triggering file picker if clicking on the START SESSION pill or clear button
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    playHaptic('tap');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      playHaptic('pop');
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      playHaptic('pop');
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="px-4 mt-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onClick={handleCardClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full h-[184px] rounded-[28px] p-5 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 transform active:scale-[0.99] group ${
          isDragging
            ? 'scale-[1.01] ring-2 ring-[#CA4639]'
            : ''
        } ${
          darkMode
            ? 'bg-[#231A1B] text-white shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10'
            : 'bg-[#FEFEFE] text-[#121212] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/60'
        }`}
      >
        {/* Top Row: Upload Icon Container (Left) + START SESSION Pill (Right) */}
        <div className="flex items-center justify-between w-full">
          {/* Upload icon inside light pink rounded square #F9E4E3 */}
          <div
            className={`w-[52px] h-[52px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
              darkMode ? 'bg-[#3D2527]' : 'bg-[#F9E4E3]'
            }`}
          >
            <Upload
              className={`w-6 h-6 stroke-[2.2] ${
                darkMode ? 'text-white' : 'text-[#121212]'
              }`}
            />
          </div>

          {/* Pill button: START SESSION */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartSession();
            }}
            className={`px-[18px] py-[10px] rounded-[20px] font-bold text-[10px] tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-1.5 ${
              session.isActive
                ? 'bg-[#10B981] text-white hover:bg-[#0EA271]'
                : 'bg-[#CA4639] text-white hover:bg-[#B83C30]'
            }`}
          >
            {session.isActive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SESSION ACTIVE</span>
              </>
            ) : (
              <span>START SESSION</span>
            )}
          </button>
        </div>

        {/* Bottom Section: Title & Subtitle or Loaded File Badge */}
        <div className="flex flex-col">
          {selectedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-white/10 text-[#CA4639]' : 'bg-[#F9E4E3] text-[#CA4639]'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h3
                    className={`font-bold text-[20px] truncate leading-tight ${
                      darkMode ? 'text-white' : 'text-[#121212]'
                    }`}
                  >
                    {selectedFile.name}
                  </h3>
                  <p className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-[0.05em] mt-0.5">
                    {formatBytes(selectedFile.size)} • READY FOR CORE ENGINE
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {selectedFile.isPdf && onOpenPdfTools && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playHaptic('pop');
                      onOpenPdfTools();
                    }}
                    className="px-2 py-1 rounded-lg bg-[#CA4639] hover:bg-[#B53C30] text-white text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                  >
                    <span>To Images</span>
                  </button>
                )}

                {selectedFile.isImage && onOpenPdfTools && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playHaptic('pop');
                      onOpenPdfTools();
                    }}
                    className="px-2 py-1 rounded-lg bg-[#CA4639] hover:bg-[#B53C30] text-white text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                  >
                    <span>To PDF</span>
                  </button>
                )}

                {selectedFile.isImage && onOpenConverter && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playHaptic('pop');
                      onOpenConverter();
                    }}
                    className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-[#CA4639] hover:text-white text-gray-700 dark:text-white/80 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                  >
                    <span>Convert</span>
                  </button>
                )}

                {selectedFile.isImage && onOpenResizer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playHaptic('pop');
                      onOpenResizer();
                    }}
                    className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-[#CA4639] hover:text-white text-gray-700 dark:text-white/80 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                  >
                    <span>Resize</span>
                  </button>
                )}

                {/* Clear file button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playHaptic('delete');
                    onClearFile();
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    darkMode ? 'bg-white/10 hover:bg-white/20 text-white/70' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2
                className={`font-bold text-[28px] leading-tight tracking-tight ${
                  darkMode ? 'text-white' : 'text-[#121212]'
                }`}
              >
                Select File
              </h2>
              <p className="text-[10px] text-[#8A8A8A] font-semibold tracking-[0.5px] uppercase mt-1">
                TAP TO LOAD ANY FILE OR MEDIA FROM DEVICE
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
