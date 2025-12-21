import { create } from 'zustand';
interface QuickEntryState {
  isHarvestOpen: boolean;
  isTaskOpen: boolean;
  isWeatherOpen: boolean;
  openHarvest: () => void;
  closeHarvest: () => void;
  openTask: () => void;
  closeTask: () => void;
  openWeather: () => void;
  closeWeather: () => void;
}
export const useQuickEntry = create<QuickEntryState>((set) => ({
  isHarvestOpen: false,
  isTaskOpen: false,
  isWeatherOpen: false,
  openHarvest: () => set({ isHarvestOpen: true, isTaskOpen: false, isWeatherOpen: false }),
  closeHarvest: () => set({ isHarvestOpen: false }),
  openTask: () => set({ isTaskOpen: true, isHarvestOpen: false, isWeatherOpen: false }),
  closeTask: () => set({ isTaskOpen: false }),
  openWeather: () => set({ isWeatherOpen: true, isHarvestOpen: false, isTaskOpen: false }),
  closeWeather: () => set({ isWeatherOpen: false }),
}));