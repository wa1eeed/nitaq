'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff, KeyRound, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

type Step = 'phone' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitPhone = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { phone });
      setStep('reset');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
      setError(e.response?.data?.error?.message ?? e.response?.data?.message ?? e.message ?? 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (newPassword.length < 6) {
      setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { phone, otp, newPassword });
      router.push('/login?reset=1');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
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
            <div className="text-lg font-bold text-white">نِطاق</div>
            <div className="text-xs text-white/60">منصة العميل</div>
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-3xl font-bold text-white leading-snug">
              استعادة<br />كلمة المرور
            </h2>
            <p className="mt-3 text-white/70 text-sm leading-relaxed">
              أدخل رقم جوالك وسنرسل لك رمز تحقق لإعادة تعيين كلمة المرور
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { icon: CheckCircle, text: 'رمز تحقق فوري عبر الجوال' },
              { icon: CheckCircle, text: 'تغيير آمن لكلمة المرور' },
              { icon: CheckCircle, text: 'حساب محمي بالكامل' },
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
        <div className="text-xs text-white/40">© 2026 نِطاق · جميع الحقوق محفوظة</div>
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
            <h1 className="text-2xl font-bold tracking-tight">نِطاق</h1>
            <p className="text-sm text-muted-foreground">استعادة كلمة المرور</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">
                  {step === 'phone' ? 'نسيت كلمة المرور' : 'تعيين كلمة مرور جديدة'}
                </CardTitle>
              </div>
              <CardDescription>
                {step === 'phone'
                  ? 'أدخل رقم جوالك لاستلام رمز التحقق'
                  : 'أدخل الرمز الذي وصلك وكلمة المرور الجديدة'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'phone' ? (
                <form onSubmit={submitPhone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الجوال</Label>
                    <Input
                      id="phone"
                      type="tel"
                      dir="ltr"
                      className="text-end"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
                  </Button>

                  <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    العودة لتسجيل الدخول
                  </Link>
                </form>
              ) : (
                <form onSubmit={submitReset} className="space-y-4">
                  <div className="rounded-md bg-success/10 border border-success/30 p-3 text-sm flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">تم إرسال رمز التحقق إلى <span className="font-mono font-semibold" dir="ltr">{phone}</span></span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">رمز التحقق</Label>
                    <Input
                      id="otp"
                      type="text"
                      dir="ltr"
                      className="text-center tracking-widest text-lg font-mono"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="● ● ● ● ● ●"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pe-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    {loading ? 'جارٍ التعيين...' : 'تعيين كلمة المرور'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setError(null); }}
                    className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    تغيير رقم الجوال
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
