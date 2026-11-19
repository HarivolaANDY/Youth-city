import confetti from 'canvas-confetti';
import type { ActionResult, GameState } from './types';

export const celebrate = (particleCount = 75, spread = 60): void => {
  try {
    confetti({ particleCount, spread, origin: { y: 0.6 } });
  } catch {
    // Les confettis sont décoratifs : jamais bloquants.
  }
};

/**
 * Le serveur fait autorité : sans compte, la ville se visite en lecture seule (ARC-02).
 * Toute action qui modifie l'état passe par cette garde, qui propose de se connecter.
 */
export const requireAuth = (get: () => GameState): boolean => {
  const state = get();
  if (state.isAuthenticated) return true;
  state.toggleAuthModal(true, 'login');
  return false;
};

export const failure = (get: () => GameState, title: string, error: string): ActionResult => {
  get().addNotification(title, error, 'warning');
  return { success: false, error };
};
