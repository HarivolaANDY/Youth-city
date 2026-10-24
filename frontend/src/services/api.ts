import type {
  Citizen,
  Transaction,
  Dilemma,
  Course,
  CourseQuizValidationResult,
  Job,
  Housing,
  AuthUser,
  AuthResponse,
  CharacterCustomizationPayload,
  MarketItem,
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
  RecurringSettlementSummary,
  CareerPassportData,
  FreelanceContract,
  FreelanceResponse,
  NovaProactiveGuidance,
  DirectoryCitizen,
  CitizenMessage,
  SendMessagePayload,
  SendMessageResponse,
} from '../types/game';

export interface FreelanceCompletionData {
  success: boolean;
  message: string;
  payout: number;
  xpEarned: number;
  energySpent: number;
  levelUp: boolean;
  contract: FreelanceContract;
  transaction: Transaction;
  citizen: Citizen;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_STORAGE_KEY = 'yc_access_token';
const REFRESH_STORAGE_KEY = 'yc_refresh_token';

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_STORAGE_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, access);
    localStorage.setItem(REFRESH_STORAGE_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  },
};

const getHeaders = (extraHeaders?: Record<string, string>): Record<string, string> => {
  const token = tokenStorage.getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) {
        tokenStorage.clear();
        return null;
      }
      const data = await res.json();
      if (data.access) {
        tokenStorage.setTokens(data.access, data.refresh || refreshToken);
        return data.access;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const fetchAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const customHeaders = (options.headers as Record<string, string>) || {};
  let res = await fetch(url, {
    ...options,
    headers: getHeaders(customHeaders),
  });

  if (res.status === 401 && tokenStorage.getRefresh()) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await fetch(url, {
        ...options,
        headers: getHeaders(customHeaders),
      });
    }
  }

  return res;
};

