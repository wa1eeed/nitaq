'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Eye, EyeOff, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEV_USERS, DEV_BYPASS_TOKEN } from '@naqla/shared-utils';
import { useAuthStore } from '@/lib/auth-store';

export default function CarrierLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('carrier@naqla.sa');
  const [password, setPassword] = useState('Carrier@1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Real auth — POSTs to /api/auth/login, stores accessToken + refreshToken.
      await useAuthStore.getState().login(identifier, password);
      router.push('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string }, message?: string } }, message?: string };
      // API unreachable → dev-bypass fallback (UI demo only, no persistence).
      if (!e.response) {
        localStorage.setItem('naqla_carrier_token', DEV_BYPASS_TOKEN);
        localStorage.setItem('naqla_carrier_refresh', DEV_BYPASS_TOKEN);
        useAuthStore.setState({ user: { ...DEV_USERS.carrier, avatar: null } as never });
        router.push('/');
        return;
      }
      setError(e.response?.data?.error?.message ?? e.response?.data?.message ?? e.message ?? 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel (desktop only) ─────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[440px] xl:w-[520px] shrink-0 flex-col justify-between p-10"
        style={{ background: 'linear-gradient(160deg, #0A3D3A 0%, #0D5C57 55%, #00C9A7 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">نقلة لوجيستك</div>
            <div className="text-xs text-white/60">منصة الناقل</div>
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-3xl font-bold text-white leading-snug">
              وسّع نطاق أعمالك<br />مع نقلة
            </h2>
            <p className="mt-3 text-white/70 text-sm leading-relaxed">
              منصة رقمية لشركات النقل في المملكة
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { icon: CheckCircle, text: 'فرص نقل يومية من العملاء' },
              { icon: CheckCircle, text: 'إدارة الأسطول والسائقين' },
              { icon: CheckCircle, text: 'مدفوعات آمنة ومضمونة' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <Icon className="h-5 w-5 text-white/80 shrink-0" />
                <span className="text-white/90 text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="text-xs text-white/40">© 2026 نقلة لوجيستك · جميع الحقوق محفوظة</div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/20">
        <motion.div
          className="w-full max-w-md space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Mobile logo (only shown on small screens) */}
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Truck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">نقلة لوجيستك</h1>
            <p className="text-sm text-muted-foreground">منصة الناقل · فرص نقل + إدارة أسطول</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">أهلاً بعودتك</CardTitle>
              <CardDescription>سجّل دخولك للمتابعة إلى منصة الناقل</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">البريد الإلكتروني أو رقم الجوال</Label>
                  <Input
                    id="identifier"
                    type="text"
                    dir="ltr"
                    className="text-end"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="carrier@naqla.sa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <a href="#" className="text-xs text-primary hover:underline">نسيت كلمة المرور؟</a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pe-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
                </Button>

                <div className="relative pt-2">
                  <div className="absolute inset-x-0 top-1/2 border-t border-border" />
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground">ناقل جديد؟</span>
                  </div>
                </div>

                <Link href="/register" className="block">
                  <Button type="button" variant="outline" className="w-full" size="lg">
                    انضم كشركة نقل
                  </Button>
                </Link>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
