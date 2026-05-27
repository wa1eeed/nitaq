'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, Clock, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { DISPUTES, ORDERS, companyById, formatRelative, formatDate, type Dispute } from '@naqla/shared-utils';

export default function AdminDisputesPage() {
  const router = useRouter();
  const [tab, setTab] = useState('ALL');

  // GET /admin/disputes — falls back to mock DISPUTES when API is unreachable.
  const { data } = useSWR<unknown>('/admin/disputes', fetcher);
  const all: Dispute[] = useMemo(() => {
    const arr =
      Array.isArray(data) ? data :
      Array.isArray((data as { items?: unknown[] })?.items) ? (data as { items: unknown[] }).items :
      [];
    return (arr.length > 0 ? arr : DISPUTES) as Dispute[];
  }, [data]);

  const rows = useMemo(
    () => (tab === 'ALL' ? all : all.filter((d) => d.status === tab)),
    [all, tab],
  );

  const open = all.filter((d) => d.status === 'OPEN').length;
  const review = all.filter((d) => d.status === 'UNDER_REVIEW').length;
  const resolved = all.filter((d) => d.status === 'RESOLVED').length;

  return (
    <>
      <PageHeader title="النزاعات" subtitle="إدارة النزاعات بين العملاء والمزودين" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="مفتوحة" value={open} hint="تحتاج تعيين" icon={AlertTriangle} tone="danger" />
        <StatsCard label="قيد المراجعة" value={review} hint="فريق الامتثال" icon={Clock} tone="warning" />
        <StatsCard label="محلولة" value={resolved} hint="مغلقة بنجاح" icon={CheckCircle} tone="success" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ALL">الكل ({all.length})</TabsTrigger>
          <TabsTrigger value="OPEN">مفتوح ({open})</TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW">قيد المراجعة ({review})</TabsTrigger>
          <TabsTrigger value="RESOLVED">محلول ({resolved})</TabsTrigger>
        </TabsList>
      </Tabs>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد نزاعات في هذه الفئة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((d) => {
            const order = ORDERS.find((o) => o.id === d.orderId);
            const raiser = companyById(d.raisedById);
            const tone =
              d.status === 'OPEN' ? 'bg-destructive/15 text-destructive' :
              d.status === 'UNDER_REVIEW' ? 'bg-warning/15 text-warning' :
              'bg-success/15 text-success';
            return (
              <Card key={d.id} className="hover:border-primary/40 cursor-pointer transition-colors" onClick={() => router.push(`/disputes/${d.id}`)}>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${tone}`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{d.reason}</h3>
                      <StatusBadge status={d.status} />
                      <Badge variant={d.raisedBy === 'CLIENT' ? 'default' : 'warning'}>
                        {d.raisedBy === 'CLIENT' ? 'من العميل' : 'من المزوّد'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-mono">{d.id}</span>
                      {order && <span>· الطلب {order.orderNumber}</span>}
                      {raiser && <span>· رفعها {raiser.nameAr}</span>}
                      <span>· {formatRelative(d.createdAt)}</span>
                      {d.resolvedAt && <span>· حُلّ {formatDate(d.resolvedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" asChild>
                      <Link href={`/disputes/${d.id}`}>عرض التفاصيل</Link>
                    </Button>
                    {d.status === 'OPEN' && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/disputes/${d.id}`}>تعيين فاحص</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