const getJSON = async <T>(path: string): Promise<T | null> => {
  try {
    const res = await fetchAuth(`${API_BASE_URL}${path}`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
};

const postJSON = async <T>(path: string, body?: unknown): Promise<T | null> => {
  try {
    const res = await fetchAuth(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
};

const postWithResult = async <T>(path: string, body?: unknown, fallbackError = 'Erreur réseau'): Promise<T | { error: string }> => {
  try {
    const res = await fetchAuth(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return res.ok ? data : { error: data.error || fallbackError };
  } catch {
    return { error: 'Impossible de joindre le serveur Youth City.' };
  }
};

export interface GameStateResponse {
  citizen: Citizen;
  day: number;
  timeSlot: string;
  recurringCycle?: RecurringCycleInfo;
  transactions: Transaction[];
  activeDilemma: Dilemma | null;
}

export const api = {
  // --- AUTHENTIFICATION & COMPTES (§42, §47) ---
  async register(payload: {
    username: string;
    email?: string;
    password: string;
    citizenName?: string;
  }): Promise<{ data?: AuthResponse; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg =
          data.username?.[0] ||
          data.password?.[0] ||
          data.email?.[0] ||
          data.error ||
          'Erreur lors de la création du compte.';
        return { error: errorMsg };
      }
      tokenStorage.setTokens(data.tokens.access, data.tokens.refresh);
      return { data };
    } catch {
      return { error: 'Impossible de joindre le serveur Youth City.' };
    }
  },

  async login(payload: {
    username: string;
    password: string;
  }): Promise<{ data?: AuthResponse; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Identifiant ou mot de passe incorrect.' };
      }
      tokenStorage.setTokens(data.tokens.access, data.tokens.refresh);
      return { data };
    } catch {
      return { error: 'Impossible de joindre le serveur Youth City.' };
    }
  },

  async getCurrentUser(): Promise<{ user: AuthUser; citizen: Citizen } | null> {
    const token = tokenStorage.getAccess();
    if (!token) return null;
    try {
      const res = await fetchAuth(`${API_BASE_URL}/auth/me/`);
      if (!res.ok) {
        if (res.status === 401) tokenStorage.clear();
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  logout() {
    tokenStorage.clear();
  },

  // --- GAMEPLAY & STATE ---
  getGameState: () => getJSON<GameStateResponse>('/game/state/'),
  advanceTime: () => postJSON<{
    day: number;
    timeSlot: string;
    energy: number;
    recurringCycle?: RecurringCycleInfo;
    settlementSummary?: RecurringSettlementSummary;
    activeDilemma?: Dilemma;
    message?: string;
    citizen: Citizen;
  }>('/game/advance_time/'),
  advanceDay: (days = 1) => postJSON<{
    day: number;
    timeSlot: string;
    energy: number;
    recurringCycle?: RecurringCycleInfo;
    settlementSummary?: RecurringSettlementSummary;
    activeDilemma?: Dilemma;
    message?: string;
    citizen: Citizen;
  }>('/game/advance_day/', { days }),
  restAndSleep: () => postJSON<{ energy: number; citizen: Citizen }>('/game/sleep/'),
  changeHousing: (housingId: string) => postJSON<{ citizen: Citizen }>('/game/housing/', { housing_id: housingId }),

  // --- CAMPUS DISTRICT ---
  getCourses: () => getJSON<Course[]>('/campus/courses/'),
  completeCourse: (courseKey: string) => postJSON<{ citizen: Citizen; xpAwarded: number; levelUp: boolean }>(`/campus/courses/${courseKey}/complete/`),
  validateCourseQuiz: (courseKey: string, moduleIndex: number, answerIndex: number) =>
    postJSON<CourseQuizValidationResult>(`/campus/courses/${courseKey}/validate-quiz/`, { moduleIndex, answerIndex }),

  // --- BUSINESS DISTRICT & CARRIÈRE ---
  getJobs: () => getJSON<Job[]>('/business/jobs/'),
  hireJob: (jobKey: string) => postJSON<{ citizen: Citizen; levelUp: boolean }>(`/business/jobs/${jobKey}/hire/`),
  workShift: () => postJSON<{ citizen: Citizen; salaryEarned: number; transaction: Transaction; levelUp: boolean }>('/business/work_shift/'),
  simulateInterview: async (jobKey: string, answerIndex: number): Promise<{ citizen: Citizen; result: InterviewResult } | null> => {
    const data = await postJSON<InterviewResult & { citizen: Citizen }>(`/business/jobs/${jobKey}/interview/`, { answerIndex });
    return data ? { citizen: data.citizen, result: data } : null;
  },

  // --- FINANCE DISTRICT ---
  depositSavings: (amount: number) => postJSON<{ citizen: Citizen; transaction: Transaction }>('/finance/deposit/', { amount }),
  withdrawSavings: (amount: number) => postJSON<{ citizen: Citizen; transaction: Transaction }>('/finance/withdraw/', { amount }),
  getTransactions: () => getJSON<Transaction[]>('/finance/transactions/'),

  // --- RESIDENTIAL DISTRICT ---
  getProperties: () => getJSON<Housing[]>('/residential/properties/'),

  // --- DILEMMAS & ALÉAS (§25, §26) ---
  getActiveDilemma: () => getJSON<Dilemma>('/dilemmas/active/'),
  triggerDynamicEvent: () => postJSON<{ success: boolean; dilemma?: Dilemma }>('/dilemmas/trigger/'),
  resolveDilemma: (optionId: string, dilemmaKey = 'dilemma-broken-laptop') =>
    postJSON<{ citizen: Citizen; message: string; levelUp?: boolean; dilemmaResolvedKey?: string }>('/dilemmas/resolve/', { dilemma_key: dilemmaKey, option_id: optionId }),
  resetGame: (preset: 'demo' | 'new') => postJSON<GameStateResponse>('/game/reset/', { preset }),
  customizeCharacter: (payload: CharacterCustomizationPayload) =>
    postJSON<{ citizen: Citizen; message: string; transactions: Transaction[] }>('/character/customize/', payload),

  // --- MARKET DISTRICT (§11, §19) ---
  getMarketItems: (category?: string) =>
    getJSON<MarketItem[]>(category ? `/market/items/?category=${encodeURIComponent(category)}` : '/market/items/'),
  buyMarketItem: (itemKey: string) =>
    postJSON<{ citizen: Citizen; transaction: Transaction; item: MarketItem; message: string }>('/market/buy/', { itemKey }),

  // --- STARTUP DISTRICT (§12, §24) ---
  getStartupProjects: () => getJSON<StartupProject[]>('/startup/projects/'),
  createStartupProject: (payload: { name: string; sector: string; pitch: string; initialCapital?: number }) =>
    postWithResult<{ project: StartupProject; citizen: Citizen; transaction: Transaction; levelUp?: boolean; message: string }>('/startup/create/', payload, 'Erreur lors de la création de la startup.'),
  advanceStartupAction: (projectKey: string, actionType: StartupActionType, role?: string) =>
    postWithResult<{ project: StartupProject; citizen: Citizen; levelUp?: boolean; message: string }>(`/startup/${projectKey}/action/`, { actionType, role }, 'Action impossible à exécuter.'),
  claimIncubatorGrant: (projectKey: string) =>
    postWithResult<{ project: StartupProject; citizen: Citizen; levelUp?: boolean; message: string }>(`/startup/${projectKey}/grant/`, undefined, 'Subvention non éligible.'),

  // --- CITY HUB : GUILDES, HACKATHONS & COMMUNAUTÉ (§13, §29, §30, §31, §33) ---
  getGuilds: () => getJSON<Guild[]>('/hub/guilds/'),
  joinGuild: (guildKey: string) =>
    postWithResult<{ guild: Guild; citizen: Citizen; levelUp?: boolean; message: string }>(`/hub/guilds/${guildKey}/join/`, undefined, 'Impossible de rejoindre la guilde.'),
  leaveGuild: (guildKey: string) =>
    postWithResult<{ citizen: Citizen; message: string }>(`/hub/guilds/${guildKey}/leave/`, undefined, 'Impossible de quitter la guilde.'),
  getHackathons: () => getJSON<Hackathon[]>('/hub/hackathons/'),
  participateHackathon: (hackathonKey: string, payload: { teamName: string; submissionPitch: string; teamMembers?: string[] }) =>
    postWithResult<{ participation: HackathonParticipation; hackathon: Hackathon; citizen: Citizen; transaction: Transaction; levelUp?: boolean; message: string }>(`/hub/hackathons/${hackathonKey}/participate/`, payload, 'Impossible de soumettre le projet de hackathon.'),
  getCommunityLeaderboard: () => getJSON<CommunityLeaderboard>('/hub/leaderboard/'),

  // --- ADMIN BACK-OFFICE & MODERATION (§43, §45, §46) ---
  getAdminOverview: () => getJSON<AdminOverviewData>('/admin/overview/'),
  getModerationReports: (statusFilter?: string) =>
    getJSON<ModerationReport[]>(statusFilter ? `/moderation/reports/?status=${encodeURIComponent(statusFilter)}` : '/moderation/reports/'),
  createModerationReport: (payload: { targetType: string; targetId: string; targetName: string; reason: string; details: string }) =>
    postWithResult<{ report: ModerationReport; message: string }>('/moderation/reports/create/', payload, 'Impossible d\'enregistrer le signalement.'),
  resolveModerationReport: (reportId: number, payload: { action: string; status: string; notes?: string }) =>
    postWithResult<{ report: ModerationReport; message: string }>(`/moderation/reports/${reportId}/resolve/`, payload, 'Impossible de traiter le signalement.'),
  grantAdminStipend: (payload: { characterId?: number; amount: number; reason: string }) =>
    postWithResult<{ citizen: Citizen; transaction: Transaction; message: string }>('/admin/grant_stipend/', payload, 'Impossible d\'octroyer la bourse administrative.'),

  // --- NOVA AI MENTOR API (§27, §28 — P2/P3) ---
  chatWithNova: (message: string) =>
    postWithResult<{ reply: string; citizenName: string; isGuardrailTriggered: boolean }>('/nova/chat/', { message }, 'Erreur lors de la communication avec NOVA.'),
  getNovaProactiveGuidance: () =>
    getJSON<NovaProactiveGuidance>('/nova/proactive-guidance/'),

  // --- CAREER PASSPORT & PORTFOLIO VÉRIFIABLE (§34, §35) ---
  getCareerPassport: () => getJSON<{ success: boolean; passport?: CareerPassportData }>('/passport/'),
  async verifyPassport(code: string): Promise<{ success: boolean; verified?: boolean; verificationCode?: string; signature?: string; passport?: CareerPassportData } | { error: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/passport/verify/${encodeURIComponent(code)}/`);
      const data = await res.json();
      return res.ok ? data : { error: data.error || 'Code de passeport invalide ou introuvable.' };
    } catch {
      return { error: 'Impossible de joindre le serveur de vérification Youth City.' };
    }
  },

  // --- MISSIONS FREELANCE & PETITS CONTRATS AU BUSINESS DISTRICT (§52) ---
  getFreelanceGigs: () => getJSON<FreelanceResponse>('/business/freelance/'),
  completeFreelanceGig: async (key: string): Promise<{
    success: boolean;
    message?: string;
    payout?: number;
    xpEarned?: number;
    energySpent?: number;
    levelUp?: boolean;
    contract?: FreelanceContract;
    transaction?: Transaction;
    citizen?: Citizen;
    error?: string;
  }> => {
    const res = await postWithResult<FreelanceCompletionData>(
      `/business/freelance/${encodeURIComponent(key)}/complete/`,
      undefined,
      'Impossible d\'exécuter ce contrat freelance.'
    );
    if ('error' in res) {
      return { success: false, error: res.error };
    }
    return res;
  },

  // --- ANNUAIRE CITOYEN & MESSAGERIE SOCIALE DIRECTE (§29) ---
  getCitizenDirectory: () => getJSON<DirectoryCitizen[]>('/hub/directory/'),
  getCitizenMessages: (contactId?: number) =>
    getJSON<CitizenMessage[]>(`/hub/messages/${contactId ? `?contact_id=${contactId}` : ''}`),
  sendCitizenMessage: (payload: SendMessagePayload) =>
    postWithResult<SendMessageResponse>('/hub/messages/send/', payload, 'Impossible d\'envoyer le message.'),
  markMessageRead: (messageId: number) =>
    postJSON<{ success: boolean; messageId: number }>(`/hub/messages/${messageId}/read/`),
};
