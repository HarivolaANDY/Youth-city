import { create } from 'zustand';
import confetti from 'canvas-confetti';
import type {
  Citizen,
  DistrictId,
  TimeSlot,
  Transaction,
  ToastNotification,
  Dilemma,
  AuthUser,
  CharacterCustomizationPayload,
  InterviewResult,
  StartupProject,
  StartupActionType,
  Guild,
  Hackathon,
  HackathonParticipation,
  CommunityLeaderboard,
  ModerationReport,
  AdminOverviewData,
  RecurringCycleInfo,
  CareerPassportData,
  FreelanceGig,
  FreelanceContract,
} from '../types/game';
import {
  INITIAL_CITIZEN,
  COURSES,
  JOBS,
  HOUSINGS,
  SAMPLE_DILEMMA,
  MARKET_ITEMS,
  DEFAULT_STARTUP_PROJECTS,
  DEFAULT_GUILDS,
  DEFAULT_HACKATHONS,
  DEFAULT_MODERATION_REPORTS,
  DEFAULT_ADMIN_OVERVIEW,
  DEFAULT_FREELANCE_GIGS,
} from '../data/mockData';
import { api } from '../services/api';
import { formatNumber } from '../lib/format';

interface GameState {
  citizen: Citizen;
  day: number;
  timeSlot: TimeSlot;
  recurringCycle: RecurringCycleInfo | null;
  careerPassport: CareerPassportData | null;
  activeTab: 'dashboard' | 'map' | 'campus' | 'career' | 'market' | 'finance' | 'residential' | 'passport' | 'startup' | 'cityhub';
  selectedDistrictId: DistrictId | null;
  isNovaModalOpen: boolean;
  activeDilemma: Dilemma | null;
  transactions: Transaction[];
  notifications: ToastNotification[];
  isBackendConnected: boolean;
  startupProjects: StartupProject[];
  guilds: Guild[];
  hackathons: Hackathon[];
  leaderboard: CommunityLeaderboard | null;
  freelanceGigs: FreelanceGig[];
  freelanceContracts: FreelanceContract[];
  freelanceStats: { totalEarned: number; totalCompleted: number };

