import React, { useState } from 'react';
import {
  Landmark,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Calculator,
  PieChart,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconChip } from '../../components/ui/IconChip';
import { controlClass } from '../../components/ui/control';

const BUDGET_RULE = [
  {
    share: '50%',
    label: 'Besoins vitaux',
    amount: '200 000 MGA',
    detail: 'Loyer, alimentation de base, factures d\'énergie.',
    tone: 'cool',
    bar: 'from-cool-500 to-cool-300',
  },
  {
    share: '30%',
    label: 'Confort & loisirs',
    amount: '120 000 MGA',
    detail: 'Sorties, vêtements, téléphone, abonnements.',
    tone: 'brand',
    bar: 'from-brand-500 to-brand-300',
  },
  {
    share: '20%',
    label: 'Épargne & projets',
    amount: '80 000 MGA',
    detail: 'Fonds d\'urgence, investissement futur, formations.',
    tone: 'gain',
    bar: 'from-gain-500 to-gain-300',
  },
] as const;

const LOAN_AMOUNTS = [50000, 100000, 200000, 400000];
const LOAN_DURATIONS = [3, 6, 12];

export const FinanceView: React.FC = () => {
  const { citizen, depositSavings, withdrawSavings } = useGameStore();
  const [savingsInput, setSavingsInput] = useState<string>('50000');
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [loanDuration, setLoanDuration] = useState<number>(6);

  const handleDeposit = () => {
    const val = parseInt(savingsInput, 10);
    if (!isNaN(val) && val > 0) {
      depositSavings(val);
    }
  };

  const handleWithdraw = () => {
    const val = parseInt(savingsInput, 10);
    if (!isNaN(val) && val > 0) {
      withdrawSavings(val);
    }
  };

  const monthlyPayment = Math.round((loanAmount * (1 + 0.05 * (loanDuration / 12))) / loanDuration);

  return (
    <div className="space-y-5 sm:space-y-6">
      <ViewHeader
        headingId="finance-title"
        tone="gain"
        badgeIcon={<Landmark />}
        badgeLabel="Finance District"
        meta="Banque & éducation budgétaire"
        title="Prends le contrôle de ton budget"
        description="Apprends à piloter tes flux financiers, à te constituer une épargne de sécurité et à comprendre les mécanismes du crédit bancaire sans risque."
        aside={
          <div className="flex max-w-xs items-start gap-2.5 rounded-xl border border-gain-400/30 bg-gain-500/8 p-3.5 text-xs text-gain-200">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gain-400" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="font-bold">100 % virtuel &amp; pédagogique :</strong> aucun argent réel n&rsquo;est
              engagé. Tous les montants sont en MGA.
            </p>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel as="section" aria-labelledby="current-account-title" className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <IconChip tone="gain" size="sm">
                <Coins />
              </IconChip>
              <h3 id="current-account-title" className="eyebrow text-gain-300">
                Compte courant disponible
              </h3>
            </div>
            <p className="metric mb-2 text-3xl font-extrabold text-white sm:text-4xl">
              {citizen.money.toLocaleString()}
              <span className="ml-1.5 text-sm font-medium text-gain-400">MGA</span>
            </p>
            <p className="text-xs leading-relaxed text-mist-400">
              Liquidités immédiatement utilisables pour payer ton loyer, tes cours ou tes achats de confort.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-5">
            <label htmlFor="savings-amount" className="text-2xs tracking-wider text-mist-500 uppercase">
              Transfert rapide
            </label>
            <input
              id="savings-amount"
              type="number"
              step="10000"
              min="0"
              inputMode="numeric"
              value={savingsInput}
              onChange={(event) => setSavingsInput(event.target.value)}
              className={`metric h-9 w-32 px-2.5 text-right text-xs ${controlClass}`}
            />
            <Button variant="gain" onClick={handleDeposit} className="shrink-0">
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span>Vers épargne</span>
            </Button>
          </div>
        </Panel>

        <Panel
          as="section"
          aria-labelledby="savings-account-title"
          tone="cool"
          className="flex flex-col justify-between p-5 sm:p-6"
        >
          <div>
            <div className="mb-4 flex items-center gap-3">
              <IconChip tone="cool" size="sm">
                <PiggyBank />
              </IconChip>
              <h3 id="savings-account-title" className="eyebrow text-cool-300">
                Livret d&rsquo;épargne de précaution
              </h3>
            </div>
            <p className="metric mb-2 text-3xl font-extrabold text-cool-300 sm:text-4xl">
              {citizen.savings.toLocaleString()}
              <span className="ml-1.5 text-sm font-medium text-cool-400">MGA</span>
            </p>
            <p className="text-xs leading-relaxed text-mist-400">
              Fonds de sécurité pour te protéger contre les imprévus (panne d&rsquo;ordinateur, coup dur
              professionnel).
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gain-400">
              <Check className="size-3.5" aria-hidden="true" />
              Sécurité active
            </span>
            <Button variant="secondary" onClick={handleWithdraw}>
              <ArrowDownLeft className="size-3.5 text-cool-400" aria-hidden="true" />
              <span>Retirer vers courant</span>
            </Button>
          </div>
        </Panel>
      </div>

      <Panel as="section" aria-labelledby="budget-rule-title" className="space-y-4 p-5 sm:p-6">
        <h3 id="budget-rule-title" className="flex items-center gap-2.5 text-base font-bold text-white">
          <IconChip tone="brand" size="sm">
            <PieChart />
          </IconChip>
          Le guide d&rsquo;or : la règle budgétaire 50 / 30 / 20
        </h3>

        <p className="text-xs leading-relaxed text-mist-400">
          Pour un revenu mensuel simulé moyen de 400 000 MGA, voici la répartition idéale recommandée par ton mentor.
        </p>

        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-3">
          {BUDGET_RULE.map((item) => (
            <div key={item.share} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <Badge tone={item.tone} className="mb-2">
                  {item.share} &mdash; {item.label}
                </Badge>
              <p className="metric text-lg font-extrabold text-white">{item.amount}</p>
              <p className="mt-1.5 text-2xs leading-relaxed text-mist-400">{item.detail}</p>
              <div className="track mt-3 h-1.5 w-full">
                <div className={`h-full rounded-full bg-linear-to-r ${item.bar}`} style={{ width: item.share }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel as="section" aria-labelledby="loan-title" className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="loan-title" className="flex items-center gap-2.5 text-base font-bold text-white">
            <IconChip tone="warn" size="sm">
              <Calculator />
            </IconChip>
            Simulateur de micro-crédit responsable
          </h3>
          <Badge tone="warn">Taux annuel simulé : 5 %</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="loan-amount" className="eyebrow mb-1.5 block">
              Montant emprunté
            </label>
            <select
              id="loan-amount"
              value={loanAmount}
              onChange={(event) => setLoanAmount(parseInt(event.target.value, 10))}
              className={`h-10 w-full px-3 text-xs ${controlClass}`}
            >
              {LOAN_AMOUNTS.map((amount) => (
                <option key={amount} value={amount}>
                  {amount.toLocaleString()} MGA
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="loan-duration" className="eyebrow mb-1.5 block">
              Durée de remboursement
            </label>
            <select
              id="loan-duration"
              value={loanDuration}
              onChange={(event) => setLoanDuration(parseInt(event.target.value, 10))}
              className={`h-10 w-full px-3 text-xs ${controlClass}`}
            >
              {LOAN_DURATIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} mois virtuels
                </option>
              ))}
            </select>
          </div>

          <div className="panel-inset flex flex-col justify-center rounded-xl p-3.5">
            <span className="eyebrow">Mensualité estimée</span>
            <span className="metric mt-1.5 text-lg font-extrabold text-warn-300">
              {monthlyPayment.toLocaleString()} MGA / mois
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
};
