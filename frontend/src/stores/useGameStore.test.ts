import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api, lastError } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    lastError: { value: null as string | null },
    api: {
      logout: fn(), advanceTime: fn(), advanceDay: fn(), restAndSleep: fn(), changeHousing: fn(),
      depositSavings: fn(), withdrawSavings: fn(), resetGame: fn(), buyMarketItem: fn(),
      enrollCourse: fn(), workShift: fn(), simulateInterview: fn(), completeFreelanceGig: fn(),
      triggerDynamicEvent: fn(), resolveDilemma: fn(), createStartupProject: fn(),
      advanceStartupAction: fn(), claimIncubatorGrant: fn(), joinGuild: fn(), leaveGuild: fn(),
      participateHackathon: fn(), createModerationReport: fn(), resolveModerationReport: fn(),
      grantAdminStipend: fn(), getCurrentUser: fn(), getGameState: fn(), getStartupProjects: fn(),
      getGuilds: fn(), getHackathons: fn(), getCommunityLeaderboard: fn(), getCareerPassport: fn(),
      getFreelanceGigs: fn(),
    },
  };
});

vi.mock('../services/api', () => ({
  api,
  getLastApiError: () => lastError.value,
  setUnauthorizedHandler: vi.fn(),
}));

import { INITIAL_CITIZEN } from '../data/mockData';
import type { Citizen } from '../types/game';
import { useGameStore } from './useGameStore';

const store = () => useGameStore.getState();
const serverCitizen = (patch: Partial<Citizen> = {}): Citizen => ({ ...INITIAL_CITIZEN, name: 'Serveur', ...patch });
const login = (citizen: Citizen = serverCitizen()) =>
  useGameStore.setState({ isAuthenticated: true, user: { username: 'aina', is_staff: false } as never, citizen });

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
  Object.values(api).forEach((mock) => mock.mockReset());
  lastError.value = null;
});

describe('visiteur (lecture seule, ARC-02)', () => {
  it("n'appelle jamais le serveur et ne modifie rien en tentant d'agir", async () => {
    const before = store().citizen;

    await store().advanceTime();
    await store().advanceDay(5);
    await store().restAndSleep();
    await store().changeHousing('housing-room');
    await store().depositSavings(1000);
    await store().withdrawSavings(1000);
    await store().resetGame('new');
    await store().triggerDilemma();
    await store().buyMarketItem('item-suit');
    await store().enrollInCourse({ id: 'c1', title: 'Web', cost: 50000 });
    await store().createStartupProject({ name: 'X', sector: 'tech', pitch: 'Y' });
    await store().joinGuild('g1');

    expect(await store().workShift()).toBe(false);
    expect(await store().simulateInterview('job', 0)).toBeNull();
    expect(store().citizen).toBe(before);
    Object.values(api).forEach((mock) => expect(mock).not.toHaveBeenCalled());
  });

  it('propose de se connecter au lieu de simuler', async () => {
    await store().buyMarketItem('item-suit');
    expect(store().isAuthModalOpen).toBe(true);
    expect(store().authMode).toBe('login');
  });

  it('refuse les actions avec un résultat explicite', async () => {
    expect(await store().buyMarketItem('x')).toEqual({ success: false, error: 'Connexion requise.' });
  });
});

