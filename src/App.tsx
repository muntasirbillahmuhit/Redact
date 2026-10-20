import React from 'react';
import {
  Moon,
  Search,
  ChevronRight,
  Scaling,
  ArrowLeftRight,
  FileText,
  Zap,
  Layers,
  Scissors,
  Lock,
  Home,
  LayoutGrid,
  Heart,
  Settings,
} from 'lucide-react';

interface ToolItem {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const EDIT_TOOLS: ToolItem[] = [
  {
    id: 'resizer',
    name: 'Image Resizer',
    subtitle: 'Custom dimensions, aspect ratio lock, resolution presets',
    icon: Scaling,
  },
  {
    id: 'converter',
    name: 'Format Converter',
    subtitle: 'Convert between PNG, JPG, WEBP, HEIC, GIF & SVG',
    icon: ArrowLeftRight,
  },
  {
    id: 'pdf',
    name: 'PDF ↔ Image Suite',
    subtitle: 'Extract PDF pages as images or compile to PDF document',
    icon: FileText,
  },
  {
    id: 'compress',
    name: 'Compress Engine',
    subtitle: 'Reduce file size and strip metadata while keeping clarity',
    icon: Zap,
  },
  {
    id: 'merge',
    name: 'Merge Engine',
    subtitle: 'Combine multiple files or images into a single container',
    icon: Layers,
  },
  {
    id: 'split',
    name: 'Split Engine',
    subtitle: 'Slice files into secure partitions and chunks',
    icon: Scissors,
  },
  {
    id: 'protect',
    name: 'Protect Engine',
    subtitle: 'Zero-knowledge AES-256 client-side file encryption',
    icon: Lock,
  },
];

export default function App() {
  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-[#EDD4CF] overflow-x-hidden selection:bg-[#DF3D30]/20 selection:text-[#DF3D30]">
      {/* Phone Canvas Container */}
      <div className="relative w-full max-w-[440px] min-h-[100dvh] flex flex-col bg-[#EDD4CF] overflow-hidden">
        
        {/* Soft Ambient Liquid Glass Glows */}
        <div className="absolute top-10 -left-16 w-56 h-56 rounded-full bg-[#E5B5AC]/60 blur-3xl pointer-events-none" />
        <div className="absolute top-72 -right-12 w-64 h-64 rounded-full bg-[#E9BDB5]/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-28 left-4 w-60 h-60 rounded-full bg-[#E0ADA3]/50 blur-3xl pointer-events-none" />

        {/* Scrollable Screen Content */}
        <div className="relative flex-1 flex flex-col pb-[110px] z-10 overflow-y-auto no-scrollbar">
          
          {/* Header */}
          <header className="px-5 pt-4 pb-1 flex items-center justify-between flex-shrink-0">
            {/* Left: Redact Logo + Text + Status */}
            <div className="flex items-center gap-2.5">
              {/* Origami Dart Paper Plane Icon */}
              <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
                <svg
                  width="26"
                  height="22"
                  viewBox="0 0 28 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transform -rotate-6 drop-shadow-sm"
                >
                  <path
                    d="M2 12.5L26 2L15 22L12 13.5L2 12.5Z"
                    fill="#DF3D30"
                  />
                  <path
                    d="M2 12.5L12 13.5L15 22L11 17L2 12.5Z"
                    fill="#121212"
                  />
                  <path
                    d="M26 2L12 13.5"
                    stroke="#FEFEFE"
                    strokeWidth="0.8"
                    strokeOpacity="0.45"
                  />
                </svg>
              </div>

              {/* Brand Text */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-[20px] text-[#121212] tracking-tight">
                    Redact
                  </span>
                  {/* Green Dot */}
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                  </span>
                </div>
                <span className="text-[8.5px] font-bold tracking-[0.22em] text-[#DF3D30] uppercase mt-0.5">
                  SECURE ENGINE
                </span>
              </div>
            </div>

            {/* Right: Dark mode toggle moon icon in light grey circle */}
            <div className="w-10 h-10 rounded-full bg-[#FEFEFE]/60 backdrop-blur-md border border-[#FEFEFE]/70 flex items-center justify-center shadow-xs">
              <Moon className="w-5 h-5 text-[#121212]" />
            </div>
          </header>

          {/* Title: "All Tools" 36px extra bold black */}
          <div className="px-5 mt-4 mb-3">
            <h1 className="text-[36px] font-black text-[#121212] tracking-tight leading-tight">
              All Tools
            </h1>
          </div>

          {/* Search Bar */}
          <div className="px-4 mb-5">
            <div
              className="w-full h-[56px] rounded-[28px] flex items-center px-2.5 transition-all"
              style={{
                backgroundColor: 'rgba(254, 254, 254, 0.80)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(254, 254, 254, 0.65)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              }}
            >
              {/* Left search icon red inside light pink circle */}
              <div className="w-10 h-10 rounded-full bg-[#F9E4E3] flex items-center justify-center flex-shrink-0 mr-3">
                <Search className="w-5 h-5 text-[#DF3D30]" />
              </div>
              {/* Placeholder text */}
              <span className="text-[16px] text-[#8A8A8A] font-normal select-none">
                Search for a tool...
              </span>
            </div>
          </div>

          {/* Section Label: "EDIT TOOLS" 12px grey #8A8A8A tracking 2px, left margin 20px */}
          <div className="ml-5 mb-3">
            <span className="text-[12px] font-semibold text-[#8A8A8A] tracking-[2px] uppercase">
              EDIT TOOLS
            </span>
          </div>

          {/* List Cards */}
          <div className="px-4 flex flex-col gap-3">
            {EDIT_TOOLS.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="w-full h-[84px] rounded-[20px] flex items-center px-4 transition-all"
                  style={{
                    backgroundColor: 'rgba(254, 254, 254, 0.65)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    border: '1px solid rgba(254, 254, 254, 0.50)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* Left: Icon container 48x48 radius 14px background #F9E4E3, icon #DF3D30 red 22px */}
                  <div className="w-[48px] h-[48px] rounded-[14px] bg-[#F9E4E3] flex items-center justify-center flex-shrink-0 mr-3.5">
                    <IconComponent className="w-[22px] h-[22px] text-[#DF3D30]" />
                  </div>

                  {/* Middle: Title 15px bold #121212, subtitle 12px #8A8A8A one line truncate */}
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-[15px] font-bold text-[#121212] leading-tight truncate">
                      {tool.name}
                    </h3>
                    <p className="text-[12px] text-[#8A8A8A] truncate mt-0.5 leading-tight">
                      {tool.subtitle}
                    </p>
                  </div>

                  {/* Right: Chevron arrow > grey #8A8A8A 16px */}
                  <div className="flex items-center justify-center flex-shrink-0 ml-1">
                    <ChevronRight className="w-4 h-4 text-[#8A8A8A]" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom Nav: Floating pill glass white 85% + blur 20px, height 80px, radius 32px, width 90% centered */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-30">
          <nav
            aria-label="Primary"
            className="w-[90%] max-w-[390px] h-[80px] rounded-[32px] px-6 flex items-center justify-between pointer-events-auto"
            style={{
              backgroundColor: 'rgba(254, 254, 254, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(254, 254, 254, 0.65)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* 1. Home */}
            <div className="flex flex-col items-center justify-center gap-1 min-w-[56px]">
              <Home className="w-6 h-6 text-[#8A8A8A]" />
              <span className="text-[10px] font-medium text-[#8A8A8A]">
                Home
              </span>
            </div>

            {/* 2. Tools (Active Red) */}
            <div className="flex flex-col items-center justify-center gap-1 min-w-[56px]">
              <LayoutGrid className="w-6 h-6 text-[#DF3D30]" />
              <span className="text-[10px] font-bold text-[#DF3D30]">
                Tools
              </span>
            </div>

            {/* 3. Favourite */}
            <div className="flex flex-col items-center justify-center gap-1 min-w-[56px]">
              <Heart className="w-6 h-6 text-[#8A8A8A]" />
              <span className="text-[10px] font-medium text-[#8A8A8A]">
                Favourite
              </span>
            </div>

            {/* 4. Settings */}
            <div className="flex flex-col items-center justify-center gap-1 min-w-[56px]">
              <Settings className="w-6 h-6 text-[#8A8A8A]" />
              <span className="text-[10px] font-medium text-[#8A8A8A]">
                Settings
              </span>
            </div>
          </nav>
        </div>

      </div>
    </div>
  );
}
