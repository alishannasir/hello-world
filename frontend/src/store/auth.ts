import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Sessions are remembered for 24 hours, then the user is logged out. */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  genderChangeCount?: number;
  country?: string | null;
  currentStreak: number;
  trialEndsAt: string;
  creditCents: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  /** Epoch ms when the current session expires (24h after login). */
  expiresAt: number | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      expiresAt: null,
      setToken: (token) =>
        set({ token, expiresAt: token ? Date.now() + SESSION_TTL_MS : null }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, expiresAt: null }),
    }),
    { name: 'ovc-auth' },
  ),
);
