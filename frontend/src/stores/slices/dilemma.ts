import type { Dilemma, TimeSlot } from '../../types/game';
import { api, getLastApiError } from '../../services/api';
import { celebrate, requireAuth } from '../helpers';
import type { Slice } from '../types';

export interface DilemmaSlice {
  activeDilemma: Dilemma | null;
  dismissDilemma: () => void;
  triggerDilemma: () => Promise<void>;
  resolveDilemmaOption: (optionId: string) => Promise<void>;
}

export const dilemmaGuest = () => ({ activeDilemma: null as Dilemma | null });

export const createDilemmaSlice: Slice<DilemmaSlice> = (set, get) => ({
  ...dilemmaGuest(),

  dismissDilemma: () => set({ activeDilemma: null }),

  triggerDilemma: async () => {
    if (!requireAuth(get)) return;
    const res = await api.triggerDynamicEvent();
    if (res?.success && res.dilemma) {
      set({ activeDilemma: res.dilemma });
      get().addNotification('🚨 Aléa Urbain Déclenché !', `Un nouvel imprévu requiert ton arbitrage : ${res.dilemma.title}`, 'warning');
    } else {
      get().addNotification('Rien à signaler', 'Aucun événement disponible actuellement.', 'info');
    }
  },

  // Le serveur applique les coûts, gains et compétences : on n'affiche que son verdict.
  resolveDilemmaOption: async (optionId) => {
    const dilemma = get().activeDilemma;
    if (!dilemma || !requireAuth(get)) return;

    const res = await api.resolveDilemma(optionId, dilemma.id);
    if (!res?.citizen) {
      get().addNotification('Arbitrage impossible', getLastApiError() || "L'arbitrage n'a pas pu être enregistré.", 'warning');
      return;
    }
    set({ activeDilemma: null, citizen: res.citizen });
    get().addNotification('Conséquence appliquée', res.message, 'info');
    if (res.levelUp) celebrate(75, 65);

    // Les mouvements d'argent (coût, gain) sont portés par le journal du serveur.
    const state = await api.getGameState();
    if (state?.citizen) {
      set({ transactions: state.transactions || [], timeSlot: state.timeSlot as TimeSlot, day: state.day });
    }
  },
});
