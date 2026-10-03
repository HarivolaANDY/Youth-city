import React, { useState } from 'react';
import { Briefcase, Zap, CheckCircle2, XCircle, Building, UserCheck, Bot, X } from 'lucide-react';
import { JOBS } from '../../data/mockData';
import { useGameStore } from '../../stores/useGameStore';
import type { Job } from '../../types/game';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconChip } from '../../components/ui/IconChip';

export const CareerView: React.FC = () => {
  const { citizen, hireForJob, workShift, addNotification } = useGameStore();
  const [interviewJob, setInterviewJob] = useState<Job | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [interviewResult, setInterviewResult] = useState<{ score: number; feedback: string } | null>(null);

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

  const handleSubmitInterview = () => {
    if (selectedAnswerIndex === null || !interviewJob) return;
    const answer = interviewJob.sampleAnswers[selectedAnswerIndex];
    setInterviewResult({ score: answer.score, feedback: answer.feedback });

    if (answer.score >= 70) {
      hireForJob(interviewJob.id);
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
                  +{activeJob.salary.toLocaleString()} MGA / mois
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
              {Math.round(activeJob.salary / 20).toLocaleString()} MGA &bull; +40 XP
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
              Annuler
            </Button>
          </div>

          <div className="panel-inset space-y-2 p-4">
            <span className="eyebrow flex items-center gap-2 text-brand-300">
              <Bot className="size-4" aria-hidden="true" />
              Recruteur virtuel
            </span>
            <p className="text-sm leading-relaxed font-semibold text-white italic">
              &laquo;&nbsp;{interviewJob.interviewQuestion}&nbsp;&raquo;
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="eyebrow mb-3">Choisis ta réponse</legend>
            {interviewJob.sampleAnswers.map((ans, idx) => {
              const isSelected = selectedAnswerIndex === idx;

              return (
                <label
                  key={idx}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition-all duration-200 ${
                    interviewResult !== null
                      ? 'cursor-default border-white/[0.06] bg-night-950/40 opacity-60'
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
                    disabled={interviewResult !== null}
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
            <div
              role="status"
              className={`space-y-2 rounded-xl border p-4 text-xs ${
                interviewResult.score >= 70
                  ? 'border-gain-400/35 bg-gain-500/10 text-gain-200'
                  : 'border-risk-400/35 bg-risk-500/10 text-risk-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
                <span>
                  {interviewResult.score >= 70 ? 'Félicitations, tu es embauché(e) !' : 'Candidature non retenue'}
                </span>
                <span className="metric">Note : {interviewResult.score}/100</span>
              </div>
              <p className="leading-relaxed opacity-90">{interviewResult.feedback}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            {!interviewResult ? (
              <Button variant="primary" disabled={selectedAnswerIndex === null} onClick={handleSubmitInterview}>
                Soumettre ma réponse
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setInterviewJob(null)}>
                Fermer
              </Button>
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
                    +{job.salary.toLocaleString()} MGA / mois
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
