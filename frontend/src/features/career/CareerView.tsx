import React, { useState } from 'react';
import {
  Briefcase,
  Zap,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  Bot,
  X,
  Star,
  Sparkles,
  Shirt,
  GraduationCap,
} from 'lucide-react';
import { JOBS } from '../../data/mockData';
import { useGameStore } from '../../stores/useGameStore';
import type { Job, InterviewResult } from '../../types/game';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconChip } from '../../components/ui/IconChip';
import { formatNumber } from '../../lib/format';

export const CareerView: React.FC = () => {
  const { citizen, workShift, addNotification, simulateInterview, setActiveTab } = useGameStore();
  const [interviewJob, setInterviewJob] = useState<Job | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSuit = (citizen.inventory || []).includes('item-suit');
  const activeJob = JOBS.find((j) => j.id === citizen.currentJobId);

  const checkEligibility = (job: Job) => {
    return job.requirements.every((req) => {
      const citizenLevel = citizen.skills[req.skillKey] || 0;
      return citizenLevel >= req.requiredPercent;
    });
  };

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

  return (
    <div className="space-y-5 sm:space-y-6">
      <ViewHeader
        headingId="career-title"
        tone="brand"
        badgeIcon={<Briefcase />}
        badgeLabel="Business District"
        meta="Entreprises & carrière"
        title="Trouve un emploi & valorise tes talents"
        description="Postule aux offres disponibles, convaincs les recruteurs lors d'entretiens simulés et assure ton autonomie financière grâce à un salaire régulier."
        aside={
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
        }
      />

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

          {/* Outfit bonus indicator (§11, §22) */}
          {hasSuit && (
            <div className="flex items-center gap-2 rounded-xl border border-brand-400/30 bg-brand-500/10 px-3.5 py-2.5 text-xs text-brand-200">
              <Shirt className="size-4 shrink-0 text-brand-300" />
              <span>
                <strong>Tenue Professionnelle équipée :</strong> Bonus de prestance <strong>+5%</strong> pris en compte par le jury !
              </span>
            </div>
          )}

          {/* 👔 Recruiter Virtual Question */}
          <div className="panel-inset space-y-2.5 p-4 sm:p-5">
            <span className="eyebrow flex items-center gap-2 text-brand-300">
              <Bot className="size-4" aria-hidden="true" />
              👔 Le Recruteur Virtuel ({interviewJob.company})
            </span>
            <p className="text-sm leading-relaxed font-semibold text-white italic">
              &laquo;&nbsp;{interviewJob.interviewQuestion}&nbsp;&raquo;
            </p>
          </div>

          {/* Candidates Answers Choice */}
          <fieldset className="space-y-3">
            <legend className="eyebrow mb-2">Choisis ton argumentation :</legend>
            {interviewJob.sampleAnswers.map((ans, idx) => {
              const isSelected = selectedAnswerIndex === idx;

              return (
                <label
                  key={idx}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition-all duration-200 ${
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

          {/* 🤖 ANALYSE PÉDAGOGIQUE DU MENTOR (§22) */}
          {interviewResult && (
            <div className="space-y-4 rounded-xl border border-white/10 bg-night-950/60 p-4 sm:p-5 animate-rise-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-iris-300">
                  <Bot className="size-4" />
                  🤖 Analyse Pédagogique du Mentor
                </span>
                <div className="flex items-center gap-2">
                  {interviewResult.suitBonus > 0 && (
                    <Badge tone="brand" icon={<Shirt className="size-3" />}>
                      +5% Tenue Pro
                    </Badge>
                  )}
                  <Badge tone={interviewResult.hired ? 'gain' : 'risk'}>
                    Note : {interviewResult.score}/100
                  </Badge>
                </div>
              </div>

              {/* 3 Criteria Bars */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Pertinence Thématique */}
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <div className="flex items-center justify-between text-mist-300">
                    <span>Pertinence thématique</span>
                    <span className="font-bold text-white">{interviewResult.thematicScore}/10</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${
                          i < Math.round(interviewResult.thematicScore / 2)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-mist-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Clarté & Structure */}
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <div className="flex items-center justify-between text-mist-300">
                    <span>Clarté & Structure</span>
                    <span className="font-bold text-white">{interviewResult.clarityScore}/10</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${
                          i < Math.round(interviewResult.clarityScore / 2)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-mist-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Valorisation des Acquis */}
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <div className="flex items-center justify-between text-mist-300">
                    <span>Valorisation des acquis</span>
                    <span className="font-bold text-white">{interviewResult.acquisScore}/10</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${
                          i < Math.round(interviewResult.acquisScore / 2)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-mist-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 💡 Conseil pour progresser */}
              <div className="rounded-xl border border-iris-500/20 bg-iris-500/10 p-3.5 text-xs text-iris-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-4 shrink-0 text-iris-400 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-iris-100">💡 Conseil pour progresser :</span>
                    <p className="leading-relaxed">{interviewResult.advice}</p>
                  </div>
                </div>
              </div>

              {/* Recruiter specific feedback */}
              <div className="rounded-xl border border-white/5 bg-night-900/60 p-3 text-xs text-mist-300">
                <span className="font-semibold text-mist-200">Avis du recruteur : </span>
                <span className="italic">&laquo; {interviewResult.feedback} &raquo;</span>
              </div>

              {/* Final Decision Banner */}
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

          {/* Bottom Actions */}
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
                  <div className="mb-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5 text-xs">
                    <span className="metric flex items-center gap-1 text-mist-500">
                      <Zap className="size-3.5 text-warn-400" aria-hidden="true" />
                      &minus;{job.energyPerShift}% énergie/jour
                    </span>
                    <span className="truncate text-mist-500">{job.minExperience}</span>
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
  );
};
