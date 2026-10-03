import React from 'react';
import { Target, ArrowRight, Sparkles, BookOpen, Briefcase, Moon, Landmark } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { IconChip } from './ui/IconChip';

export const NextActionBanner: React.FC = () => {
  const { citizen, setActiveTab } = useGameStore();

  let actionTitle = '';
  let actionDesc = '';
  let actionReward = '';
  let actionTab: 'campus' | 'career' | 'finance' | 'residential' = 'campus';
  let ActionIcon = Sparkles;
  let btnText = 'Commencer';

  if (citizen.energy < 25) {
    actionTitle = 'Repos urgent nécessaire !';
    actionDesc = 'Ton énergie est passée sous la barre des 25%. Rentre chez toi pour dormir et restaurer ta vitalité.';
    actionReward = '+40% à +80% Énergie';
    actionTab = 'residential';
    ActionIcon = Moon;
    btnText = 'Aller se reposer';
  } else if (!citizen.completedCourses.includes('course-web-dev') && (citizen.skills.javascript || 0) < 50) {
    actionTitle = 'Perfectionne tes compétences au Campus District';
    actionDesc = 'Termine le cursus "Développement Web Fondamental" pour débloquer les offres de Développeur Junior.';
    actionReward = '+150 XP & +20% JavaScript';
    actionTab = 'campus';
    ActionIcon = BookOpen;
    btnText = 'Aller au Campus';
  } else if (!citizen.currentJobId && (citizen.skills.javascript || 0) >= 50) {
    actionTitle = 'Postule à ton premier emploi tech au Business District !';
    actionDesc = 'Tu as le niveau requis pour le poste de Développeur Web Junior chez TechSolutions S.A. (450 000 MGA/mois).';
    actionReward = '+120 XP & Salaire mensuel';
    actionTab = 'career';
    ActionIcon = Briefcase;
    btnText = 'Voir les offres';
  } else if (citizen.money > 200000 && citizen.savings < 150000) {
    actionTitle = 'Sécurise ton épargne de précaution au Finance District';
    actionDesc = 'Place une partie de tes liquidités sur ton livret d\'épargne pour parer aux imprévus de la vie adulte.';
    actionReward = 'Protection financière';
    actionTab = 'finance';
    ActionIcon = Landmark;
    btnText = 'Gérer mon épargne';
  } else {
    actionTitle = 'Accomplis ta journée de travail ou avance sur ton projet';
    actionDesc = 'Effectue ton shift journalier pour percevoir ton salaire et accumuler de l\'expérience citoyenne.';
    actionReward = '+40 XP & Revenus virtuels';
    actionTab = 'career';
    ActionIcon = Briefcase;
    btnText = 'Travailler';
  }

  return (
    <section
      aria-labelledby="next-action-title"
      className="panel panel-accent relative overflow-hidden border-l-[3px] border-l-brand-400 p-4 sm:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -bottom-24 size-64 rounded-full bg-brand-500/15 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <IconChip tone="brand" className="mt-0.5">
            <ActionIcon />
          </IconChip>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="brand" variant="square" icon={<Target />}>
                Next action recommandée
              </Badge>
              <span className="text-xs font-bold text-warn-300">{actionReward}</span>
            </div>
            <h3 id="next-action-title" className="text-sm font-bold text-white sm:text-base">
              {actionTitle}
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-mist-400 sm:text-sm">
              {actionDesc}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setActiveTab(actionTab)}
          className="shrink-0 self-start md:self-center"
        >
          {btnText}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
};
