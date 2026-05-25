import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api, apiError } from './api';

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  companyId: string | null;
};

// ─── DEV BYPASS ─────────────────────────────────────────────────────────────
// Set to 'carrier' | 'driver' | null to skip login during UI development.
// Change back to null before production.
const DEV_USER: AuthUser | null = {
  id: 'dev-001',
  firstName: 'سلطان',
  lastName: 'القحطاني',
  phone: '+966500000003',
  role: 'CARRIER_ADMIN',
  companyId: 'dev-company-001',
};
// ─────────────────────────────────────────────────────────────────────────────

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  boot: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  boot: async () => {
    if (__DEV__ && DEV_USER) {
      set({ user: DEV_USER, isLoading: false });
      return;
    }
    try {
      const token = await SecureStore.getItemAsync('naqla_driver_token');
      if (!token) { set({ isLoading: false }); return; }
      const raw = await SecureStore.getItemAsync('naqla_driver_user');
      if (raw) set({ user: JSON.parse(raw) });
    } catch {}
    set({ isLoading: false });
  },

  login: async (phoneOrEmail, password) => {
    const { data } = await api.post('/auth/login', { phoneOrEmail, password });
    const payload = data?.data;
    if (!payload?.accessToken) throw new Error('استجابة غير صالحة من الخادم');
    await SecureStore.setItemAsync('naqla_driver_token',   payload.accessToken);
    await SecureStore.setItemAsync('naqla_driver_refresh', payload.refreshToken);
    await SecureStore.setItemAsync('naqla_driver_user',    JSON.stringify(payload.user));
    set({ user: payload.user });
  },

  logout: async () => {
    try {
      const refresh = await SecureStore.getItemAsync('naqla_driver_refresh');
      if (refresh) await api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
    } finally {
      await SecureStore.deleteItemAsync('naqla_driver_token');
      await SecureStore.deleteItemAsync('naqla_driver_refresh');
      await SecureStore.deleteItemAsync('naqla_driver_user');
      set({ user: null });
    }
  },
}));
