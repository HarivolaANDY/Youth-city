import type { Citizen, Course, Job } from '../types/game';

export interface PlanItem {
  label: string;
  done: boolean;
}

export interface Guidance {
  briefing: string;
  plan: PlanItem[];
}

const gapOf = (citizen: Citizen, job: Job) =>
  job.requirements.reduce(
    (total, req) => total + Math.max(0, req.requiredPercent - (citizen.skills[req.skillKey] ?? 0)),
    0
  );

/** Dérive le message de NOVA et le plan du jour de l'état réel du citoyen. */
export const getGuidance = (citizen: Citizen, jobs: Job[], courses: Course[]): Guidance => {
  const currentJob = jobs.find((j) => j.id === citizen.currentJobId);
  const target = [...jobs]
    .filter((j) => j.id !== citizen.currentJobId)
    .sort((a, b) => gapOf(citizen, a) - gapOf(citizen, b))[0];

  const missing = target?.requirements
    .map((req) => ({ ...req, gap: req.requiredPercent - (citizen.skills[req.skillKey] ?? 0) }))
    .filter((req) => req.gap > 0)
    .sort((a, b) => b.gap - a.gap)[0];

  const nextCourse = missing
    ? courses.find(
        (c) => !citizen.completedCourses.includes(c.id) && (c.skillsAwarded[missing.skillKey] ?? 0) > 0
      )
    : undefined;

  let briefing = `Bonjour ${citizen.name} ! Ton épargne est de ${citizen.savings.toLocaleString()} MGA.`;
  if (target && missing) {
    briefing += ` Ton niveau en ${missing.skillName} (${citizen.skills[missing.skillKey] ?? 0} %) doit encore progresser de ${missing.gap} points pour viser le poste « ${target.title} » chez ${target.company}.`;
  } else if (target) {
    briefing += ` Tu remplis les conditions pour le poste « ${target.title} » chez ${target.company} : tente ta chance !`;
  }

  const plan: PlanItem[] = [{ label: 'Garder son énergie au-dessus de 30 %', done: citizen.energy >= 30 }];
  if (nextCourse) plan.push({ label: `Suivre « ${nextCourse.title} » au Campus`, done: false });
  plan.push({
    label: currentJob ? 'Effectuer son shift de travail' : target ? `Postuler : ${target.title}` : 'Explorer la ville',
    done: false,
  });

  return { briefing, plan };
};
