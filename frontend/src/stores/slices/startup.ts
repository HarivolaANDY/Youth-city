import type { StartupActionType, StartupProject } from '../../types/game';
import { DEFAULT_STARTUP_PROJECTS } from '../../data/mockData';
import { api } from '../../services/api';
import { celebrate, failure, requireAuth } from '../helpers';
import type { ActionResult, Slice } from '../types';

export interface StartupSlice {
  startupProjects: StartupProject[];
  fetchStartupProjects: () => Promise<void>;
  createStartupProject: (payload: { name: string; sector: string; pitch: string; initialCapital?: number }) => Promise<ActionResult>;
  advanceStartupAction: (projectKey: string, actionType: StartupActionType, role?: string) => Promise<ActionResult>;
  claimIncubatorGrant: (projectKey: string) => Promise<ActionResult>;
}

export const startupGuest = () => ({ startupProjects: DEFAULT_STARTUP_PROJECTS });

const isProject = (key: string) => (p: StartupProject) => p.key === key || p.id === key;

export const createStartupSlice: Slice<StartupSlice> = (set, get) => ({
  ...startupGuest(),

  fetchStartupProjects: async () => {
    const projects = await api.getStartupProjects();
    if (projects) set({ startupProjects: projects });
  },

  createStartupProject: async (payload) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.createStartupProject(payload);
    if ('error' in res) return failure(get, 'Erreur Startup', res.error);
    set((s) => ({ startupProjects: [res.project, ...s.startupProjects] }));
    get().applyServerCitizen(res.citizen, res.transaction);
    celebrate(80);
    get().addNotification('Venture enregistrée !', res.message, 'success');
    return { success: true };
  },

  advanceStartupAction: async (projectKey, actionType, role) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.advanceStartupAction(projectKey, actionType, role);
    if ('error' in res) return failure(get, 'Action impossible', res.error);
    set((s) => ({ startupProjects: s.startupProjects.map((p) => (isProject(projectKey)(p) ? res.project : p)) }));
    get().applyServerCitizen(res.citizen);
    if (res.levelUp) celebrate();
    get().addNotification('Action entrepreneuriale', res.message, 'success');
    return { success: true };
  },

  claimIncubatorGrant: async (projectKey) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.claimIncubatorGrant(projectKey);
    if ('error' in res) return failure(get, 'Subvention refusée', res.error);
    set((s) => ({ startupProjects: s.startupProjects.map((p) => (isProject(projectKey)(p) ? res.project : p)) }));
    get().applyServerCitizen(res.citizen);
    celebrate(120, 80);
    get().addNotification('Bourse Incubateur obtenue !', res.message, 'success');
    return { success: true };
  },
});
