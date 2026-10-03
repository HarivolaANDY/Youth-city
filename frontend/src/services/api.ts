import type { Citizen, Transaction, Dilemma, Course, Job, Housing } from '../types/game';

const API_BASE_URL = 'http://localhost:8000/api';

export interface GameStateResponse {
  citizen: Citizen;
  day: number;
  timeSlot: string;
  transactions: Transaction[];
  activeDilemma: Dilemma | null;
}

export const api = {
  async getGameState(): Promise<GameStateResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/game/state/`);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_BASE_URL}/campus/courses/`);
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
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getJobs(): Promise<Job[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/business/jobs/`);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_BASE_URL}/residential/properties/`);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
