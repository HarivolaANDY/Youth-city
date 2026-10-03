import React, { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { TABS, navItemClass } from '../data/navigation';

const STORAGE_KEY = 'youthcity.sidebar.expanded';

const readExpanded = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(STORAGE_KEY) !== '0';
};

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useGameStore();
  const [expanded, setExpanded] = useState<boolean>(readExpanded);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, expanded ? '1' : '0');
  }, [expanded]);

  return (
    <nav
      aria-label="Sections de Youth City"
      className={`sticky top-0 z-30 hidden h-dvh shrink-0 self-start flex-col overflow-y-auto no-scrollbar border-r border-white/[0.07] bg-night-950/80 py-4 pr-3 backdrop-blur-xl transition-[width] duration-200 ease-soft md:flex ${
        expanded ? 'w-16 lg:w-60' : 'w-16'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls="app-sidebar-nav"
        title={expanded ? 'Réduire le menu latéral' : 'Déployer le menu latéral'}
        className="mb-3 hidden size-10 shrink-0 self-center rounded-xl border border-white/10 bg-white/[0.04] text-mist-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 active:scale-95 lg:grid lg:place-items-center"
      >
        {expanded ? (
          <PanelLeftClose className="size-4" aria-hidden="true" />
        ) : (
          <PanelLeftOpen className="size-4" aria-hidden="true" />
        )}
        <span className="sr-only">
          {expanded ? 'Réduire le menu latéral' : 'Déployer le menu latéral'}
        </span>
      </button>

      <span className="eyebrow mb-1 hidden pl-3 lg:block">Navigation</span>

      <ul id="app-sidebar-nav" className="flex flex-col gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                title={tab.label}
                className={`relative mx-auto flex w-10 items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 lg:w-full lg:justify-start lg:px-3 ${navItemClass(
                  isActive
                )}`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand-200"
                  />
                )}
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className={expanded ? 'hidden lg:inline' : 'sr-only'}>{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
