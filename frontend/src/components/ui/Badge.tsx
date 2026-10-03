import React from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'iris' | 'gain' | 'warn' | 'risk' | 'cool';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-white/10 bg-white/[0.05] text-mist-300',
  brand: 'border-brand-400/30 bg-brand-500/12 text-brand-200',
  iris: 'border-iris-400/30 bg-iris-500/12 text-iris-200',
  gain: 'border-gain-400/30 bg-gain-500/12 text-gain-300',
  warn: 'border-warn-400/30 bg-warn-500/12 text-warn-300',
  risk: 'border-risk-400/30 bg-risk-500/12 text-risk-300',
  cool: 'border-cool-400/30 bg-cool-500/12 text-cool-300',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  variant?: 'pill' | 'square';
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  icon,
  variant = 'pill',
  className = '',
  children,
  ...props
}) => (
  <span
    className={`inline-flex items-center gap-1.5 border text-2xs leading-none ${
      variant === 'square'
        ? 'rounded-md px-2 py-1 font-bold tracking-wider uppercase'
        : 'rounded-full px-2.5 py-1 font-semibold'
    } ${TONES[tone]} ${className}`}
    {...props}
  >
    {icon && (
      <span aria-hidden="true" className="[&_svg]:size-3.5">
        {icon}
      </span>
    )}
    {children}
  </span>
);