  // Authentification & Comptes (§42, §47)
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authMode: 'login' | 'register';
  toggleAuthModal: (open?: boolean, mode?: 'login' | 'register') => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: { username: string; email?: string; password: string; citizenName?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Création guidée & Onboarding Citoyen (§14, §47)
  isCharacterCreationOpen: boolean;
  toggleCharacterCreation: (open?: boolean) => void;
  customizeCharacter: (payload: CharacterCustomizationPayload) => Promise<{ success: boolean; error?: string }>;
  
  // Lifecycle
  initGame: () => Promise<void>;

  // Navigation & UI Actions
  setActiveTab: (tab: 'dashboard' | 'map' | 'campus' | 'career' | 'market' | 'finance' | 'residential' | 'passport' | 'startup' | 'cityhub') => void;
  selectDistrict: (id: DistrictId | null) => void;
  toggleNovaModal: (open?: boolean) => void;
  dismissDilemma: () => void;
  triggerDilemma: (dilemma?: Dilemma) => void;
  triggerDynamicEvent: () => Promise<void>;
  
  // Startup District (§12, §24)
  fetchStartupProjects: () => Promise<void>;
  createStartupProject: (payload: { name: string; sector: string; pitch: string; initialCapital?: number }) => Promise<{ success: boolean; error?: string }>;
  advanceStartupAction: (projectKey: string, actionType: StartupActionType, role?: string) => Promise<{ success: boolean; error?: string }>;
  claimIncubatorGrant: (projectKey: string) => Promise<{ success: boolean; error?: string }>;

  // City Hub (§13, §29, §30, §31, §33)
  fetchCityHubData: () => Promise<void>;
  joinGuild: (guildKey: string) => Promise<{ success: boolean; error?: string }>;
  leaveGuild: (guildKey: string) => Promise<{ success: boolean; error?: string }>;
  participateHackathon: (hackathonKey: string, payload: { teamName: string; submissionPitch: string; teamMembers?: string[] }) => Promise<{ success: boolean; error?: string }>;

  // Back-Office d'Administration, Modération & Analytics d'Impact (§43, §45, §46)
  isAdminModalOpen: boolean;
  adminOverview: AdminOverviewData | null;
  moderationReports: ModerationReport[];
  toggleAdminModal: (open?: boolean) => void;
  fetchAdminData: () => Promise<void>;
  createModerationReport: (payload: { targetType: string; targetId: string; targetName: string; reason: string; details: string }) => Promise<{ success: boolean; error?: string }>;
  resolveModerationReport: (reportId: number, payload: { action: string; status: string; notes?: string }) => Promise<{ success: boolean; error?: string }>;
  grantAdminStipend: (payload: { characterId?: number; amount: number; reason: string }) => Promise<{ success: boolean; error?: string }>;

  // Career Passport & Portfolio (§34, §35)
  fetchCareerPassport: () => Promise<void>;

  // Missions Freelance & Petits Contrats (§52)
  fetchFreelanceGigs: () => Promise<void>;
  completeFreelanceGig: (key: string) => Promise<{ success: boolean; error?: string }>;

  // Game Actions
  advanceTime: () => void;
  advanceDay: (days?: number) => Promise<void>;
  restAndSleep: () => void;
  addXp: (amount: number) => void;
  earnMoney: (amount: number, label: string, category?: string) => void;
  spendMoney: (amount: number, label: string, category?: string) => boolean;
  depositSavings: (amount: number) => boolean;
  withdrawSavings: (amount: number) => boolean;
  buyMarketItem: (itemKey: string) => Promise<{ success: boolean; error?: string }>;
  completeCourseModule: (courseId: string) => void;
  hireForJob: (jobId: string) => void;
  simulateInterview: (jobId: string, answerIndex: number) => Promise<InterviewResult | null>;
  workShift: () => boolean;
  changeHousing: (housingId: string) => void;
  resolveDilemmaOption: (optionId: string) => void;
  
  // Feedback
  addNotification: (title: string, message: string, type?: ToastNotification['type']) => void;
  removeNotification: (id: string) => void;
  
  // Reset
  resetGame: (preset: 'demo' | 'new') => void;
}

const TIME_SLOTS: TimeSlot[] = [
  'Matin (08:00)',
  'Après-midi (14:00)',
  'Soir (18:00)',
  'Nuit (22:00)',
];

export const useGameStore = create<GameState>((set, get) => ({
  citizen: { ...INITIAL_CITIZEN },
  day: 14,
  timeSlot: 'Matin (08:00)',
  recurringCycle: null,
  careerPassport: null,
  activeTab: 'dashboard',
  selectedDistrictId: null,
  isNovaModalOpen: false,
  activeDilemma: null,
  transactions: [
    { id: 'tx-1', timestamp: 'J-1 18:00', label: 'Mission Freelance Landing Page', amount: 100000, type: 'income', category: 'Carrière' },
    { id: 'tx-2', timestamp: 'J-2 10:00', label: 'Inscription Formation Web (Campus)', amount: -50000, type: 'expense', category: 'Éducation' },
    { id: 'tx-3', timestamp: 'J-3 12:00', label: 'Loyer mensuel Studio City', amount: -150000, type: 'expense', category: 'Logement' },
  ],
  notifications: [
    { id: 'notif-1', title: 'Bienvenue sur Youth City !', message: 'Explore la carte et découvre les opportunités du Campus.', type: 'info' },
  ],
  isBackendConnected: false,
  startupProjects: DEFAULT_STARTUP_PROJECTS,
  guilds: DEFAULT_GUILDS,
  hackathons: DEFAULT_HACKATHONS,
  leaderboard: null,
  freelanceGigs: DEFAULT_FREELANCE_GIGS,
  freelanceContracts: [],
  freelanceStats: { totalEarned: 0, totalCompleted: 0 },
  isAdminModalOpen: false,
  adminOverview: DEFAULT_ADMIN_OVERVIEW,
  moderationReports: DEFAULT_MODERATION_REPORTS,

  // Authentification & Comptes (§42, §47)
  user: null,
  isAuthenticated: false,
  isAuthModalOpen: false,
  authMode: 'login',

  toggleAuthModal: (open, mode = 'login') =>
    set((state) => ({
      isAuthModalOpen: open !== undefined ? open : !state.isAuthModalOpen,
      authMode: mode,
    })),

  login: async (username, password) => {
    const res = await api.login({ username, password });
    if (res.error || !res.data) {
      return { success: false, error: res.error || 'Erreur de connexion.' };
    }
    const { user, citizen } = res.data;
    set({
      user,
      citizen,
      isAuthenticated: true,
      isAuthModalOpen: false,
      isBackendConnected: true,
    });
    get().addNotification(
      'Connexion réussie',
      `Ravi de te revoir, ${user.username} ! Ta progression citoyenne est synchronisée.`,
      'success'
    );
    await get().initGame();
    return { success: true };
  },

  register: async (payload) => {
    const res = await api.register(payload);
    if (res.error || !res.data) {
      return { success: false, error: res.error || "Erreur lors de l'inscription." };
    }
    const { user, citizen } = res.data;
    set({
      user,
      citizen,
      isAuthenticated: true,
      isAuthModalOpen: false,
      isCharacterCreationOpen: true,
      isBackendConnected: true,
    });
    get().addNotification(
      'Bienvenue dans Youth City !',
      `Ton compte est créé. Personnalisons maintenant ton avatar citoyen !`,
      'success'
    );
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
    await get().initGame();
    return { success: true };
  },

  logout: () => {
    api.logout();
    set({
      user: null,
      isAuthenticated: false,
      isCharacterCreationOpen: false,
    });
    get().addNotification(
      'Déconnexion',
      'Tu es repassé en session démo / invité.',
      'info'
    );
    get().initGame();
  },

  // Création guidée & Onboarding Citoyen (§14, §47)
  isCharacterCreationOpen: false,

  toggleCharacterCreation: (open) =>
    set((state) => ({
      isCharacterCreationOpen: open !== undefined ? open : !state.isCharacterCreationOpen,
    })),

  customizeCharacter: async (payload) => {
    const res = await api.customizeCharacter(payload);
    if (!res) {
      return { success: false, error: 'Impossible de personnaliser le profil.' };
    }
    set({
      citizen: res.citizen,
      transactions: res.transactions,
      isCharacterCreationOpen: false,
      isBackendConnected: true,
    });
    get().addNotification(
      'Profil Citoyen activé !',
      `Bienvenue ${res.citizen.name} ! Ton profil (${res.citizen.title}) et ta dotation de départ sont prêts.`,
      'success'
    );
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    return { success: true };
  },

  initGame: async () => {
    try {
      const userProfile = await api.getCurrentUser();
      if (userProfile && userProfile.user) {
        set({
          user: userProfile.user,
          isAuthenticated: true,
        });
      }

      const state = await api.getGameState();
      if (state && state.citizen) {
        set({
          citizen: state.citizen,
          day: state.day || 14,
          timeSlot: (state.timeSlot as TimeSlot) || 'Matin (08:00)',
          recurringCycle: state.recurringCycle || null,
          transactions: state.transactions && state.transactions.length > 0 ? state.transactions : get().transactions,
          activeDilemma: state.activeDilemma || null,
          isBackendConnected: true,
        });
      }

      const [projects, guilds, hackathons, lb, passportRes, freelanceRes] = await Promise.all([
        api.getStartupProjects(),
        api.getGuilds(),
        api.getHackathons(),
        api.getCommunityLeaderboard(),
        api.getCareerPassport(),
        api.getFreelanceGigs(),
      ]);
      if (projects && projects.length > 0) set({ startupProjects: projects });
      if (guilds && guilds.length > 0) set({ guilds });
      if (hackathons && hackathons.length > 0) set({ hackathons });
      if (lb) set({ leaderboard: lb });
      if (passportRes && passportRes.success && passportRes.passport) {
        set({ careerPassport: passportRes.passport });
      }
      if (freelanceRes && freelanceRes.success) {
        set({
          freelanceGigs: freelanceRes.gigs || [],
          freelanceContracts: freelanceRes.contracts || [],
          freelanceStats: freelanceRes.stats || { totalEarned: 0, totalCompleted: 0 },
        });
      }
    } catch {
      // Backend not running, falls back silently to local state
    }
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    if (tab === 'passport') {
      get().fetchCareerPassport();
    } else if (tab === 'career') {
      get().fetchFreelanceGigs();
    }
  },

  selectDistrict: (id) => {
    set({ selectedDistrictId: id });
    if (id === 'campus') set({ activeTab: 'campus' });
    else if (id === 'business') set({ activeTab: 'career' });
    else if (id === 'finance') set({ activeTab: 'finance' });
    else if (id === 'residential') set({ activeTab: 'residential' });
    else if (id === 'market') set({ activeTab: 'market' });
    else if (id === 'startup') set({ activeTab: 'startup' });
    else if (id === 'cityhub') set({ activeTab: 'cityhub' });
  },

  toggleNovaModal: (open) => set((state) => ({ isNovaModalOpen: open !== undefined ? open : !state.isNovaModalOpen })),

  dismissDilemma: () => set({ activeDilemma: null }),

  triggerDilemma: (dilemma?: Dilemma) => {
    if (dilemma) {
      set({ activeDilemma: dilemma });
      return;
    }
    // Attempt dynamic contextual event from backend first, fallback to SAMPLE_DILEMMA
    get().triggerDynamicEvent().catch(() => {
      set({ activeDilemma: SAMPLE_DILEMMA });
    });
  },

  triggerDynamicEvent: async () => {
    try {
      const res = await api.triggerDynamicEvent();
      if (res && res.success && res.dilemma) {
        set({ activeDilemma: res.dilemma });
        get().addNotification(
          '🚨 Aléa Urbain Déclenché !',
          `Un nouvel imprévu requiert ton arbitrage : ${res.dilemma.title}`,
          'warning'
        );
      } else {
        set({ activeDilemma: SAMPLE_DILEMMA });
      }
    } catch {
      set({ activeDilemma: SAMPLE_DILEMMA });
    }
  },

  // --- CAREER PASSPORT & PORTFOLIO VÉRIFIABLE (§34, §35) ---
  fetchCareerPassport: async () => {
    const res = await api.getCareerPassport();
    if (res && res.success && res.passport) {
      set({ careerPassport: res.passport });
    }
  },

  // --- MISSIONS FREELANCE & PETITS CONTRATS (§52) ---
  fetchFreelanceGigs: async () => {
    const res = await api.getFreelanceGigs();
    if (res && res.success) {
      set({
        freelanceGigs: res.gigs || [],
        freelanceContracts: res.contracts || [],
        freelanceStats: res.stats || { totalEarned: 0, totalCompleted: 0 },
      });
    }
  },

  completeFreelanceGig: async (key: string) => {
    const res = await api.completeFreelanceGig(key);
    if (!res.success) {
      get().addNotification('Échec de la mission', res.error || 'Impossible d\'exécuter ce contrat.', 'warning');
      return { success: false, error: res.error };
    }

    if (res.citizen) {
      set({ citizen: res.citizen });
    }

    if (res.transaction) {
      set((state) => ({ transactions: [res.transaction!, ...state.transactions] }));
    }

    // Actualiser la liste des missions et contrats
    await get().fetchFreelanceGigs();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    get().addNotification(
      '🎉 Mission freelance accomplie !',
      res.message || `Rémunération de +${formatNumber(res.payout || 0)} MGA perçue !`,
      'success'
    );

    if (res.levelUp) {
      get().addNotification(
        'Niveau supérieur !',
        `Félicitations ${get().citizen.name}, tu as atteint le niveau ${get().citizen.level} !`,
        'success'
      );
    }

    return { success: true };
  },

  // --- STARTUP DISTRICT (§12, §24) ---
  fetchStartupProjects: async () => {
    const projects = await api.getStartupProjects();
    if (projects) {
      set({ startupProjects: projects });
    }
  },

  createStartupProject: async (payload) => {
    const { addNotification, citizen, addXp } = get();
    try {
      const res = await api.createStartupProject(payload);
      if ('error' in res) {
        addNotification('Erreur Startup', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        startupProjects: [res.project, ...state.startupProjects],
        citizen: res.citizen,
        transactions: res.transaction ? [res.transaction, ...state.transactions].slice(0, 30) : state.transactions,
      }));
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      addNotification('Venture enregistrée !', res.message, 'success');
      return { success: true };
    } catch {
      // Offline fallback
      const initialCapital = payload.initialCapital || 30000;
      if (citizen.money < initialCapital) {
        addNotification('Fonds insuffisants', `Tu as besoin de ${formatNumber(initialCapital)} MGA de capital.`, 'warning');
        return { success: false, error: 'Fonds personnels insuffisants.' };
      }
      const newProj: StartupProject = {
        id: `startup-${Date.now()}`,
        key: `startup-${Date.now()}`,
        name: payload.name,
        sector: payload.sector as StartupProject['sector'],
        pitch: payload.pitch,
        stage: 'idea',
        progress: 15,
        treasury: initialCapital,
        monthlyRevenue: 0,
        reputation: 15,
        usersCount: 0,
        hasIncubatorGrant: false,
        team: ['Fondateur'],
      };
      set((state) => ({
        startupProjects: [newProj, ...state.startupProjects],
        citizen: {
          ...state.citizen,
          money: state.citizen.money - initialCapital,
          completedProjects: state.citizen.completedProjects + 1,
        },
      }));
      addXp(80);
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      addNotification('Venture enregistrée !', `La startup "${payload.name}" est créée !`, 'success');
      return { success: true };
    }
  },

  advanceStartupAction: async (projectKey, actionType, role) => {
    const { addNotification, citizen, addXp } = get();
    try {
      const res = await api.advanceStartupAction(projectKey, actionType, role);
      if ('error' in res) {
        addNotification('Action impossible', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        startupProjects: state.startupProjects.map((p) => (p.key === projectKey || p.id === projectKey ? res.project : p)),
        citizen: res.citizen,
      }));
      if (res.levelUp) {
        try {
          confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
        } catch {
          // Confetti fallback
        }
      }
      addNotification('Action entrepreneuriale', res.message, 'success');
      return { success: true };
    } catch {
      // Offline fallback
      const project = get().startupProjects.find((p) => p.key === projectKey || p.id === projectKey);
      if (!project) return { success: false, error: 'Projet introuvable.' };
      if (citizen.energy < 15) {
        addNotification('Énergie insuffisante', 'Tu es trop épuisé(e) (min. 15%).', 'warning');
        return { success: false, error: 'Énergie insuffisante.' };
      }

      const updated = { ...project };
      let msg = '';
      if (actionType === 'market_study') {
        updated.progress = Math.min(100, updated.progress + 25);
        updated.reputation = Math.min(100, updated.reputation + 10);
        msg = 'Étude de marché validée !';
        if (updated.progress >= 70 && updated.stage === 'idea') {
          updated.stage = 'mvp';
          updated.progress = 20;
          msg += ' Passage au stade MVP !';
        }
        addXp(50);
      } else if (actionType === 'develop_mvp') {
        if (updated.treasury < 25000) {
          addNotification('Trésorerie insuffisante', '25 000 MGA requis.', 'warning');
          return { success: false, error: 'Trésorerie insuffisante.' };
        }
        updated.treasury -= 25000;
        updated.progress = Math.min(100, updated.progress + 30);
        updated.reputation = Math.min(100, updated.reputation + 15);
        msg = 'Prototype MVP développé !';
        if (updated.progress >= 70) {
          updated.stage = 'launched';
          updated.progress = 25;
          updated.usersCount += 10;
          updated.monthlyRevenue += 40000;
          msg += ' Lancement officiel effectué !';
        }
        addXp(70);
      } else if (actionType === 'launch_campaign') {
        if (updated.treasury < 20000) {
          addNotification('Trésorerie insuffisante', '20 000 MGA requis.', 'warning');
          return { success: false, error: 'Trésorerie insuffisante.' };
        }
        updated.treasury -= 20000;
        updated.usersCount += 25;
        updated.monthlyRevenue += 60000;
        updated.reputation = Math.min(100, updated.reputation + 20);
        updated.progress = Math.min(100, updated.progress + 25);
        msg = 'Campagne marketing réussie !';
        if (updated.progress >= 80 && updated.stage === 'launched') {
          updated.stage = 'growth';
          msg += ' Phase de forte croissance atteinte !';
        }
        addXp(80);
      } else if (actionType === 'recruit_partner') {
        const teamRole = role || 'Co-fondateur Tech';
        updated.team = [...updated.team, teamRole];
        updated.reputation = Math.min(100, updated.reputation + 10);
        msg = `Partenaire recruté : ${teamRole} !`;
        addXp(40);
      } else if (actionType === 'collect_revenue') {
        if (updated.monthlyRevenue <= 0) {
          addNotification('Aucun revenu', 'Ta startup ne génère pas encore de revenus.', 'warning');
          return { success: false, error: 'Aucun revenu récurrent.' };
        }
        const dividend = Math.round(updated.monthlyRevenue * 0.5);
        updated.treasury += (updated.monthlyRevenue - dividend);
        get().earnMoney(dividend, `Dividendes : ${updated.name}`, 'Startup');
        msg = `+${formatNumber(dividend)} MGA de dividendes encaissés !`;
      }

      set((state) => ({
        startupProjects: state.startupProjects.map((p) => (p.key === projectKey || p.id === projectKey ? updated : p)),
        citizen: { ...state.citizen, energy: Math.max(0, state.citizen.energy - 15) },
      }));
      addNotification('Startup mise à jour', msg, 'success');
      return { success: true };
    }
  },

  claimIncubatorGrant: async (projectKey) => {
    const { addNotification, addXp } = get();
    try {
      const res = await api.claimIncubatorGrant(projectKey);
      if ('error' in res) {
        addNotification('Subvention refusée', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        startupProjects: state.startupProjects.map((p) => (p.key === projectKey || p.id === projectKey ? res.project : p)),
        citizen: res.citizen,
      }));
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      addNotification('Bourse Incubateur obtenue !', res.message, 'success');
      return { success: true };
    } catch {
      const project = get().startupProjects.find((p) => p.key === projectKey || p.id === projectKey);
      if (!project) return { success: false, error: 'Projet introuvable.' };
      if (project.hasIncubatorGrant) return { success: false, error: 'Déjà obtenue.' };
      if (project.reputation < 30 && project.stage === 'idea') {
        addNotification('Dossier refusé', 'Réputation minimale de 30% ou MVP requis.', 'warning');
        return { success: false, error: 'Dossier insuffisant.' };
      }

      const updated = {
        ...project,
        hasIncubatorGrant: true,
        treasury: project.treasury + 200000,
        reputation: Math.min(100, project.reputation + 25),
      };
      set((state) => ({
        startupProjects: state.startupProjects.map((p) => (p.key === projectKey || p.id === projectKey ? updated : p)),
      }));
      addXp(100);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      addNotification('Bourse Incubateur obtenue !', `200 000 MGA de subvention versés dans la trésorerie de ${project.name} !`, 'success');
      return { success: true };
    }
  },

