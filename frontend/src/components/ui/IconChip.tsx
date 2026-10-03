import React from 'react';
import type { BadgeTone } from './Badge';

export type IconChipSize = 'sm' | 'md' | 'lg';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-white/10 bg-white/[0.05] text-mist-300',
  brand: 'border-brand-400/25 bg-brand-500/12 text-brand-300',
  iris: 'border-iris-400/25 bg-iris-500/12 text-iris-300',
  gain: 'border-gain-400/25 bg-gain-500/12 text-gain-400',
  warn: 'border-warn-400/25 bg-warn-500/12 text-warn-300',
  risk: 'border-risk-400/25 bg-risk-500/12 text-risk-300',
  cool: 'border-cool-400/25 bg-cool-500/12 text-cool-300',
};

const SIZES: Record<IconChipSize, string> = {
  sm: 'size-8 rounded-lg [&_svg]:size-4',
  md: 'size-10 rounded-xl [&_svg]:size-5',
  lg: 'size-12 rounded-2xl [&_svg]:size-6',
};

export interface IconChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: IconChipSize;
}

export const IconChip: React.FC<IconChipProps> = ({
  tone = 'brand',
  size = 'md',
  className = '',
  children,
  ...props
}) => (
  <span
    aria-hidden="true"
    className={`grid shrink-0 place-items-center border ${TONES[tone]} ${SIZES[size]} ${className}`}
    {...props}
  >
    {children}
  </span>
);
