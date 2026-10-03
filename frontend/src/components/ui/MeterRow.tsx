import React from 'react';
import { Progress, type ProgressTone } from './Progress';

const VALUE_TONE: Record<ProgressTone, string> = {
  brand: 'text-brand-300',
  iris: 'text-iris-300',
  gain: 'text-gain-300',
  warn: 'text-warn-300',
  risk: 'text-risk-300',
  cool: 'text-cool-300',
};

export interface MeterRowProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: ProgressTone;
  showBar?: boolean;
  barSize?: 'xs' | 'sm';
  suffix?: string;
  labelClassName?: string;
  className?: string;
}

export const MeterRow: React.FC<MeterRowProps> = ({
  label,
  value,
  icon,
  tone = 'brand',
  showBar = true,
  barSize = 'xs',
  suffix = '%',
  labelClassName = '',
  className = '',
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <span className={`flex min-w-0 items-center gap-1.5 text-xs font-medium text-mist-200 ${labelClassName}`}>
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className={`metric shrink-0 text-xs font-bold ${VALUE_TONE[tone]}`}>
        {value}
        {suffix}
      </span>
    </div>
    {showBar && <Progress value={value} tone={tone} size={barSize} label={`${label} : ${value}${suffix}`} />}
  </div>
);
