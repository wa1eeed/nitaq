'use client';
import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

/**
 * `/join?token=xxx` — activation page hit from the SMS invitation link.
 *
 * UI-first implementation: the token + member info are pulled from the URL
 * (in prod they'd be fetched from `/api/team/invitation/:token` to verify
 * validity and pre-fill the form). Submitting "activates" the account in
 * memory and redirects to login. Replace the mock submit with a real API
 * call when the backend endpoint is wired.
 */
export default function CarrierJoinPage() {
  return (
    <Suspense fallback={<JoinFallback />}>
      <JoinForm />
    </Suspense>
  );
}

function JoinFallback() {
  return (
    <div className="min-h-screen bg-muted/30 grid place-items-center">
      <div className="text-sm text-muted-foreground">...</div>
    </div>
  );
}

function JoinForm() {
  const t = useTranslations('auth.join');
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  // In production these come from the API after validating the token.
  // For now we read display hints from the URL for the demo.
  const companyName = params.get('company') ?? 'شركة المسار السريع للنقل';
  const memberName = params.get('name') ?? '';
  const roleName = params.get('role') ?? 'STAFF';

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) { setError(t('passwordTooShort')); return; }
    if (pw !== pw2)    { setError(t('passwordMismatch')); return; }
    setLoading(true);
    try {
      // TODO: replace with `await api.post('/auth/activate', { token, password: pw })`.
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Missing token = invalid link.
  if (!token) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-lg">{t('tokenMissing')}</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl mt-3">{t('successTitle')}</CardTitle>
            <CardDescription>{t('successSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/login">
              <Button size="lg">{t('goToLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit gap-1">
            <ShieldCheck className="h-3 w-3" />
            {t('invitedBy')} · {companyName}
          </Badge>
          <CardTitle className="text-xl">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle', { companyName })}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {memberName && (
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                <div className="text-muted-foreground text-xs">{t('memberName')}</div>
                <div className="font-medium">{memberName}</div>
              </div>
            )}

            <div className="rounded-md bg-muted/40 p-3 text-sm">
              <div className="text-muted-foreground text-xs">{t('yourRole')}</div>
              <div className="font-medium">{roleName}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pw">{t('newPassword')}</Label>
              <div className="relative">
                <Input
                  id="pw"
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="pe-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pw2">{t('confirmPassword')}</Label>
              <Input
                id="pw2"
                type={showPw ? 'text' : 'password'}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t('activating') : t('activate')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">نقلة لوجيستك</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
