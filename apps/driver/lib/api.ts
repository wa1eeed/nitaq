import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE = 'https://api.nqlah.nx.sa/api';

export const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('naqla_driver_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as typeof err.config & { _retry?: boolean };
    if (err.response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync('naqla_driver_refresh');
        if (refresh) {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: refresh });
          const tokens = data?.data;
          if (tokens?.accessToken) {
            await SecureStore.setItemAsync('naqla_driver_token',   tokens.accessToken);
            await SecureStore.setItemAsync('naqla_driver_refresh', tokens.refreshToken);
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return api(config);
          }
        }
      } catch {}
      await SecureStore.deleteItemAsync('naqla_driver_token');
      await SecureStore.deleteItemAsync('naqla_driver_refresh');
      await SecureStore.deleteItemAsync('naqla_driver_user');
    }
    return Promise.reject(err);
  },
);

export const fetcher = async <T>(url: string): Promise<T> => {
  const { data } = await api.get<{ data: T }>(url);
  // API wraps responses in { success, data } or { success, data, meta }
  return (data as any).data ?? data;
};

export const apiError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data;
    // { success: false, error: { message } }  ← API shape
    const errObj = d?.error;
    if (errObj?.message && typeof errObj.message === 'string') return errObj.message;
    // fallback: flat { message } or validation array
    const msg = d?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg[0];
    // network / timeout
    if (!err.response) return 'تعذّر الاتصال بالخادم، تحقق من الإنترنت';
  }
  if (err instanceof Error) return err.message;
  return 'حدث خطأ غير متوقع';
};
