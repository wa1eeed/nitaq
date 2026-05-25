'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageSquare, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
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
import { useSmsTemplatesStore } from '@/stores/sms-templates-store';
import type { SmsTemplate, SmsTemplateChannel } from '@naqla/shared-utils';

type Draft = Omit<SmsTemplate, 'id'>;
const EMPTY: Draft = {
  name: '', channel: 'SMS',
  subjectAr: '', subjectEn: '',
  bodyAr: '', bodyEn: '',
  variables: [], active: true,
};

export function SmsTemplatesPanel() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const locale = useLocale();

  const templates = useSmsTemplatesStore((s) => s.templates);
  const addTemplate = useSmsTemplatesStore((s) => s.addTemplate);
  const updateTemplate = useSmsTemplatesStore((s) => s.updateTemplate);
  const removeTemplate = useSmsTemplatesStore((s) => s.removeTemplate);
  const toggleActive = useSmsTemplatesStore((s) => s.toggleActive);
  const resetToDefaults = useSmsTemplatesStore((s) => s.resetToDefaults);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [varDraft, setVarDraft] = useState('');

  const openAdd = () => { setEditingId(null); setDraft(EMPTY); setOpen(true); };
  const openEdit = (tmpl: SmsTemplate) => {
    setEditingId(tmpl.id);
    setDraft({
      name: tmpl.name, channel: tmpl.channel,
      subjectAr: tmpl.subjectAr ?? '', subjectEn: tmpl.subjectEn ?? '',
      bodyAr: tmpl.bodyAr, bodyEn: tmpl.bodyEn,
      variables: tmpl.variables, active: tmpl.active,
    });
    setOpen(true);
  };

  const onSave = () => {
    if (!draft.name.trim() || !draft.bodyAr.trim() || !draft.bodyEn.trim()) return;
    const payload: Draft = {
      ...draft,
      subjectAr: draft.channel === 'EMAIL' ? draft.subjectAr : undefined,
      subjectEn: draft.channel === 'EMAIL' ? draft.subjectEn : undefined,
    };
    if (editingId) updateTemplate(editingId, payload);
    else addTemplate(payload);
    setOpen(false);
  };

  const addVariable = () => {
    const v = varDraft.trim().replace(/[{}]/g, '');
    if (!v || draft.variables.includes(v)) return;
    setDraft({ ...draft, variables: [...draft.variables, v] });
    setVarDraft('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>{t('smsTemplates.title')}</CardTitle>
            <CardDescription className="mt-1">{t('smsTemplates.subtitle')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4" />
              {tc('buttons.reset')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  {t('smsTemplates.addTemplate')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? t('smsTemplates.editTemplate') : t('smsTemplates.addTemplate')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pe-1">
                  <div className="grid grid-cols-[1fr_140px] gap-3">
                    <div className="space-y-2">
                      <Label>{t('smsTemplates.fields.name')}</Label>
                      <Input
                        dir="ltr"
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        placeholder="team_member_invitation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('smsTemplates.fields.channel')}</Label>
                      <select
                        value={draft.channel}
                        onChange={(e) => setDraft({ ...draft, channel: e.target.value as SmsTemplateChannel })}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="SMS">SMS</option>
                        <option value="EMAIL">EMAIL</option>
                        <option value="PUSH">PUSH</option>
                      </select>
                    </div>
                  </div>

                  {draft.channel === 'EMAIL' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{t('smsTemplates.fields.subject')} (AR)</Label>
                        <Input value={draft.subjectAr} onChange={(e) => setDraft({ ...draft, subjectAr: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('smsTemplates.fields.subject')} (EN)</Label>
                        <Input dir="ltr" value={draft.subjectEn} onChange={(e) => setDraft({ ...draft, subjectEn: e.target.value })} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t('smsTemplates.fields.body')} (AR)</Label>
                    <textarea
                      rows={5}
                      value={draft.bodyAr}
                      onChange={(e) => setDraft({ ...draft, bodyAr: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('smsTemplates.fields.body')} (EN)</Label>
                    <textarea
                      rows={5}
                      dir="ltr"
                      value={draft.bodyEn}
                      onChange={(e) => setDraft({ ...draft, bodyEn: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('smsTemplates.fields.variables')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        dir="ltr"
                        value={varDraft}
                        onChange={(e) => setVarDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariable(); } }}
                        placeholder="memberName"
                      />
                      <Button type="button" variant="outline" onClick={addVariable}>{tc('buttons.add')}</Button>
                    </div>
                    {draft.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {draft.variables.map((v) => (
                          <Badge key={v} variant="outline" className="gap-1 font-mono">
                            {`{${v}}`}
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, variables: draft.variables.filter((x) => x !== v) })}
                              className="hover:text-destructive"
                              aria-label={`Remove ${v}`}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm">{t('smsTemplates.fields.active')}</span>
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>{tc('buttons.cancel')}</Button>
                  <Button onClick={onSave} disabled={!draft.name.trim() || !draft.bodyAr.trim() || !draft.bodyEn.trim()}>
                    {tc('buttons.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {templates.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
            {t('smsTemplates.empty')}
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-medium">{tmpl.name}</code>
                      <Badge variant="outline">{tmpl.channel}</Badge>
                      <button type="button" onClick={() => toggleActive(tmpl.id)}>
                        <Badge variant={tmpl.active ? 'default' : 'outline'}>
                          {tmpl.active ? t('cargoTypes.statusActive') : t('cargoTypes.statusInactive')}
                        </Badge>
                      </button>
                    </div>
                    {tmpl.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tmpl.variables.map((v) => (
                          <code key={v} className="text-[11px] px-1.5 py-0.5 rounded bg-muted font-mono">
                            {`{${v}}`}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(tmpl)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`Delete "${tmpl.name}"?`)) removeTemplate(tmpl.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded-md leading-relaxed">
                    {locale === 'ar' ? tmpl.bodyAr : tmpl.bodyEn}
                  </pre>
                  <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded-md leading-relaxed" dir={locale === 'ar' ? 'ltr' : 'rtl'}>
                    {locale === 'ar' ? tmpl.bodyEn : tmpl.bodyAr}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
