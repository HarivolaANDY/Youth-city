import React from 'react';
import { Bot } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { TABS, MOBILE_ITEMS } from '../data/navigation';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, toggleNovaModal } = useGameStore();

  return (
    <>
      <nav aria-label="Sections de Youth City" className="relative -mx-4 sm:mx-0 md:hidden">
        <div className="no-scrollbar overflow-x-auto px-4 sm:px-0">
          <ul className="mx-auto flex w-max min-w-full items-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1.5 shadow-panel backdrop-blur-xl sm:min-w-0 sm:justify-center">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
                      isActive ? 'text-white' : 'text-mist-400 hover:bg-white/[0.06] hover:text-mist-100'
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 rounded-lg border border-brand-300/25 bg-linear-to-r from-brand-600 to-iris-600 shadow-iris animate-pop-in"
                      />
                    )}
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-night-950 to-transparent sm:hidden"
        />
      </nav>

      <nav
        aria-label="Navigation rapide"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-night-950/92 backdrop-blur-xl md:hidden"
      >
        <ul className="safe-bottom flex items-stretch justify-around gap-0.5 px-2 pt-2 pb-1.5">
          {MOBILE_ITEMS.map((id) => {
            const tab = TABS.find((item) => item.id === id)!;
            const Icon = tab.icon;
            const isActive = activeTab === id;

            return (
              <li key={id} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex h-full w-full flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-2xs font-bold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400 ${
                    isActive ? 'text-brand-300' : 'text-mist-500 hover:text-mist-200'
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-linear-to-r from-brand-400 to-iris-400"
                    />
                  )}
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="truncate">{tab.short}</span>
                </button>
              </li>
            );
          })}

          <li className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => toggleNovaModal(true)}
              className="flex h-full w-full flex-col items-center gap-1 rounded-lg px-1 pt-1.5 pb-1.5 text-2xs font-bold text-brand-300 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400"
            >
              <span className="grid size-8 -translate-y-3 place-items-center rounded-full border border-brand-300/40 bg-linear-to-br from-brand-600 to-iris-600 text-white shadow-brand transition-transform duration-300 ease-spring active:scale-95">
                <Bot className="size-4" aria-hidden="true" />
              </span>
              <span className="truncate">NOVA</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
};
