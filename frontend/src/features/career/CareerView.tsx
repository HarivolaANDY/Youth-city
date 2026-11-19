import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Zap,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  Bot,
  X,
  Shirt,
  GraduationCap,
  Clock,
  Code,
  Megaphone,
  BarChart,
  Palette,
  FileText,
  History,
  Loader2,
} from 'lucide-react';
import { JOBS, DEFAULT_FREELANCE_GIGS } from '../../data/mockData';
import { useGameStore } from '../../stores/useGameStore';
import type { Job, InterviewResult, FreelanceGig } from '../../types/game';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconChip } from '../../components/ui/IconChip';
import { Tooltip } from '../../components/ui/Tooltip';
import { formatNumber } from '../../lib/format';

const GIG_CATEGORY_META: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
  tech: { label: 'Tech & Web', tone: 'brand', icon: <Code className="size-3.5" /> },
  marketing: { label: 'Marketing & Comm', tone: 'cool', icon: <Megaphone className="size-3.5" /> },
  finance: { label: 'Finance & Compta', tone: 'gain', icon: <BarChart className="size-3.5" /> },
  design: { label: 'Design & Créa', tone: 'iris', icon: <Palette className="size-3.5" /> },
  writing: { label: 'Rédaction & Trad', tone: 'warn', icon: <FileText className="size-3.5" /> },
};

