'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { fetcher, api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Bell, Globe, MapPin, MessageSquare, Package, Palette, Pencil, Percent, Plus, ShieldCheck, Trash2, Truck, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
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
import { useBrandsStore } from '@/stores/brands-store';
import { useCitiesStore } from '@/stores/cities-store';
import { useCargoTypesStore } from '@/stores/cargo-types-store';
import { useTruckTypesStore } from '@/stores/truck-types-store';
import type { City, CargoTypeDef, TruckTypeOption } from '@naqla/shared-utils';

export default function AdminSettingsPage() {
  const t = useTranslations('admin');

  // Fetch all settings from DB
  const { data: settingsArr, mutate: mutateSettings } = useSWR<{ key: string; value: string }[]>('/admin/settings', fetcher);
  const settingMap = Object.fromEntries((settingsArr ?? []).map((s) => [s.key, s.value]));

  // Financial settings
  const [commission, setCommission] = useState(8);
  const [vat, setVat] = useState(15);
  const [escrowDays, setEscrowDays] = useState(3);
  const [savingFinancial, setSavingFinancial] = useState(false);

  // General settings
  const [brandName, setBrandName] = useState('نِطاق');
  const [supportEmail, setSupportEmail] = useState('support@nitaq.sa');
  const [supportPhone, setSupportPhone] = useState('+966 920 000 000');
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Sync from DB settings once loaded
  useEffect(() => {
    if (!settingsArr) return;
    if (settingMap['financial.commission']) setCommission(Number(settingMap['financial.commission']));
    if (settingMap['financial.vat']) setVat(Number(settingMap['financial.vat']));
    if (settingMap['financial.escrowDays']) setEscrowDays(Number(settingMap['financial.escrowDays']));
    if (settingMap['general.brandName']) setBrandName(settingMap['general.brandName']);
    if (settingMap['general.supportEmail']) setSupportEmail(settingMap['general.supportEmail']);
    if (settingMap['general.supportPhone']) setSupportPhone(settingMap['general.supportPhone']);
    // Init catalog Zustand stores from DB
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
      notify.success('تم حفظ أنواع الشاحنات');
      await mutateSettings();
    } catch (err) { notify.error(err, 'فشل حفظ أنواع الشاحنات'); }
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
          <TabsTrigger value="brands">
            <Truck className="h-4 w-4 me-1.5" />
            {t('settings.tabs.brands')}
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

        <TabsContent value="brands">
          <BrandsPanel />
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

// ─── Brands & Models panel ────────────────────────────────────────────

function BrandsPanel() {
  const brands = useBrandsStore((s) => s.brands);
  const addBrand = useBrandsStore((s) => s.addBrand);
  const updateBrand = useBrandsStore((s) => s.updateBrand);
  const removeBrand = useBrandsStore((s) => s.removeBrand);
  const addModel = useBrandsStore((s) => s.addModel);
  const removeModel = useBrandsStore((s) => s.removeModel);
  const updateModel = useBrandsStore((s) => s.updateModel);
  const resetToDefaults = useBrandsStore((s) => s.resetToDefaults);

  const [openAdd, setOpenAdd] = useState(false);
  const [newBrandAr, setNewBrandAr] = useState('');
  const [newBrandEn, setNewBrandEn] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(brands[0]?.id ?? null);

  const selected = brands.find((b) => b.id === selectedId) ?? brands[0];
  const activeId = selected?.id ?? null;

  const handleAddBrand = () => {
    if (!newBrandAr.trim()) return;
    addBrand({ nameAr: newBrandAr.trim(), nameEn: newBrandEn.trim() || undefined });
    setNewBrandAr('');
    setNewBrandEn('');
    setOpenAdd(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>براندات الشاحنات</CardTitle>
            <CardDescription className="mt-1">
              تُستخدم في نموذج إضافة الشاحنة لدى الناقل — كل براند يحتوي على موديلاته الخاصة
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('استرجاع القائمة الافتراضية؟ سيتم فقدان أي تعديلات.')) {
                  resetToDefaults();
                  setSelectedId(null);
                }
              }}
            >
              استرجاع الافتراضي
            </Button>
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" /> إضافة براند
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة براند جديد</DialogTitle>
                  <DialogDescription>أضف اسم البراند بالعربية والإنجليزية (اختياري)</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="brand-ar">الاسم بالعربية</Label>
                    <Input
                      id="brand-ar"
                      autoFocus
                      value={newBrandAr}
                      onChange={(e) => setNewBrandAr(e.target.value)}
                      placeholder="مثلاً: تاتا"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand-en">الاسم بالإنجليزية (اختياري)</Label>
                    <Input
                      id="brand-en"
                      dir="ltr"
                      value={newBrandEn}
                      onChange={(e) => setNewBrandEn(e.target.value)}
                      placeholder="Tata"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenAdd(false)}>إلغاء</Button>
                  <Button onClick={handleAddBrand} disabled={!newBrandAr.trim()}>حفظ</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {brands.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-40" />
            لا توجد براندات — أضف واحداً للبدء
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
            {/* Brand list */}
            <div className="space-y-1 max-h-[520px] overflow-y-auto pe-1">
              {brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedId(b.id)}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg border p-3 text-start transition-colors ${
                    activeId === b.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{b.nameAr}</div>
                    {b.nameEn && (
                      <div className="text-xs text-muted-foreground truncate" dir="ltr">{b.nameEn}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <span className="num">{b.models.length}</span>
                  </Badge>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            {selected ? (
              <BrandDetailPanel
                key={selected.id}
                brand={selected}
                onRenameBrand={(patch) => updateBrand(selected.id, patch)}
                onDeleteBrand={() => {
                  if (confirm(`حذف "${selected.nameAr}" مع كل موديلاته؟`)) {
                    removeBrand(selected.id);
                    setSelectedId(null);
                  }
                }}
                onAddModel={(name) => addModel(selected.id, name)}
                onUpdateModel={(modelId, name) => updateModel(selected.id, modelId, name)}
                onRemoveModel={(modelId) => removeModel(selected.id, modelId)}
              />
            ) : (
              <div className="rounded-lg border border-dashed grid place-items-center text-sm text-muted-foreground p-8">
                اختر براند من القائمة
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BrandDetailPanel({
  brand,
  onRenameBrand,
  onDeleteBrand,
  onAddModel,
  onUpdateModel,
  onRemoveModel,
}: {
  brand: { id: string; nameAr: string; nameEn?: string; models: { id: string; name: string }[] };
  onRenameBrand: (patch: { nameAr?: string; nameEn?: string }) => void;
  onDeleteBrand: () => void;
  onAddModel: (name: string) => void;
  onUpdateModel: (modelId: string, name: string) => void;
  onRemoveModel: (modelId: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftAr, setDraftAr] = useState(brand.nameAr);
  const [draftEn, setDraftEn] = useState(brand.nameEn ?? '');
  const [newModel, setNewModel] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [draftModel, setDraftModel] = useState('');

  const handleAddModel = () => {
    const name = newModel.trim();
    if (!name) return;
    onAddModel(name);
    setNewModel('');
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      {/* Brand header */}
      <div className="flex items-start justify-between gap-3">
        {editingName ? (
          <div className="flex-1 space-y-2">
            <Input value={draftAr} onChange={(e) => setDraftAr(e.target.value)} placeholder="الاسم بالعربية" />
            <Input value={draftEn} dir="ltr" onChange={(e) => setDraftEn(e.target.value)} placeholder="English name" />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onRenameBrand({ nameAr: draftAr.trim() || brand.nameAr, nameEn: draftEn.trim() || undefined });
                  setEditingName(false);
                }}
              >
                حفظ
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>إلغاء</Button>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">{brand.nameAr}</div>
            {brand.nameEn && (
              <div className="text-sm text-muted-foreground truncate" dir="ltr">{brand.nameEn}</div>
            )}
          </div>
        )}
        {!editingName && (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="ghost" onClick={() => { setDraftAr(brand.nameAr); setDraftEn(brand.nameEn ?? ''); setEditingName(true); }}>
              <Pencil className="h-3.5 w-3.5" /> تعديل
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDeleteBrand}>
              <Trash2 className="h-3.5 w-3.5" /> حذف
            </Button>
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Models */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">الموديلات ({brand.models.length})</div>
        </div>

        <div className="space-y-2">
          {brand.models.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              لا توجد موديلات بعد — أضف موديلاً أدناه
            </div>
          ) : (
            brand.models.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                {editingModelId === m.id ? (
                  <>
                    <Input value={draftModel} onChange={(e) => setDraftModel(e.target.value)} className="flex-1" />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (draftModel.trim()) onUpdateModel(m.id, draftModel.trim());
                        setEditingModelId(null);
                      }}
                    >
                      حفظ
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingModelId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 rounded-md bg-muted/30 px-3 py-2 text-sm">{m.name}</div>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingModelId(m.id); setDraftModel(m.name); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`حذف "${m.name}"؟`)) onRemoveModel(m.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add model row */}
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddModel(); }}
            placeholder="اسم موديل جديد..."
            className="flex-1"
          />
          <Button onClick={handleAddModel} disabled={!newModel.trim()}>
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </div>
      </div>
    </div>
  );
}
