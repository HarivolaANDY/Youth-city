import type { DistrictId, ToastNotification } from '../../types/game';
import type { Slice } from '../types';

export type TabId =
  | 'dashboard' | 'map' | 'campus' | 'career' | 'market'
  | 'finance' | 'residential' | 'passport' | 'startup' | 'cityhub';

const DISTRICT_TAB: Partial<Record<DistrictId, TabId>> = {
  campus: 'campus',
  business: 'career',
  finance: 'finance',
  residential: 'residential',
  market: 'market',
  startup: 'startup',
  cityhub: 'cityhub',
};

export interface UiSlice {
  activeTab: TabId;
  selectedDistrictId: DistrictId | null;
  isNovaModalOpen: boolean;
  notifications: ToastNotification[];
  setActiveTab: (tab: TabId) => void;
  selectDistrict: (id: DistrictId | null) => void;
  toggleNovaModal: (open?: boolean) => void;
  addNotification: (title: string, message: string, type?: ToastNotification['type']) => void;
  removeNotification: (id: string) => void;
}

export const createUiSlice: Slice<UiSlice> = (set, get) => ({
  activeTab: 'dashboard',
  selectedDistrictId: null,
  isNovaModalOpen: false,
  notifications: [
    { id: 'notif-1', title: 'Bienvenue sur Youth City !', message: 'Explore la carte et découvre les opportunités du Campus.', type: 'info' },
  ],

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    if (!get().isAuthenticated) return;
    if (tab === 'passport') void get().fetchCareerPassport();
    else if (tab === 'career') void get().fetchFreelanceGigs();
  },

  selectDistrict: (id) => {
    const tab = id ? DISTRICT_TAB[id] : undefined;
    set(tab ? { selectedDistrictId: id, activeTab: tab } : { selectedDistrictId: id });
  },

  toggleNovaModal: (open) => set((s) => ({ isNovaModalOpen: open ?? !s.isNovaModalOpen })),

  addNotification: (title, message, type = 'info') => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    set((s) => ({ notifications: [{ id, title, message, type }, ...s.notifications].slice(0, 5) }));
    setTimeout(() => get().removeNotification(id), 5000);
  },

  removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
});
