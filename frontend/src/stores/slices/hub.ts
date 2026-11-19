import type { CommunityLeaderboard, Guild, Hackathon } from '../../types/game';
import { DEFAULT_GUILDS, DEFAULT_HACKATHONS } from '../../data/mockData';
import { api } from '../../services/api';
import { celebrate, failure, requireAuth } from '../helpers';
import type { ActionResult, Slice } from '../types';

export interface HubSlice {
  guilds: Guild[];
  hackathons: Hackathon[];
  leaderboard: CommunityLeaderboard | null;
  fetchCityHubData: () => Promise<void>;
  joinGuild: (guildKey: string) => Promise<ActionResult>;
  leaveGuild: (guildKey: string) => Promise<ActionResult>;
  participateHackathon: (hackathonKey: string, payload: { teamName: string; submissionPitch: string; teamMembers?: string[] }) => Promise<ActionResult>;
}

export const hubGuest = () => ({
  guilds: DEFAULT_GUILDS,
  hackathons: DEFAULT_HACKATHONS,
  leaderboard: null as CommunityLeaderboard | null,
});

export const createHubSlice: Slice<HubSlice> = (set, get) => ({
  ...hubGuest(),

  fetchCityHubData: async () => {
    const [guilds, hackathons, leaderboard] = await Promise.all([
      api.getGuilds(),
      api.getHackathons(),
      api.getCommunityLeaderboard(),
    ]);
    if (guilds) set({ guilds });
    if (hackathons) set({ hackathons });
    if (leaderboard) set({ leaderboard });
  },

  joinGuild: async (guildKey) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.joinGuild(guildKey);
    if ('error' in res) return failure(get, 'Guilde', res.error);
    set((s) => ({
      guilds: s.guilds.map((g) => ({
        ...g,
        isJoined: g.key === guildKey,
        memberCount: g.key === guildKey ? g.memberCount + 1 : g.isJoined ? Math.max(0, g.memberCount - 1) : g.memberCount,
      })),
    }));
    get().applyServerCitizen(res.citizen);
    celebrate();
    get().addNotification('Guilde rejointe !', res.message, 'success');
    return { success: true };
  },

  leaveGuild: async (guildKey) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.leaveGuild(guildKey);
    if ('error' in res) return failure(get, 'Guilde', res.error);
    set((s) => ({
      guilds: s.guilds.map((g) => (g.key === guildKey ? { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) } : g)),
    }));
    get().applyServerCitizen(res.citizen);
    get().addNotification('Guilde quittée', res.message, 'info');
    return { success: true };
  },

  participateHackathon: async (hackathonKey, payload) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.participateHackathon(hackathonKey, payload);
    if ('error' in res) return failure(get, 'Hackathon', res.error);
    set((s) => ({ hackathons: s.hackathons.map((h) => (h.key === hackathonKey ? res.hackathon : h)) }));
    get().applyServerCitizen(res.citizen, res.transaction);
    celebrate(110, 75);
    get().addNotification('Résultat Hackathon !', res.message, 'success');
    return { success: true };
  },
});
