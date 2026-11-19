import type {
  Citizen,
  RecurringCycleInfo,
  RecurringSettlementSummary,
  TimeSlot,
  Transaction,
} from '../../types/game';
import { INITIAL_CITIZEN } from '../../data/mockData';
import { api, getLastApiError } from '../../services/api';
import { formatNumber } from '../../lib/format';
import { requireAuth } from '../helpers';
import type { ActionResult, Slice } from '../types';

/** Réponse serveur commune à « avancer le temps », « avancer d'un jour » et « dormir ». */
interface TimeStepResponse {
  day: number;
  timeSlot: string;
  citizen: Citizen;
  recurringCycle?: RecurringCycleInfo | null;
  settlementSummary?: RecurringSettlementSummary | null;
}

export interface CitizenSlice {
  citizen: Citizen;
  day: number;
  timeSlot: TimeSlot;
  recurringCycle: RecurringCycleInfo | null;
  transactions: Transaction[];
  applyServerCitizen: (citizen: Citizen, transaction?: Transaction | null) => void;
  resyncFromServer: (reason?: string) => Promise<void>;
  advanceTime: () => Promise<void>;
  advanceDay: (days?: number) => Promise<void>;
  restAndSleep: () => Promise<void>;
  changeHousing: (housingId: string) => Promise<void>;
  depositSavings: (amount: number) => Promise<ActionResult>;
  withdrawSavings: (amount: number) => Promise<ActionResult>;
  resetGame: (preset: 'demo' | 'new') => Promise<void>;
}

/** État de la vitrine (visiteur sans compte) : données d'exemple, jamais enregistrées. */
export const citizenGuest = () => ({
  citizen: { ...INITIAL_CITIZEN },
  day: 14,
  timeSlot: 'Matin (08:00)' as TimeSlot,
  recurringCycle: null as RecurringCycleInfo | null,
  transactions: [
    { id: 'tx-1', timestamp: 'J-1 18:00', label: 'Mission Freelance Landing Page', amount: 100000, type: 'income', category: 'Carrière' },
    { id: 'tx-2', timestamp: 'J-2 10:00', label: 'Inscription Formation Web (Campus)', amount: -50000, type: 'expense', category: 'Éducation' },
    { id: 'tx-3', timestamp: 'J-3 12:00', label: 'Loyer mensuel Studio City', amount: -150000, type: 'expense', category: 'Logement' },
  ] as Transaction[],
});

const settlementNotice = (s: RecurringSettlementSummary): [string, string, 'success' | 'warning'] | null => {
  if (s.status === 'paid') {
    const interest = s.interestEarned > 0 ? ` +${formatNumber(s.interestEarned)} MGA d'intérêts versés sur ton épargne BOA !` : '';
    return ['🏠 Loyer mensuel prélevé', `Loyer de ${formatNumber(s.rentPaid)} MGA honoré.${interest}`, 'success'];
  }
  if (s.status === 'covered_by_savings') {
    return ['⚠️ Prélèvement de secours sur épargne', `Solde courant insuffisant : ${formatNumber(s.rentCoveredBySavings)} MGA prélevés sur ton épargne BOA pour payer ton loyer.`, 'warning'];
  }
  if (s.status === 'overdue') {
    return ['🚨 Impayé de loyer', 'Trésorerie et épargne épuisées : loyer impayé ! Malus de bien-être (-20%).', 'warning'];
  }
  return null;
};

