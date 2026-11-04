import React from 'react';
import {
  CheckCircle2,
  Circle,
  Briefcase,
  GraduationCap,
  Home,
  Coins,
  Bot,
  Zap,
  Heart,
  History,
  Target,
  ArrowRight,
  Sparkles,
  Rocket,
  Users,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { NextActionBanner } from '../../components/NextActionBanner';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { IconChip } from '../../components/ui/IconChip';
import { Progress } from '../../components/ui/Progress';
import { MeterRow } from '../../components/ui/MeterRow';
import { HOUSINGS, JOBS, COURSES } from '../../data/mockData';
import { getGuidance } from '../../lib/guidance';
import { formatNumber } from '../../lib/format';

export const Dashboard: React.FC = () => {
  const { citizen, day, setActiveTab, toggleNovaModal, workShift, transactions, toggleCharacterCreation, isAuthenticated } = useGameStore();

  const currentHousing = HOUSINGS.find((h) => h.id === citizen.currentHousingId) || HOUSINGS[0];
  const currentJob = JOBS.find((j) => j.id === citizen.currentJobId);
  const guidance = getGuidance(citizen, JOBS, COURSES);

  const xpProgressPercent = Math.min(100, Math.round((citizen.xp / citizen.xpToNextLevel) * 100));

  return (
    <div className="space-y-5 sm:space-y-6">
      <NextActionBanner />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel as="section" aria-labelledby="cockpit-title" glow className="p-5 sm:p-6 lg:col-span-8">
          <div className="relative">
            <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar name={citizen.name} seed={citizen.avatarSeed} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="cockpit-title" className="text-xl font-black tracking-tight text-white md:text-2xl">
                      Bonjour, {citizen.name} !
                    </h2>
                    <Badge tone="brand">Niveau {citizen.level}</Badge>
                    {isAuthenticated && !citizen.onboardingCompleted && (
                      <button
                        type="button"
                        onClick={() => toggleCharacterCreation(true)}
                        title="Créer ton personnage : prénom, avatar et archétype (§14). Cette étape ne se fait qu'une fois."
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-2xs font-semibold text-mist-300 transition-colors hover:border-brand-400/40 hover:bg-brand-500/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 active:scale-95"
                      >
                        <Sparkles className="size-3 text-brand-400" aria-hidden="true" />
                        <span>Créer mon personnage</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-mist-400">
                    {citizen.title} &bull; Citoyen actif depuis {day} jours
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant={currentJob ? 'gain' : 'secondary'}
                  onClick={() => workShift()}
                  disabled={!currentJob}
                  title={
                    currentJob
                      ? 'Effectuer une journée de travail'
                      : 'Trouve d\'abord un emploi au Business District'
                  }
                >
                  <Briefcase className="size-4" aria-hidden="true" />
                  <span>Travailler</span>
                </Button>
                <Button variant="secondary" onClick={() => setActiveTab('campus')}>
                  <GraduationCap className="size-4 text-cool-400" aria-hidden="true" />
                  <span>Se former</span>
                </Button>
                <Button variant="secondary" onClick={() => setActiveTab('startup')}>
                  <Rocket className="size-4 text-emerald-400" aria-hidden="true" />
                  <span>Startup</span>
                </Button>
                <Button variant="secondary" onClick={() => setActiveTab('cityhub')}>
                  <Users className="size-4 text-iris-400" aria-hidden="true" />
                  <span>City Hub</span>
                </Button>
              </div>
            </div>

            <div className="py-5">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <span className="eyebrow flex items-center gap-2">
                  <Target className="size-3.5 text-brand-400" aria-hidden="true" />
                  Objectif de vie actuel
                </span>
                <span className="metric text-xs font-bold text-brand-300">
                  {citizen.currentObjective.progress}%
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{citizen.currentObjective.title}</h3>
              <p className="mt-1 mb-3 text-xs text-mist-400">{citizen.currentObjective.target}</p>

              <Progress
                value={citizen.currentObjective.progress}
                tone="brand"
                size="md"
                animated
                label={`Objectif : ${citizen.currentObjective.title}`}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="block text-2xs tracking-wider text-mist-500 uppercase">Progression de rang</span>
                <span className="metric mt-1 block text-xs font-bold text-mist-200">
                  {citizen.xp} XP / {citizen.xpToNextLevel} XP pour le niveau {citizen.level + 1}
                </span>
              </div>
              <Progress
                value={xpProgressPercent}
                tone="iris"
                size="sm"
                className="sm:w-48"
                label={`Rang : ${xpProgressPercent}%`}
              />
            </div>
          </div>
        </Panel>

        <Panel as="section" aria-labelledby="nova-briefing-title" tone="iris" className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-4">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <IconChip tone="iris" size="sm">
                  <Bot />
                </IconChip>
                <div className="min-w-0">
                  <h3 id="nova-briefing-title" className="text-sm font-black text-white">
                    Mentor NOVA
                  </h3>
                  <span className="flex items-center gap-1.5 text-2xs font-semibold text-gain-400">
                    <span className="size-1.5 rounded-full bg-gain-400 animate-pulse-soft" aria-hidden="true" />
                    En veille active
                  </span>
                </div>
              </div>
              <Badge tone="neutral">Jour {day}</Badge>
            </div>

            <blockquote className="panel-inset mb-4 p-3.5 text-xs leading-relaxed text-mist-200">
              &laquo;&nbsp;{guidance.briefing}&nbsp;&raquo;
            </blockquote>

            <div className="mb-4 space-y-2">
              <span className="eyebrow block">Plan du jour</span>
              <ul className="space-y-2">
                {guidance.plan.map((item) => (
                  <li
                    key={item.label}
                    className={`flex items-center gap-2 text-xs ${item.done ? 'text-mist-400' : 'text-mist-200'}`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-gain-400" aria-hidden="true" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-brand-400" aria-hidden="true" />
                    )}
                    <span className={item.done ? 'line-through' : ''}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <Button variant="outline" block onClick={() => toggleNovaModal(true)}>
            <Bot className="size-4" aria-hidden="true" />
            <span>Discuter avec NOVA</span>
          </Button>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Panel as="section" aria-labelledby="wallet-title" className="flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="wallet-title" className="flex items-center gap-2 text-sm font-bold text-white">
              <Coins className="size-4 text-gain-400" aria-hidden="true" />
              Portefeuille &amp; trésorerie
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('finance')}>
              Gérer
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>

          <div className="panel-inset mb-3 flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <span className="block text-2xs tracking-wider text-mist-500 uppercase">Solde liquide</span>
              <span className="metric mt-1 block text-lg font-black text-gain-300">
                {formatNumber(citizen.money)}
                <span className="ml-1 text-2xs font-medium text-mist-400">MGA</span>
              </span>
            </div>
            <div className="text-right">
              <span className="block text-2xs tracking-wider text-mist-500 uppercase">Épargne bloquée</span>
              <span className="metric mt-1 block text-sm font-bold text-cool-300">
                {formatNumber(citizen.savings)}
                <span className="ml-1 text-2xs font-medium text-mist-400">MGA</span>
              </span>
            </div>
          </div>

          <dl className="mt-auto space-y-2 text-xs">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-mist-500">Loyer estimé</dt>
              <dd className="metric font-semibold text-mist-200">&minus;{formatNumber(currentHousing.rentMonthly)} MGA / mois</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-mist-500">Emploi actuel</dt>
              <dd className="text-right font-semibold text-gain-400">
                {currentJob ? `${currentJob.title} (+${formatNumber(currentJob.salary)} MGA)` : 'Aucun — en recherche'}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel as="section" aria-labelledby="housing-title" className="flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="housing-title" className="flex items-center gap-2 text-sm font-bold text-white">
              <Home className="size-4 text-brand-300" aria-hidden="true" />
              Cadre de vie &amp; logement
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('residential')}>
              Changer
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>

          <div className="panel-inset mb-3 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-mist-100">{currentHousing.title}</span>
              <span
                role="img"
                aria-label={`${currentHousing.comfortStars} étoiles sur 5`}
                className="text-2xs text-warn-300"
              >
                {'★'.repeat(currentHousing.comfortStars)}
                <span className="text-mist-400/60">{'★'.repeat(5 - currentHousing.comfortStars)}</span>
              </span>
            </div>
            <p className="mt-1.5 text-2xs text-mist-500">
              Régénération d&rsquo;énergie : +{currentHousing.energyRecoveryPerNight}% par nuit
            </p>
          </div>

          <div className="mt-auto space-y-3">
            <MeterRow
              label="Énergie vitale"
              value={citizen.energy}
              tone="warn"
              icon={<Zap className="size-3.5 text-warn-400" aria-hidden="true" />}
            />
            <MeterRow
              label="Indice bien-être"
              value={citizen.wellbeing}
              tone="risk"
              icon={<Heart className="size-3.5 text-risk-400" aria-hidden="true" />}
            />
          </div>
        </Panel>

        <Panel as="section" aria-labelledby="skills-title" className="flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="skills-title" className="flex items-center gap-2 text-sm font-bold text-white">
              <GraduationCap className="size-4 text-cool-400" aria-hidden="true" />
              Compétences clés
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('passport')}>
              Passport
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>

          <ul className="space-y-2.5">
            {Object.entries(citizen.skills).slice(0, 4).map(([skill, val]) => (
              <li key={skill}>
                <MeterRow label={skill} value={val} labelClassName="capitalize" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel as="section" aria-labelledby="transactions-title" className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id="transactions-title" className="flex items-center gap-2 text-sm font-bold text-white">
            <History className="size-4 text-mist-400" aria-hidden="true" />
            Journal récent des transactions
          </h3>
          <Badge tone="neutral">Devise : MGA</Badge>
        </div>

        {transactions.length > 0 ? (
          <ul className="divide-y divide-white/[0.06]">
            {transactions.slice(0, 4).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`size-2 shrink-0 rounded-full ${
                      tx.amount > 0 ? 'bg-gain-400 shadow-[0_0_8px] shadow-gain-400/50' : 'bg-risk-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="block truncate font-semibold text-mist-100">{tx.label}</span>
                    <span className="block text-2xs text-mist-500">
                      {tx.timestamp} &bull; {tx.category}
                    </span>
                  </div>
                </div>
                <span
                  className={`metric shrink-0 text-sm font-bold ${
                    tx.amount > 0 ? 'text-gain-400' : 'text-risk-400'
                  }`}
                >
                  {tx.amount > 0 ? `+${formatNumber(tx.amount)} MGA` : `−${formatNumber(Math.abs(tx.amount))} MGA`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel-inset p-4 text-center text-xs text-mist-500">
            Aucune transaction pour l&rsquo;instant. Effectue un shift ou valide une mission freelance pour alimenter
            ton historique.
          </p>
        )}
      </Panel>
    </div>
  );
};
