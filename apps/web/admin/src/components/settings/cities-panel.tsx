'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
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
import { useCitiesStore } from '@/stores/cities-store';
import type { City } from '@naqla/shared-utils';

type CityDraft = Omit<City, 'id'>;
const EMPTY_DRAFT: CityDraft = { nameAr: '', nameEn: '', region: '', lat: 24.7, lng: 46.7, active: true };

export function CitiesPanel({ onPersist }: { onPersist?: (cities: City[]) => Promise<void> }) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const locale = useLocale();

  const cities = useCitiesStore((s) => s.cities);
  const addCity = useCitiesStore((s) => s.addCity);
  const updateCity = useCitiesStore((s) => s.updateCity);
  const removeCity = useCitiesStore((s) => s.removeCity);
  const toggleActive = useCitiesStore((s) => s.toggleActive);
  const resetToDefaults = useCitiesStore((s) => s.resetToDefaults);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CityDraft>(EMPTY_DRAFT);

  const openAdd = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  };

  const openEdit = (city: City) => {
    setEditingId(city.id);
    setDraft({
      nameAr: city.nameAr, nameEn: city.nameEn, region: city.region,
      lat: city.lat, lng: city.lng, active: city.active,
    });
    setDialogOpen(true);
  };

  const persist = () => void onPersist?.(useCitiesStore.getState().cities);

  const onSave = () => {
    if (!draft.nameAr.trim() || !draft.nameEn.trim()) return;
    if (editingId) {
      updateCity(editingId, draft);
    } else {
      addCity(draft);
    }
    setDialogOpen(false);
    persist();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>{t('cities.title')}</CardTitle>
            <CardDescription className="mt-1">{t('cities.subtitle')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(t('cities.confirmReset'))) { resetToDefaults(); persist(); }
              }}
            >
              <RotateCcw className="h-4 w-4" />
              {t('cities.resetToDefaults')}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  {t('cities.addCity')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? t('cities.editCity') : t('cities.addCity')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t('cities.fields.nameAr')}</Label>
                      <Input value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('cities.fields.nameEn')}</Label>
                      <Input dir="ltr" value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('cities.fields.region')}</Label>
                    <Input value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t('cities.fields.lat')}</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        dir="ltr"
                        value={draft.lat}
                        onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('cities.fields.lng')}</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        dir="ltr"
                        value={draft.lng}
                        onChange={(e) => setDraft({ ...draft, lng: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm">{t('cities.fields.active')}</span>
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>{tc('buttons.cancel')}</Button>
                  <Button onClick={onSave} disabled={!draft.nameAr.trim() || !draft.nameEn.trim()}>
                    {tc('buttons.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {cities.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
            {t('cities.empty')}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-start">
                  <th className="text-start font-medium p-3">{t('cities.columns.name')}</th>
                  <th className="text-start font-medium p-3">{t('cities.columns.region')}</th>
                  <th className="text-start font-medium p-3">{t('cities.columns.coordinates')}</th>
                  <th className="text-start font-medium p-3">{t('cities.columns.status')}</th>
                  <th className="text-end font-medium p-3">{t('cities.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cities.map((city) => (
                  <tr key={city.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{locale === 'ar' ? city.nameAr : city.nameEn}</div>
                      <div className="text-xs text-muted-foreground" dir={locale === 'ar' ? 'ltr' : 'rtl'}>
                        {locale === 'ar' ? city.nameEn : city.nameAr}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{city.region}</td>
                    <td className="p-3 font-mono text-xs num" dir="ltr">
                      {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                    </td>
                    <td className="p-3">
                      <button type="button" onClick={() => { toggleActive(city.id); persist(); }}>
                        <Badge variant={city.active ? 'default' : 'outline'}>
                          {city.active ? t('cities.statusActive') : t('cities.statusInactive')}
                        </Badge>
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(city)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(t('cities.confirmDelete', { name: locale === 'ar' ? city.nameAr : city.nameEn }))) {
                              removeCity(city.id); persist();
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
