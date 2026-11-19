import React, { useEffect, useState } from 'react';
import {
  Target,
  ArrowRight,
  Sparkles,
  BookOpen,
  Briefcase,
  Moon,
  Landmark,
  Bot,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Zap,
  Rocket,
  AlertTriangle,
} from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { IconChip } from './ui/IconChip';
import { formatMGA } from '../lib/format';
import type { NovaProactiveGuidance } from '../types/game';

type ValidTab = 'campus' | 'career' | 'finance' | 'residential' | 'startup' | 'cityhub';

export const NextActionBanner: React.FC = () => {
  const { citizen, setActiveTab, toggleNovaModal } = useGameStore();
  const [remoteGuidance, setRemoteGuidance] = useState<NovaProactiveGuidance | null>(null);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getNovaProactiveGuidance()
      .then((data) => {
        if (isMounted && data) {
          setRemoteGuidance(data);
        }
      })
      .catch(() => {
        // Fallback local gracefully
      });
    return () => {
      isMounted = false;
    };
  }, [citizen.energy, citizen.money, citizen.savings, citizen.currentJobId, citizen.completedCourses.length]);

  // Détermination locale réactive immédiate (zéro latence)
  let localTitle = '';
  let localDesc = '';
  let localReward = '';
  let localTab: ValidTab = 'campus';
  let LocalIcon = Sparkles;
  let localBtnText = 'Commencer';
  let urgency: 'urgent' | 'high' | 'medium' | 'normal' = 'normal';

  if (citizen.energy < 25) {
    localTitle = 'Repos vital urgent au Résidentiel !';
    localDesc = 'Ton énergie est passée sous la barre critique des 25%. Rentre chez toi te reposer pour restaurer ta vitalité.';
    localReward = '+40% à +80% Énergie';
    localTab = 'residential';
    LocalIcon = Moon;
    localBtnText = 'Aller se reposer';
    urgency = 'urgent';
  } else if (citizen.money < 50000 && citizen.savings < 20000) {
    localTitle = 'Trésorerie basse : Mission freelance d\'urgence';
    localDesc = 'Ton solde courant est inférieur à 50 000 MGA. Réalise une mission courte au Business District pour regarnir tes liquidités.';
    localReward = '+60 000 à 120 000 MGA';
    localTab = 'career';
    LocalIcon = Zap;
    localBtnText = 'Missions Freelance';
    urgency = 'high';
  } else if (!citizen.completedCourses.includes('course-web-dev') && (citizen.skills.javascript || 0) < 50) {
    localTitle = 'Perfectionne tes compétences au Campus District';
    localDesc = 'Valide le cursus « Développement Web Fondamental », réussis le quiz de contrôle et obtiens ton certificat officiel.';
    localReward = '+150 XP & +20% Compétences';
    localTab = 'campus';
    LocalIcon = BookOpen;
    localBtnText = 'Aller au Campus';
    urgency = 'medium';
  } else if (!citizen.currentJobId && (citizen.skills.javascript || 0) >= 50) {
    localTitle = 'Postule à ton premier emploi tech au Business District !';
    localDesc = 'Tu as le niveau requis pour le poste de Développeur Web Junior chez TechSolutions S.A. (450 000 MGA/mois).';
    localReward = '+120 XP & Salaire mensuel';
    localTab = 'career';
    LocalIcon = Briefcase;
    localBtnText = 'Voir les offres';
    urgency = 'medium';
  } else if (citizen.money >= 200000 && citizen.savings < 150000) {
    localTitle = 'Sécurise ton épargne de précaution au Finance District';
    localDesc = 'Place une partie de tes liquidités sur ton livret d\'épargne pour parer aux imprévus de la vie adulte.';
    localReward = 'Protection financière';
    localTab = 'finance';
    LocalIcon = Landmark;
    localBtnText = 'Gérer mon épargne';
    urgency = 'normal';
  } else if (citizen.money >= 300000) {
    localTitle = 'Amorçage entrepreneurial au Startup District';
    localDesc = 'Tu disposes de réserves financières solides. Il est temps de prototyper un projet ou de postuler à une subvention.';
    localReward = '+300 XP & Dividendes';
    localTab = 'startup';
    LocalIcon = Rocket;
    localBtnText = 'Incubateur Startup';
    urgency = 'normal';
  } else {
    localTitle = 'Accomplis ta journée de travail ou avance sur ton projet';
    localDesc = 'Effectue ton shift journalier pour percevoir ton salaire virtuel et consolider ton Career Passport.';
    localReward = '+40 XP & Revenus virtuels';
    localTab = 'career';
    LocalIcon = Briefcase;
    localBtnText = 'Travailler';
    urgency = 'normal';
  }

  // Fusion avec données serveur si disponibles
  const actionTitle = remoteGuidance?.priorityAction.title || localTitle;
  const actionDesc = remoteGuidance?.priorityAction.description || localDesc;
  const actionReward = remoteGuidance?.priorityAction.reward || localReward;
  const actionTab = (remoteGuidance?.priorityAction.targetTab as ValidTab) || localTab;
  const btnText = remoteGuidance?.priorityAction.buttonText || localBtnText;
  const activeUrgency = remoteGuidance?.priorityAction.urgency || urgency;

  const proactiveTip =
    remoteGuidance?.proactiveTip ||
    (citizen.savings < 50000
      ? `Attention ${citizen.name} : Ton épargne est faible (${formatMGA(citizen.savings)}). Envisage d'épargner au moins 20 000 MGA par cycle pour te prémunir contre les aléas imprévus.`
      : `Excellente gestion citoyenne, ${citizen.name} ! Équilibre toujours compétences au Campus, autonomie financière au Business District et vitalité au Résidentiel.`);

  const dailyChecklist = remoteGuidance?.dailyChecklist || [
    {
      id: 'task-campus',
      label: 'Terminer ou réviser un module de formation (Campus District)',
      completed: citizen.completedCourses.length > 0,
      targetTab: 'campus' as const,
      xpBonus: 50,
    },
    {
      id: 'task-career',
      label: 'Postuler à un emploi ou accomplir une mission freelance (Business District)',
      completed: Boolean(citizen.currentJobId),
      targetTab: 'career' as const,
      xpBonus: 60,
    },
    {
      id: 'task-finance',
      label: 'Déposer au moins 20 000 MGA sur le livret d\'épargne (Finance District)',
      completed: citizen.savings >= 50000,
      targetTab: 'finance' as const,
      xpBonus: 40,
    },
    {
      id: 'task-social-startup',
      label: 'Rejoindre une Guilde ou développer un projet de Startup',
      completed: citizen.completedProjects > 0,
      targetTab: 'cityhub' as const,
      xpBonus: 75,
    },
  ];

  const borderTone =
    activeUrgency === 'urgent'
      ? 'border-l-risk-400 bg-risk-500/5'
      : activeUrgency === 'high'
        ? 'border-l-warn-400 bg-warn-500/5'
        : activeUrgency === 'medium'
          ? 'border-l-brand-400 bg-brand-500/5'
          : 'border-l-gain-400 bg-gain-500/5';

  return (
    <section
      aria-labelledby="next-action-title"
      className={`panel panel-accent relative overflow-hidden border-l-[3px] p-4 sm:p-5 transition-all duration-300 ${borderTone}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -bottom-24 size-64 rounded-full bg-brand-500/10 blur-3xl"
      />

      {/* Ligne principale : Action Recommandée (§57) */}
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <IconChip
            tone={activeUrgency === 'urgent' ? 'risk' : activeUrgency === 'high' ? 'warn' : 'brand'}
            className="mt-0.5"
          >
            {activeUrgency === 'urgent' ? (
              <AlertTriangle className="animate-pulse" />
            ) : (
              <LocalIcon />
            )}
          </IconChip>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge
                tone={activeUrgency === 'urgent' ? 'risk' : activeUrgency === 'high' ? 'warn' : 'brand'}
                variant="square"
                icon={<Target />}
              >
                Next Action Conseillée
              </Badge>
              <span className="text-xs font-bold text-warn-300">{actionReward}</span>
              {activeUrgency === 'urgent' && (
                <span className="rounded-full bg-risk-500/20 px-2 py-0.5 text-3xs font-black uppercase text-risk-300 animate-pulse">
                  Priorité vitale
                </span>
              )}
            </div>
            <h3 id="next-action-title" className="text-sm font-bold text-white sm:text-base">
              {actionTitle}
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-mist-400 sm:text-sm">
              {actionDesc}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPlan((prev) => !prev)}
            className="text-xs"
          >
            <Bot className="size-3.5 text-brand-300" aria-hidden="true" />
            <span>Plan NOVA</span>
            {showPlan ? (
              <ChevronUp className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            )}
          </Button>

          <Button
            variant={activeUrgency === 'urgent' ? 'warn' : 'primary'}
            size="lg"
            onClick={() => setActiveTab(actionTab)}
          >
            {btnText}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Accordéon Dépliable : Conseils Proactifs & Plan d'Action Journalier NOVA (§27, §28) */}
      {showPlan && (
        <div className="relative mt-5 border-t border-white/[0.08] pt-4 animate-rise-in space-y-4">
          {/* Bulle Conseil Proactif de NOVA (§27) */}
          <div className="rounded-xl border border-brand-400/25 bg-brand-500/10 p-3.5 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand-400/40 bg-brand-500/20 text-brand-200">
                <Bot className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-brand-200 flex items-center gap-1.5">
                    Conseil Proactif de NOVA
                    <Sparkles className="size-3 text-warn-400" />
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleNovaModal(true)}
                    className="text-3xs text-brand-300 hover:text-white underline font-semibold cursor-pointer"
                  >
                    Ouvrir le chat
                  </button>
                </div>
                <p className="mt-1 text-xs italic leading-relaxed text-mist-200">
                  « {proactiveTip} »
                </p>
              </div>
            </div>
          </div>

          {/* Checklist du Plan Journalier (§28) */}
          <div className="rounded-xl border border-white/[0.06] bg-night-950/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow text-mist-400">
                Plan d'action du jour de NOVA
              </span>
              <span className="text-3xs text-mist-400">
                {dailyChecklist.filter((t) => t.completed).length}/{dailyChecklist.length} complétés
              </span>
            </div>

            <ul className="space-y-2">
              {dailyChecklist.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5 text-xs transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {task.completed ? (
                      <CheckCircle2 className="size-4 shrink-0 text-gain-400" aria-hidden="true" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-mist-500" aria-hidden="true" />
                    )}
                    <span className={task.completed ? 'text-mist-400 line-through' : 'text-white font-medium'}>
                      {task.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-3xs text-warn-300 font-bold">+{task.xpBonus} XP</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(task.targetTab)}
                      className="rounded px-2 py-0.5 text-3xs font-semibold text-brand-300 hover:bg-brand-500/20 hover:text-white transition-colors"
                    >
                      Aller &rarr;
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNovaModal(true)}
                className="text-xs text-mist-300 hover:text-white"
              >
                <MessageSquare className="size-3.5" aria-hidden="true" />
                Consulter NOVA pour un arbitrage personnalisé
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
