import { create } from 'zustand';
interface QuickEntryState {
  isHarvestOpen: boolean;
  isTaskOpen: boolean;
  isWeatherOpen: boolean;
  isNoteOpen: boolean;
  openHarvest: () => void;
  closeHarvest: () => void;
  openTask: () => void;
  closeTask: () => void;
  openWeather: () => void;
  closeWeather: () => void;
  openNote: () => void;
  closeNote: () => void;
}
export const useQuickEntry = create<QuickEntryState>((set) => ({
  isHarvestOpen: false,
  isTaskOpen: false,
  isWeatherOpen: false,
  isNoteOpen: false,
  openHarvest: () => set({ isHarvestOpen: true, isTaskOpen: false, isWeatherOpen: false, isNoteOpen: false }),
  closeHarvest: () => set({ isHarvestOpen: false }),
  openTask: () => set({ isTaskOpen: true, isHarvestOpen: false, isWeatherOpen: false, isNoteOpen: false }),
  closeTask: () => set({ isTaskOpen: false }),
  openWeather: () => set({ isWeatherOpen: true, isHarvestOpen: false, isTaskOpen: false, isNoteOpen: false }),
  closeWeather: () => set({ isWeatherOpen: false }),
  openNote: () => set({ isNoteOpen: true, isHarvestOpen: false, isTaskOpen: false, isWeatherOpen: false }),
  closeNote: () => set({ isNoteOpen: false }),
}));