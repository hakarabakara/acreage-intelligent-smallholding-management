import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
interface ScratchpadState {
  content: string;
  setContent: (content: string) => void;
  appendNote: (note: string) => void;
}
export const useScratchpadStore = create<ScratchpadState>()(
  persist(
    (set) => ({
      content: '',
      setContent: (content) => set({ content }),
      appendNote: (note) => set((state) => {
        const timestamp = new Date().toLocaleString();
        const newEntry = `[${timestamp}] ${note}`;
        return {
          content: state.content ? `${state.content}\n\n${newEntry}` : newEntry
        };
      }),
    }),
    {
      name: 'acreage-scratchpad-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);