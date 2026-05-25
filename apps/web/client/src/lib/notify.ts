/**
 * Thin wrapper around sonner so every page imports a single helper instead of
 * remembering the toast API. Also normalizes our error format — many of our
 * API calls throw `Error` objects whose message field already contains the
 * Arabic phrase from the backend, so `notify.error(err)` Just Works.
 */
import { toast } from 'sonner';

export const notify = {
  success(message: string, description?: string) {
    toast.success(message, { description });
  },
  error(err: unknown, fallback = 'حدث خطأ') {
    const msg = err instanceof Error ? err.message : (typeof err === 'string' ? err : fallback);
    toast.error(msg || fallback);
  },
  info(message: string, description?: string) {
    toast.info(message, { description });
  },
  async promise<T>(
    p: Promise<T>,
    opts: { loading: string; success: string; error?: string },
  ): Promise<T> {
    toast.promise(p, opts);
    return p;
  },
};
