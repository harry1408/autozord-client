import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (token: string, user: User, refreshToken?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      // refreshToken is optional so a plain access-token refresh (which
      // doesn't get a new user object either) can update just the access
      // token without clobbering the persisted refresh token.
      setTokens: (token, user, refreshToken) =>
        set({ accessToken: token, user, isAuthenticated: true, refreshToken: refreshToken ?? get().refreshToken }),
      // Refreshes the stored user (e.g. shopStatus) without touching tokens -
      // used on mount so a freshly-verified shop's lock overlay clears without
      // requiring a re-login.
      setUser: (user) => set({ user }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'autozord-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