export const CareerView: React.FC = () => {
  const {
    citizen,
    workShift,
    addNotification,
    simulateInterview,
    setActiveTab,
    freelanceGigs,
    freelanceContracts,
    freelanceStats,
    fetchFreelanceGigs,
    completeFreelanceGig,
  } = useGameStore();

  const [careerMode, setCareerMode] = useState<'jobs' | 'freelance'>('jobs');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [executingKey, setExecutingKey] = useState<string | null>(null);

  const [interviewJob, setInterviewJob] = useState<Job | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFreelanceGigs();
  }, [fetchFreelanceGigs]);

  const hasSuit = (citizen.inventory || []).includes('item-suit');
  const activeJob = JOBS.find((j) => j.id === citizen.currentJobId);

  // Active gigs list with fallback
  const displayGigs: FreelanceGig[] =
    freelanceGigs && freelanceGigs.length > 0
      ? freelanceGigs
      : DEFAULT_FREELANCE_GIGS.map((g) => {
          const citizenSkill = citizen.skills[g.requiredSkillKey] || 10;
          const skillOk = citizenSkill >= g.minSkillPercent;
          const energyOk = citizen.energy >= g.energyCost;
          let reason = '';
          if (!energyOk) reason = `Énergie insuffisante (${citizen.energy}% / ${g.energyCost}% requis)`;
          else if (!skillOk) reason = `Compétence insuffisante (${citizenSkill}% / ${g.minSkillPercent}% requis)`;

          return {
            ...g,
            canApply: skillOk && energyOk,
            citizenSkillLevel: citizenSkill,
            reason,
          };
        });

  const filteredGigs = selectedCategory === 'all'
    ? displayGigs
    : displayGigs.filter((g) => g.category === selectedCategory);

  const checkEligibility = (job: Job) =>
    job.requirements.every((req) => (citizen.skills[req.skillKey] || 0) >= req.requiredPercent);

  const handleStartInterview = (job: Job) => {
    if (!checkEligibility(job)) {
      addNotification('Compétences insuffisantes', 'Perfectionne d\'abord tes compétences au Campus District.', 'warning');
      return;
    }
    setInterviewJob(job);
    setSelectedAnswerIndex(null);
    setInterviewResult(null);
  };

  const handleSubmitInterview = async () => {
    if (selectedAnswerIndex === null || !interviewJob) return;
    setIsSubmitting(true);
    try {
      const res = await simulateInterview(interviewJob.id, selectedAnswerIndex);
      if (res) {
        setInterviewResult(res);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteGig = async (gig: FreelanceGig) => {
    if (!gig.canApply) {
      addNotification('Conditions non remplies', gig.reason || 'Prérequis non satisfaits.', 'warning');
      return;
    }
    setExecutingKey(gig.key);
    try {
      await completeFreelanceGig(gig.key);
    } finally {
      setExecutingKey(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <ViewHeader
        headingId="career-title"
        tone="brand"
        badgeIcon={<Briefcase />}
        badgeLabel="Business District"
        meta="Entreprises & Opportunités"
        title="Carrière & Contrats Professionnels"
        description="Trouve un poste salarié avec salaire mensuel ou exécute des missions freelance rémunérées à l'acte pour booster tes liquidités et forger ton Career Passport."
        aside={
          careerMode === 'jobs' ? (
            activeJob ? (
              <div className="flex items-center gap-3 rounded-xl border border-gain-400/35 bg-gain-500/10 px-4 py-3">
                <IconChip tone="gain">
                  <UserCheck />
                </IconChip>
                <div className="min-w-0">
                  <span className="eyebrow block text-gain-400">Poste en cours</span>
                  <span className="mt-1 block truncate text-sm font-bold text-white">{activeJob.title}</span>
                  <span className="metric block text-xs text-gain-300">
                    +{formatNumber(activeJob.salary)} MGA / mois
                  </span>
                </div>
              </div>
            ) : (
              <div className="panel-inset px-4 py-3">
                <span className="block text-2xs tracking-wider text-mist-500 uppercase">Statut professionnel</span>
                <span className="mt-1 block text-sm font-bold text-warn-300">En recherche d&rsquo;emploi</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-brand-400/35 bg-brand-500/10 px-4 py-3">
              <IconChip tone="brand">
                <Zap />
              </IconChip>
              <div className="min-w-0">
                <span className="eyebrow block text-brand-300">Revenus Freelance Cumulés</span>
                <span className="metric mt-1 block text-sm font-bold text-gain-300">
                  +{formatNumber(freelanceStats?.totalEarned || 0)} MGA
                </span>
                <span className="block text-2xs text-mist-400">
                  {freelanceStats?.totalCompleted || 0} contrat{(freelanceStats?.totalCompleted || 0) > 1 ? 's' : ''} livré{(freelanceStats?.totalCompleted || 0) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )
        }
      />

      {/* Mode Switcher: Emplois Salariés vs Missions Freelance (§52) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="inline-flex rounded-xl border border-white/10 bg-night-950/60 p-1">
          <button
            type="button"
            onClick={() => setCareerMode('jobs')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
              careerMode === 'jobs'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-mist-400 hover:text-white'
            }`}
          >
            <Building className="size-3.5" />
            <span>Emplois Salariés ({JOBS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCareerMode('freelance')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
              careerMode === 'freelance'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-mist-400 hover:text-white'
            }`}
          >
            <Zap className="size-3.5 text-warn-400" />
            <span>Missions Freelance &amp; Contrats Courts</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-2xs font-black">
              {displayGigs.length}
            </span>
          </button>
        </div>

        {careerMode === 'freelance' && (
          <div className="flex items-center gap-2">
            <span className="text-2xs text-mist-400">Énergie citoyenne :</span>
            <span className={`metric text-xs font-bold ${citizen.energy >= 25 ? 'text-warn-300' : 'text-risk-400'}`}>
              <Zap className="inline size-3.5 text-warn-400 mr-0.5" />
              {citizen.energy}%
            </span>
          </div>
        )}
      </div>

      {/* --- SECTION 1: EMPLOIS SALARIÉS --- */}
      {careerMode === 'jobs' && (
        <div className="space-y-5">
          {activeJob && (
            <Panel
              as="section"
              aria-label="Activité professionnelle du jour"
              tone="gain"
              className="flex flex-col gap-4 border-l-[3px] border-l-gain-400 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div className="min-w-0">
                <span className="eyebrow block text-gain-400">Activité professionnelle du jour</span>
                <h3 className="mt-1.5 text-base font-bold text-white">
                  Effectuer une journée de travail chez {activeJob.company}
                </h3>
                <p className="mt-1 text-xs text-mist-400">
                  Coût : &minus;{activeJob.energyPerShift}% d&rsquo;énergie &bull; Gain : +
                  {formatNumber(Math.round(activeJob.salary / 20))} MGA &bull; +40 XP
                </p>
              </div>

              <Button variant="gain" size="lg" onClick={() => workShift()} className="shrink-0">
                <Briefcase className="size-4" aria-hidden="true" />
                <span>Valider ma journée de travail</span>
              </Button>
            </Panel>
          )}

          {interviewJob && (
            <Panel
              as="section"
              aria-labelledby="interview-title"
              tone="brand"
              className="animate-rise-in space-y-4 border-l-[3px] border-l-brand-400 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] pb-4">
                <div className="min-w-0">
                  <span className="eyebrow text-brand-300">Simulation d&rsquo;entretien d&rsquo;embauche</span>
                  <h3 id="interview-title" className="mt-1.5 text-lg font-bold text-white">
                    {interviewJob.title} &mdash; {interviewJob.company}
                  </h3>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setInterviewJob(null)}>
                  <X className="size-3.5" aria-hidden="true" />
                  Fermer
                </Button>
              </div>

              {hasSuit && (
                <div className="flex items-center gap-2 rounded-xl border border-brand-400/30 bg-brand-500/10 px-3.5 py-2.5 text-xs text-brand-200">
                  <Shirt className="size-4 shrink-0 text-brand-300" />
                  <span>
                    <strong>Tenue Professionnelle équipée :</strong> Bonus de prestance <strong>+5%</strong> pris en compte par le jury !
                  </span>
                </div>
              )}

              <div className="panel-inset space-y-2.5 p-4 sm:p-5">
                <span className="eyebrow flex items-center gap-2 text-brand-300">
                  <Bot className="size-4" aria-hidden="true" />
                  👔 Le Recruteur Virtuel ({interviewJob.company})
                </span>
                <p className="text-sm leading-relaxed font-semibold text-white italic">
                  &laquo;&nbsp;{interviewJob.interviewQuestion}&nbsp;&raquo;
                </p>
              </div>

              <fieldset className="space-y-3">
                <legend className="eyebrow mb-2">Choisis ton argumentation :</legend>
                {interviewJob.sampleAnswers.map((ans, idx) => {
                  const isSelected = selectedAnswerIndex === idx;

                  return (
                    <label
                      key={idx}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-400 ${
                        interviewResult !== null
                          ? 'cursor-default border-white/[0.06] bg-night-950/40 opacity-70'
                          : isSelected
                            ? 'border-brand-400/60 bg-brand-500/12 text-white'
                            : 'border-white/[0.08] bg-white/[0.02] text-mist-300 hover:border-brand-400/40 hover:bg-white/[0.05]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="interview-answer"
                        value={idx}
                        checked={isSelected}
                        disabled={interviewResult !== null || isSubmitting}
                        onChange={() => setSelectedAnswerIndex(idx)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`metric mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-2xs font-bold transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400 ${
                          isSelected ? 'border-brand-300 bg-brand-500 text-white' : 'border-white/15 bg-white/[0.04] text-mist-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{ans.text}</span>
                    </label>
                  );
                })}
              </fieldset>

              {interviewResult && (
                <div className="animate-fade-in space-y-4 pt-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/5 bg-night-900/60 p-3 text-xs">
                      <span className="text-mist-400">Score de prestance obtenu : </span>
                      <span className="font-bold text-brand-300">{interviewResult.score}%</span>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-night-900/60 p-3 text-xs">
                      <span className="text-mist-400">Barème d'embauche : </span>
                      <span className="font-bold text-mist-200">70% minimum</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-night-900/60 p-3 text-xs text-mist-300">
                    <span className="font-semibold text-mist-200">Avis du recruteur : </span>
                    <span className="italic">&laquo; {interviewResult.feedback} &raquo;</span>
                  </div>

                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-xs font-semibold ${
                      interviewResult.hired
                        ? 'border-gain-400/35 bg-gain-500/15 text-gain-200'
                        : 'border-risk-400/35 bg-risk-500/15 text-risk-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {interviewResult.hired ? (
                        <CheckCircle2 className="size-5 shrink-0 text-gain-400" />
                      ) : (
                        <XCircle className="size-5 shrink-0 text-risk-400" />
                      )}
                      <div>
                        <p className="font-bold text-sm text-white">
                          {interviewResult.hired
                            ? `🎉 Félicitations, contrat de travail signé chez ${interviewJob.company} !`
                            : '❌ Candidature non retenue pour cette session'}
                        </p>
                        <p className="text-[11px] opacity-90">
                          {interviewResult.hired
                            ? '+100 XP enregistrés ! Tu peux désormais effectuer tes shifts quotidiens.'
                            : 'Progresse au Campus District ou retente l\'entretien avec une réponse plus convaincante.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {!interviewResult ? (
                  <Button
                    variant="primary"
                    disabled={selectedAnswerIndex === null || isSubmitting}
                    onClick={handleSubmitInterview}
                  >
                    {isSubmitting ? 'Évaluation en cours…' : 'Soumettre ma réponse au recruteur'}
                  </Button>
                ) : interviewResult.hired ? (
                  <Button variant="gain" onClick={() => setInterviewJob(null)}>
                    <CheckCircle2 className="size-4" />
                    Accéder à mon poste
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInterviewResult(null);
                        setSelectedAnswerIndex(null);
                      }}
                    >
                      Réessayer l'entretien
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setInterviewJob(null);
                        setActiveTab('campus');
                      }}
                    >
                      <GraduationCap className="size-4" />
                      Se former au Campus
                    </Button>
                  </div>
                )}
              </div>
            </Panel>
          )}

          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {JOBS.map((job) => {
              const isEligible = checkEligibility(job);
              const isHired = citizen.currentJobId === job.id;

              return (
                <li key={job.id} className="h-full">
                  <Panel
                    tone={isHired ? 'gain' : 'neutral'}
                    className={`flex h-full flex-col p-5 transition-[transform,border-color] duration-300 ease-soft hover:-translate-y-1 ${
                      isHired ? '' : 'hover:border-brand-400/40'
                    }`}
                  >
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 text-xs text-mist-400">
                          <Building className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{job.company}</span>
                        </span>
                        {isHired && (
                          <Badge tone="gain" icon={<CheckCircle2 />}>
                            Poste actuel
                          </Badge>
                        )}
                      </div>

                      <h3 className="mb-1 text-base font-bold text-white">{job.title}</h3>
                      <p className="metric mb-3 text-xs font-bold text-gain-400">
                        +{formatNumber(job.salary)} MGA / mois
                      </p>

                      <p className="mb-4 text-xs leading-relaxed text-mist-400">{job.description}</p>

                      <div className="panel-inset mb-4 space-y-2 p-3">
                        <span className="eyebrow block">Prérequis de compétences</span>
                        {job.requirements.map((req) => {
                          const currentVal = citizen.skills[req.skillKey] || 0;
                          const passed = currentVal >= req.requiredPercent;

                          return (
                            <div key={req.skillKey} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-mist-300">
                                {req.skillName} <span className="text-mist-500">(min. {req.requiredPercent}%)</span>
                              </span>
                              <span
                                className={`metric flex shrink-0 items-center gap-1 font-semibold ${
                                  passed ? 'text-gain-400' : 'text-risk-400'
                                }`}
                              >
                                {passed ? (
                                  <CheckCircle2 className="size-3" role="img" aria-label="Atteint" />
                                ) : (
                                  <XCircle className="size-3" role="img" aria-label="Non atteint" />
                                )}
                                {currentVal}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3.5 text-xs">
                        <span className="metric flex items-center gap-1 text-mist-400 shrink-0">
                          <Zap className="size-3.5 text-warn-400" aria-hidden="true" />
                          &minus;{job.energyPerShift}% énergie/jour
                        </span>
                        <span className="text-mist-400 text-right text-2xs font-medium">{job.minExperience}</span>
                      </div>

                      <Button
                        variant={isHired ? 'secondary' : isEligible ? 'primary' : 'secondary'}
                        block
                        disabled={isHired}
                        onClick={() => handleStartInterview(job)}
                      >
                        <Briefcase className="size-4" aria-hidden="true" />
                        {isHired ? 'En poste' : isEligible ? 'Passer l\'entretien' : 'Prérequis non atteints'}
                      </Button>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* --- SECTION 2: MISSIONS FREELANCE & CONTRATS COURTS (§52) --- */}
      {careerMode === 'freelance' && (
        <div className="space-y-6">
          {/* Category filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white/[0.04] text-mist-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              Toutes les missions ({displayGigs.length})
            </button>
            {Object.entries(GIG_CATEGORY_META).map(([catKey, meta]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === catKey
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white/[0.04] text-mist-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {meta.icon}
                <span>{meta.label}</span>
              </button>
            ))}
          </div>

          {/* Freelance Gigs Grid */}
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredGigs.map((gig) => {
              const meta = GIG_CATEGORY_META[gig.category] || { label: gig.category, tone: 'brand', icon: <Briefcase /> };
              const isExecuting = executingKey === gig.key;
              const skillMet = gig.citizenSkillLevel >= gig.minSkillPercent;
              const energyMet = citizen.energy >= gig.energyCost;

              return (
                <li key={gig.key} className="h-full">
                  <Panel
                    tone={gig.canApply ? 'neutral' : 'neutral'}
                    className="flex h-full flex-col p-5 transition-[transform,border-color] duration-300 ease-soft hover:-translate-y-1 hover:border-brand-400/40"
                  >
                    <div>
                      {/* Top Header: Client & Category Badge */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 text-xs text-mist-400">
                          <Building className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate font-medium">{gig.clientName}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-2xs font-semibold text-mist-300">
                          {meta.icon}
                          <span>{meta.label}</span>
                        </span>
                      </div>

                      {/* Title & Remuneration */}
                      <h3 className="mb-1 text-base font-bold text-white">{gig.title}</h3>
                      <div className="mb-3 flex flex-wrap items-center gap-2.5">
                        <span className="metric text-sm font-black text-gain-300">
                          +{formatNumber(gig.rewardMoney)} MGA
                        </span>
                        <span className="text-2xs font-semibold text-brand-300">
                          +{gig.rewardXp} XP
                        </span>
                        {gig.completedCount > 0 && (
                          <span className="rounded-full bg-gain-500/20 px-2 py-0.5 text-2xs font-bold text-gain-300">
                            Validé {gig.completedCount}x
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mb-4 text-xs leading-relaxed text-mist-400">{gig.description}</p>

                      {/* Skill Requirement Meter */}
                      <div className="panel-inset mb-4 space-y-2 p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-mist-400">{gig.requiredSkillName}</span>
                          <span
                            className={`metric flex items-center gap-1 font-bold ${
                              skillMet ? 'text-gain-400' : 'text-risk-400'
                            }`}
                          >
                            {skillMet ? (
                              <CheckCircle2 className="size-3" aria-hidden="true" />
                            ) : (
                              <XCircle className="size-3" aria-hidden="true" />
                            )}
                            {gig.citizenSkillLevel}% / {gig.minSkillPercent}% min.
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              skillMet ? 'bg-gain-400' : 'bg-risk-500'
                            }`}
                            style={{ width: `${Math.min(100, (gig.citizenSkillLevel / gig.minSkillPercent) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Requirements & Action Button */}
                    <div className="mt-auto">
                      <div className="mb-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3 text-xs text-mist-400">
                        <span className={`metric flex items-center gap-1 ${energyMet ? 'text-mist-400' : 'text-risk-400 font-semibold'}`}>
                          <Zap className={`size-3.5 ${energyMet ? 'text-warn-400' : 'text-risk-400'}`} aria-hidden="true" />
                          &minus;{gig.energyCost}% énergie
                        </span>
                        <span className="flex items-center gap-1 text-mist-500">
                          <Clock className="size-3.5" aria-hidden="true" />
                          ~{gig.durationHours}h de sprint
                        </span>
                      </div>

                      <Tooltip text={gig.reason || "Exécute ce contrat pour encaisser immédiatement la rémunération en MGA !"}>
                        <div>
                          <Button
                            variant={gig.canApply ? 'gain' : 'secondary'}
                            block
                            disabled={!gig.canApply || isExecuting}
                            onClick={() => handleExecuteGig(gig)}
                          >
                            {isExecuting ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Livraison en cours…</span>
                              </>
                            ) : gig.canApply ? (
                              <>
                                <Zap className="size-4 text-warn-300" />
                                <span>Exécuter la mission</span>
                              </>
                            ) : !energyMet ? (
                              <>
                                <Zap className="size-4 text-risk-400" />
                                <span>Énergie insuffisante</span>
                              </>
                            ) : (
                              <>
                                <GraduationCap className="size-4 text-mist-400" />
                                <span>Compétence requise</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </Tooltip>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>

          {/* History of Completed Contracts (§52) */}
          {freelanceContracts && freelanceContracts.length > 0 && (
            <Panel as="section" aria-labelledby="freelance-history-title" className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-brand-400" />
                  <h3 id="freelance-history-title" className="text-sm font-bold text-white">
                    Historique des Contrats Freelance Validés
                  </h3>
                </div>
                <Badge tone="gain">
                  {freelanceContracts.length} contrat{freelanceContracts.length > 1 ? 's' : ''} livré{freelanceContracts.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-2xs font-semibold tracking-wider text-mist-500 uppercase">
                      <th className="pb-2">Mission &amp; Client</th>
                      <th className="pb-2">Catégorie</th>
                      <th className="pb-2">Jour</th>
                      <th className="pb-2 text-right">Rémunération</th>
                      <th className="pb-2 text-right">XP Perçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {freelanceContracts.map((c) => (
                      <tr key={c.id} className="text-mist-300 hover:bg-white/[0.02]">
                        <td className="py-2.5 font-semibold text-white">
                          <div>{c.gigTitle}</div>
                          <div className="text-2xs text-mist-500 font-normal">{c.clientName}</div>
                        </td>
                        <td className="py-2.5 capitalize">{c.category || 'Tech'}</td>
                        <td className="py-2.5">Jour {c.day}</td>
                        <td className="py-2.5 text-right font-bold text-gain-400">
                          +{formatNumber(c.payout)} MGA
                        </td>
                        <td className="py-2.5 text-right font-medium text-brand-300">
                          +{c.xpEarned} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
};
