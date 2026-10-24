import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Zap,
  Coins,
  Check,
  Briefcase,
  Home,
  Rocket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { IconChip } from './ui/IconChip';
import { formatNumber } from '../lib/format';

const CATEGORY_META = {
  career: { label: 'Emploi & Carrière (§26, §52)', tone: 'iris' as const, icon: <Briefcase /> },
  startup: { label: 'Startup & Innovation (§26, §24)', tone: 'brand' as const, icon: <Rocket /> },
  finance: { label: 'Finance & Pouvoir d\'achat (§26)', tone: 'gain' as const, icon: <TrendingUp /> },
  domestic: { label: 'Logement & Aléa Domestique (§26)', tone: 'warn' as const, icon: <Home /> },
  campus: { label: 'Campus & Challenge Citoyen (§26, §31)', tone: 'brand' as const, icon: <Users /> },
  general: { label: 'Événement Imprévu & Aléa (§25, §26)', tone: 'warn' as const, icon: <AlertTriangle /> },
};

export const DecisionModal: React.FC = () => {
  const { activeDilemma, dismissDilemma, resolveDilemmaOption, citizen } = useGameStore();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  if (!activeDilemma) return null;

  const meta = CATEGORY_META[activeDilemma.category || 'general'] || CATEGORY_META.general;

  const handleConfirm = () => {
    if (!selectedOptionId) return;
    resolveDilemmaOption(selectedOptionId);
  };

  return (
    <Modal open onClose={dismissDilemma} labelledBy="dilemma-title" size="lg" dismissOnBackdrop={false}>
      <div className="border-b border-white/[0.07] bg-warn-500/[0.04] px-5 py-4 pr-14 sm:px-6">
        <div className="flex items-center gap-3">
          <IconChip tone={meta.tone}>
            {meta.icon}
          </IconChip>
          <div className="min-w-0">
            <span className="text-2xs font-black tracking-wider text-warn-400 uppercase">
              {meta.label}
            </span>
            <h2 id="dilemma-title" className="mt-1 text-lg font-bold text-white">
              {activeDilemma.title}
            </h2>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        <p className="panel-inset p-4 text-xs leading-relaxed text-mist-200 sm:text-sm">
          {activeDilemma.scenario}
        </p>

        <fieldset className="space-y-2.5">
          <legend className="eyebrow mb-2.5">Que décides-tu de faire ?</legend>

          {activeDilemma.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const canAfford = citizen.money >= opt.costMoney;

            return (
              <label
                key={opt.id}
                className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-3.5 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between ${
                  !canAfford
                    ? 'cursor-not-allowed border-white/[0.06] bg-night-950/40 opacity-55'
                    : isSelected
                      ? 'border-warn-400/60 bg-warn-500/12 shadow-warn'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-warn-400/35 hover:bg-warn-500/[0.06]'
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="dilemma-option"
                    value={opt.id}
                    checked={isSelected}
                    disabled={!canAfford}
                    onChange={() => setSelectedOptionId(opt.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400 ${
                      isSelected ? 'border-warn-300 bg-warn-400 text-night-950' : 'border-white/15 bg-white/[0.04]'
                    }`}
                  >
                    {isSelected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <div className="space-y-1">
                    <span
                      className={`block text-xs leading-snug font-medium ${
                        isSelected ? 'text-white' : canAfford ? 'text-mist-200' : 'text-mist-400'
                      }`}
                    >
                      {opt.text}
                    </span>
                    {opt.impactSkills && Object.keys(opt.impactSkills).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 text-3xs">
                        {Object.entries(opt.impactSkills).map(([skill, val]) => (
                          <span
                            key={skill}
                            className={`rounded px-1.5 py-0.2 font-semibold ${
                              val > 0
                                ? 'bg-gain-500/15 text-gain-300'
                                : 'bg-risk-500/15 text-risk-300'
                            }`}
                          >
                            {skill} {val > 0 ? `+${val}%` : `${val}%`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </span>

                <span className="flex shrink-0 flex-wrap items-center gap-3 self-end text-xs sm:self-center">
                  {opt.costMoney > 0 && (
                    <span className="metric flex items-center gap-1 font-bold text-risk-300">
                      <Coins className="size-3" aria-hidden="true" />
                      &minus;{formatNumber(opt.costMoney)} MGA
                    </span>
                  )}
                  {opt.gainMoney && opt.gainMoney > 0 && (
                    <span className="metric flex items-center gap-1 font-bold text-gain-300">
                      <Coins className="size-3" aria-hidden="true" />
                      +{formatNumber(opt.gainMoney)} MGA
                    </span>
                  )}
                  {opt.costEnergy > 0 && (
                    <span className="metric flex items-center gap-1 font-bold text-warn-300">
                      <Zap className="size-3" aria-hidden="true" />
                      &minus;{opt.costEnergy}%
                    </span>
                  )}
                  {opt.gainXp > 0 && (
                    <span className="metric flex items-center gap-1 font-bold text-brand-300">
                      <Sparkles className="size-3" aria-hidden="true" />
                      +{opt.gainXp} XP
                    </span>
                  )}
                  {!canAfford && <Badge tone="neutral">Fonds insuffisants</Badge>}
                </span>
              </label>
            );
          })}
        </fieldset>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] bg-night-900/40 px-5 py-4 sm:px-6">
        <Button variant="ghost" size="md" onClick={dismissDilemma}>
          Plus tard
        </Button>
        <Button variant="warn" size="md" disabled={!selectedOptionId} onClick={handleConfirm}>
          Confirmer mon arbitrage
        </Button>
      </div>
    </Modal>
  );
};
