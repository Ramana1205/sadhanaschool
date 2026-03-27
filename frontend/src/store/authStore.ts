import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  token?: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, token?: string | null, user?: User | null) => boolean;
  logout: () => void;
}

const DEMO_CREDENTIALS: Record<string, { password: string; role: UserRole; name: string }> = {
  Sadhana: { password: 'Sadhana@School@04', role: 'admin', name: 'Sadhana Administrator' },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (username: string, password: string, token?: string | null, user?: User | null) => {
        if (token && user) {
          set({
            user,
            token,
            isAuthenticated: true,
          });
          return true;
        }

        const normalizedUser = username.trim();
        const normalizedPass = password.trim();
        const cred = DEMO_CREDENTIALS[normalizedUser];

        if (cred && cred.password === normalizedPass) {
          set({
            user: { username: normalizedUser, role: cred.role, name: cred.name },
            token: 'demo-token',
            isAuthenticated: true,
          });
          return true;
        }

        return false;
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
