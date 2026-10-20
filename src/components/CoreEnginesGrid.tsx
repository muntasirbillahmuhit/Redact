import React from 'react';
import { Layers, Zap, Scissors, Lock } from 'lucide-react';
import { CoreEngineId } from '../types';
import { playHaptic } from '../utils/audio';

interface CoreEnginesGridProps {
  darkMode: boolean;
  onSelectEngine: (engineId: CoreEngineId) => void;
}

interface EngineItem {
  id: CoreEngineId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export const CoreEnginesGrid: React.FC<CoreEnginesGridProps> = ({
  darkMode,
  onSelectEngine,
}) => {
  const engines: EngineItem[] = [
    {
      id: 'merge',
      title: 'Merge',
      subtitle: 'COMBINE',
      icon: <Layers className="w-5 h-5 text-[#DF3D30] stroke-[2.2]" />,
    },
    {
      id: 'compress',
      title: 'Compress',
      subtitle: 'OPTIMIZE',
      icon: <Zap className="w-5 h-5 text-[#DF3D30] stroke-[2.2]" />,
    },
    {
      id: 'split',
      title: 'Split',
      subtitle: 'EXTRACT',
      icon: <Scissors className="w-5 h-5 text-[#DF3D30] stroke-[2.2]" />,
    },
    {
      id: 'protect',
      title: 'Protect',
      subtitle: 'SECURE',
      icon: <Lock className="w-5 h-5 text-[#DF3D30] stroke-[2.2]" />,
    },
  ];

  return (
    <div className="mt-5">
      {/* 3. SECTION LABEL: CORE ENGINES */}
      <div className="px-5 mb-3">
        <span className="text-[10px] font-bold text-[#8A8A8A] tracking-[1.5px] uppercase">
          CORE ENGINES
        </span>
      </div>

      {/* 4. CORE ENGINES GRID - 2x2 with FULL LIQUID GLASS */}
      <div className="px-4 grid grid-cols-2 gap-3.5">
        {engines.map((engine) => (
          <button
            key={engine.id}
            type="button"
            onClick={() => {
              playHaptic('pop');
              onSelectEngine(engine.id);
            }}
            className={`relative h-[130px] rounded-[24px] p-4 flex flex-col justify-between text-left transition-all duration-200 transform active:scale-95 group overflow-hidden ${
              darkMode ? 'liquid-glass-dark' : 'liquid-glass'
            }`}
          >
            {/* Top specular reflection shimmer overlay */}
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-[24px]" />

            {/* Top Left: Icon container 36x36 radius 12px background #F9E4E3, icon #DF3D30 size 20px */}
            <div
              className={`w-9 h-9 rounded-[12px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                darkMode ? 'bg-[#3D2527]' : 'bg-[#F9E4E3]'
              }`}
            >
              {engine.icon}
            </div>

            {/* Bottom: Title bold 16px #121212, Subtitle 10px #8A8A8A uppercase */}
            <div className="flex flex-col">
              <span
                className={`font-bold text-[16px] leading-tight tracking-tight ${
                  darkMode ? 'text-white' : 'text-[#121212]'
                }`}
              >
                {engine.title}
              </span>
              <span className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-[0.06em] mt-0.5">
                {engine.subtitle}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
