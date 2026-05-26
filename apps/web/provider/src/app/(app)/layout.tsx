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
    const token = localStorage.getItem('naqla_carrier_token');
    // DEV_BYPASS_TOKEN is treated as "not logged in" — API rejects it anyway.
    if (!token || token === DEV_BYPASS_TOKEN) {
      try {
        localStorage.removeItem('naqla_carrier_token');
        localStorage.removeItem('naqla_carrier_refresh');
        localStorage.removeItem('naqla-carrier-auth');
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
