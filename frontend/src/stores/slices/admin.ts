import type { AdminOverviewData, ModerationReport } from '../../types/game';
import { DEFAULT_ADMIN_OVERVIEW, DEFAULT_MODERATION_REPORTS } from '../../data/mockData';
import { api } from '../../services/api';
import { celebrate, failure, requireAuth } from '../helpers';
import type { ActionResult, Slice } from '../types';

export interface AdminSlice {
  isAdminModalOpen: boolean;
  adminOverview: AdminOverviewData | null;
  moderationReports: ModerationReport[];
  toggleAdminModal: (open?: boolean) => void;
  fetchAdminData: () => Promise<void>;
  createModerationReport: (payload: { targetType: string; targetId: string; targetName: string; reason: string; details: string }) => Promise<ActionResult>;
  resolveModerationReport: (reportId: number, payload: { action: string; status: string; notes?: string }) => Promise<ActionResult>;
  grantAdminStipend: (payload: { characterId?: number; amount: number; reason: string }) => Promise<ActionResult>;
}

export const adminGuest = () => ({
  adminOverview: DEFAULT_ADMIN_OVERVIEW as AdminOverviewData | null,
  moderationReports: DEFAULT_MODERATION_REPORTS,
});

export const createAdminSlice: Slice<AdminSlice> = (set, get) => ({
  isAdminModalOpen: false,
  ...adminGuest(),

  toggleAdminModal: (open) => {
    const next = open ?? !get().isAdminModalOpen;
    set({ isAdminModalOpen: next });
    if (next) void get().fetchAdminData();
  },

  fetchAdminData: async () => {
    if (!get().user?.is_staff) return;
    const [overview, reports] = await Promise.all([api.getAdminOverview(), api.getModerationReports()]);
    if (overview) set({ adminOverview: overview });
    if (reports) set({ moderationReports: reports });
  },

  createModerationReport: async (payload) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.createModerationReport(payload);
    if ('error' in res) return failure(get, 'Signalement', res.error);
    set((s) => ({ moderationReports: [res.report, ...s.moderationReports] }));
    get().addNotification('Signalement transmis', res.message, 'info');
    return { success: true };
  },

  resolveModerationReport: async (reportId, payload) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.resolveModerationReport(reportId, payload);
    if ('error' in res) return failure(get, 'Modération', res.error);
    set((s) => ({ moderationReports: s.moderationReports.map((r) => (r.id === reportId ? res.report : r)) }));
    get().addNotification('Modération appliquée', res.message, 'success');
    return { success: true };
  },

  grantAdminStipend: async (payload) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.grantAdminStipend(payload);
    if ('error' in res) return failure(get, 'Bourse Administrative', res.error);
    get().applyServerCitizen(res.citizen, res.transaction);
    get().addNotification('Bourse accordée !', res.message, 'success');
    celebrate(60);
    void get().fetchAdminData();
    return { success: true };
  },
});
