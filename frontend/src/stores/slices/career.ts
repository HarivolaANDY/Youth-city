import type {
  CareerPassportData,
  FreelanceContract,
  FreelanceGig,
  InterviewResult,
} from '../../types/game';
import { DEFAULT_FREELANCE_GIGS, JOBS } from '../../data/mockData';
import { api, getLastApiError } from '../../services/api';
import { formatNumber } from '../../lib/format';
import { celebrate, failure, requireAuth } from '../helpers';
import type { ActionResult, Slice } from '../types';

export interface CareerSlice {
  careerPassport: CareerPassportData | null;
  freelanceGigs: FreelanceGig[];
  freelanceContracts: FreelanceContract[];
  freelanceStats: { totalEarned: number; totalCompleted: number };
  fetchCareerPassport: () => Promise<void>;
  setCareerPassport: (passport: CareerPassportData) => void;
  fetchFreelanceGigs: () => Promise<void>;
  completeFreelanceGig: (key: string) => Promise<ActionResult>;
  simulateInterview: (jobId: string, answerIndex: number) => Promise<InterviewResult | null>;
  workShift: () => Promise<boolean>;
}

export const careerGuest = () => ({
  careerPassport: null as CareerPassportData | null,
  freelanceGigs: DEFAULT_FREELANCE_GIGS,
  freelanceContracts: [] as FreelanceContract[],
  freelanceStats: { totalEarned: 0, totalCompleted: 0 },
});

export const createCareerSlice: Slice<CareerSlice> = (set, get) => ({
  ...careerGuest(),

  fetchCareerPassport: async () => {
    const res = await api.getCareerPassport();
    if (res?.success && res.passport) set({ careerPassport: res.passport });
  },

  setCareerPassport: (passport) => set({ careerPassport: passport }),

  fetchFreelanceGigs: async () => {
    const res = await api.getFreelanceGigs();
    if (res?.success) {
      set({
        freelanceGigs: res.gigs || [],
        freelanceContracts: res.contracts || [],
        freelanceStats: res.stats || { totalEarned: 0, totalCompleted: 0 },
      });
    }
  },

  completeFreelanceGig: async (key) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.completeFreelanceGig(key);
    if (!res.success) return failure(get, 'Échec de la mission', res.error || "Impossible d'exécuter ce contrat.");

    if (res.citizen) get().applyServerCitizen(res.citizen, res.transaction);
    await get().fetchFreelanceGigs();
    celebrate(50);
    get().addNotification('🎉 Mission freelance accomplie !', res.message || `Rémunération de +${formatNumber(res.payout || 0)} MGA perçue !`, 'success');
    if (res.levelUp) {
      const { citizen } = get();
      get().addNotification('Niveau supérieur !', `Félicitations ${citizen.name}, tu as atteint le niveau ${citizen.level} !`, 'success');
    }
    return { success: true };
  },

  simulateInterview: async (jobId, answerIndex) => {
    if (!requireAuth(get)) return null;
    const res = await api.simulateInterview(jobId, answerIndex);
    if (!res?.result) {
      get().addNotification('Entretien impossible', getLastApiError() || "L'entretien n'a pas pu être enregistré.", 'warning');
      return null;
    }
    if (res.result.hired) {
      set({ citizen: res.citizen });
      celebrate(100, 70);
      const company = JOBS.find((j) => j.id === jobId)?.company || "l'entreprise";
      get().addNotification('🎉 Embauché(e) !', `Félicitations, tu as réussi l'entretien chez ${company} ! (+100 XP)`, 'success');
    } else {
      get().addNotification('Candidature ajournée', `Note : ${res.result.score}/100. Consulte l'analyse pédagogique pour progresser.`, 'warning');
    }
    return res.result;
  },

  // Le serveur décide (emploi, énergie, un seul shift par jour).
  workShift: async () => {
    if (!requireAuth(get)) return false;
    const res = await api.workShift();
    if (!res?.citizen) {
      get().addNotification('Shift impossible', getLastApiError() || "Le shift n'a pas pu être enregistré.", 'warning');
      return false;
    }
    get().applyServerCitizen(res.citizen, res.transaction);
    get().addNotification('Journée de travail accomplie', `+${formatNumber(res.salaryEarned)} MGA virtuels perçus.`, 'success');
    return true;
  },
});
