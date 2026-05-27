'use client';
import { useRef, useState } from 'react';
import {
  AlertCircle, CheckCircle2, ImageIcon, Link as LinkIcon, Pencil, Plus,
  RotateCcw, Trash2, Truck, Upload, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { TruckTypeOption } from '@naqla/shared-utils';
import { useTruckTypesStore } from '@/stores/truck-types-store';

type DraftType = Omit<TruckTypeOption, 'id'> & { id?: string };

const EMOJI_OPTIONS = ['💼', '🎨', '🔧', '🛠️', '🖥️', '📚', '💻', '📦', '📋', '⚡', '🏗️', '🔬', '📊', '🤝', '🌐'];

const BLANK: DraftType = {
  nameAr: '', nameEn: '', capacityKg: 0, description: '', imageUrl: '', icon: '💼', active: true,
};

export function TruckTypesPanel({ onPersist }: { onPersist?: (types: TruckTypeOption[]) => Promise<void> }) {
  const types = useTruckTypesStore((s) => s.types);
  const addType = useTruckTypesStore((s) => s.addType);
  const updateType = useTruckTypesStore((s) => s.updateType);
  const removeType = useTruckTypesStore((s) => s.removeType);
  const toggleActive = useTruckTypesStore((s) => s.toggleActive);
  const resetToDefaults = useTruckTypesStore((s) => s.resetToDefaults);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftType>(BLANK);

  const openAdd = () => { setEditingId(null); setDraft(BLANK); setOpen(true); };
  const openEdit = (t: TruckTypeOption) => { setEditingId(t.id); setDraft({ ...t }); setOpen(true); };

  const persist = () => void onPersist?.(useTruckTypesStore.getState().types);

  const save = () => {
    if (!draft.nameAr.trim()) return;
    if (editingId) updateType(editingId, draft);
    else addType(draft);
    setOpen(false);
    persist();
  };

  const active = types.filter((t) => t.active).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" /> أنواع الخدمات
              </CardTitle>
              <CardDescription className="mt-1">
                تُستخدم هذه القائمة في نموذج إضافة خدمة لدى المزود وفي تسجيل المزود الجديد.
                كل نوع يمثّل فئة خدمة متاحة للعملاء.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="num">{active} مفعّل من {types.length}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('استرجاع كل أنواع الخدمات للقائمة الافتراضية؟ ستُفقد التعديلات.')) {
                    resetToDefaults(); persist();
                  }
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> استرجاع الافتراضي
              </Button>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" /> نوع جديد
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {types.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Truck className="h-10 w-10 mx-auto mb-2 opacity-40" />
              لا توجد أنواع خدمات — أضف أولاً
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map((t) => (
                <TruckTypeCard
                  key={t.id}
                  type={t}
                  onEdit={() => openEdit(t)}
                  onToggle={(v) => { toggleActive(t.id, v); persist(); }}
                  onRemove={() => {
                    if (confirm(`حذف "${t.nameAr}"؟ لن يظهر في قوائم المزودين بعد الآن.`)) {
                      removeType(t.id); persist();
                    }
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
            <DialogTitle>{editingId ? 'تعديل نوع الخدمة' : 'إضافة نوع خدمة'}</DialogTitle>
            <DialogDescription>
              املأ معلومات النوع — ستظهر للمزودين عند إضافة خدمة أو في تسجيل مزود جديد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الاسم بالعربية</Label>
                <Input value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} placeholder="مثال: مسطح كبير" />
              </div>
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input dir="ltr" value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} placeholder="e.g. Large Flatbed" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
                className="w-full p-3 rounded-md border bg-background text-sm leading-relaxed"
                placeholder="ما الذي يميّز هذا النوع؟ ما المناسب له؟"
              />
            </div>

            <div className="space-y-2">
              <Label>الأيقونة الرمزية (Emoji)</Label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setDraft({ ...draft, icon: e })}
                    className={`h-10 w-10 rounded-md border-2 text-xl ${
                      draft.icon === e ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <ImageField
              value={draft.imageUrl}
              onChange={(v) => setDraft({ ...draft, imageUrl: v })}
            />

            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border">
              <div>
                <Label>نشط</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">يظهر للمزودين فقط إذا كان نشطاً</p>
              </div>
              <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save} disabled={!draft.nameAr.trim()}>
              <CheckCircle2 className="h-4 w-4" />
              {editingId ? 'حفظ التغييرات' : 'إضافة النوع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TruckTypeCard({
  type, onEdit, onToggle, onRemove,
}: {
  type: TruckTypeOption;
  onEdit: () => void;
  onToggle: (v: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <Card className={!type.active ? 'opacity-60' : ''}>
      {/* Image — gradient bg shows clean studio render PNGs nicely */}
      <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border-b flex items-center justify-center p-4 relative">
        {type.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={type.imageUrl}
              alt={type.nameAr}
              className="max-h-full max-w-full object-contain drop-shadow-md"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = 'none';
                const fb = t.nextElementSibling as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <div className="text-6xl items-center justify-center" style={{ display: 'none' }}>{type.icon}</div>
          </>
        ) : (
          <div className="text-6xl">{type.icon}</div>
        )}
        {!type.active && (
          <Badge variant="outline" className="absolute top-2 start-2 bg-card">معطّل</Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{type.icon}</span>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{type.nameAr}</h3>
            <div className="text-xs text-muted-foreground" dir="ltr">{type.nameEn}</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {type.description || '—'}
        </p>

        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> تعديل
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{type.active ? 'مفعّل' : 'معطّل'}</span>
            <Switch checked={type.active} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ImageField — upload from device OR paste URL ────────────────────

const MAX_IMAGE_MB = 2;

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<'upload' | 'url'>(value?.startsWith('data:') ? 'upload' : 'url');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('الملف ليس صورة. اختر PNG / JPG / WEBP');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`حجم الصورة كبير (${(file.size / 1024 / 1024).toFixed(1)} MB). الحد الأقصى ${MAX_IMAGE_MB} MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => setError('تعذّر قراءة الملف');
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const isDataUrl = value?.startsWith('data:');
  const isLocalUrl = value?.startsWith('http://localhost');

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5" />
        الصورة التوصيفية
      </Label>

      {/* Source toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-md">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`text-xs font-medium py-1.5 rounded transition-colors ${
            mode === 'upload' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:bg-card/50'
          }`}
        >
          <Upload className="h-3.5 w-3.5 inline me-1" /> رفع من الجهاز
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`text-xs font-medium py-1.5 rounded transition-colors ${
            mode === 'url' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:bg-card/50'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5 inline me-1" /> رابط خارجي
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-lg border-2 border-dashed p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">اضغط لاختيار صورة، أو اسحب ملفاً هنا</p>
          <p className="text-xs text-muted-foreground mt-1 num">
            PNG, JPG, WEBP — حد أقصى {MAX_IMAGE_MB} MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Input
            dir="ltr"
            value={isDataUrl ? '' : value}
            onChange={(e) => { onChange(e.target.value); setError(null); }}
            placeholder="https://... أو /truck-types/myimage.png"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            يُفضّل صورة بأسلوب studio render: خلفية شفافة، رؤية 3/4 جانبية، PNG عالي الجودة.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Live preview */}
      {value && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="معاينة"
              className="max-h-full max-w-full object-contain drop-shadow-md"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = 'none';
                const fb = t.parentElement?.querySelector('.img-fallback') as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <div className="img-fallback hidden absolute inset-0 flex-col items-center justify-center text-muted-foreground text-sm">
              <ImageIcon className="h-8 w-8 mb-1 opacity-40" />
              تعذّر تحميل الصورة
            </div>
            <div className="absolute top-2 end-2 flex items-center gap-1">
              {isDataUrl && <Badge variant="default" className="text-[10px]">من الجهاز</Badge>}
              {isLocalUrl && <Badge variant="outline" className="text-[10px]">محلي</Badge>}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(''); setError(null); }}
                className="h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground grid place-items-center hover:bg-destructive"
                title="إزالة الصورة"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

