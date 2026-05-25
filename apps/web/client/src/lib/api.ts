import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getMockResponse, DEV_BYPASS_TOKEN } from '@naqla/shared-utils';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL: `${API_URL}/api`, withCredentials: true });

api.interceptors.request.use((c) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('naqla_client_token');
    // Skip attaching the dev-bypass token — it's a literal string, not a real
    // JWT, so the API's auth guard rejects it with "session invalid". Letting
    // the request go through unauthenticated lets the API respond with a
    // proper 401 that our response interceptor turns into a re-login.
    if (token && token !== DEV_BYPASS_TOKEN) {
      c.headers.Authorization = `Bearer ${token}`;
    }
  }
  return c;
});

/**
 * On a real 401 (expired/invalid JWT), tear down stale credentials and bounce
 * the user to /login. Otherwise the user stays stuck in a dashboard where
 * every request fails silently.
 */
function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('naqla_client_token');
    localStorage.removeItem('naqla_client_refresh');
    localStorage.removeItem('naqla-client-auth'); // Zustand persist key
  } catch { /* ignore */ }
  // Only redirect if we're not already on /login (avoid infinite loops)
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

// ⚠️ Mock fallback — ONLY for safe GET requests. We deliberately do NOT mask
// failures of mutations (POST/PUT/DELETE/PATCH): if creating an order fails,
// the user MUST see the real error — silently returning a mock "success"
// would let them think they created an order that's actually never persisted.
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
        ? localStorage.getItem('naqla_client_refresh')
        : null;
      if (refreshToken && refreshToken !== DEV_BYPASS_TOKEN && !config._retry) {
        config._retry = true;
        try {
          const r = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const data = r.data?.data;
          if (data?.accessToken) {
            localStorage.setItem('naqla_client_token', data.accessToken);
            localStorage.setItem('naqla_client_refresh', data.refreshToken);
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
        return Promise.reject(new Error(
          `الـ API غير متاح على ${API_URL}. تأكّد أن الـ backend شغّال (pnpm dev).`,
        ));
      }
      const status = err.response.status;
      const responseData = err.response.data as { error?: { message?: string }; message?: string } | undefined;
      const msg =
        responseData?.error?.message ??
        responseData?.message ??
        `الخادم رفض الطلب (HTTP ${status})`;
      const augmented = new Error(msg) as Error & { status?: number; response?: typeof err.response };
      augmented.status = status;
      augmented.response = err.response;
      return Promise.reject(augmented);
    }

    // GET requests — safe to mock-fallback. Demo mode + offline use stays usable.
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
