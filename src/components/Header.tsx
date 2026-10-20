import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { playHaptic } from '../utils/audio';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sessionActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  sessionActive = true,
}) => {
  return (
    <header
      style={{ paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))' }}
      className="px-5 pb-2 flex items-center justify-between transition-colors duration-300 flex-shrink-0 z-20"
    >
      {/* Left: Red Paper Plane + Redact + Green Dot + SECURE ENGINE */}
      <div className="flex items-center gap-2.5">
        {/* Origami Dart Paper Plane Icon */}
        <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <svg
            width="26"
            height="22"
            viewBox="0 0 28 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform -rotate-6 transition-transform hover:rotate-0 duration-300 drop-shadow-sm"
          >
            {/* Top red aerodynamic facet */}
            <path
              d="M2 12.5L26 2L15 22L12 13.5L2 12.5Z"
              fill="#CA4639"
            />
            {/* Dark stealth underbody facet */}
            <path
              d="M2 12.5L12 13.5L15 22L11 17L2 12.5Z"
              fill="#181415"
            />
            {/* Fold spine highlight */}
            <path
              d="M26 2L12 13.5"
              stroke="white"
              strokeWidth="0.8"
              strokeOpacity="0.45"
            />
          </svg>
        </div>

        {/* Brand Text & Status */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black text-[20px] tracking-tight transition-colors duration-200 ${
                darkMode ? 'text-white' : 'text-[#121212]'
              }`}
            >
              Redact
            </span>
            {/* Active green status indicator */}
            <span className="relative flex h-2 w-2">
              {sessionActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
            </span>
          </div>
          <span className="text-[8px] font-black tracking-[0.22em] text-[#CA4639] uppercase mt-0.5">
            SECURE ENGINE
          </span>
        </div>
      </div>

      {/* Right: Dark mode toggle inside light circle #EEEDE8 */}
      <button
        type="button"
        onClick={() => {
          playHaptic('toggle');
          onToggleDarkMode();
        }}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm ${
          darkMode
            ? 'bg-[#2A1F21] text-amber-300 hover:bg-[#342729] border border-white/10'
            : 'bg-[#EEEDE8] text-[#121212] hover:bg-[#E5E3DC]'
        }`}
      >
        {darkMode ? (
          <Sun className="w-5 h-5 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-300 hover:-rotate-12" />
        )}
      </button>
    </header>
  );
};
