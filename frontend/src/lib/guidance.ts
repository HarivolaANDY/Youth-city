import type { Citizen, Course, Job } from '../types/game';
import { formatNumber } from './format';

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

  let briefing = `Bonjour ${citizen.name} ! Ton épargne est de ${formatNumber(citizen.savings)} MGA.`;
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

export interface InputSanitizationResult {
  cleanText: string;
  isSuspect: boolean;
  reason?: string;
}

const SUSPICIOUS_INJECTION_PATTERNS = [
  /ignore (all )?(previous|above) (instructions|rules|prompts)/i,
  /oublie (toutes )?(les )?(instructions|consignes|règles)/i,
  /system prompt/i,
  /you are now (an? )?(unrestricted|jailbroken|dan)/i,
  /mode sans restriction/i,
  /<script[\s>]/i,
  /javascript:/i,
  /grant me \d+/i,
  /donne-moi \d+ mga/i,
];

export const MAX_USER_INPUT_LENGTH = 500;

export const sanitizeUserInputForAgent = (rawInput: string): InputSanitizationResult => {
  if (!rawInput) return { cleanText: '', isSuspect: false };

  // 1. Tronquer à la longueur maximale pour contrer le déni de service de contexte
  let trimmed = rawInput.trim().slice(0, MAX_USER_INPUT_LENGTH);

  // 2. Éliminer les caractères de contrôle non imprimables
  trimmed = Array.from(trimmed)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return (code >= 32 && code !== 127) || code === 10 || code === 9;
    })
    .join('');

  // 3. Détecter les signatures connues d'injection de prompt directe
  for (const pattern of SUSPICIOUS_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        cleanText: trimmed,
        isSuspect: true,
        reason: "Tentative d'altération de directives système détectée (Prompt Injection).",
      };
    }
  }

  return { cleanText: trimmed, isSuspect: false };
};
