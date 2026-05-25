'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopbar } from '@/components/app-topbar';
import { DEV_BYPASS_TOKEN } from '@naqla/shared-utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('naqla_client_token');
    // A bare DEV_BYPASS_TOKEN is treated as "not logged in" here too — the API
    // would reject every request anyway, so sending the user straight to
    // /login is better than letting the dashboard load + crash on 401.
    if (!token || token === DEV_BYPASS_TOKEN) {
      // Clear stale state proactively so re-login uses a clean slate.
      try {
        localStorage.removeItem('naqla_client_token');
        localStorage.removeItem('naqla_client_refresh');
        localStorage.removeItem('naqla-client-auth');
      } catch { /* ignore */ }
      router.replace('/login');
      setAuthed(false);
      return;
    }
    setAuthed(true);
  }, [router]);

  if (authed !== true) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">جارٍ التحويل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AppTopbar />
        <main className="flex-1 p-4 lg:p-6 space-y-6">
          <div className="max-w-[1400px] mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
