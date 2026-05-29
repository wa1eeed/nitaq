'use client';
import { useMemo, useState } from 'react';
import {
  Building2, Cog, CreditCard, FileText, History, Key, Package, Search,
  Settings, Shield, ShieldCheck, User, Wallet,
} from 'lucide-react';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import {
  AUDIT_EVENTS, formatDateTime, formatRelative,
  type AuditCategory, type AuditActor,
} from '@naqla/shared-utils';
import { fetcher } from '@/lib/api';

const CATEGORY_META: Record<AuditCategory, { label: string; icon: any; tone: string }> = {
  AUTH:     { label: 'حساب',      icon: Key,        tone: 'bg-muted text-muted-foreground' },
  COMPANY:  { label: 'شركة',      icon: Building2,  tone: 'bg-info/15 text-info' },
  KYC:      { label: 'KYC',       icon: ShieldCheck,tone: 'bg-success/15 text-success' },
  ORDER:    { label: 'طلب',       icon: Package,    tone: 'bg-primary/10 text-primary' },
  PAYMENT:  { label: 'دفع',       icon: CreditCard, tone: 'bg-success/15 text-success' },
  DISPUTE:  { label: 'نزاع',      icon: Shield,     tone: 'bg-warning/15 text-warning' },
  SETTINGS: { label: 'إعدادات',  icon: Settings,   tone: 'bg-muted text-muted-foreground' },
  WALLET:   { label: 'محفظة',     icon: Wallet,     tone: 'bg-info/15 text-info' },
  TICKET:   { label: 'تذكرة',    icon: FileText,   tone: 'bg-muted text-muted-foreground' },
};

const ACTOR_LABEL: Record<AuditActor, string> = {
  ADMIN: 'أدمن', SYSTEM: 'النظام', CLIENT: 'عميل', CARRIER: 'ناقل',
};
const ACTOR_BADGE: Record<AuditActor, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  ADMIN: 'default', SYSTEM: 'outline', CLIENT: 'success', CARRIER: 'warning',
};

export default function AuditLogPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [actor, setActor] = useState<string>('ALL');

  const { data: apiData } = useSWR<{ data: any[] }>('/admin/audit-logs?limit=50', fetcher);

  // Normalize API audit logs to the mock shape the UI renders
  const ROLE_TO_ACTOR: Record<string, string> = {
    ADMIN: 'ADMIN', SUPER_ADMIN: 'ADMIN', CLIENT_ADMIN: 'CLIENT',
    PROVIDER_ADMIN: 'CARRIER', EMPLOYEE: 'CLIENT',
  };
  const apiEvents = (apiData?.data ?? []).map((e: any) => ({
    id: e.id,
    at: e.createdAt,
    category: (e.resourceType as any) ?? 'AUTH',
    action: e.action,
    actor: (ROLE_TO_ACTOR[e.user?.role ?? ''] ?? 'SYSTEM') as any,
    actorName: e.user?.email ?? e.user?.phone ?? 'النظام',
    target: e.resourceId ?? undefined,
    detail: e.ipAddress ? `IP: ${e.ipAddress}` : undefined,
  }));
  const events = apiEvents.length > 0 ? apiEvents : AUDIT_EVENTS;

  const filtered = useMemo(() => {
    return events
      .filter((e) => {
        if (category !== 'ALL' && e.category !== category) return false;
        if (actor !== 'ALL' && e.actor !== actor) return false;
        if (q) {
          const hay = `${e.action} ${e.target ?? ''} ${e.actorName} ${e.detail ?? ''}`;
          if (!hay.toLowerCase().includes(q.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [q, category, actor, events]);

  return (
    <>
      <PageHeader
        title="سجل التدقيق"
        subtitle="سجل غير قابل للتعديل لكل الإجراءات الحساسة على المنصة"
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في السجل..." className="pe-10" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الفئات</SelectItem>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actor} onValueChange={setActor}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأدوار</SelectItem>
                {Object.entries(ACTOR_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
              لا توجد إدخالات مطابقة
            </div>
          ) : (
            <div className="relative">
              <div className="absolute start-[19px] top-2 bottom-2 w-px bg-border" aria-hidden />
              <ul className="space-y-3">
                {filtered.map((e) => {
                  const cat = e.category as AuditCategory;
                  const act = e.actor as AuditActor;
                  const meta = CATEGORY_META[cat] ?? CATEGORY_META.AUTH;
                  const Icon = meta.icon;
                  return (
                    <li key={e.id} className="relative flex items-start gap-3">
                      <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${meta.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 rounded-lg border bg-card p-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{e.action}</span>
                              {e.target && (
                                <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">{e.target}</code>
                              )}
                            </div>
                            {e.detail && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{e.detail}</p>}
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <Badge variant={ACTOR_BADGE[act]} className="h-5">
                                {act === 'SYSTEM' ? <Cog className="h-3 w-3 me-1" /> : <User className="h-3 w-3 me-1" />}
                                {ACTOR_LABEL[act]}
                              </Badge>
                              <span>{e.actorName}</span>
                              <span>·</span>
                              <Badge variant="outline" className="h-5">{meta.label}</Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-end shrink-0">
                            <div>{formatRelative(e.at)}</div>
                            <div className="text-[10px]">{formatDateTime(e.at)}</div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
