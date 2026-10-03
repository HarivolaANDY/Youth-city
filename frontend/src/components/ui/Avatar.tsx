import React from 'react';

export interface AvatarProps {
  name: string;
  size?: 'md' | 'lg';
  className?: string;
}

const SIZES = {
  md: 'size-14 text-2xl md:size-16 md:text-3xl',
  lg: 'size-18 text-3xl sm:size-20',
} as const;

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => (
  <span
    aria-hidden="true"
    className={`grid shrink-0 place-items-center rounded-2xl border border-brand-400/25 bg-linear-to-br from-brand-600 via-iris-600 to-brand-400 p-px font-display font-black text-white shadow-brand ${SIZES[size]} ${className}`}
  >
    {name.charAt(0)}
  </span>
);
