import React from 'react';

type ButtonVariant =
  | 'primary'
  | 'iris'
  | 'gain'
  | 'warn'
  | 'warnSoft'
  | 'secondary'
  | 'ghost'
  | 'outline';

type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'relative inline-flex items-center justify-center gap-2 rounded-lg font-bold whitespace-nowrap ' +
  'transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-soft ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ' +
  'disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] ' +
  '[&_svg]:shrink-0';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-r from-brand-600 to-iris-600 text-white shadow-brand ' +
    'hover:from-brand-500 hover:to-iris-500 hover:shadow-iris',
  iris: 'bg-iris-600 text-white shadow-iris hover:bg-iris-500',
  gain: 'bg-gain-600 text-night-950 shadow-gain hover:bg-gain-500',
  warn: 'bg-warn-500 text-night-950 shadow-warn hover:bg-warn-400',
  warnSoft:
    'border border-warn-400/25 bg-warn-500/10 text-warn-300 hover:border-warn-400/45 hover:bg-warn-500/20 hover:text-warn-200',
  secondary:
    'border border-white/10 bg-white/[0.04] text-mist-200 shadow-raise ' +
    'hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
  ghost: 'text-mist-300 hover:bg-white/[0.06] hover:text-white',
  outline:
    'border border-brand-400/40 bg-brand-500/10 text-brand-200 ' +
    'hover:border-brand-300/60 hover:bg-brand-500/20 hover:text-white',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-2xs [&_svg]:size-3.5',
  md: 'h-9 px-3.5 text-xs [&_svg]:size-4',
  lg: 'h-11 px-5 text-sm [&_svg]:size-4.5',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', block = false, className = '', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
);

Button.displayName = 'Button';
