'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

export interface AuthUser {
  id: string; phone: string; email: string | null;
  firstName: string; lastName: string; role: string; companyId: string | null;
}
interface AuthState {
  user: AuthUser | null;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (phoneOrEmail, password) => {
        const r = await api.post('/auth/login', { phoneOrEmail, password });
        const d = r.data?.data;
        localStorage.setItem('naqla_carrier_token', d.accessToken);
        localStorage.setItem('naqla_carrier_refresh', d.refreshToken);
        set({ user: d.user });
      },
      logout: async () => {
        const rt = localStorage.getItem('naqla_carrier_refresh');
        if (rt) { try { await api.post('/auth/logout', { refreshToken: rt }); } catch {} }
        localStorage.removeItem('naqla_carrier_token');
        localStorage.removeItem('naqla_carrier_refresh');
        set({ user: null });
      },
    }),
    { name: 'naqla-carrier-auth' },
  ),
);
