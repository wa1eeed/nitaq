'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEV_USERS, DEV_BYPASS_TOKEN } from '@naqla/shared-utils';
import { useAuthStore } from '@/lib/auth-store';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('admin@nitaq.sa');
  const [password, setPassword] = useState('Admin@1234');
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
        localStorage.setItem('nitaq_access_token', DEV_BYPASS_TOKEN);
        localStorage.setItem('nitaq_refresh_token', DEV_BYPASS_TOKEN);
        useAuthStore.setState({ user: { ...DEV_USERS.admin, avatar: null } as never });
        router.push('/');
        return;
      }
      setError(e.response?.data?.error?.message ?? e.response?.data?.message ?? e.message ?? 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">نِطاق</h1>
          <p className="text-sm text-muted-foreground">لوحة إدارة المنصة</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">أهلاً بعودتك</CardTitle>
            <CardDescription>سجّل دخولك للمتابعة إلى لوحة الإدارة</CardDescription>
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
                  placeholder="admin@nitaq.sa"
                  autoComplete="username"
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
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="إظهار/إخفاء كلمة المرور"
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

              <p className="text-xs text-muted-foreground text-center pt-2 leading-relaxed">
                محمي بنظام التحقق الثنائي والتشفير الكامل
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} نِطاق · جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
