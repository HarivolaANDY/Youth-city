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
} from '../types/game';
import { INITIAL_CITIZEN, COURSES, JOBS, HOUSINGS, SAMPLE_DILEMMA, MARKET_ITEMS } from '../data/mockData';
import { api } from '../services/api';
import { formatNumber } from '../lib/format';

interface GameState {
  citizen: Citizen;
  day: number;
  timeSlot: TimeSlot;
  activeTab: 'dashboard' | 'map' | 'campus' | 'career' | 'market' | 'finance' | 'residential' | 'passport';
  selectedDistrictId: DistrictId | null;
  isNovaModalOpen: boolean;
  activeDilemma: Dilemma | null;
  transactions: Transaction[];
  notifications: ToastNotification[];
  isBackendConnected: boolean;

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
  setActiveTab: (tab: 'dashboard' | 'map' | 'campus' | 'career' | 'market' | 'finance' | 'residential' | 'passport') => void;
  selectDistrict: (id: DistrictId | null) => void;
  toggleNovaModal: (open?: boolean) => void;
  dismissDilemma: () => void;
  triggerDilemma: (dilemma?: Dilemma) => void;
  
  // Game Actions
  advanceTime: () => void;
  restAndSleep: () => void;
  addXp: (amount: number) => void;
  earnMoney: (amount: number, label: string, category?: string) => void;
  spendMoney: (amount: number, label: string, category?: string) => boolean;
  depositSavings: (amount: number) => boolean;
  withdrawSavings: (amount: number) => boolean;
  buyMarketItem: (itemKey: string) => Promise<{ success: boolean; error?: string }>;
  completeCourseModule: (courseId: string) => void;
  hireForJob: (jobId: string) => void;
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
          transactions: state.transactions && state.transactions.length > 0 ? state.transactions : get().transactions,
          activeDilemma: state.activeDilemma || null,
          isBackendConnected: true,
        });
      }
    } catch {
      // Backend not running, falls back silently to local state
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  selectDistrict: (id) => {
    set({ selectedDistrictId: id });
    if (id === 'campus') set({ activeTab: 'campus' });
    else if (id === 'business') set({ activeTab: 'career' });
    else if (id === 'finance') set({ activeTab: 'finance' });
    else if (id === 'residential') set({ activeTab: 'residential' });
    else if (id === 'market') set({ activeTab: 'market' });
  },

  toggleNovaModal: (open) => set((state) => ({ isNovaModalOpen: open !== undefined ? open : !state.isNovaModalOpen })),

  dismissDilemma: () => set({ activeDilemma: null }),

  triggerDilemma: (dilemma = SAMPLE_DILEMMA) => set({ activeDilemma: dilemma }),

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
        });
      }
    });
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
    const { activeDilemma, spendMoney, addXp, addNotification, citizen } = get();
    if (!activeDilemma) return;

    const opt = activeDilemma.options.find((o) => o.id === optionId);
    if (!opt) return;

    if (opt.costMoney > 0) {
      const ok = spendMoney(opt.costMoney, `Arbitrage : ${opt.text}`, 'Aléas');
      if (!ok) return;
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
      },
    });

    addNotification('Conséquence appliquée', opt.consequenceText, 'info');

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
