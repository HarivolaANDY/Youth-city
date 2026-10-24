import React, { useState } from 'react';
import {
  Rocket,
  TrendingUp,
  Users,
  Award,
  DollarSign,
  PlusCircle,
  Briefcase,
  CheckCircle2,
  Sparkles,
  UserPlus,
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Leaf,
  Sprout,
  Store,
  ChevronRight,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { formatNumber } from '../../lib/format';
import type { StartupProject, StartupStage, StartupSector, StartupActionType } from '../../types/game';

const STAGE_LABELS: Record<StartupStage, { label: string; desc: string; step: number }> = {
  idea: { label: 'Idée & Étude', desc: 'Validation du problème, étude de marché et personas', step: 1 },
  mvp: { label: 'Prototypage MVP', desc: 'Développement de la première version fonctionnelle', step: 2 },
  launched: { label: 'Lancement Public', desc: 'Acquisition des premiers utilisateurs et revenus', step: 3 },
  growth: { label: 'Croissance', desc: 'Scalabilité, équipe pluridisciplinaire et expansion', step: 4 },
};

const SECTOR_INFO: Record<StartupSector, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  tech: { label: 'Tech & Logiciels', icon: Cpu, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  greentech: { label: 'GreenTech & Écologie', icon: Leaf, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  agritech: { label: 'AgriTech Madagascar', icon: Sprout, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  services: { label: 'Services & Commerce', icon: Store, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export const StartupView: React.FC = () => {
  const {
    citizen,
    startupProjects,
    createStartupProject,
    advanceStartupAction,
    claimIncubatorGrant,
  } = useGameStore();

  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newSector, setNewSector] = useState<StartupSector>('tech');
  const [newPitch, setNewPitch] = useState('');
  const [newCapital, setNewCapital] = useState(30000);
  const [formError, setFormError] = useState('');

  const currentProject: StartupProject | undefined = startupProjects[selectedProjectIndex] || startupProjects[0];

  const handleAction = async (actionType: StartupActionType, role?: string) => {
    if (!currentProject || isSubmitting) return;
    setIsSubmitting(true);
    await advanceStartupAction(currentProject.key || currentProject.id, actionType, role);
    setIsSubmitting(false);
  };

  const handleGrant = async () => {
    if (!currentProject || isSubmitting) return;
    setIsSubmitting(true);
    await claimIncubatorGrant(currentProject.key || currentProject.id);
    setIsSubmitting(false);
  };

  const handleCreateVenture = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (newName.trim().length < 3) {
      setFormError('Le nom du projet doit comporter au moins 3 caractères.');
      return;
    }
    if (newPitch.trim().length < 10) {
      setFormError("Le pitch d'impact doit faire au moins 10 caractères.");
      return;
    }
    if (newCapital > citizen.money) {
      setFormError(`Fonds insuffisants. Solde citoyen disponible : ${formatNumber(citizen.money)} MGA.`);
      return;
    }

    setIsSubmitting(true);
    const res = await createStartupProject({
      name: newName.trim(),
      sector: newSector,
      pitch: newPitch.trim(),
      initialCapital: newCapital,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsCreateModalOpen(false);
      setNewName('');
      setNewPitch('');
      setSelectedProjectIndex(0);
    } else if (res.error) {
      setFormError(res.error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-950/40 via-surface-900 to-surface-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300">
              <Rocket className="h-3.5 w-3.5" />
              <span>Startup District & Incubateur (§12, §24)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Fais Grandir ta Propre Entreprise
            </h1>
            <p className="text-sm md:text-base text-mist-300 max-w-2xl leading-relaxed">
              Passe de l'idée au MVP, séduis tes premiers clients malgaches, obtiens la subvention d'amorçage de
              l'incubateur et verse-toi des dividendes en Ariary virtuels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-surface-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Créer une Startup</span>
            </button>
          </div>
        </div>

        {/* Project Selector tabs if multiple projects */}
        {startupProjects.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-mist-400 uppercase tracking-wider shrink-0">Tes Projets :</span>
            {startupProjects.map((proj, idx) => (
              <button
                type="button"
                key={proj.id || proj.key}
                onClick={() => setSelectedProjectIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-2 border cursor-pointer ${
                  selectedProjectIndex === idx
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200 shadow-sm'
                    : 'border-white/[0.06] bg-white/[0.02] text-mist-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold">{proj.name}</span>
                <span className="text-mist-400 text-[10px] uppercase">({proj.stage})</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {currentProject ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Venture Cockpit (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identity & Pitch Card */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-surface-900/80 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{currentProject.name}</h2>
                    {(() => {
                      const sec = SECTOR_INFO[currentProject.sector] || SECTOR_INFO.tech;
                      const SectorIcon = sec.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sec.color}`}>
                          <SectorIcon className="h-3 w-3" />
                          {sec.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="mt-2 text-sm text-mist-300 leading-relaxed italic">
                    "{currentProject.pitch}"
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-mist-400">Étape actuelle</div>
                  <div className="text-base font-bold text-emerald-400 uppercase">
                    {STAGE_LABELS[currentProject.stage].label}
                  </div>
                </div>
              </div>

              {/* Progress Stepper (§12, §358) */}
              <div className="pt-4 border-t border-white/[0.06] space-y-3">
                <div className="flex justify-between text-xs text-mist-300">
                  <span>Progression du palier : {STAGE_LABELS[currentProject.stage].label}</span>
                  <span className="font-bold text-white">{currentProject.progress}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-950 overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, currentProject.progress))}%` }}
                  />
                </div>

                {/* 4 Steps timeline indicator */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  {(['idea', 'mvp', 'launched', 'growth'] as StartupStage[]).map((stg, i) => {
                    const isDone = STAGE_LABELS[currentProject.stage].step > i + 1;
                    const isCurrent = currentProject.stage === stg;
                    return (
                      <div
                        key={stg}
                        className={`p-2 rounded-xl border text-[11px] flex flex-col items-center justify-center gap-1 ${
                          isCurrent
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-bold'
                            : isDone
                            ? 'border-emerald-500/20 bg-surface-950/40 text-mist-400'
                            : 'border-white/[0.04] bg-surface-950/20 text-mist-500'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">
                              {i + 1}
                            </span>
                          )}
                          <span className="truncate">{STAGE_LABELS[stg].label.split(' ')[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-white/[0.08] bg-surface-900/60 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-medium text-mist-400">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span>Trésorerie</span>
                </div>
                <div className="mt-2 text-lg font-extrabold text-white">
                  {formatNumber(currentProject.treasury)} <span className="text-xs font-normal text-mist-400">MGA</span>
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-0.5">Budget d'opérations</div>
              </div>

              <div className="p-4 rounded-2xl border border-white/[0.08] bg-surface-900/60 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-medium text-mist-400">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <span>Revenus (MRR)</span>
                </div>
                <div className="mt-2 text-lg font-extrabold text-white">
                  {formatNumber(currentProject.monthlyRevenue)} <span className="text-xs font-normal text-mist-400">MGA/m</span>
                </div>
                <div className="text-[11px] text-cyan-400/80 mt-0.5">Facturation récurrente</div>
              </div>

              <div className="p-4 rounded-2xl border border-white/[0.08] bg-surface-900/60 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-medium text-mist-400">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>Utilisateurs</span>
                </div>
                <div className="mt-2 text-lg font-extrabold text-white">
                  {currentProject.usersCount} <span className="text-xs font-normal text-mist-400">clients</span>
                </div>
                <div className="text-[11px] text-purple-400/80 mt-0.5">Base active</div>
              </div>

              <div className="p-4 rounded-2xl border border-white/[0.08] bg-surface-900/60 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-medium text-mist-400">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>Notoriété</span>
                </div>
                <div className="mt-2 text-lg font-extrabold text-white">
                  {currentProject.reputation}%
                </div>
                <div className="text-[11px] text-amber-400/80 mt-0.5">Crédibilité écosystème</div>
              </div>
            </div>

            {/* Action Deck (§12, §24) */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-surface-900/80 backdrop-blur-md shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Actions Stratégiques d'Accélération</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Market Study */}
                <div className="p-4 rounded-xl border border-white/[0.06] bg-surface-950/50 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white flex items-center gap-2">
                        <Compass className="h-4 w-4 text-cyan-400" />
                        Étude de Marché & Interview
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">+50 XP</span>
                    </div>
                    <p className="text-xs text-mist-400">
                      Conduis des entrevues avec des utilisateurs cibles à Antananarivo pour affiner ton offre.
                    </p>
                    <div className="text-[11px] text-mist-500 pt-1">
                      Coût : <span className="text-amber-400 font-medium">15% énergie</span> | Gain : <span className="text-emerald-400">+25% progression, +10 réputation</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || citizen.energy < 15}
                    onClick={() => handleAction('market_study')}
                    className="w-full py-2 px-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Lancer l'étude</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 2. Develop MVP */}
                <div className="p-4 rounded-xl border border-white/[0.06] bg-surface-950/50 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-emerald-400" />
                        Développer le Prototype MVP
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">+70 XP</span>
                    </div>
                    <p className="text-xs text-mist-400">
                      Conçois l'architecture technique et code la première version testable du produit.
                    </p>
                    <div className="text-[11px] text-mist-500 pt-1">
                      Coût : <span className="text-amber-400 font-medium">25 000 MGA trésorerie</span>, 15% énergie | Gain : <span className="text-emerald-400">+30% progression, +15 réputation</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || citizen.energy < 15 || currentProject.treasury < 25000}
                    onClick={() => handleAction('develop_mvp')}
                    className="w-full py-2 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Développer MVP (25k MGA)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 3. Launch Marketing Campaign */}
                <div className="p-4 rounded-xl border border-white/[0.06] bg-surface-950/50 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        Campagne Marketing Digitale
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">+80 XP</span>
                    </div>
                    <p className="text-xs text-mist-400">
                      Diffuse des campagnes ciblées sur les réseaux sociaux pour acquérir des abonnés payants.
                    </p>
                    <div className="text-[11px] text-mist-500 pt-1">
                      Coût : <span className="text-amber-400 font-medium">20 000 MGA trésorerie</span> | Gain : <span className="text-emerald-400">+25 clients, +60k MGA MRR</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || citizen.energy < 15 || currentProject.treasury < 20000}
                    onClick={() => handleAction('launch_campaign')}
                    className="w-full py-2 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Diffuser campagne (20k MGA)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 4. Recruit Partner */}
                <div className="p-4 rounded-xl border border-white/[0.06] bg-surface-950/50 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-purple-400" />
                        Associer un Talents / Partenaire
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">+40 XP</span>
                    </div>
                    <p className="text-xs text-mist-400">
                      Recrute un co-fondateur spécialisé (Tech, Marketing ou Finance) pour renforcer l'équipe.
                    </p>
                    <div className="text-[11px] text-mist-500 pt-1">
                      Coût : <span className="text-amber-400 font-medium">15% énergie</span> | Gain : <span className="text-emerald-400">+10 réputation</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || citizen.energy < 15}
                    onClick={() => handleAction('recruit_partner', 'Co-fondateur(rice) Croissance')}
                    className="w-full py-2 px-3 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Recruter un associé</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Dividends Collector Banner */}
              {currentProject.monthlyRevenue > 0 && (
                <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-sm font-bold text-emerald-300 flex items-center justify-center sm:justify-start gap-2">
                      <DollarSign className="h-4 w-4" />
                      Dividendes Disponibles : {formatNumber(Math.round(currentProject.monthlyRevenue * 0.5))} MGA
                    </div>
                    <p className="text-xs text-mist-300">
                      50% des revenus mensuels peuvent être transférés directement sur ton compte citoyen personnel.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAction('collect_revenue')}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md"
                  >
                    <span>Encaisser dividendes</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Incubator Grant & Team */}
          <div className="space-y-6">
            {/* Incubator Seed Grant (§12, §24) */}
            <div className={`p-6 rounded-2xl border transition-all shadow-xl relative overflow-hidden ${
              currentProject.hasIncubatorGrant
                ? 'border-emerald-500/40 bg-linear-to-br from-emerald-950/40 to-surface-900'
                : currentProject.reputation >= 30 || currentProject.stage !== 'idea'
                ? 'border-amber-500/50 bg-linear-to-br from-amber-950/30 via-surface-900 to-surface-950 animate-pulse'
                : 'border-white/[0.08] bg-surface-900/80'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bourse d'Amorçage</h3>
                  <div className="text-xs text-amber-400 font-semibold">200 000 MGA accordés</div>
                </div>
              </div>

              <p className="mt-4 text-xs text-mist-300 leading-relaxed">
                Le fond d'amorçage de l'incubateur YOUTH CITY soutient les entrepreneurs à fort potentiel.
                Requis : <strong className="text-white">30% de réputation</strong> ou passage au stade <strong className="text-white">MVP</strong>.
              </p>

              <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-mist-400">Éligibilité jury :</span>
                  <span className={`font-bold ${currentProject.reputation >= 30 || currentProject.stage !== 'idea' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {currentProject.hasIncubatorGrant
                      ? 'Accordée'
                      : currentProject.reputation >= 30 || currentProject.stage !== 'idea'
                      ? 'Dossier Éligible !'
                      : `${currentProject.reputation} / 30% requis`}
                  </span>
                </div>

                {currentProject.hasIncubatorGrant ? (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Subvention de 200 000 MGA perçue</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting || (currentProject.reputation < 30 && currentProject.stage === 'idea')}
                    onClick={handleGrant}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      currentProject.reputation >= 30 || currentProject.stage !== 'idea'
                        ? 'bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-surface-950 shadow-lg shadow-amber-500/20'
                        : 'bg-white/[0.05] text-mist-500 border border-white/[0.06] cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Réclamer la Bourse (200k MGA)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Team Members Card */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-surface-900/80 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-400" />
                  <span>Équipe Fondatrice ({currentProject.team?.length || 1})</span>
                </h3>
                <span className="text-xs text-mist-400">{citizen.name} (Lead)</span>
              </div>

              <div className="space-y-2">
                {(currentProject.team || ['Fondateur']).map((member, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-white/[0.06] bg-surface-950/40 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-white">{member}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                      Actif
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl border border-dashed border-white/[0.1] bg-surface-900/40 space-y-4">
          <Rocket className="h-12 w-12 text-mist-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Aucun projet entrepreneurial en cours</h2>
          <p className="text-sm text-mist-400 max-w-md mx-auto">
            Lance ta première startup dans la tech, greentech ou agritech et accélère ton ascension à Youth City.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold text-sm inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Créer mon premier projet</span>
          </button>
        </div>
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-surface-900 p-6 md:p-8 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Rocket className="h-6 w-6 text-emerald-400" />
                <h2 className="text-xl font-extrabold text-white">Lancer une Nouvelle Startup</h2>
              </div>
              <button
                type="button"
                aria-label="Fermer la modale"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-mist-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVenture} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1.5">Nom de la Startup</label>
                <input
                  type="text"
                  required
                  placeholder="ex: MadaTech Solutions, AgriSmart Tana..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-surface-950 text-white placeholder-mist-600 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1.5">Secteur d'Activité</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['tech', 'greentech', 'agritech', 'services'] as StartupSector[]).map((sec) => {
                    const info = SECTOR_INFO[sec];
                    const Icon = info.icon;
                    return (
                      <button
                        type="button"
                        key={sec}
                        onClick={() => setNewSector(sec)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs transition-all cursor-pointer ${
                          newSector === sec
                            ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                            : 'border-white/[0.06] bg-surface-950/60 text-mist-400 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span className="truncate">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1.5">Pitch & Proposition de Valeur</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explique en quelques lignes le problème résolu et ta cible à Madagascar..."
                  value={newPitch}
                  onChange={(e) => setNewPitch(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-surface-950 text-white placeholder-mist-600 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-mist-300 mb-1.5">
                  <span>Capital de départ apporté (MGA)</span>
                  <span className="text-emerald-400 font-bold">{formatNumber(newCapital)} MGA</span>
                </div>
                <input
                  type="range"
                  min={20000}
                  max={Math.max(20000, citizen.money)}
                  step={5000}
                  value={newCapital}
                  onChange={(e) => setNewCapital(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-mist-500 mt-1">
                  <span>Min : 20 000 MGA</span>
                  <span>Solde dispo : {formatNumber(citizen.money)} MGA</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-mist-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || citizen.money < 20000}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 text-xs font-extrabold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Startup (+80 XP)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
