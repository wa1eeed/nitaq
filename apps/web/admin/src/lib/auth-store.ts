'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string | null;
}

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (u: AuthUser | null) => void;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setUser: (user) => set({ user }),
      login: async (emailInput, password) => {
        // Admin has a dedicated endpoint (`/admin/auth/login`) with email-only
        // (no phone) auth and stricter throttling (5 attempts / 30 min). The
        // DTO expects `{ email, password }` — not `phoneOrEmail`.
        const res = await api.post('/admin/auth/login', { email: emailInput, password });
        const data = res.data?.data;
        localStorage.setItem('nitaq_access_token', data.accessToken);
        localStorage.setItem('nitaq_refresh_token', data.refreshToken);
        set({ user: data.user });
      },
      logout: async () => {
        const rt = localStorage.getItem('nitaq_refresh_token');
        // Admin uses its own logout endpoint (audit log includes admin role)
        if (rt) {
          try { await api.post('/admin/auth/logout', {}); } catch {}
        }
        localStorage.removeItem('nitaq_access_token');
        localStorage.removeItem('nitaq_refresh_token');
        set({ user: null });
      },
      fetchMe: async () => {
        try {
          const res = await api.get('/users/me');
          set({ user: res.data?.data });
        } catch {
          set({ user: null });
        }
      },
    }),
    {
      name: 'nitaq-admin-auth',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setUser(state.user ?? null);
        (state as any).hydrated = true;
      },
    },
  ),
);
