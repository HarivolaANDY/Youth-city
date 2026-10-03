import React from 'react';
import { Panel, type PanelTone } from './Panel';
import { Badge } from './Badge';

export interface ViewHeaderProps {
  tone: PanelTone;
  badgeIcon: React.ReactNode;
  badgeLabel: string;
  meta?: string;
  title: string;
  description: string;
  headingId: string;
  aside?: React.ReactNode;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  tone,
  badgeIcon,
  badgeLabel,
  meta,
  title,
  description,
  headingId,
  aside,
}) => (
  <Panel as="header" tone={tone} glow className="overflow-hidden p-5 sm:p-6">
    <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <Badge tone={tone} icon={badgeIcon}>
            {badgeLabel}
          </Badge>
          {meta && <span className="text-xs text-mist-400">{meta}</span>}
        </div>
        <h2 id={headingId} className="text-xl font-black text-white sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist-400">{description}</p>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  </Panel>
);
