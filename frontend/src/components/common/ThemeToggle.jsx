import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = 'w-10 h-10' }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center justify-center shrink-0 rounded-xl border transition-colors ${
        isDark
          ? 'border-slate-600 bg-slate-800 text-amber-300 hover:bg-slate-700'
          : 'border-gray-200 bg-white text-slate-600 shadow-sm hover:bg-gray-50'
      } ${className}`}
    >
      {isDark ? <FaSun className="text-lg" aria-hidden /> : <FaMoon className="text-lg" aria-hidden />}
    </button>
  );
}
