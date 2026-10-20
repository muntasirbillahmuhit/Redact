import React from 'react';

interface PhoneContainerProps {
  children: React.ReactNode;
  darkMode: boolean;
}

export const PhoneContainer: React.FC<PhoneContainerProps> = ({
  children,
  darkMode,
}) => {
  return (
    <div
      className={`min-h-[100dvh] w-full flex justify-center transition-colors duration-500 overflow-x-hidden ${
        darkMode ? 'bg-[#120E0F]' : 'bg-[#E7C7C1]'
      }`}
    >
      {/* Main Responsive App Container - Natural native full layout without smartphone frame */}
      <div
        className={`relative w-full max-w-[480px] min-h-[100dvh] h-[100dvh] flex flex-col transition-colors duration-300 overflow-hidden shadow-2xl ${
          darkMode ? 'bg-[#161112]' : 'bg-[#EDD4CF]'
        }`}
      >
        {/* Ambient Liquid Light Blobs for frosted liquid glass refraction */}
        <div className="absolute top-12 -left-16 w-60 h-60 rounded-full bg-[#E5B5AC]/70 dark:bg-[#3D2527]/50 blur-3xl pointer-events-none" />
        <div className="absolute top-64 -right-12 w-64 h-64 rounded-full bg-[#E9BDB5]/70 dark:bg-[#4A2629]/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-28 left-6 w-72 h-60 rounded-full bg-[#E0ADA3]/60 dark:bg-[#2B1B1C]/60 blur-3xl pointer-events-none" />

        {/* App Content */}
        <div className="relative flex-1 w-full flex flex-col overflow-hidden z-10">
          {children}
        </div>
      </div>
    </div>
  );
};
