import React from 'react';

interface TooltipProps {
  text: string;
  /** Alignement horizontal de l'info-bulle par rapport au déclencheur. */
  align?: 'center' | 'end';
  className?: string;
  children: React.ReactNode;
}

/**
 * Info-bulle CSS visible au survol et au focus clavier (contrairement à `title`).
 * Elle est masquée aux lecteurs d'écran : le déclencheur doit déjà porter un nom accessible.
 */
export const Tooltip: React.FC<TooltipProps> = ({ text, align = 'center', className = '', children }) => (
  <span className={`group/tip relative inline-flex ${className}`}>
    {children}
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-full z-50 mt-2 w-max max-w-56 rounded-md border border-white/10 bg-night-800 px-2.5 py-1.5 text-2xs font-medium text-mist-100 opacity-0 shadow-raise transition-opacity duration-150 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100 ${
        align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'
      }`}
    >
      {text}
    </span>
  </span>
);
