'use client';
import { useState } from 'react';
import { Building2, Pencil, Plus, Trash2, User, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DocRequirement {
  id: string;
  label: string;
  required: boolean;
}

/**
 * KYC requirements panel with two scopes:
 *   1. Company carriers (شركات الناقل) — CR, VAT, Zakat, transport license, insurance, ...
 *   2. Individual carriers (الناقل الفرد) — national ID, driver license, vehicle reg, insurance, ...
 *
 * Admin can add/edit/delete entries in each list. Backing store is local
 * useState here; production wires this to `Setting` rows under
 * `kyc_company_docs` / `kyc_individual_docs` keys.
 */
export function CompliancePanel() {
  const [companyDocs, setCompanyDocs] = useState<DocRequirement[]>([
    { id: 'CR',        label: 'السجل التجاري ساري المفعول', required: true },
    { id: 'ZAKAT',     label: 'شهادة الزكاة والدخل',         required: true },
    { id: 'VAT',       label: 'شهادة الضريبة (VAT)',         required: true },
    { id: 'INSURANCE', label: 'بوليصة التأمين',                required: true },
    { id: 'TRANSPORT', label: 'رخصة نقل البضائع (TGA)',       required: true },
    { id: 'ARTICLES',  label: 'عقد التأسيس',                   required: false },
    { id: 'BANK',      label: 'كشف حساب البنك',                required: false },
  ]);

  const [individualDocs, setIndividualDocs] = useState<DocRequirement[]>([
    { id: 'NATIONAL_ID',     label: 'الهوية الوطنية/الإقامة',         required: true },
    { id: 'DRIVING_LICENSE', label: 'رخصة قيادة سارية',                required: true },
    { id: 'SELFIE',          label: 'صورة شخصية',                       required: true },
    { id: 'ISTIMARA',        label: 'استمارة المركبة (الملكية)',        required: true },
    { id: 'INSURANCE',       label: 'وثيقة تأمين المركبة',              required: true },
    { id: 'INSPECTION',      label: 'الفحص الدوري',                    required: true },
    { id: 'TGA_PERMIT',      label: 'تصريح TGA للأفراد',                required: false },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DocsSection
        title="متطلبات الشركات الناقلة"
        subtitle="المستندات المطلوبة من شركة لاعتماد تسجيلها"
        icon={<Building2 className="h-5 w-5" />}
        docs={companyDocs}
        onChange={setCompanyDocs}
        emptyMsg="لا توجد متطلبات — أضف واحداً للبدء"
      />
      <DocsSection
        title="متطلبات الناقل الفرد"
        subtitle="المستندات المطلوبة من سائق فرد (غير منتمي لشركة)"
        icon={<User className="h-5 w-5" />}
        docs={individualDocs}
        onChange={setIndividualDocs}
        emptyMsg="لا توجد متطلبات — أضف واحداً للبدء"
      />
    </div>
  );
}

function DocsSection({
  title, subtitle, icon, docs, onChange, emptyMsg,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  docs: DocRequirement[];
  onChange: (next: DocRequirement[]) => void;
  emptyMsg: string;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftRequired, setDraftRequired] = useState(true);

  const openAdd = () => { setEditingId(null); setDraftLabel(''); setDraftRequired(true); setOpen(true); };
  const openEdit = (doc: DocRequirement) => {
    setEditingId(doc.id);
    setDraftLabel(doc.label);
    setDraftRequired(doc.required);
    setOpen(true);
  };
  const onSave = () => {
    if (!draftLabel.trim()) return;
    if (editingId) {
      onChange(docs.map((d) => d.id === editingId ? { ...d, label: draftLabel.trim(), required: draftRequired } : d));
    } else {
      const id = draftLabel.trim().toUpperCase().replace(/\s+/g, '_').slice(0, 24) + '_' + Date.now().toString(36).slice(-4);
      onChange([...docs, { id, label: draftLabel.trim(), required: draftRequired }]);
    }
    setOpen(false);
  };
  const toggleRequired = (id: string) =>
    onChange(docs.map((d) => d.id === id ? { ...d, required: !d.required } : d));
  const remove = (id: string) => {
    if (confirm('حذف هذا المتطلّب؟')) onChange(docs.filter((d) => d.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-0.5">{subtitle}</CardDescription>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'تعديل المتطلّب' : 'إضافة متطلّب'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>اسم المستند</Label>
                  <Input
                    autoFocus
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    placeholder="مثلاً: شهادة المنشأة"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftRequired}
                    onChange={(e) => setDraftRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">إلزامي للتسجيل</span>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={onSave} disabled={!draftLabel.trim()}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {docs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{emptyMsg}</div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/30 group">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant={doc.required ? 'default' : 'outline'} className="shrink-0">
                    {doc.required ? 'إلزامي' : 'اختياري'}
                  </Badge>
                  <span className="text-sm truncate">{doc.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleRequired(doc.id)}
                    title={doc.required ? 'اجعله اختيارياً' : 'اجعله إلزامياً'}
                  >
                    {doc.required ? <X className="h-3.5 w-3.5" /> : '✓'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(doc)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
