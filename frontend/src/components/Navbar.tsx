import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Zap,
  Heart,
  Coins,
  Landmark,
  Clock,
  Moon,
  Bot,
  Settings,
  RotateCcw,
  Sparkles,
  ChevronDown,
  User,
  LogIn,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { IconChip } from './ui/IconChip';
import { Tooltip } from './ui/Tooltip';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { formatNumber } from '../lib/format';

interface VitalProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  showUnit?: boolean;
  tone: string;
  chipTone: string;
  hint: string;
}

const Vital: React.FC<VitalProps> = ({ icon, label, value, showUnit, tone, chipTone, hint }) => (
  <Tooltip text={hint}><div className="flex items-center gap-2.5">
    <span className={`grid size-8 shrink-0 place-items-center rounded-md border ${chipTone}`} aria-hidden="true">
      {icon}
    </span>
    <div className="min-w-0">
      <span className="block text-2xs leading-none font-medium text-mist-400">{label}</span>
      <span className={`metric mt-1 block text-sm font-bold leading-none ${tone}`}>
        {value}
        {showUnit && <span className="ml-1 text-2xs font-medium opacity-70">MGA</span>}
      </span>
    </div>
  </div></Tooltip>
);

export const Navbar: React.FC = () => {
  const {
    citizen,
    day,
    timeSlot,
    recurringCycle,
    advanceTime,
    restAndSleep,
    toggleNovaModal,
    triggerDilemma,
    resetGame,
    setActiveTab,
    isBackendConnected,
    user,
    isAuthenticated,
    toggleAuthModal,
    logout,
    toggleCharacterCreation,
    toggleAdminModal,
    moderationReports,
  } = useGameStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingReset, setPendingReset] = useState<'demo' | 'new' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const getMenuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (menuOpen) getMenuItems()[0]?.focus();
  }, [menuOpen]);

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    const items = getMenuItems();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };

    if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(items.length - 1);
    else if (event.key === 'Tab') setMenuOpen(false);
  };

  const energyPercent = Math.min(100, Math.max(0, citizen.energy));
  const energyTone = energyPercent > 20 ? 'warn' : 'risk';

  const confirmReset = () => {
    if (pendingReset) resetGame(pendingReset);
    setPendingReset(null);
  };

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-night-950/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="group flex shrink-0 items-center gap-3 rounded-lg pr-2 text-left transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
          >
            <IconChip tone="brand" className="bg-linear-to-br from-brand-600 to-iris-500 text-white shadow-brand transition-transform duration-300 ease-spring group-hover:scale-105">
              <Building2 />
            </IconChip>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="font-display text-lg font-extrabold tracking-[0.12em] text-gradient">
                  YOUTH CITY
                </span>
                <Badge
                  tone={isBackendConnected ? 'gain' : 'brand'}
                  variant="square"
                  className="tracking-[0.14em] flex items-center gap-1.5"
                  title={isBackendConnected ? 'Backend Django & Base de Données synchronisés' : 'Mode MVP local'}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isBackendConnected
                        ? 'bg-gain-400 shadow-[0_0_6px] shadow-gain-400 animate-pulse-soft'
                        : 'bg-brand-400'
                    }`}
                  />
                  {isBackendConnected ? 'API SYNC' : 'MVP'}
                </Badge>
              </span>
              <span className="hidden text-2xs font-medium text-mist-400 sm:block">
                Apprends la vie. Construis ton avenir.
              </span>
            </span>
          </button>

          <div className="ml-auto hidden items-center gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 lg:flex">
            <Vital
              icon={<Coins className="size-4" />}
              label="Disponible"
              value={formatNumber(citizen.money)}
              showUnit
              tone="text-gain-300"
              chipTone="border-gain-400/25 bg-gain-500/12 text-gain-400"
              hint="Solde liquide disponible"
            />
            <Vital
              icon={<Landmark className="size-4" />}
              label="Épargne"
              value={formatNumber(citizen.savings)}
              showUnit
              tone="text-cool-300"
              chipTone="border-cool-400/25 bg-cool-500/12 text-cool-400"
              hint="Épargne de précaution"
            />

            <span aria-hidden="true" className="h-7 w-px bg-white/10" />

            <Tooltip text="Jauge d'énergie vitale"><div className="w-28">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-2xs font-medium text-mist-400">
                  <Zap className="size-3 text-warn-400" aria-hidden="true" />
                  Énergie
                </span>
                <span
                  className={`metric text-2xs font-bold ${energyPercent > 20 ? 'text-warn-300' : 'text-risk-300'}`}
                >
                  {energyPercent}%
                </span>
              </div>
              <Progress value={energyPercent} tone={energyTone} size="xs" label={`Énergie ${energyPercent}%`} />
            </div></Tooltip>

            <Tooltip text="Indice de bien-être personnel"><div className="flex items-center gap-1.5">
              <Heart className="size-4 text-risk-400" aria-hidden="true" />
              <span className="metric text-sm font-bold text-risk-300">{citizen.wellbeing}%</span>
              <span className="sr-only">de bien-être</span>
            </div></Tooltip>

            <span aria-hidden="true" className="h-7 w-px bg-white/10" />

            <Tooltip text={`Jour et créneau horaire en cours • ${recurringCycle ? `Loyer dans ${recurringCycle.daysUntilRent} jour(s)` : 'Cycle mensuel'}`}><div className="flex items-center gap-2">
              <Clock className="size-4 text-iris-400" aria-hidden="true" />
              <div className="text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="block font-bold text-mist-100">Jour {day}</span>
                  <span className="rounded bg-iris-500/15 px-1 py-0.2 text-3xs font-semibold text-iris-300">
                    J-{recurringCycle?.daysUntilRent ?? (30 - (((day - 1) % 30) + 1))}
                  </span>
                </div>
                <span className="block text-2xs text-mist-400">{timeSlot}</span>
              </div>
            </div></Tooltip>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Tooltip text="Avancer au créneau horaire suivant">
              <Button onClick={advanceTime}>
                <Clock className="text-iris-400" aria-hidden="true" />
                <span className="hidden md:inline">Temps +</span>
                <span className="sr-only md:hidden">Avancer au créneau horaire suivant</span>
              </Button>
            </Tooltip>

            <Tooltip text="Dormir dans ton logement pour régénérer ton énergie">
              <Button onClick={restAndSleep}>
                <Moon className="text-brand-300" aria-hidden="true" />
                <span className="hidden md:inline">Dormir</span>
                <span className="sr-only md:hidden">Dormir et régénérer ton énergie</span>
              </Button>
            </Tooltip>

            <Tooltip text="Simuler un événement aléatoire / dilemme citoyen">
              <Button variant="warnSoft" onClick={() => triggerDilemma()}>
                <Sparkles className="text-warn-400" aria-hidden="true" />
                <span className="hidden md:inline">Dilemme</span>
                <span className="sr-only md:hidden">Lancer un dilemme</span>
              </Button>
            </Tooltip>

            <Button variant="primary" onClick={() => toggleNovaModal(true)}>
              <Bot className="text-brand-200" aria-hidden="true" />
              <span className="hidden xl:inline">NOVA</span>
              <span className="xl:hidden sr-only">Ouvrir le mentor NOVA</span>
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-gain-400 shadow-[0_0_8px] shadow-gain-400 animate-pulse-soft"
              />
            </Button>


            {isAuthenticated ? (
              <Tooltip text={`Connecté en tant que ${user?.username} — Espace Citoyen`}>
                <Button
                  variant="secondary"
                  onClick={() => toggleAuthModal(true, 'login')}
                  className="border-brand-400/30 bg-brand-500/10 text-brand-200"
                >
                  <User className="size-3.5 text-gain-400" aria-hidden="true" />
                  <span className="hidden md:inline max-w-24 truncate font-bold">{user?.username}</span>
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-gain-400 shadow-[0_0_6px] shadow-gain-400 animate-pulse-soft"
                  />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip text="Se connecter ou s'inscrire pour sauvegarder sa progression">
                <Button
                  variant="secondary"
                  onClick={() => toggleAuthModal(true, 'login')}
                  className="border-white/10"
                >
                  <LogIn className="size-3.5 text-brand-300" aria-hidden="true" />
                  <span className="hidden md:inline">Connexion</span>
                </Button>
              </Tooltip>
            )}

            <Tooltip text="Console d'Administration & Modération (§43, §45, §46)">
              <button
                type="button"
                onClick={() => toggleAdminModal(true)}
                aria-label="Ouvrir la Console d'Administration et Modération"
                className="relative grid size-9 place-items-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 transition-colors hover:bg-amber-500/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 active:scale-95"
              >
                <ShieldAlert className="size-4" aria-hidden="true" />
                {moderationReports.some((r) => r.status === 'pending') && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-400 ring-2 ring-night-950 animate-pulse" />
                )}
              </button>
            </Tooltip>

            <div className="relative" ref={menuRef}>
              <Tooltip text="Options et réinitialisation" align="end">
                <button
                  type="button"
                  ref={menuButtonRef}
                  onClick={() => setMenuOpen((prev) => !prev)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setMenuOpen(true);
                    }
                  }}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-mist-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 active:scale-95"
                >
                  <Settings className="size-4" aria-hidden="true" />
                  <span className="sr-only">Options et réinitialisation</span>
                </button>
              </Tooltip>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Options de partie"
                  onKeyDown={handleMenuKeyDown}
                  className="panel panel-accent absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl p-1.5 shadow-panel-lg animate-pop-in"
                >
                  {/* Section Compte Utilisateur (§42) */}
                  {isAuthenticated ? (
                    <div className="border-b border-white/[0.06] px-2.5 py-2 mb-1 bg-white/[0.02] rounded-lg">
                      <span className="block text-2xs text-mist-500 font-medium">Compte citoyen :</span>
                      <span className="block text-xs font-bold text-brand-300 truncate">@{user?.username}</span>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                        }}
                        className="mt-1.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-bold text-risk-300 transition-colors hover:bg-risk-500/10 focus-visible:outline-none"
                      >
                        <LogOut className="size-3 shrink-0" aria-hidden="true" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border-b border-white/[0.06] px-2.5 py-2 mb-1 bg-white/[0.02] rounded-lg">
                      <span className="block text-2xs text-mist-500 font-medium">Session invité / démo</span>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          toggleAuthModal(true, 'login');
                          setMenuOpen(false);
                        }}
                        className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-bold text-brand-300 transition-colors hover:bg-brand-500/20 focus-visible:outline-none"
                      >
                        <LogIn className="size-3 shrink-0" aria-hidden="true" />
                        <span>Connexion / S'inscrire</span>
                      </button>
                    </div>
                  )}

                  <div className="border-b border-white/[0.06] pb-1.5 mb-1.5 pt-0.5 space-y-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        toggleAdminModal(true);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/15 focus-visible:outline-none"
                    >
                      <ShieldAlert className="size-3.5 text-amber-400" aria-hidden="true" />
                      <span>Console d'Administration (§43)</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        toggleCharacterCreation(true);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-500/15 focus-visible:outline-none"
                    >
                      <Sparkles className="size-3.5 text-brand-400" aria-hidden="true" />
                      <span>Personnaliser mon Citoyen</span>
                    </button>
                  </div>

                  <p className="px-2.5 pt-1.5 pb-2 text-2xs font-bold tracking-wider text-mist-500 uppercase">
                    Réinitialiser la simulation
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setPendingReset('demo');
                      setMenuOpen(false);
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left text-xs text-mist-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] focus-visible:outline-none"
                  >
                    <span className="font-bold text-mist-100">Profil démo</span>
                    <span className="text-2xs text-mist-500">Emmanuel &mdash; niveau 5, en cours de partie</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setPendingReset('new');
                      setMenuOpen(false);
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left text-xs text-mist-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] focus-visible:outline-none"
                  >
                    <span className="font-bold text-mist-100">Nouvelle partie</span>
                    <span className="text-2xs text-mist-500">Citoyen débutant &mdash; niveau 1, 0 XP</span>
                  </button>
                  <p className="mt-1 flex items-center gap-1.5 border-t border-white/[0.06] px-2.5 py-2 text-2xs text-mist-500">
                    <ChevronDown className="size-3" aria-hidden="true" />
                    Réinitialise la progression simulée
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <dl
          aria-label="Statistiques du citoyen"
          className="flex items-center justify-between gap-3 border-t border-white/[0.06] py-2 text-xs lg:hidden"
        >
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Disponible</dt>
            <Coins className="size-3.5 text-gain-400" aria-hidden="true" />
            <dd className="metric font-bold text-gain-300">{formatNumber(citizen.money)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Épargne</dt>
            <Landmark className="size-3.5 text-cool-400" aria-hidden="true" />
            <dd className="metric font-bold text-cool-300">{formatNumber(citizen.savings)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Énergie</dt>
            <Zap className="size-3.5 text-warn-400" aria-hidden="true" />
            <dd className={`metric font-bold ${energyPercent > 20 ? 'text-warn-300' : 'text-risk-300'}`}>
              {energyPercent}%
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Bien-être</dt>
            <Heart className="size-3.5 text-risk-400" aria-hidden="true" />
            <dd className="metric font-bold text-risk-300">{citizen.wellbeing}%</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Jour</dt>
            <Clock className="size-3.5 text-iris-400" aria-hidden="true" />
            <dd className="font-bold text-mist-100">J{day}</dd>
          </div>
        </dl>
      </div>
    </header>

    <Modal open={pendingReset !== null} onClose={() => setPendingReset(null)} labelledBy="reset-title" describedBy="reset-desc">
      <div className="px-5 py-5 pr-14 sm:px-6">
        <div className="mb-3 flex items-center gap-3">
          <IconChip tone="warn">
            <RotateCcw />
          </IconChip>
          <h2 id="reset-title" className="text-base font-black text-white">
            {pendingReset === 'new' ? 'Commencer une nouvelle partie ?' : 'Charger le profil démo ?'}
          </h2>
        </div>
        <p id="reset-desc" className="text-xs leading-relaxed text-mist-300">
          Ta progression actuelle (argent, compétences, niveau, historique) sera définitivement remplacée. Cette action
          est irréversible.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingReset(null)}>
            Annuler
          </Button>
          <Button variant="warn" onClick={confirmReset}>
            Réinitialiser
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
};