  // --- CITY HUB (§13, §29, §30, §31, §33) ---
  fetchCityHubData: async () => {
    try {
      const [guilds, hackathons, lb] = await Promise.all([
        api.getGuilds(),
        api.getHackathons(),
        api.getCommunityLeaderboard(),
      ]);
      if (guilds) set({ guilds });
      if (hackathons) set({ hackathons });
      if (lb) set({ leaderboard: lb });
    } catch {
      // offline fallback
    }
  },

  joinGuild: async (guildKey) => {
    const { addNotification } = get();
    try {
      const res = await api.joinGuild(guildKey);
      if ('error' in res) {
        addNotification('Guilde', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        guilds: state.guilds.map((g) => ({
          ...g,
          isJoined: g.key === guildKey,
          memberCount: g.key === guildKey ? g.memberCount + 1 : (g.isJoined ? Math.max(0, g.memberCount - 1) : g.memberCount),
        })),
        citizen: res.citizen,
      }));
      try {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      addNotification('Guilde rejointe !', res.message, 'success');
      return { success: true };
    } catch {
      set((state) => ({
        guilds: state.guilds.map((g) => ({
          ...g,
          isJoined: g.key === guildKey,
        })),
      }));
      get().addXp(50);
      try {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      addNotification('Guilde rejointe !', 'Tu as rejoint la guilde ! (+50 XP)', 'success');
      return { success: true };
    }
  },

  leaveGuild: async (guildKey) => {
    const { addNotification } = get();
    try {
      const res = await api.leaveGuild(guildKey);
      if ('error' in res) {
        addNotification('Guilde', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        guilds: state.guilds.map((g) => (g.key === guildKey ? { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) } : g)),
        citizen: res.citizen,
      }));
      addNotification('Guilde quittée', res.message, 'info');
      return { success: true };
    } catch {
      set((state) => ({
        guilds: state.guilds.map((g) => (g.key === guildKey ? { ...g, isJoined: false } : g)),
      }));
      addNotification('Guilde quittée', 'Tu as quitté la guilde.', 'info');
      return { success: true };
    }
  },

  participateHackathon: async (hackathonKey, payload) => {
    const { addNotification, citizen, addXp, earnMoney } = get();
    try {
      const res = await api.participateHackathon(hackathonKey, payload);
      if ('error' in res) {
        addNotification('Hackathon', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        hackathons: state.hackathons.map((h) => (h.key === hackathonKey ? res.hackathon : h)),
        citizen: res.citizen,
        transactions: res.transaction ? [res.transaction, ...state.transactions].slice(0, 30) : state.transactions,
      }));
      try {
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      addNotification('Résultat Hackathon !', res.message, 'success');
      return { success: true };
    } catch {
      const hackathon = get().hackathons.find((h) => h.key === hackathonKey);
      if (!hackathon) return { success: false, error: 'Hackathon introuvable.' };
      if (citizen.energy < 20) {
        addNotification('Énergie insuffisante', "20% d'énergie requis.", 'warning');
        return { success: false, error: 'Énergie insuffisante.' };
      }
      const score = 88;
      const isWinner = true;
      const wonXp = Math.round(hackathon.xpPool / hackathon.teamSize * 1.2);
      const wonMoney = Math.round(hackathon.prizeMoney / hackathon.teamSize * 1.2);

      const part: HackathonParticipation = {
        id: Date.now(),
        teamName: payload.teamName,
        teamMembers: payload.teamMembers || [
          `${citizen.name} (Lead)`,
          'Aina (UI/UX)',
          'Hery (Dev)',
        ],
        submissionPitch: payload.submissionPitch,
        score,
        awardedXp: wonXp,
        awardedMoney: wonMoney,
        isWinner,
        feedback: "Bravo ! Le jury a salué la pertinence et l'impact de votre prototype pour Madagascar.",
      };

      earnMoney(wonMoney, `Hackathon : ${hackathon.title}`, 'Hackathon');
      addXp(wonXp);
      set((state) => ({
        hackathons: state.hackathons.map((h) => (h.key === hackathonKey ? { ...h, myParticipation: part } : h)),
        citizen: {
          ...state.citizen,
          energy: Math.max(5, state.citizen.energy - 20),
          completedChallenges: state.citizen.completedChallenges + 1,
        },
      }));
      try {
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      addNotification('🏆 Victoire au Hackathon !', `Score 88/100 ! +${wonXp} XP et +${formatNumber(wonMoney)} MGA remportés !`, 'success');
      return { success: true };
    }
  },

  // --- ADMIN BACK-OFFICE & MODERATION (§43, §45, §46) ---
  toggleAdminModal: (open) => {
    const nextState = open !== undefined ? open : !get().isAdminModalOpen;
    set({ isAdminModalOpen: nextState });
    if (nextState) {
      get().fetchAdminData();
    }
  },

  fetchAdminData: async () => {
    if (!get().user?.is_staff) return;
    try {
      const [overview, reports] = await Promise.all([
        api.getAdminOverview(),
        api.getModerationReports(),
      ]);
      if (overview) set({ adminOverview: overview });
      if (reports && reports.length > 0) set({ moderationReports: reports });
    } catch {
      // offline fallback retained
    }
  },

  createModerationReport: async (payload) => {
    const { addNotification } = get();
    try {
      const res = await api.createModerationReport(payload);
      if ('error' in res) {
        addNotification('Signalement', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        moderationReports: [res.report, ...state.moderationReports],
      }));
      addNotification('Signalement transmis', res.message, 'info');
      return { success: true };
    } catch {
      const newReport: ModerationReport = {
        id: Date.now(),
        reporterName: get().citizen.name,
        targetType: payload.targetType,
        targetId: payload.targetId,
        targetName: payload.targetName,
        reason: payload.reason as any,
        details: payload.details,
        status: 'pending',
        actionTaken: 'none',
        moderatorNotes: '',
        createdAt: 'À l\'instant',
      };
      set((state) => ({
        moderationReports: [newReport, ...state.moderationReports],
      }));
      addNotification('Signalement transmis', 'Votre signalement a été enregistré.', 'info');
      return { success: true };
    }
  },

  resolveModerationReport: async (reportId, payload) => {
    const { addNotification } = get();
    try {
      const res = await api.resolveModerationReport(reportId, payload);
      if ('error' in res) {
        addNotification('Modération', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        moderationReports: state.moderationReports.map((r) => (r.id === reportId ? res.report : r)),
      }));
      addNotification('Modération appliquée', res.message, 'success');
      return { success: true };
    } catch {
      set((state) => ({
        moderationReports: state.moderationReports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: payload.status as any,
                actionTaken: payload.action as any,
                moderatorNotes: payload.notes || r.moderatorNotes,
              }
            : r
        ),
      }));
      addNotification('Modération appliquée', 'Le dossier a été mis à jour.', 'success');
      return { success: true };
    }
  },

  grantAdminStipend: async (payload) => {
    const { addNotification, earnMoney } = get();
    try {
      const res = await api.grantAdminStipend(payload);
      if ('error' in res) {
        addNotification('Bourse Administrative', res.error, 'warning');
        return { success: false, error: res.error };
      }
      set((state) => ({
        citizen: res.citizen,
        transactions: res.transaction ? [res.transaction, ...state.transactions].slice(0, 30) : state.transactions,
      }));
      addNotification('Bourse accordée !', res.message, 'success');
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      get().fetchAdminData();
      return { success: true };
    } catch {
      earnMoney(payload.amount, payload.reason, 'Bourse Administrative');
      addNotification('Bourse accordée !', `Bourse d'encouragement de ${formatNumber(payload.amount)} MGA accordée.`, 'success');
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }
      return { success: true };
    }
  },

  addNotification: (title, message, type = 'info') => {
    const newNotif: ToastNotification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications].slice(0, 5) }));
    setTimeout(() => {
      get().removeNotification(newNotif.id);
    }, 5000);
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  addXp: (amount) => {
    const { citizen, addNotification } = get();
    let newXp = citizen.xp + amount;
    let newLevel = citizen.level;
    let xpThreshold = citizen.xpToNextLevel;

    addNotification(`+${amount} XP`, 'Progression citoyenne enregistrée !', 'xp');

    if (newXp >= xpThreshold) {
      newLevel += 1;
      newXp = newXp - xpThreshold;
      xpThreshold = Math.round(xpThreshold * 1.3);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }

      addNotification(
        '🎉 MONTÉE DE NIVEAU !',
        `Félicitations, tu as atteint le Niveau ${newLevel} ! De nouvelles opportunités sont débloquées.`,
        'success'
      );
    }

    set({
      citizen: {
        ...citizen,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: xpThreshold,
      },
    });
  },

  earnMoney: (amount, label, category = 'Revenus') => {
    const { citizen, addNotification, transactions } = get();
    const newMoney = citizen.money + amount;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      timestamp: `J-${get().day} ${get().timeSlot.split(' ')[0]}`,
      label,
      amount,
      type: 'income',
      category,
    };

    addNotification(`+${formatNumber(amount)} MGA`, label, 'money');
    set({
      citizen: { ...citizen, money: newMoney },
      transactions: [newTx, ...transactions],
    });
  },

  spendMoney: (amount, label, category = 'Dépenses') => {
    const { citizen, addNotification, transactions } = get();
    if (citizen.money < amount) {
      addNotification('Fonds insuffisants', `Tu as besoin de ${formatNumber(amount)} MGA mais tu ne disposes que de ${formatNumber(citizen.money)} MGA.`, 'warning');
      return false;
    }

    const newMoney = citizen.money - amount;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      timestamp: `J-${get().day} ${get().timeSlot.split(' ')[0]}`,
      label,
      amount,
      type: 'expense',
      category,
    };

    addNotification(`-${formatNumber(amount)} MGA`, label, 'money');
    set({
      citizen: { ...citizen, money: newMoney },
      transactions: [newTx, ...transactions],
    });
    return true;
  },

  depositSavings: (amount) => {
    const { citizen, spendMoney, addNotification } = get();
    if (amount <= 0 || citizen.money < amount) return false;
    
    spendMoney(amount, 'Virement vers livret d\'épargne', 'Épargne');
    set({
      citizen: {
        ...get().citizen,
        savings: get().citizen.savings + amount,
      },
    });
    addNotification('Épargne sécurisée', `${formatNumber(amount)} MGA placés sur ton livret de précaution.`, 'success');

    // Sync with backend
    api.depositSavings(amount).then((res) => {
      if (res && res.citizen) {
        set({ citizen: res.citizen });
      }
    });

    return true;
  },

  withdrawSavings: (amount) => {
    const { citizen, addNotification } = get();
    if (amount <= 0 || citizen.savings < amount) return false;

    set({
      citizen: {
        ...citizen,
        money: citizen.money + amount,
        savings: citizen.savings - amount,
      },
    });
    addNotification('Retrait d\'épargne', `${formatNumber(amount)} MGA transférés sur ton compte courant.`, 'info');

    // Sync with backend
    api.withdrawSavings(amount).then((res) => {
      if (res && res.citizen) {
        set({ citizen: res.citizen });
      }
    });

    return true;
  },

  buyMarketItem: async (itemKey: string) => {
    const { citizen, addNotification } = get();

    // 1. Try backend API first
    try {
      const res = await api.buyMarketItem(itemKey);
      if (res && res.citizen) {
        set((state) => ({
          citizen: res.citizen,
          transactions: res.transaction ? [res.transaction, ...state.transactions].slice(0, 30) : state.transactions,
        }));
        addNotification(
          res.item && res.item.isConsumable ? 'Vitalité restaurée !' : 'Équipement acquis !',
          res.message,
          'success'
        );
        return { success: true };
      }
    } catch {
      // Fallback to local offline logic
    }

    // 2. Offline fallback logic
    const item = MARKET_ITEMS.find((it) => it.id === itemKey);
    if (!item) {
      return { success: false, error: 'Article introuvable au Market District.' };
    }

    if (!item.isConsumable && (citizen.inventory || []).includes(item.id)) {
      return { success: false, error: 'Tu possèdes déjà cet équipement dans ton inventaire.' };
    }

    if (citizen.money < item.price) {
      return { success: false, error: `Fonds insuffisants. Cet article coûte ${formatNumber(item.price)} MGA.` };
    }

    const newInventory = item.isConsumable
      ? (citizen.inventory || [])
      : [...(citizen.inventory || []), item.id];

    const newEnergy = item.energyBonus > 0
      ? Math.min(100, citizen.energy + item.energyBonus)
      : citizen.energy;
    const newWellbeing = item.wellbeingBonus > 0
      ? Math.min(100, citizen.wellbeing + item.wellbeingBonus)
      : citizen.wellbeing;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      timestamp: `J-${get().day} ${get().timeSlot.split(' ')[0]}`,
      label: `Achat Market : ${item.name}`,
      amount: -item.price,
      type: 'expense',
      category: 'Market',
    };

    set((state) => ({
      citizen: {
        ...state.citizen,
        money: state.citizen.money - item.price,
        energy: newEnergy,
        wellbeing: newWellbeing,
        inventory: newInventory,
      },
      transactions: [newTx, ...state.transactions].slice(0, 30),
    }));

    addNotification(
      item.isConsumable ? 'Vitalité restaurée !' : 'Équipement acquis !',
      item.isConsumable
        ? `Dégustation terminée : ${item.name}. Vitalité restaurée !`
        : `Équipement acquis : ${item.name}. Ajouté à ton inventaire !`,
      'success'
    );

    return { success: true };
  },

  advanceTime: () => {
    const { timeSlot, day, restAndSleep } = get();
    const currentIndex = TIME_SLOTS.indexOf(timeSlot);
    
    if (currentIndex < TIME_SLOTS.length - 1) {
      set({ timeSlot: TIME_SLOTS[currentIndex + 1] });
    } else {
      // Fin de journée -> Nuit -> Nouveau jour
      restAndSleep();
      set({
        day: day + 1,
        timeSlot: TIME_SLOTS[0],
      });
    }

    // Sync with backend
    api.advanceTime().then((res) => {
      if (res && res.citizen) {
        set({
          day: res.day,
          timeSlot: res.timeSlot as TimeSlot,
          citizen: res.citizen,
          recurringCycle: res.recurringCycle || null,
          activeDilemma: res.activeDilemma || get().activeDilemma,
        });

        if (res.settlementSummary) {
          const s = res.settlementSummary;
          if (s.status === 'paid') {
            get().addNotification(
              '🏠 Loyer mensuel prélevé',
              `Loyer de ${formatNumber(s.rentPaid)} MGA honoré.${s.interestEarned > 0 ? ` +${formatNumber(s.interestEarned)} MGA d'intérêts versés sur ton épargne BOA !` : ''}`,
              'success'
            );
          } else if (s.status === 'covered_by_savings') {
            get().addNotification(
              '⚠️ Prélèvement de secours sur épargne',
              `Solde courant insuffisant : ${formatNumber(s.rentCoveredBySavings)} MGA prélevés sur ton épargne BOA pour payer ton loyer.`,
              'warning'
            );
          } else if (s.status === 'overdue') {
            get().addNotification(
              '🚨 Impayé de loyer',
              `Trésorerie et épargne épuisées : loyer impayé ! Malus de bien-être (-20%).`,
              'warning'
            );
          }
        }
      }
    });
  },

  advanceDay: async (days = 1) => {
    const res = await api.advanceDay(days);
    if (res && res.citizen) {
      set({
        day: res.day,
        timeSlot: res.timeSlot as TimeSlot,
        citizen: res.citizen,
        recurringCycle: res.recurringCycle || null,
        activeDilemma: res.activeDilemma || get().activeDilemma,
      });

      if (res.settlementSummary) {
        const s = res.settlementSummary;
        if (s.status === 'paid') {
          get().addNotification(
            '🏠 Fin de cycle mensuel : Loyer réglé',
            `Loyer payé (${formatNumber(s.rentPaid)} MGA).${s.interestEarned > 0 ? ` +${formatNumber(s.interestEarned)} MGA d'intérêts d'épargne crédités !` : ''}`,
            'success'
          );
        } else if (s.status === 'covered_by_savings') {
          get().addNotification(
            '⚠️ Couvert par ton épargne BOA',
            `${formatNumber(s.rentCoveredBySavings)} MGA puisés dans ton livret d'épargne pour honorer ton loyer. Reconstitue ta réserve !`,
            'warning'
          );
        } else if (s.status === 'overdue') {
          get().addNotification(
            '🚨 Impayé de loyer critique',
            `Défaut de paiement de loyer. Malus de bien-être appliqué.`,
            'warning'
          );
        }
      } else {
        get().addNotification(
          `Jour ${res.day} atteint`,
          `Nouveau jour démarré (+${days} j). Repos nocturne effectué.`,
          'info'
        );
      }
    }
  },

  restAndSleep: () => {
    const { citizen, addNotification } = get();
    const housing = HOUSINGS.find((h) => h.id === citizen.currentHousingId) || HOUSINGS[0];
    const recoveredEnergy = Math.min(100, citizen.energy + housing.energyRecoveryPerNight);
    
    addNotification(
      'Nuit de sommeil réparatrice',
      `Ton logement (${housing.title}) t'a permis de récupérer +${housing.energyRecoveryPerNight}% d'énergie.`,
      'success'
    );

    set({
      citizen: {
        ...citizen,
        energy: recoveredEnergy,
      },
    });

    // Sync with backend
    api.restAndSleep().then((res) => {
      if (res && res.citizen) {
        set({ citizen: res.citizen });
      }
    });
  },

  completeCourseModule: (courseId) => {
    const { citizen, addXp, addNotification } = get();
    const course = COURSES.find((c) => c.id === courseId);
    if (!course) return;

    // Mise à jour des compétences
    const updatedSkills = { ...citizen.skills };
    Object.entries(course.skillsAwarded).forEach(([skill, gain]) => {
      updatedSkills[skill] = Math.min(100, (updatedSkills[skill] || 0) + gain);
    });

    const isFirstTime = !citizen.completedCourses.includes(courseId);
    const updatedCompleted = isFirstTime 
      ? [...citizen.completedCourses, courseId]
      : citizen.completedCourses;

    const updatedCerts = isFirstTime && course.certificationName
      ? [...citizen.certifications, course.certificationName]
      : citizen.certifications;

    set({
      citizen: {
        ...citizen,
        skills: updatedSkills,
        completedCourses: updatedCompleted,
        certifications: updatedCerts,
        energy: Math.max(10, citizen.energy - 15),
      },
    });

    addXp(course.xpReward);
    addNotification(
      'Module validé avec succès !',
      `Tes compétences ont augmenté et le certificat "${course.certificationName}" a été ajouté à ton Career Passport.`,
      'success'
    );

    // Sync with backend
    api.completeCourse(courseId).then((res) => {
      if (res && res.citizen) {
        set({ citizen: res.citizen });
      }
    });
  },

  hireForJob: (jobId) => {
    const { citizen, addNotification, addXp } = get();
    const job = JOBS.find((j) => j.id === jobId);
    if (!job) return;

    set({
      citizen: {
        ...citizen,
        currentJobId: jobId,
      },
    });

    addXp(120);
    addNotification(
      '🎉 Embauché(e) !',
      `Félicitations, tu occupes désormais le poste de ${job.title} chez ${job.company} !`,
      'success'
    );

    // Sync with backend
    api.hireJob(jobId).then((res) => {
      if (res && res.citizen) {
        set({ citizen: res.citizen });
      }
    });
  },

  simulateInterview: async (jobId: string, answerIndex: number) => {
    const { citizen, addNotification, addXp } = get();
    const job = JOBS.find((j) => j.id === jobId);

    // 1. Try backend API first
    try {
      const res = await api.simulateInterview(jobId, answerIndex);
      if (res && res.result) {
        if (res.result.hired) {
          set({ citizen: res.citizen });
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {
            // Confetti fallback
          }
          addNotification(
            '🎉 Embauché(e) !',
            `Félicitations, tu as réussi l'entretien chez ${job?.company || "l'entreprise"} ! (+100 XP)`,
            'success'
          );
        } else {
          addNotification(
            'Candidature ajournée',
            `Note : ${res.result.score}/100. Consulte l'analyse pédagogique pour progresser.`,
            'warning'
          );
        }
        return res.result;
      }
    } catch {
      // Offline fallback
    }

    // 2. Offline fallback logic
    if (!job) return null;
    const sample = job.sampleAnswers[answerIndex];
    if (!sample) return null;

    const hasSuit = (citizen.inventory || []).includes('item-suit');
    const suitBonus = hasSuit ? 5 : 0;
    const finalScore = Math.min(100, sample.score + suitBonus);

    const thematicScore = Math.min(10, Math.max(1, Math.round(finalScore / 10)));
    const clarityScore = Math.min(10, Math.max(1, Math.round((finalScore + (finalScore > 60 ? 3 : -5)) / 10)));
    const acquisScore = Math.min(10, Math.max(1, Math.round((finalScore + suitBonus * 2) / 10)));

    let advice = "Candidature insuffisamment préparée. Prends le temps de valider des formations au Campus District avant de te représenter.";
    if (finalScore >= 80) {
      advice = "Excellente prestation ! Ton argumentation technique est solide et ton aisance professionnelle a convaincu le recruteur.";
    } else if (finalScore >= 70) {
      advice = "Prestation convaincante. Pour viser l'excellence, pense à illustrer ton propos avec un exemple chiffré de projet réalisé.";
    } else if (finalScore >= 50) {
      advice = "Des bases intéressantes mais ta réponse manque de structure. Revois tes projets pratiques et illustre avec des exemples concrets.";
    }

    const hired = finalScore >= 70;

    if (hired) {
      set((state) => ({
        citizen: {
          ...state.citizen,
          currentJobId: jobId,
        },
      }));
      addXp(100);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
      addNotification(
        '🎉 Embauché(e) !',
        `Félicitations, tu as réussi l'entretien chez ${job.company} ! (+100 XP)`,
        'success'
      );
    } else {
      addNotification(
        'Candidature ajournée',
        `Note : ${finalScore}/100. Consulte l'analyse pédagogique pour progresser.`,
        'warning'
      );
    }

    return {
      hired,
      score: finalScore,
      baseScore: sample.score,
      suitBonus,
      thematicScore,
      clarityScore,
      acquisScore,
      advice,
      feedback: sample.feedback,
      message: hired
        ? `Félicitations, tu as réussi l'entretien avec une note de ${finalScore}/100 ! Contrat signé chez ${job.company}.`
        : `Entretien ajourné avec une note de ${finalScore}/100. Suis les conseils du mentor pour retenter ta chance !`,
    };
  },

  workShift: () => {
    const { citizen, earnMoney, addXp, addNotification } = get();
    const job = JOBS.find((j) => j.id === citizen.currentJobId);
    if (!job) {
      addNotification('Aucun emploi actif', 'Consulte le Business District pour postuler à un poste.', 'warning');
      return false;
    }

    if (citizen.energy < job.energyPerShift) {
      addNotification('Énergie insuffisante', 'Tu es trop épuisé(e) pour accomplir ta journée de travail. Repose-toi au Residential District !', 'warning');
      return false;
    }

    // Salaire journalier = Salaire mensuel / 20 jours ouvrés
    const dailyPay = Math.round(job.salary / 20);
    earnMoney(dailyPay, `Salaire journalier — ${job.title}`, 'Salaire');
    addXp(40);

    set({
      citizen: {
        ...citizen,
        energy: citizen.energy - job.energyPerShift,
      },
    });

    // Sync with backend
    api.workShift().then((res) => {
      if (res && res.citizen) {
        set({ citizen: res.citizen });
      }
    });

    return true;
  },

  changeHousing: (housingId) => {
    const { citizen, addNotification } = get();
    const housing = HOUSINGS.find((h) => h.id === housingId);
    if (!housing) return;

    set({
      citizen: {
        ...citizen,
        currentHousingId: housingId,
      },
    });

    addNotification('Nouveau logement', `Tu as emménagé dans : ${housing.title}`, 'info');

    // Sync with backend
    api.changeHousing(housingId).then((res) => {
      if (res && res.citizen) {
        set({ citizen: res.citizen });
      }
    });
  },

  resolveDilemmaOption: (optionId) => {
    const { activeDilemma, spendMoney, earnMoney, addXp, addNotification, citizen } = get();
    if (!activeDilemma) return;

    const opt = activeDilemma.options.find((o) => o.id === optionId);
    if (!opt) return;

    if (opt.costMoney > 0) {
      const ok = spendMoney(opt.costMoney, `Arbitrage : ${opt.text}`, 'Aléas');
      if (!ok) return;
    }

    if (opt.gainMoney && opt.gainMoney > 0) {
      earnMoney(opt.gainMoney, `Gain Aléa : ${opt.text.slice(0, 40)}`, 'Aléas');
    }

    if (opt.gainXp > 0) {
      addXp(opt.gainXp);
    }

    const updatedSkills = { ...citizen.skills };
    if (opt.impactSkills) {
      Object.entries(opt.impactSkills).forEach(([k, v]) => {
        updatedSkills[k] = Math.max(0, Math.min(100, (updatedSkills[k] || 50) + v));
      });
    }

    set({
      activeDilemma: null,
      citizen: {
        ...citizen,
        energy: Math.max(5, citizen.energy - opt.costEnergy),
        skills: updatedSkills,
        completedChallenges: citizen.completedChallenges + 1,
      },
    });

    addNotification('Conséquence appliquée', opt.consequenceText, 'info');

    if (opt.gainXp >= 70 || (opt.gainMoney && opt.gainMoney >= 50000)) {
      try {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      } catch {
        // Fallback
      }
    }

    // Sync with backend
    api.resolveDilemma(optionId, activeDilemma.id).then((res) => {
      if (res && res.citizen) {
        set({ citizen: res.citizen });
      }
    });
  },

  resetGame: (preset) => {
    if (preset === 'new') {
      set({
        citizen: {
          ...INITIAL_CITIZEN,
          name: 'Nouveau Citoyen',
          title: 'Citoyen Débutant',
          level: 1,
          xp: 0,
          xpToNextLevel: 500,
          money: 250000,
          savings: 50000,
          currentHousingId: 'housing-room',
          currentJobId: null,
          skills: {
            javascript: 10,
            react: 5,
            git: 10,
            budget: 30,
            communication: 40,
            entrepreneuriat: 10,
          },
          completedCourses: [],
          certifications: [],
          completedProjects: 0,
          completedChallenges: 0,
        },
        day: 1,
        timeSlot: 'Matin (08:00)',
        activeTab: 'dashboard',
        selectedDistrictId: null,
        transactions: [],
      });
    } else {
      set({
        citizen: { ...INITIAL_CITIZEN },
        day: 14,
        timeSlot: 'Matin (08:00)',
        activeTab: 'dashboard',
        selectedDistrictId: null,
      });
    }

    // Sync with backend
    api.resetGame(preset).then((res) => {
      if (res && res.citizen) {
        set({
          citizen: res.citizen,
          day: res.day,
          timeSlot: res.timeSlot as TimeSlot,
          transactions: res.transactions,
        });
      }
    });
  },
}));
