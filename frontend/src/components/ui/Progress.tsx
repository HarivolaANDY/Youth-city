import React from 'react';

export type ProgressTone = 'brand' | 'iris' | 'gain' | 'warn' | 'risk' | 'cool';

const FILL: Record<ProgressTone, string> = {
  brand: 'from-brand-500 to-iris-500',
  iris: 'from-iris-500 to-brand-400',
  gain: 'from-gain-500 to-gain-300',
  warn: 'from-warn-500 to-warn-300',
  risk: 'from-risk-500 to-risk-300',
  cool: 'from-cool-500 to-brand-400',
};

export interface ProgressProps {
  value: number;
  tone?: ProgressTone;
  size?: 'xs' | 'sm' | 'md';
  label?: string;
  animated?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  tone = 'brand',
  size = 'sm',
  label,
  animated = false,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const height = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' }[size];

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`track w-full ${height} ${className}`}
    >
      <div
        className={`h-full rounded-full bg-linear-to-r ${FILL[tone]} transition-[width] duration-500 ease-soft ${animated ? 'shimmer-fill' : ''}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
