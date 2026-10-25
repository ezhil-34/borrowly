import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-8 left-1/2 z-[70] -translate-x-1/2 transform rounded-2xl bg-[#232826]/95 px-5 py-3 text-sm font-medium text-white shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-lime animate-ping" />
        <span>{message}</span>
      </div>
    </div>
  );
}
