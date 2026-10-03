import type {
  Citizen,
  Transaction,
  Dilemma,
  Course,
  Job,
  Housing,
  AuthUser,
  AuthResponse,
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
      const res = await fetch(`${API_BASE_URL}/auth/me/`, {
        headers: getHeaders(),
      });
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
      const res = await fetch(`${API_BASE_URL}/game/state/`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async advanceTime(): Promise<{ day: number; timeSlot: string; energy: number; citizen: Citizen } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/game/advance_time/`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async restAndSleep(): Promise<{ energy: number; citizen: Citizen } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/game/sleep/`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async changeHousing(housingId: string): Promise<{ citizen: Citizen } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/game/housing/`, {
        method: 'POST',
        headers: getHeaders(),
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
      const res = await fetch(`${API_BASE_URL}/campus/courses/`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async completeCourse(courseKey: string): Promise<{ citizen: Citizen; xpAwarded: number; levelUp: boolean } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/campus/courses/${courseKey}/complete/`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getJobs(): Promise<Job[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/business/jobs/`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async hireJob(jobKey: string): Promise<{ citizen: Citizen; levelUp: boolean } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/business/jobs/${jobKey}/hire/`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async workShift(): Promise<{ citizen: Citizen; salaryEarned: number; transaction: Transaction; levelUp: boolean } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/business/work_shift/`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async depositSavings(amount: number): Promise<{ citizen: Citizen; transaction: Transaction } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/deposit/`, {
        method: 'POST',
        headers: getHeaders(),
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
      const res = await fetch(`${API_BASE_URL}/finance/withdraw/`, {
        method: 'POST',
        headers: getHeaders(),
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
      const res = await fetch(`${API_BASE_URL}/residential/properties/`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async resolveDilemma(optionId: string, dilemmaKey = 'dilemma-broken-laptop'): Promise<{ citizen: Citizen; message: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/dilemmas/resolve/`, {
        method: 'POST',
        headers: getHeaders(),
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
      const res = await fetch(`${API_BASE_URL}/game/reset/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ preset }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
