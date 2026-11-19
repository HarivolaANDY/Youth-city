import type { Slice, ActionResult } from '../types';
import { api, getLastApiError } from '../../services/api';
import { failure, requireAuth } from '../helpers';

export interface MarketSlice {
  buyMarketItem: (itemKey: string) => Promise<ActionResult>;
}

export const createMarketSlice: Slice<MarketSlice> = (_set, get) => ({
  buyMarketItem: async (itemKey) => {
    if (!requireAuth(get)) return { success: false, error: 'Connexion requise.' };
    const res = await api.buyMarketItem(itemKey);
    if (!res?.citizen) return failure(get, 'Achat refusé', getLastApiError() || 'Achat impossible pour le moment.');
    get().applyServerCitizen(res.citizen, res.transaction);
    get().addNotification(res.item?.isConsumable ? 'Vitalité restaurée !' : 'Équipement acquis !', res.message, 'success');
    return { success: true };
  },
});
