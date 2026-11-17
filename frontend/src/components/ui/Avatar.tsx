import React from 'react';

export interface AvatarProps {
  name: string;
  seed?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_GRADIENTS: Record<string, string> = {
  felix: 'from-brand-600 via-iris-600 to-cyan-400 border-brand-400/30',
  anita: 'from-fuchsia-600 via-pink-600 to-rose-400 border-pink-400/30',
  alex: 'from-cyan-600 via-teal-600 to-emerald-400 border-cyan-400/30',
  sam: 'from-amber-600 via-orange-600 to-yellow-400 border-amber-400/30',
  zoe: 'from-blue-600 via-indigo-600 to-violet-400 border-indigo-400/30',
  rado: 'from-emerald-600 via-teal-600 to-lime-400 border-emerald-400/30',
};

const SIZES = {
  sm: 'size-10 text-lg rounded-xl',
  md: 'size-14 text-2xl md:size-16 md:text-3xl rounded-2xl',
  lg: 'size-18 text-3xl sm:size-20 rounded-2xl',
  xl: 'size-24 text-4xl sm:size-28 sm:text-5xl rounded-3xl',
} as const;

export const Avatar: React.FC<AvatarProps> = ({ name, seed = 'felix', size = 'md', className = '' }) => {
  const normalizedSeed = (seed || 'felix').toLowerCase();
  const gradientClass = AVATAR_GRADIENTS[normalizedSeed] || AVATAR_GRADIENTS.felix;

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center border bg-linear-to-br p-px font-display font-black text-white shadow-brand select-none ${gradientClass} ${SIZES[size]} ${className}`}
    >
      {name.trim() ? name.trim().charAt(0).toUpperCase() : 'C'}
    </span>
  );
};
