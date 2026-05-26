'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { fetcher, api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Bell, Globe, MapPin, MessageSquare, Package, Palette, Percent, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { BrandingPanel } from '@/components/settings/branding-panel';
import { CitiesPanel } from '@/components/settings/cities-panel';
import { CargoTypesPanel } from '@/components/settings/cargo-types-panel';
import { SmsTemplatesPanel } from '@/components/settings/sms-templates-panel';
import { CompliancePanel } from '@/components/settings/compliance-panel';
import { NotificationsPanel } from '@/components/settings/notifications-panel';
import { TruckTypesPanel } from '@/components/settings/truck-types-panel';
import { useCitiesStore } from '@/stores/cities-store';
import { useCargoTypesStore } from '@/stores/cargo-types-store';
import { useTruckTypesStore } from '@/stores/truck-types-store';
import type { City, CargoTypeDef, TruckTypeOption } from '@naqla/shared-utils';

export default function AdminSettingsPage() {
  const t = useTranslations('admin');

  const { data: settingsArr, mutate: mutateSettings } = useSWR<{ key: string; value: string }[]>('/admin/settings', fetcher);
  const settingMap = Object.fromEntries((settingsArr ?? []).map((s) => [s.key, s.value]));

  const [commission, setCommission] = useState(8);
  const [vat, setVat] = useState(15);
  const [escrowDays, setEscrowDays] = useState(3);
  const [savingFinancial, setSavingFinancial] = useState(false);

  const [brandName, setBrandName] = useState('نِطاق');
  const [supportEmail, setSupportEmail] = useState('support@nitaq.sa');
  const [supportPhone, setSupportPhone] = useState('+966 920 000 000');
  const [savingGeneral, setSavingGeneral] = useState(false);

  useEffect(() => {
    if (!settingsArr) return;
    if (settingMap['financial.commission']) setCommission(Number(settingMap['financial.commission']));
    if (settingMap['financial.vat']) setVat(Number(settingMap['financial.vat']));
    if (settingMap['financial.escrowDays']) setEscrowDays(Number(settingMap['financial.escrowDays']));
    if (settingMap['general.brandName']) setBrandName(settingMap['general.brandName']);
    if (settingMap['general.supportEmail']) setSupportEmail(settingMap['general.supportEmail']);
    if (settingMap['general.supportPhone']) setSupportPhone(settingMap['general.supportPhone']);
    try {
      if (settingMap['catalog.cities']) useCitiesStore.setState({ cities: JSON.parse(settingMap['catalog.cities']) });
      if (settingMap['catalog.cargo_types']) useCargoTypesStore.setState({ cargoTypes: JSON.parse(settingMap['catalog.cargo_types']) });
      if (settingMap['catalog.truck_types']) useTruckTypesStore.setState({ types: JSON.parse(settingMap['catalog.truck_types']) });
    } catch { /* malformed JSON in DB — keep store defaults */ }
  }, [settingsArr]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistCities = async (cities: City[]) => {
    try {
      await api.put('/admin/settings', { settings: [{ key: 'catalog.cities', value: JSON.stringify(cities) }] });
      notify.success('تم حفظ قائمة المدن');
      await mutateSettings();
    } catch (err) { notify.error(err, 'فشل حفظ المدن'); }
  };

  const persistCargoTypes = async (types: CargoTypeDef[]) => {
    try {
      await api.put('/admin/settings', { settings: [{ key: 'catalog.cargo_types', value: JSON.stringify(types) }] });
      notify.success('تم حفظ أنواع البضائع');
      await mutateSettings();
    } catch (err) { notify.error(err, 'فشل حفظ أنواع البضائع'); }
  };

  const persistServiceTypes = async (types: TruckTypeOption[]) => {
    try {
      await api.put('/admin/settings', { settings: [{ key: 'catalog.truck_types', value: JSON.stringify(types) }] });
      notify.success('تم حفظ أنواع الخدمات');
      await mutateSettings();
    } catch (err) { notify.error(err, 'فشل حفظ أنواع الخدمات'); }
  };

  const saveFinancial = async () => {
    if (savingFinancial) return;
    setSavingFinancial(true);
    try {
      await api.put('/admin/settings', {
        settings: [
          { key: 'financial.commission', value: String(commission) },
          { key: 'financial.vat', value: String(vat) },
          { key: 'financial.escrowDays', value: String(escrowDays) },
        ],
      });
      notify.success('تم حفظ الإعدادات المالية');
      await mutateSettings();
    } catch (err) {
      notify.error(err, 'فشل حفظ الإعدادات');
    } finally {
      setSavingFinancial(false);
    }
  };

  const saveGeneral = async () => {
    if (savingGeneral) return;
    setSavingGeneral(true);
    try {
      await api.put('/admin/settings', {
        settings: [
          { key: 'general.brandName', value: brandName },
          { key: 'general.supportEmail', value: supportEmail },
          { key: 'general.supportPhone', value: supportPhone },
        ],
      });
      notify.success('تم حفظ الإعدادات العامة');
      await mutateSettings();
    } catch (err) {
      notify.error(err, 'فشل حفظ الإعدادات');
    } finally {
      setSavingGeneral(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="financial">
            <Percent className="h-4 w-4 me-1.5" />
            {t('settings.tabs.financial')}
          </TabsTrigger>
          <TabsTrigger value="kyc">
            <ShieldCheck className="h-4 w-4 me-1.5" />
            {t('settings.tabs.compliance')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 me-1.5" />
            {t('settings.tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="sms-templates">
            <MessageSquare className="h-4 w-4 me-1.5" />
            {t('settings.tabs.smsTemplates')}
          </TabsTrigger>
          <TabsTrigger value="truck-types">
            <Truck className="h-4 w-4 me-1.5" />
            {t('settings.tabs.truckTypes')}
          </TabsTrigger>
          <TabsTrigger value="cargo-types">
            <Package className="h-4 w-4 me-1.5" />
            {t('settings.tabs.cargoTypes')}
          </TabsTrigger>
          <TabsTrigger value="cities">
            <MapPin className="h-4 w-4 me-1.5" />
            {t('settings.tabs.cities')}
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 me-1.5" />
            {t('settings.tabs.branding')}
          </TabsTrigger>
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 me-1.5" />
            {t('settings.tabs.general')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>العمولات والضرائب</CardTitle>
              <CardDescription>تطبّق على كل طلب جديد بدءاً من تاريخ الحفظ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="commission">نسبة عمولة المنصة (%)</Label>
                <Input id="commission" type="number" value={commission} onChange={(e) => setCommission(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat">ضريبة القيمة المضافة (%)</Label>
                <Input id="vat" type="number" value={vat} onChange={(e) => setVat(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escrow">مدة احتجاز Escrow (أيام)</Label>
                <Input id="escrow" type="number" value={escrowDays} onChange={(e) => setEscrowDays(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground">الحد الأدنى قبل الإفراج التلقائي للناقل</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={saveFinancial} disabled={savingFinancial}>
                  {savingFinancial ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc">
          <CompliancePanel />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsPanel />
        </TabsContent>

        <TabsContent value="truck-types">
          <TruckTypesPanel onPersist={persistServiceTypes} />
        </TabsContent>

        <TabsContent value="cargo-types">
          <CargoTypesPanel onPersist={persistCargoTypes} />
        </TabsContent>

        <TabsContent value="cities">
          <CitiesPanel onPersist={persistCities} />
        </TabsContent>

        <TabsContent value="sms-templates">
          <SmsTemplatesPanel />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingPanel />
        </TabsContent>

        <TabsContent value="general">
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader><CardTitle>إعدادات عامة</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">اسم المنصة</Label>
                  <Input id="brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">البريد الرسمي</Label>
                  <Input id="support-email" dir="ltr" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-phone">رقم الدعم</Label>
                  <Input id="support-phone" dir="ltr" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
                </div>
                <div className="pt-2">
                  <Button onClick={saveGeneral} disabled={savingGeneral}>
                    {savingGeneral ? 'جارٍ الحفظ…' : 'حفظ'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
