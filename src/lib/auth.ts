import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from './api-client';
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker' | 'viewer';
  avatar?: string;
  phone?: string;
  // Extended Staff Management Fields
  leaveRecords?: any[];
  identification?: any;
  nextOfKin?: any;
  hourlyRate?: number;
  startDate?: number;
  skills?: string[];
  interests?: string[];
  employmentType?: 'long-term' | 'short-term' | 'seasonal';
  paymentMethods?: any[];
  bonuses?: any[];
}
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  changePassword: (current: string, newPass: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password?: string) => {
        try {
          const user = await api<UserProfile>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login failed:', error);
          // Re-throw the error so the UI can catch it and display the message
          throw error;
        }
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      changePassword: async (current: string, newPass: string) => {
        const user = get().user;
        if (!user?.email) return false;
        try {
          await api('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
              email: user.email,
              currentPassword: current,
              newPassword: newPass
            })
          });
          return true;
        } catch (error) {
          console.error('Password change failed:', error);
          return false;
        }
      },
      refreshProfile: async () => {
        const currentUser = get().user;
        if (!currentUser?.id) return;
        try {
          const refreshedUser = await api<UserProfile>(`/api/users/${currentUser.id}`);
          set({ user: refreshedUser });
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      }
    }),
    {
      name: 'acreage-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);