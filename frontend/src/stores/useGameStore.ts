import { create } from 'zustand';
import confetti from 'canvas-confetti';
import type { Citizen, DistrictId, TimeSlot, Transaction, ToastNotification, Dilemma } from '../types/game';
import { INITIAL_CITIZEN, COURSES, JOBS, HOUSINGS, SAMPLE_DILEMMA } from '../data/mockData';
import { api } from '../services/api';
import { formatNumber } from '../lib/format';

interface GameState {
  citizen: Citizen;
  day: number;
  timeSlot: TimeSlot;
  activeTab: 'dashboard' | 'map' | 'campus' | 'career' | 'finance' | 'residential' | 'passport';
  selectedDistrictId: DistrictId | null;
  isNovaModalOpen: boolean;
  activeDilemma: Dilemma | null;
  transactions: Transaction[];
  notifications: ToastNotification[];
  isBackendConnected: boolean;
  
  // Lifecycle
  initGame: () => Promise<void>;

  // Navigation & UI Actions
  setActiveTab: (tab: 'dashboard' | 'map' | 'campus' | 'career' | 'finance' | 'residential' | 'passport') => void;
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

  initGame: async () => {
    try {
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
