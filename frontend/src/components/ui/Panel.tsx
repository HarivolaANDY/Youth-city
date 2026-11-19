import React from 'react';

export type PanelTone = 'neutral' | 'brand' | 'iris' | 'gain' | 'warn' | 'risk' | 'cool';

const TONE_RING: Record<PanelTone, string> = {
  neutral: '',
  brand: 'border-brand-400/35',
  iris: 'border-iris-400/35',
  gain: 'border-gain-400/35',
  warn: 'border-warn-400/40',
  risk: 'border-risk-400/40',
  cool: 'border-cool-400/35',
};

const GLOW: Record<PanelTone, string> = {
  neutral: 'bg-night-500/25',
  brand: 'bg-brand-500/25',
  iris: 'bg-iris-500/25',
  gain: 'bg-gain-500/20',
  warn: 'bg-warn-500/20',
  risk: 'bg-risk-500/20',
  cool: 'bg-cool-500/20',
};

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: PanelTone;
  glow?: boolean;
  as?: 'div' | 'section' | 'article' | 'header';
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ tone = 'neutral', glow = false, as: Tag = 'div', className = '', children, ...props }, ref) => (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`panel ${glow ? 'overflow-hidden' : ''} ${TONE_RING[tone]} ${className}`}
      {...props}
    >
      {glow && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-24 -right-20 size-72 rounded-full blur-3xl ${GLOW[tone]}`}
        />
      )}
      {children}
    </Tag>
  )
);

Panel.displayName = 'Panel';
