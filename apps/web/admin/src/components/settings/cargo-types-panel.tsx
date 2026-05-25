'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Package, Pencil, Plus, RotateCcw, Snowflake, Trash2, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCargoTypesStore } from '@/stores/cargo-types-store';
import type { CargoTypeDef } from '@naqla/shared-utils';

type CargoDraft = Omit<CargoTypeDef, 'id'>;
const EMPTY_DRAFT: CargoDraft = {
  nameAr: '', nameEn: '', icon: '📦',
  requiresRefrigeration: false, hazardous: false, active: true,
};

export function CargoTypesPanel({ onPersist }: { onPersist?: (types: CargoTypeDef[]) => Promise<void> }) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const locale = useLocale();

  const cargoTypes = useCargoTypesStore((s) => s.cargoTypes);
  const addType = useCargoTypesStore((s) => s.addType);
  const updateType = useCargoTypesStore((s) => s.updateType);
  const removeType = useCargoTypesStore((s) => s.removeType);
  const toggleActive = useCargoTypesStore((s) => s.toggleActive);
  const resetToDefaults = useCargoTypesStore((s) => s.resetToDefaults);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CargoDraft>(EMPTY_DRAFT);

  const openAdd = () => { setEditingId(null); setDraft(EMPTY_DRAFT); setDialogOpen(true); };

  const openEdit = (type: CargoTypeDef) => {
    setEditingId(type.id);
    setDraft({
      nameAr: type.nameAr, nameEn: type.nameEn, icon: type.icon,
      requiresRefrigeration: type.requiresRefrigeration,
      hazardous: type.hazardous, active: type.active,
    });
    setDialogOpen(true);
  };

  const persist = () => void onPersist?.(useCargoTypesStore.getState().cargoTypes);

  const onSave = () => {
    if (!draft.nameAr.trim() || !draft.nameEn.trim() || !draft.icon.trim()) return;
    if (editingId) {
      updateType(editingId, draft);
    } else {
      addType(draft);
    }
    setDialogOpen(false);
    persist();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>{t('cargoTypes.title')}</CardTitle>
            <CardDescription className="mt-1">{t('cargoTypes.subtitle')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { if (confirm(t('cargoTypes.confirmReset'))) { resetToDefaults(); persist(); } }}
            >
              <RotateCcw className="h-4 w-4" />
              {t('cargoTypes.resetToDefaults')}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  {t('cargoTypes.addType')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? t('cargoTypes.editType') : t('cargoTypes.addType')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-[80px_1fr] gap-3">
                    <div className="space-y-2">
                      <Label>{t('cargoTypes.fields.icon')}</Label>
                      <Input
                        value={draft.icon}
                        onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                        placeholder="📦"
                        className="text-center text-2xl"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('cargoTypes.fields.nameAr')}</Label>
                      <Input value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('cargoTypes.fields.nameEn')}</Label>
                    <Input dir="ltr" value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
                  </div>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.requiresRefrigeration}
                        onChange={(e) => setDraft({ ...draft, requiresRefrigeration: e.target.checked })}
                        className="h-4 w-4 rounded border-input"
                      />
                      <Snowflake className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{t('cargoTypes.fields.requiresRefrigeration')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.hazardous}
                        onChange={(e) => setDraft({ ...draft, hazardous: e.target.checked })}
                        className="h-4 w-4 rounded border-input"
                      />
                      <TriangleAlert className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">{t('cargoTypes.fields.hazardous')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="text-sm">{t('cargoTypes.fields.active')}</span>
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>{tc('buttons.cancel')}</Button>
                  <Button onClick={onSave} disabled={!draft.nameAr.trim() || !draft.nameEn.trim() || !draft.icon.trim()}>
                    {tc('buttons.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {cargoTypes.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
            {t('cargoTypes.empty')}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-start font-medium p-3 w-16">{t('cargoTypes.columns.icon')}</th>
                  <th className="text-start font-medium p-3">{t('cargoTypes.columns.name')}</th>
                  <th className="text-start font-medium p-3">{t('cargoTypes.columns.flags')}</th>
                  <th className="text-start font-medium p-3">{t('cargoTypes.columns.status')}</th>
                  <th className="text-end font-medium p-3">{t('cargoTypes.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cargoTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-muted/30">
                    <td className="p-3 text-2xl text-center" aria-hidden>{type.icon}</td>
                    <td className="p-3">
                      <div className="font-medium">{locale === 'ar' ? type.nameAr : type.nameEn}</div>
                      <div className="text-xs text-muted-foreground" dir={locale === 'ar' ? 'ltr' : 'rtl'}>
                        {locale === 'ar' ? type.nameEn : type.nameAr}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {type.requiresRefrigeration && (
                          <Badge variant="outline" className="gap-1">
                            <Snowflake className="h-3 w-3 text-blue-500" />
                            {t('cargoTypes.flags.refrigerated')}
                          </Badge>
                        )}
                        {type.hazardous && (
                          <Badge variant="outline" className="gap-1">
                            <TriangleAlert className="h-3 w-3 text-amber-500" />
                            {t('cargoTypes.flags.hazardous')}
                          </Badge>
                        )}
                        {!type.requiresRefrigeration && !type.hazardous && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <button type="button" onClick={() => { toggleActive(type.id); persist(); }}>
                        <Badge variant={type.active ? 'default' : 'outline'}>
                          {type.active ? t('cargoTypes.statusActive') : t('cargoTypes.statusInactive')}
                        </Badge>
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(type)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(t('cargoTypes.confirmDelete', { name: locale === 'ar' ? type.nameAr : type.nameEn }))) {
                              removeType(type.id); persist();
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