export const createCitizenSlice: Slice<CitizenSlice> = (set, get) => {
  const refuse = (title: string): ActionResult => {
    const error = getLastApiError() || "Le serveur n'a pas pu enregistrer cette action.";
    get().addNotification(title, error, 'warning');
    return { success: false, error };
  };

  const applyTimeStep = (res: TimeStepResponse) => {
    set((s) => ({
      day: res.day,
      timeSlot: res.timeSlot as TimeSlot,
      citizen: res.citizen,
      recurringCycle: res.recurringCycle ?? s.recurringCycle,
    }));
    const notice = res.settlementSummary ? settlementNotice(res.settlementSummary) : null;
    if (notice) get().addNotification(...notice);
  };

  return {
    ...citizenGuest(),

    applyServerCitizen: (citizen, transaction) =>
      set((s) => ({
        citizen,
        transactions: transaction ? [transaction, ...s.transactions].slice(0, 30) : s.transactions,
      })),

    // Remet l'état d'un joueur connecté en conformité avec le serveur : aucune progression locale ne survit à un échec.
    resyncFromServer: async (reason) => {
      const message = reason || getLastApiError() || 'Le serveur a refusé cette action.';
      const state = await api.getGameState();
      if (state?.citizen) {
        set({
          citizen: state.citizen,
          day: state.day,
          timeSlot: (state.timeSlot as TimeSlot) || 'Matin (08:00)',
          recurringCycle: state.recurringCycle || null,
          transactions: state.transactions || [],
          activeDilemma: state.activeDilemma || null,
        });
        get().addNotification('Action non enregistrée', `${message} Ton état a été resynchronisé avec le serveur.`, 'warning');
      } else {
        get().addNotification('Serveur injoignable', `${message} Ta dernière action n'est peut-être pas enregistrée.`, 'warning');
      }
    },

    advanceTime: async () => {
      if (!requireAuth(get)) return;
      const res = await api.advanceTime();
      if (!res?.citizen) {
        refuse('Temps');
        return;
      }
      applyTimeStep(res);
      if (res.activeDilemma) set({ activeDilemma: res.activeDilemma });
    },

    advanceDay: async (days = 1) => {
      if (!requireAuth(get)) return;
      const res = await api.advanceDay(days);
      if (!res?.citizen) {
        refuse('Temps');
        return;
      }
      applyTimeStep(res);
      if (res.activeDilemma) set({ activeDilemma: res.activeDilemma });
      if (!res.settlementSummary) {
        get().addNotification(`Jour ${res.day} atteint`, `Nouveau jour démarré (+${days} j). Repos nocturne effectué.`, 'info');
      }
    },

    // Dormir fait passer la nuit côté serveur (jour suivant, loyer éventuel).
    restAndSleep: async () => {
      if (!requireAuth(get)) return;
      const res = await api.restAndSleep();
      if (!res?.citizen) {
        refuse('Sommeil');
        return;
      }
      applyTimeStep(res);
      get().addNotification('Nuit de sommeil réparatrice', res.message, 'success');
    },

    changeHousing: async (housingId) => {
      if (!requireAuth(get)) return;
      const res = await api.changeHousing(housingId);
      if (!res?.citizen) {
        refuse('Logement');
        return;
      }
      set({ citizen: res.citizen });
      get().addNotification('Nouveau logement', 'Ton déménagement est enregistré.', 'info');
    },

    depositSavings: async (amount) => {
      if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
      if (amount <= 0) return { success: false, error: 'Montant invalide.' };
      const res = await api.depositSavings(amount);
      if (!res?.citizen) return refuse('Épargne');
      get().applyServerCitizen(res.citizen, res.transaction);
      get().addNotification('Épargne sécurisée', `${formatNumber(amount)} MGA placés sur ton livret de précaution.`, 'success');
      return { success: true };
    },

    withdrawSavings: async (amount) => {
      if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
      if (amount <= 0) return { success: false, error: 'Montant invalide.' };
      const res = await api.withdrawSavings(amount);
      if (!res?.citizen) return refuse('Épargne');
      get().applyServerCitizen(res.citizen, res.transaction);
      get().addNotification("Retrait d'épargne", `${formatNumber(amount)} MGA transférés sur ton compte courant.`, 'info');
      return { success: true };
    },

    resetGame: async (preset) => {
      if (!requireAuth(get)) return;
      const res = await api.resetGame(preset);
      if (!res?.citizen) {
        refuse('Réinitialisation');
        return;
      }
      set({
        citizen: res.citizen,
        day: res.day,
        timeSlot: res.timeSlot as TimeSlot,
        transactions: res.transactions,
        recurringCycle: res.recurringCycle || null,
        activeDilemma: res.activeDilemma || null,
        activeTab: 'dashboard',
        selectedDistrictId: null,
      });
    },
  };
};
