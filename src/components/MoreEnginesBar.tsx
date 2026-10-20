import React from 'react';
import { LayoutGrid, ChevronRight } from 'lucide-react';
import { playHaptic } from '../utils/audio';

interface MoreEnginesBarProps {
  darkMode: boolean;
  onOpenCatalog: () => void;
}

export const MoreEnginesBar: React.FC<MoreEnginesBarProps> = ({
  darkMode,
  onOpenCatalog,
}) => {
  return (
    <div className="px-4 mt-4">
      <button
        type="button"
        onClick={() => {
          playHaptic('pop');
          onOpenCatalog();
        }}
        className={`w-full h-[72px] rounded-[24px] px-4 flex items-center justify-between text-left transition-all duration-200 transform active:scale-[0.98] shadow-[0_12px_28px_rgba(202,70,57,0.32)] group ${
          darkMode ? 'bg-[#C33E32] hover:bg-[#B5352A]' : 'bg-[#CA4639] hover:bg-[#BF3E31]'
        }`}
      >
        {/* Left: 4-square grid icon container + Title/Subtitle */}
        <div className="flex items-center gap-3.5">
          {/* Grid icon 4 squares inside lighter red container */}
          <div className="w-[46px] h-[46px] rounded-[16px] bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <LayoutGrid className="w-5 h-5 text-white stroke-[2.2]" />
          </div>

          <div className="flex flex-col">
            <span className="text-white font-bold text-[16px] leading-tight">
              More Engines
            </span>
            <span className="text-white/70 text-[10px] font-semibold tracking-[0.14em] uppercase mt-0.5">
              FULL CATALOG
            </span>
          </div>
        </div>

        {/* Right: Subtle sleek chevron */}
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 group-hover:translate-x-0.5 transition-transform">
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </div>
      </button>
    </div>
  );
};
