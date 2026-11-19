import type { AuthUser, CharacterCustomizationPayload, TimeSlot } from '../../types/game';
import { api, getLastApiError } from '../../services/api';
import { celebrate } from '../helpers';
import type { ActionResult, Slice } from '../types';
import { citizenGuest } from './citizen';
import { dilemmaGuest } from './dilemma';
import { careerGuest } from './career';
import { startupGuest } from './startup';
import { hubGuest } from './hub';
import { adminGuest } from './admin';

type AuthMode = 'login' | 'register';

export interface AuthSlice {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBackendConnected: boolean;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  isCharacterCreationOpen: boolean;
  toggleAuthModal: (open?: boolean, mode?: AuthMode) => void;
  login: (username: string, password: string) => Promise<ActionResult>;
  register: (payload: {
    username: string;
    email?: string;
    password: string;
    citizenName?: string;
    birthYear: number;
    acceptTerms: boolean;
    guardianConsent?: boolean;
  }) => Promise<ActionResult>;
  logout: () => void;
  toggleCharacterCreation: (open?: boolean) => void;
  customizeCharacter: (payload: CharacterCustomizationPayload) => Promise<ActionResult>;
  initGame: () => Promise<void>;
}

export const createAuthSlice: Slice<AuthSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  isBackendConnected: false,
  isAuthModalOpen: false,
  authMode: 'login',
  isCharacterCreationOpen: false,

  toggleAuthModal: (open, mode = 'login') =>
    set((s) => ({ isAuthModalOpen: open ?? !s.isAuthModalOpen, authMode: mode })),

  login: async (username, password) => {
    const res = await api.login({ username, password });
    if (res.error || !res.data) return { success: false, error: res.error || 'Erreur de connexion.' };
    const { user, citizen } = res.data;
    set({ user, citizen, isAuthenticated: true, isAuthModalOpen: false, isBackendConnected: true });
    get().addNotification('Connexion réussie', `Ravi de te revoir, ${user.username} ! Ta progression citoyenne est synchronisée.`, 'success');
    await get().initGame();
    return { success: true };
  },

  register: async (payload) => {
    const res = await api.register(payload);
    if (res.error || !res.data) return { success: false, error: res.error || "Erreur lors de l'inscription." };
    const { user, citizen } = res.data;
    set({ user, citizen, isAuthenticated: true, isAuthModalOpen: false, isCharacterCreationOpen: true, isBackendConnected: true });
    get().addNotification('Bienvenue dans Youth City !', 'Ton compte est créé. Personnalisons maintenant ton avatar citoyen !', 'success');
    celebrate();
    await get().initGame();
    return { success: true };
  },

  // Retour à la vitrine : aucune donnée du compte précédent ne doit rester à l'écran.
  logout: () => {
    api.logout();
    set({
      user: null,
      isAuthenticated: false,
      isBackendConnected: false,
      isCharacterCreationOpen: false,
      activeTab: 'dashboard',
      selectedDistrictId: null,
      ...citizenGuest(),
      ...dilemmaGuest(),
      ...careerGuest(),
      ...startupGuest(),
      ...hubGuest(),
      ...adminGuest(),
    });
    get().addNotification('Déconnexion', 'Tu es repassé en visite (lecture seule).', 'info');
  },

  toggleCharacterCreation: (open) =>
    set((s) => ({ isCharacterCreationOpen: open ?? !s.isCharacterCreationOpen })),

  customizeCharacter: async (payload) => {
    const res = await api.customizeCharacter(payload);
    if (!res) return { success: false, error: getLastApiError() || 'Impossible de personnaliser le profil.' };
    set({ citizen: res.citizen, transactions: res.transactions, isCharacterCreationOpen: false, isBackendConnected: true });
    get().addNotification('Profil Citoyen activé !', `Bienvenue ${res.citizen.name} ! Ton profil (${res.citizen.title}) et ta dotation de départ sont prêts.`, 'success');
    celebrate(90, 70);
    return { success: true };
  },

  // Charge l'état du joueur connecté ; sans session valide, la vitrine reste affichée telle quelle.
  initGame: async () => {
    const profile = await api.getCurrentUser();
    if (!profile?.user) return;
    set({ user: profile.user, isAuthenticated: true });

    const [state, projects, guilds, hackathons, leaderboard, passport, freelance] = await Promise.all([
      api.getGameState(),
      api.getStartupProjects(),
      api.getGuilds(),
      api.getHackathons(),
      api.getCommunityLeaderboard(),
      api.getCareerPassport(),
      api.getFreelanceGigs(),
    ]);

    if (state?.citizen) {
      set({
        citizen: state.citizen,
        day: state.day || 14,
        timeSlot: (state.timeSlot as TimeSlot) || 'Matin (08:00)',
        recurringCycle: state.recurringCycle || null,
        transactions: state.transactions || [],
        activeDilemma: state.activeDilemma || null,
        isBackendConnected: true,
      });
    }
    if (projects) set({ startupProjects: projects });
    if (guilds) set({ guilds });
    if (hackathons) set({ hackathons });
    if (leaderboard) set({ leaderboard });
    if (passport?.success && passport.passport) set({ careerPassport: passport.passport });
    if (freelance?.success) {
      set({
        freelanceGigs: freelance.gigs || [],
        freelanceContracts: freelance.contracts || [],
        freelanceStats: freelance.stats || { totalEarned: 0, totalCompleted: 0 },
      });
    }
  },
});
