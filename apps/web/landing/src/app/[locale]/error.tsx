'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/page-shell';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Landing error:', error);
  }, [error]);

  return (
    <PageShell>
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="h-24 w-24 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto mb-6">
            <AlertOctagon className="h-12 w-12" />
          </div>
          <h1 className="text-6xl font-bold tracking-tight num mb-2">500</h1>
          <h2 className="text-xl font-semibold mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            نعتذر، حدث خلل في الموقع. حاول مرة أخرى أو تواصل معنا.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono mb-4">
              معرّف الخطأ: <code className="bg-muted px-1.5 py-0.5 rounded">{error.digest}</code>
            </p>
          )}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
            <Button onClick={reset}>
              <RefreshCcw className="h-4 w-4" /> إعادة المحاولة
            </Button>
            <Button variant="outline" asChild>
              <Link href="/"><Home className="h-4 w-4" /> الرئيسية</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
