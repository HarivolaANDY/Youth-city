import React, { useEffect, useRef } from 'react';
import { useGameStore } from './stores/useGameStore';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NavigationTabs } from './components/NavigationTabs';
import { Dashboard } from './features/dashboard/Dashboard';
import { CityMap } from './features/city/CityMap';
import { CampusView } from './features/campus/CampusView';
import { CareerView } from './features/career/CareerView';
import { FinanceView } from './features/finance/FinanceView';
import { ResidentialView } from './features/residential/ResidentialView';
import { CareerPassportView } from './features/passport/CareerPassportView';
import { NovaMentorModal } from './components/NovaMentorModal';
import { DecisionModal } from './components/DecisionModal';
import { ToastContainer } from './components/ToastContainer';

export const App: React.FC = () => {
  const { activeTab, initGame } = useGameStore();
  const isFirstRender = useRef(true);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }, [activeTab]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'map':
        return <CityMap />;
      case 'campus':
        return <CampusView />;
      case 'career':
        return <CareerView />;
      case 'finance':
        return <FinanceView />;
      case 'residential':
        return <ResidentialView />;
      case 'passport':
        return <CareerPassportView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="relative min-h-dvh">
      <div aria-hidden="true" className="aurora" />
      <div aria-hidden="true" className="grid-lines" />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:border focus:border-brand-400/40 focus:bg-night-800 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white md:focus:left-20"
      >
        Aller au contenu principal
      </a>

      <div className="relative z-10 flex min-h-dvh">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />

          <main
            id="main-content"
            tabIndex={-1}
            className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-5 focus:outline-none sm:px-6 sm:py-6 lg:px-8"
          >
            <NavigationTabs />

            <div className="mt-5 sm:mt-6">
              <div key={activeTab} className="animate-rise-in">
                {renderActiveView()}
              </div>
            </div>
          </main>

          <footer className="relative z-10 mt-auto border-t border-white/[0.06] px-4 pt-6 pb-24 text-center sm:px-6 md:pb-6">
            <p className="text-2xs text-mist-500">
              YOUTH CITY &mdash; Simulation pédagogique. Tous les montants sont virtuels (MGA), aucun
              argent réel n&rsquo;est engagé.
            </p>
          </footer>
        </div>
      </div>

      <NovaMentorModal />
      <DecisionModal />
      <ToastContainer />
    </div>
  );
};

export default App;
