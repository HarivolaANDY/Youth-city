import type {
  Citizen,
  Transaction,
  Dilemma,
  Course,
  Job,
  Housing,
  AuthUser,
  AuthResponse,
  CharacterCustomizationPayload,
  MarketItem,
  InterviewResult,
  StartupProject,
  StartupActionType,
} from '../types/game';

const API_BASE_URL = 'http://localhost:8000/api';
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

export interface GameStateResponse {
  citizen: Citizen;
  day: number;
  timeSlot: string;
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
        if (res.status === 401) {
          tokenStorage.clear();
        }
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
  async getGameState(): Promise<GameStateResponse | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/game/state/`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async advanceTime(): Promise<{ day: number; timeSlot: string; energy: number; citizen: Citizen } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/game/advance_time/`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async restAndSleep(): Promise<{ energy: number; citizen: Citizen } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/game/sleep/`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async changeHousing(housingId: string): Promise<{ citizen: Citizen } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/game/housing/`, {
        method: 'POST',
        body: JSON.stringify({ housing_id: housingId }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCourses(): Promise<Course[] | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/campus/courses/`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async completeCourse(courseKey: string): Promise<{ citizen: Citizen; xpAwarded: number; levelUp: boolean } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/campus/courses/${courseKey}/complete/`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getJobs(): Promise<Job[] | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/business/jobs/`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async hireJob(jobKey: string): Promise<{ citizen: Citizen; levelUp: boolean } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/business/jobs/${jobKey}/hire/`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async workShift(): Promise<{ citizen: Citizen; salaryEarned: number; transaction: Transaction; levelUp: boolean } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/business/work_shift/`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async depositSavings(amount: number): Promise<{ citizen: Citizen; transaction: Transaction } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/finance/deposit/`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async withdrawSavings(amount: number): Promise<{ citizen: Citizen; transaction: Transaction } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/finance/withdraw/`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getProperties(): Promise<Housing[] | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/residential/properties/`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async resolveDilemma(optionId: string, dilemmaKey = 'dilemma-broken-laptop'): Promise<{ citizen: Citizen; message: string } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/dilemmas/resolve/`, {
        method: 'POST',
        body: JSON.stringify({ dilemma_key: dilemmaKey, option_id: optionId }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async resetGame(preset: 'demo' | 'new'): Promise<GameStateResponse | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/game/reset/`, {
        method: 'POST',
        body: JSON.stringify({ preset }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async customizeCharacter(payload: CharacterCustomizationPayload): Promise<{ citizen: Citizen; message: string; transactions: Transaction[] } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/character/customize/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getMarketItems(category?: string): Promise<MarketItem[] | null> {
    try {
      const url = category
        ? `${API_BASE_URL}/market/items/?category=${encodeURIComponent(category)}`
        : `${API_BASE_URL}/market/items/`;
      const res = await fetchAuth(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async buyMarketItem(itemKey: string): Promise<{ citizen: Citizen; transaction: Transaction; item: MarketItem; message: string } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/market/buy/`, {
        method: 'POST',
        body: JSON.stringify({ itemKey }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async simulateInterview(jobKey: string, answerIndex: number): Promise<{ citizen: Citizen; result: InterviewResult } | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/business/jobs/${jobKey}/interview/`, {
        method: 'POST',
        body: JSON.stringify({ answerIndex }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        citizen: data.citizen,
        result: data as InterviewResult,
      };
    } catch {
      return null;
    }
  },

  // --- STARTUP DISTRICT (§12, §24) ---
  async getStartupProjects(): Promise<StartupProject[] | null> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/startup/projects/`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createStartupProject(payload: { name: string; sector: string; pitch: string; initialCapital?: number }): Promise<{ project: StartupProject; citizen: Citizen; transaction: Transaction; levelUp?: boolean; message: string } | { error: string }> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/startup/create/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Erreur lors de la création de la startup.' };
      }
      return data;
    } catch {
      return { error: 'Impossible de joindre le serveur Youth City.' };
    }
  },

  async advanceStartupAction(projectKey: string, actionType: StartupActionType, role?: string): Promise<{ project: StartupProject; citizen: Citizen; levelUp?: boolean; message: string } | { error: string }> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/startup/${projectKey}/action/`, {
        method: 'POST',
        body: JSON.stringify({ actionType, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Action impossible à exécuter.' };
      }
      return data;
    } catch {
      return { error: 'Impossible de joindre le serveur Youth City.' };
    }
  },

  async claimIncubatorGrant(projectKey: string): Promise<{ project: StartupProject; citizen: Citizen; levelUp?: boolean; message: string } | { error: string }> {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/startup/${projectKey}/grant/`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Subvention non éligible.' };
      }
      return data;
    } catch {
      return { error: 'Impossible de joindre le serveur Youth City.' };
    }
  },
};

