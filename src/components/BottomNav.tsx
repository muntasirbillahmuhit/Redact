import React from 'react';
import { Home, LayoutGrid, Heart, Settings } from 'lucide-react';
import { NavTabId } from '../types';
import { playHaptic } from '../utils/audio';

interface BottomNavProps {
  darkMode: boolean;
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  favouriteCount?: number;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  darkMode,
  activeTab,
  onTabChange,
  favouriteCount = 0,
}) => {
  const items: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (active) => (
        <Home
          className={`w-6 h-6 stroke-[2.2] transition-colors duration-200 ${
            active
              ? 'text-[#DF3D30]'
              : darkMode
              ? 'text-[#8A8A8A] group-hover:text-white'
              : 'text-[#8A8A8A] group-hover:text-[#121212]'
          }`}
        />
      ),
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: (active) => (
        <LayoutGrid
          className={`w-6 h-6 stroke-[2.2] transition-colors duration-200 ${
            active
              ? 'text-[#DF3D30]'
              : darkMode
              ? 'text-[#8A8A8A] group-hover:text-white'
              : 'text-[#8A8A8A] group-hover:text-[#121212]'
          }`}
        />
      ),
    },
    {
      id: 'favourite',
      label: 'Favourite',
      icon: (active) => (
        <div className="relative">
          <Heart
            className={`w-6 h-6 stroke-[2.2] transition-colors duration-200 ${
              active
                ? 'text-[#DF3D30] fill-[#DF3D30]'
                : darkMode
                ? 'text-[#8A8A8A] group-hover:text-white'
                : 'text-[#8A8A8A] group-hover:text-[#121212]'
            }`}
          />
          {favouriteCount > 0 && !active && (
            <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#CA4639] text-white text-[9px] font-bold flex items-center justify-center">
              {favouriteCount}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (active) => (
        <Settings
          className={`w-6 h-6 stroke-[2.2] transition-colors duration-200 ${
            active
              ? 'text-[#DF3D30]'
              : darkMode
              ? 'text-[#8A8A8A] group-hover:text-white'
              : 'text-[#8A8A8A] group-hover:text-[#121212]'
          }`}
        />
      ),
    },
  ];

  return (
    <div
      style={{
        bottom: 'calc(var(--nav-bottom, 16px) + env(safe-area-inset-bottom, 0px))',
      }}
      className="fixed inset-x-0 flex justify-center pointer-events-none z-30 px-5"
    >
      <nav
        aria-label="Bottom Navigation"
        style={{
          height: 'var(--nav-height, 80px)',
        }}
        className={`w-full max-w-[380px] rounded-[32px] px-3 flex items-center justify-around pointer-events-auto transition-all duration-300 ${
          darkMode ? 'liquid-nav-glass-dark' : 'liquid-nav-glass'
        }`}
      >
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!isActive) {
                  playHaptic('tap');
                  onTabChange(item.id);
                }
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 group transition-transform active:scale-90"
            >
              {/* Icon Container with active glow aura matching reference image */}
              <div
                className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200 ${
                  isActive
                    ? darkMode
                      ? 'bg-[#3D2527]'
                      : 'bg-[#F9E4E3]'
                    : 'bg-transparent'
                }`}
              >
                {item.icon(isActive)}
              </div>

              {/* Text Label */}
              <span
                className={`text-[10px] mt-1 transition-colors duration-200 ${
                  isActive
                    ? 'font-bold text-[#DF3D30]'
                    : darkMode
                    ? 'font-medium text-[#8A8A8A] group-hover:text-white'
                    : 'font-medium text-[#8A8A8A] group-hover:text-[#121212]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
