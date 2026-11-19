import { create } from 'zustand';
import { setUnauthorizedHandler } from '../services/api';
import type { GameState } from './types';
import { createUiSlice } from './slices/ui';
import { createAuthSlice } from './slices/auth';
import { createCitizenSlice } from './slices/citizen';
import { createDilemmaSlice } from './slices/dilemma';
import { createCareerSlice } from './slices/career';
import { createCampusSlice } from './slices/campus';
import { createMarketSlice } from './slices/market';
import { createStartupSlice } from './slices/startup';
import { createHubSlice } from './slices/hub';
import { createAdminSlice } from './slices/admin';

export type { TabId } from './slices/ui';

/**
 * Store unique, composé de slices par domaine (voir ./slices).
 * Règle d'autorité : le serveur décide de tout ; sans compte, l'app est une vitrine en lecture seule.
 */
export const useGameStore = create<GameState>()((...a) => ({
  ...createUiSlice(...a),
  ...createAuthSlice(...a),
  ...createCitizenSlice(...a),
  ...createDilemmaSlice(...a),
  ...createCareerSlice(...a),
  ...createCampusSlice(...a),
  ...createMarketSlice(...a),
  ...createStartupSlice(...a),
  ...createHubSlice(...a),
  ...createAdminSlice(...a),
}));

// Requête refusée faute de session (401) : on propose de se connecter plutôt que d'échouer en silence.
setUnauthorizedHandler(() => {
  const state = useGameStore.getState();
  if (!state.isAuthenticated && !state.isAuthModalOpen) {
    state.toggleAuthModal(true, 'login');
  }
});
