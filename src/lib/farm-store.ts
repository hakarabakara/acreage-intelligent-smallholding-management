import { create } from 'zustand';
import { api } from '@/lib/api-client';
import type { FarmSettings } from '@shared/types';
interface FarmStore {
  settings: FarmSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<FarmSettings>) => Promise<void>;
}
export const useFarmStore = create<FarmStore>((set) => ({
  settings: null,
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await api<FarmSettings>('/api/settings/farm');
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch farm settings', error);
      set({ isLoading: false });
    }
  },
  updateSettings: async (updates) => {
    set({ isLoading: true });
    try {
      const updated = await api<FarmSettings>('/api/settings/farm', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      set({ settings: updated, isLoading: false });
    } catch (error) {
      console.error('Failed to update farm settings', error);
      set({ isLoading: false });
      throw error;
    }
  }
}));