import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { useGameStore } from './stores/useGameStore';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NavigationTabs } from './components/NavigationTabs';
import { Dashboard } from './features/dashboard/Dashboard';
import { NovaMentorModal } from './components/NovaMentorModal';
import { DecisionModal } from './components/DecisionModal';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/AuthModal';
import { AgeDeclarationModal } from './components/AgeDeclarationModal';
import { CharacterCreationModal } from './components/CharacterCreationModal';
import { AdminBackOfficeModal } from './components/AdminBackOfficeModal';

const CityMap = lazy(() => import('./features/city/CityMap').then((m) => ({ default: m.CityMap })));
const CampusView = lazy(() => import('./features/campus/CampusView').then((m) => ({ default: m.CampusView })));
const CareerView = lazy(() => import('./features/career/CareerView').then((m) => ({ default: m.CareerView })));
const FinanceView = lazy(() => import('./features/finance/FinanceView').then((m) => ({ default: m.FinanceView })));
const ResidentialView = lazy(() =>
  import('./features/residential/ResidentialView').then((m) => ({ default: m.ResidentialView }))
);
const CareerPassportView = lazy(() =>
  import('./features/passport/CareerPassportView').then((m) => ({ default: m.CareerPassportView }))
);
const MarketView = lazy(() => import('./features/market/MarketView').then((m) => ({ default: m.MarketView })));
const StartupView = lazy(() => import('./features/startup/StartupView').then((m) => ({ default: m.StartupView })));
const CityHubView = lazy(() => import('./features/hub/CityHubView').then((m) => ({ default: m.CityHubView })));

const ViewSkeleton: React.FC = () => (
  <div role="status" aria-busy="true" className="space-y-5">
    <span className="sr-only">Chargement de la section…</span>
    <div className="panel h-32 animate-pulse-soft" />
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      <div className="panel h-40 animate-pulse-soft" />
      <div className="panel h-40 animate-pulse-soft" />
      <div className="panel hidden h-40 animate-pulse-soft lg:block" />
    </div>
  </div>
);

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
      case 'startup':
        return <StartupView />;
      case 'cityhub':
        return <CityHubView />;
      case 'market':
        return <MarketView />;
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
                <Suspense fallback={<ViewSkeleton />}>{renderActiveView()}</Suspense>
              </div>
            </div>
          </main>

          <footer className="relative z-10 mt-auto border-t border-white/[0.06] px-4 pt-6 pb-24 text-center sm:px-6 md:pb-6">
            <p className="text-2xs font-medium text-mist-400">
              YOUTH CITY &mdash; Simulation pédagogique. Tous les montants sont virtuels (MGA), aucun
              argent réel n&rsquo;est engagé.
            </p>
          </footer>
        </div>
      </div>

      <NovaMentorModal />
      <DecisionModal />
      <AuthModal />
      <AgeDeclarationModal />
      <CharacterCreationModal />
      <AdminBackOfficeModal />
      <ToastContainer />
    </div>
  );
};

export default App;
