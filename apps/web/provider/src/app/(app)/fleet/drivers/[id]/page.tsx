'use client';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowRight, Calendar, Phone, Star, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { fetcher } from '@/lib/api';
import { formatDate, DRIVERS } from '@naqla/shared-utils';

type DriverDetail = {
  id: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: string;
  status: string;
  totalTrips: number;
  rating: number;
  photo?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    nationalId?: string | null;
  };
};

type TripHistory = {
  id: string;
  orderNumber: string;
  originCity: string;
  destinationCity: string;
  status: string;
  agreedPrice?: number | null;
  createdAt: string;
};

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // All hooks before any early return (Rules of Hooks)
  const { data: driverData } = useSWR<DriverDetail>(
    params?.id ? `/fleet/drivers/${params.id}` : null,
    fetcher,
  );
  const { data: historyData } = useSWR<TripHistory[] | { items?: TripHistory[] }>(
    params?.id ? `/fleet/drivers/${params.id}/history` : null,
    fetcher,
  );

  const driver = driverData ?? DRIVERS.find((d) => d.id === params.id) as unknown as DriverDetail | undefined;
  const history: TripHistory[] = Array.isArray(historyData)
    ? historyData
    : Array.isArray((historyData as { items?: TripHistory[] })?.items)
      ? (historyData as { items: TripHistory[] }).items
      : [];

  if (!driver) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">الموظف غير موجود</h3>
          <Button onClick={() => router.push('/fleet/drivers')} className="mt-4">عودة للموظفين</Button>
        </CardContent>
      </Card>
    );
  }

  const fullName = driver.user
    ? `${driver.user.firstName} ${driver.user.lastName}`
    : (driver as unknown as { fullName?: string }).fullName ?? '—';

  const jobTitle = (driver as unknown as { jobTitle?: string }).jobTitle ?? driver.licenseType ?? '—';
  const nationalId = driver.user?.nationalId ?? (driver as unknown as { nationalId?: string }).nationalId;

  const initials = fullName.split(' ').slice(0, 2).map((w) => w[0]).join('');

  return (
    <>
      <PageHeader
        title={fullName}
        subtitle={`موظف · ${jobTitle}`}
        actions={
          <Button variant="outline" onClick={() => router.push('/fleet/drivers')}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-20 w-20">
                {driver.photo && <img src={driver.photo} alt={fullName} className="object-cover" />}
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{fullName}</h2>
                <StatusBadge status={driver.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <dl className="divide-y">
              {driver.user?.phone && (
                <InfoRow icon={Phone} label="الهاتف" value={<span className="num" dir="ltr">{driver.user.phone}</span>} />
              )}
              {nationalId && (
                <InfoRow icon={User} label="رقم الهوية" value={<span className="num">{nationalId}</span>} />
              )}
              <InfoRow icon={Calendar} label="تاريخ الانضمام" value={formatDate(driver.licenseExpiry)} />
              <InfoRow icon={Star} label="التقييم" value={
                <span className="num">{(driver.rating ?? 0).toFixed(1)} / 5.0</span>
              } />
            </dl>
          </CardContent>
        </Card>

        {/* Stats + assignment history */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="إجمالي المهام" value={String(driver.totalTrips ?? 0)} />
            <StatCard label="التقييم" value={`${(driver.rating ?? 0).toFixed(1)} ★`} />
            <StatCard label="المسمى الوظيفي" value={jobTitle} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>سجل المهام</CardTitle>
              <CardDescription>آخر المهام المنجزة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد مهام مسجّلة بعد.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطلب</TableHead>
                      <TableHead>المسار</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-mono text-xs">{trip.orderNumber}</TableCell>
                        <TableCell className="text-sm">{trip.originCity} ← {trip.destinationCity}</TableCell>
                        <TableCell><StatusBadge status={trip.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(trip.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value, icon: Icon }: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="text-2xl font-bold num">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}
