import React, { useId } from 'react';

/**
 * Recovery Road brand mark — upward path + horizon (no “RR” initials).
 * Set color via className, e.g. `className="w-5 h-5 text-white"`.
 */
export function RecoveryRoadLogoMark({ className = '', title = 'Recovery Road' }) {
  const uid = useId().replace(/:/g, '');
  const shineId = `rr-shine-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={shineId} x1="6" y1="34" x2="34" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M17 32.5 C17 25.5 19.5 21 26.5 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
      <path
        d="M8 32.5 C8 22 12.5 17.5 20 14 C27.5 10.5 31.5 12.5 31.5 6.5"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 32.5 C8 22 12.5 17.5 20 14 C27.5 10.5 31.5 12.5 31.5 6.5"
        stroke={`url(#${shineId})`}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx="31.5" cy="6" r="3.25" fill="currentColor" />
      <circle cx="31.5" cy="6" r="1.35" fill="rgba(255,255,255,0.95)" />
    </svg>
  );
}

/** Sidebar / chrome: gradient tile + “Recovery Road” wordmark */
export function RecoveryRoadWordmark({ expanded = true, className = '', forceDark = false }) {
  const textMain = forceDark ? 'text-white' : 'text-gray-900 dark:text-white';
  const textRoad = forceDark ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400';

  if (!expanded) {
    return (
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-md ring-1 ring-black/15 ${className}`}
      >
        <RecoveryRoadLogoMark className="w-5 h-5 text-white" title="" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-md ring-1 ring-black/15">
        <RecoveryRoadLogoMark className="w-5 h-5 text-white" title="" />
      </div>
      <span className={`text-lg font-bold tracking-tight leading-tight ${textMain}`}>
        <span className="font-extrabold">Recovery</span>
        <span className={`font-semibold ${textRoad}`}> Road</span>
      </span>
    </div>
  );
}

export default RecoveryRoadLogoMark;