describe('joueur connecté (le serveur fait autorité)', () => {
  it("applique l'état renvoyé par le serveur après un dépôt", async () => {
    login(serverCitizen({ money: 10000, savings: 0 }));
    const after = serverCitizen({ money: 9000, savings: 1000 });
    api.depositSavings.mockResolvedValue({ citizen: after, transaction: { id: 'tx-9', label: 'Dépôt' } });

    expect(await store().depositSavings(1000)).toEqual({ success: true });
    expect(store().citizen).toBe(after);
    expect(store().transactions[0].id).toBe('tx-9');
  });

  it("ne modifie pas le citoyen quand le serveur refuse, et affiche l'erreur", async () => {
    const before = serverCitizen({ money: 100 });
    login(before);
    lastError.value = 'Fonds insuffisants.';
    api.depositSavings.mockResolvedValue(null);

    const res = await store().depositSavings(5000);

    expect(res).toEqual({ success: false, error: 'Fonds insuffisants.' });
    expect(store().citizen).toBe(before);
    expect(store().notifications[0]).toMatchObject({ message: 'Fonds insuffisants.', type: 'warning' });
  });

  it('ignore les montants invalides sans solliciter le serveur', async () => {
    login();
    expect((await store().depositSavings(0)).success).toBe(false);
    expect((await store().withdrawSavings(-5)).success).toBe(false);
    expect(api.depositSavings).not.toHaveBeenCalled();
  });

  it("met à jour le jour et le créneau d'après le serveur", async () => {
    login();
    api.advanceTime.mockResolvedValue({ day: 15, timeSlot: 'Après-midi (14:00)', citizen: serverCitizen({ energy: 70 }) });

    await store().advanceTime();

    expect(store()).toMatchObject({ day: 15, timeSlot: 'Après-midi (14:00)' });
    expect(store().citizen.energy).toBe(70);
  });

  it('notifie le prélèvement du loyer en fin de cycle', async () => {
    login();
    api.advanceDay.mockResolvedValue({
      day: 31, timeSlot: 'Matin (08:00)', citizen: serverCitizen(),
      settlementSummary: { status: 'overdue', rentPaid: 0, rentCoveredBySavings: 0, interestEarned: 0 },
    });

    await store().advanceDay(1);

    expect(store().notifications[0].title).toContain('Impayé de loyer');
  });

  it("n'applique le shift que si le serveur l'accepte", async () => {
    login();
    api.workShift.mockResolvedValue(null);
    lastError.value = 'Aucun emploi actif.';
    expect(await store().workShift()).toBe(false);

    api.workShift.mockResolvedValue({ citizen: serverCitizen({ money: 777 }), transaction: { id: 'tx-w' }, salaryEarned: 5000 });
    expect(await store().workShift()).toBe(true);
    expect(store().citizen.money).toBe(777);
  });

  it('retire le dilemme actif quand le serveur valide le choix', async () => {
    login();
    useGameStore.setState({ activeDilemma: { id: 'd1', title: 'Panne', options: [] } as never });
    api.resolveDilemma.mockResolvedValue({ citizen: serverCitizen(), message: 'Réparé.' });
    api.getGameState.mockResolvedValue({ citizen: serverCitizen(), day: 14, timeSlot: 'Matin (08:00)', transactions: [] });

    await store().resolveDilemmaOption('opt-1');

    expect(api.resolveDilemma).toHaveBeenCalledWith('opt-1', 'd1');
    expect(store().activeDilemma).toBeNull();
  });
});

describe('session', () => {
  it("charge l'état serveur au démarrage d'une session valide", async () => {
    api.getCurrentUser.mockResolvedValue({ user: { username: 'aina' } });
    api.getGameState.mockResolvedValue({ citizen: serverCitizen({ money: 42 }), day: 3, timeSlot: 'Soir (18:00)', transactions: [] });
    api.getStartupProjects.mockResolvedValue([]);

    await store().initGame();

    expect(store()).toMatchObject({ isAuthenticated: true, day: 3, isBackendConnected: true });
    expect(store().citizen.money).toBe(42);
    expect(store().startupProjects).toEqual([]);
  });

  it('garde la vitrine sans session valide', async () => {
    api.getCurrentUser.mockResolvedValue(null);
    await store().initGame();
    expect(store().isAuthenticated).toBe(false);
    expect(api.getGameState).not.toHaveBeenCalled();
  });

  it('la déconnexion efface les données du compte précédent', () => {
    login(serverCitizen({ name: 'Aina', money: 999999 }));
    useGameStore.setState({ day: 99, activeTab: 'finance' });

    store().logout();

    expect(store()).toMatchObject({ isAuthenticated: false, user: null, day: 14, activeTab: 'dashboard' });
    expect(store().citizen.name).toBe(INITIAL_CITIZEN.name);
    expect(api.logout).toHaveBeenCalled();
  });
});

describe('navigation', () => {
  it("ouvre l'onglet du quartier sélectionné", () => {
    store().selectDistrict('business');
    expect(store()).toMatchObject({ selectedDistrictId: 'business', activeTab: 'career' });
  });

  it("n'appelle pas le serveur pour un visiteur qui ouvre le passeport", () => {
    store().setActiveTab('passport');
    expect(api.getCareerPassport).not.toHaveBeenCalled();
  });

  it('limite les notifications à 5', () => {
    for (let i = 0; i < 8; i++) store().addNotification(`n${i}`, 'm');
    expect(store().notifications).toHaveLength(5);
    expect(store().notifications[0].title).toBe('n7');
  });
});
