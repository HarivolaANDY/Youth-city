import type { Slice, ActionResult } from '../types';
import { api } from '../../services/api';
import { failure, requireAuth } from '../helpers';

export interface CampusSlice {
  enrollInCourse: (course: { id: string; title: string; cost: number }) => Promise<ActionResult>;
}

export const createCampusSlice: Slice<CampusSlice> = (_set, get) => ({
  // Le serveur prélève les frais (une seule fois) et tranche l'inscription.
  enrollInCourse: async (course) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.enrollCourse(course.id);
    if ('error' in res) return failure(get, 'Inscription impossible', res.error);
    get().applyServerCitizen(res.citizen, res.transaction);
    if (!res.alreadyEnrolled) get().addNotification('Inscription validée', res.message, 'success');
    return { success: true };
  },
});
