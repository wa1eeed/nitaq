'use client';
import { useMemo, useState } from 'react';
import {
  Clock, Filter, Inbox, LifeBuoy, MessageSquare, Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import {
  SUPPORT_TICKETS, companyById, formatRelative,
  type SupportTicket, type TicketStatus, type TicketPriority, type TicketCategory,
} from '@naqla/shared-utils';

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'مفتوحة', IN_PROGRESS: 'قيد المعالجة', WAITING_USER: 'بانتظار العميل',
  RESOLVED: 'محلولة', CLOSED: 'مغلقة',
};
const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'منخفضة', MEDIUM: 'متوسطة', HIGH: 'عالية', URGENT: 'عاجلة',
};
const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ACCOUNT: 'حساب', BILLING: 'فواتير', ORDER: 'طلب',
  TECHNICAL: 'تقني', KYC: 'KYC', DRIVER: 'موظف', OTHER: 'أخرى',
};

const STATUS_BADGE: Record<TicketStatus, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  OPEN: 'warning', IN_PROGRESS: 'default', WAITING_USER: 'outline',
  RESOLVED: 'success', CLOSED: 'outline',
};
const PRIORITY_BADGE: Record<TicketPriority, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  LOW: 'outline', MEDIUM: 'default', HIGH: 'warning', URGENT: 'destructive',
};

export default function AdminSupportPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [priority, setPriority] = useState<string>('ALL');
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  const filtered = useMemo(() => {
    return SUPPORT_TICKETS.filter((t) => {
      if (status !== 'ALL' && t.status !== status) return false;
      if (priority !== 'ALL' && t.priority !== priority) return false;
      if (q) {
        const hay = `${t.subject} ${t.id} ${companyById(t.raisedById)?.nameAr ?? ''}`;
        if (!hay.toLowerCase().includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [q, status, priority]);

  const open = SUPPORT_TICKETS.filter((t) => t.status === 'OPEN').length;
  const inProgress = SUPPORT_TICKETS.filter((t) => t.status === 'IN_PROGRESS').length;
  const urgent = SUPPORT_TICKETS.filter((t) => t.priority === 'URGENT' && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
  const total = SUPPORT_TICKETS.length;

  return (
    <>
      <PageHeader
        title="الدعم الفني"
        subtitle="تذاكر الدعم الواردة من العملاء والمزودين"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="إجمالي التذاكر" value={total.toLocaleString('en-US')} icon={LifeBuoy} />
        <StatsCard label="مفتوحة"          value={open.toLocaleString('en-US')} icon={Inbox} tone="warning" />
        <StatsCard label="قيد المعالجة"   value={inProgress.toLocaleString('en-US')} icon={MessageSquare} />
        <StatsCard label="عاجلة"            value={urgent.toLocaleString('en-US')} icon={Clock} tone={urgent > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في التذاكر..." className="pe-10" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل الحالات</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل الأولويات</SelectItem>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>المُرسِل</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>المسؤول</TableHead>
                  <TableHead>آخر تحديث</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      لا توجد تذاكر مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => {
                    const c = companyById(t.raisedById);
                    return (
                      <TableRow
                        key={t.id}
                        className={`cursor-pointer ${selected?.id === t.id ? 'bg-primary/5' : ''}`}
                        onClick={() => setSelected(t)}
                      >
                        <TableCell>
                          <div className="font-medium truncate max-w-[280px]">{t.subject}</div>
                          <div className="text-xs text-muted-foreground font-mono">{t.id} · {t.messageCount} رسالة</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm truncate max-w-[140px]">{c?.nameAr ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{t.raisedBy === 'CLIENT' ? 'عميل' : 'مزوّد'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{CATEGORY_LABELS[t.category]}</Badge>
                        </TableCell>
                        <TableCell><Badge variant={PRIORITY_BADGE[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.assignedTo ?? 'غير معيّن'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatRelative(t.updatedAt)}</TableCell>
                        <TableCell><Badge variant={STATUS_BADGE[t.status]}>{STATUS_LABELS[t.status]}</Badge></TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          {selected ? (
            <TicketDetail ticket={selected} onClose={() => setSelected(null)} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
                اختر تذكرة لعرض تفاصيلها
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function TicketDetail({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const company = companyById(ticket.raisedById);
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={PRIORITY_BADGE[ticket.priority]}>{PRIORITY_LABELS[ticket.priority]}</Badge>
              <Badge variant={STATUS_BADGE[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
            </div>
            <h3 className="font-semibold">{ticket.subject}</h3>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">{ticket.id}</div>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="إغلاق">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t">
          <div>
            <div className="text-muted-foreground mb-0.5">المُرسِل</div>
            <div className="font-medium">{company?.nameAr ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">المسؤول</div>
            <div className="font-medium">{ticket.assignedTo ?? 'غير معيّن'}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">الفئة</div>
            <div className="font-medium">{CATEGORY_LABELS[ticket.category]}</div>
          </div>
          {ticket.orderId && (
            <div>
              <div className="text-muted-foreground mb-0.5">الطلب المرتبط</div>
              <div className="font-mono font-medium text-primary">{ticket.orderId}</div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">الوصف</div>
          <p className="text-sm leading-relaxed">{ticket.description}</p>
        </div>

        <div className="rounded-md bg-muted/30 p-3 text-xs space-y-1">
          <div className="font-semibold">سجل المحادثة ({ticket.messageCount} رسائل)</div>
          <p className="text-muted-foreground">عرض المحادثة سيظهر في الواجهة الكاملة للتذكرة.</p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <button type="button" className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium">رد على التذكرة</button>
          <button type="button" className="h-9 px-3 rounded-md border text-sm">إغلاق</button>
        </div>
      </CardContent>
    </Card>
  );
}
