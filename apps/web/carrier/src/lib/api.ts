import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getMockResponse, DEV_BYPASS_TOKEN } from '@naqla/shared-utils';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL: `${API_URL}/api`, withCredentials: true });

api.interceptors.request.use((c) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('naqla_carrier_token');
    // Don't attach DEV_BYPASS_TOKEN — it's a literal string, not a real JWT;
    // letting it go unauthenticated lets the API return a proper 401 that
    // our response interceptor handles by clearing the bad token + redirect.
    if (token && token !== DEV_BYPASS_TOKEN) {
      c.headers.Authorization = `Bearer ${token}`;
    }
  }
  return c;
});

function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('naqla_carrier_token');
    localStorage.removeItem('naqla_carrier_refresh');
    localStorage.removeItem('naqla-carrier-auth');
  } catch { /* ignore */ }
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

// Mock fallback — GETs only. Mutations must surface real errors so a
// failed bid/order creation doesn't pretend to succeed via mock data.
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const config = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = config?.url ?? '';
    const method = (config?.method ?? 'get').toLowerCase();
    const isMutation = method !== 'get';
    const isAuthEndpoint = url.includes('/auth/');

    // 401 on a non-auth endpoint — try refresh before giving up.
    if (err.response?.status === 401 && !isAuthEndpoint) {
      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('naqla_carrier_refresh')
        : null;
      if (refreshToken && refreshToken !== DEV_BYPASS_TOKEN && !config._retry) {
        config._retry = true;
        try {
          const r = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const data = r.data?.data;
          if (data?.accessToken) {
            localStorage.setItem('naqla_carrier_token', data.accessToken);
            localStorage.setItem('naqla_carrier_refresh', data.refreshToken);
            config.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(config);
          }
        } catch { /* fall through to clearAuthAndRedirect */ }
      }
      clearAuthAndRedirect();
      return Promise.reject(new Error('الجلسة منتهية — يُعاد توجيهك لصفحة الدخول'));
    }

    if (isMutation) {
      if (!err.response) {
        return Promise.reject(new Error(`الـ API غير متاح على ${API_URL}. تأكّد أن الـ backend شغّال.`));
      }
      const status = err.response.status;
      const responseData = err.response.data as { error?: { message?: string }; message?: string } | undefined;
      const msg = responseData?.error?.message ?? responseData?.message ?? `الخادم رفض الطلب (HTTP ${status})`;
      const augmented = new Error(msg) as Error & { status?: number; response?: typeof err.response };
      augmented.status = status;
      augmented.response = err.response;
      return Promise.reject(augmented);
    }

    const mock = getMockResponse(url);
    if (mock !== null) {
      // eslint-disable-next-line no-console
      console.warn(
        `[mock] ${method.toUpperCase()} ${url} (${err.response?.status ?? 'offline'})`,
      );
      return Promise.resolve({
        data: { success: true, data: mock },
        status: 200,
        statusText: 'OK (mock)',
        headers: {},
        config,
      });
    }
    return Promise.reject(err);
  },
);

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await api.get(url);
  return res.data?.data as T;
}

export { DEV_BYPASS_TOKEN };
