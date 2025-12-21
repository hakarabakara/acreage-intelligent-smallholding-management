import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker' | 'viewer';
  avatar?: string;
  phone?: string;
}
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}
// Mock user data for the demo
const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Farmer John',
  email: 'john@acreage.app',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  phone: '(555) 123-4567'
};
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        // In a real app, we would validate credentials here
        // For this demo, we just set the mock user but use the provided email
        set({
          user: { ...MOCK_USER, email },
          isAuthenticated: true,
        });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'acreage-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);