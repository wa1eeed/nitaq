'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Image as ImageIcon, Link as LinkIcon, RotateCcw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { usePlatformStore } from '@/stores/platform-store';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPTED = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];

/**
 * Branding panel: lets the admin upload (or paste a URL for) the platform
 * logo, plus change the display name in both languages. Writes flow through
 * `usePlatformStore`; the Logo component picks up changes immediately.
 *
 * Upload path: file → base64 data URL in localStorage. In production this
 * would POST to MinIO and store only the resulting public URL.
 */
export function BrandingPanel() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');

  const logoUrl = usePlatformStore((s) => s.logoUrl);
  const nameAr = usePlatformStore((s) => s.nameAr);
  const nameEn = usePlatformStore((s) => s.nameEn);
  const setLogoUrl = usePlatformStore((s) => s.setLogoUrl);
  const setName = usePlatformStore((s) => s.setName);
  const reset = usePlatformStore((s) => s.reset);

  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlDraft, setUrlDraft] = useState(logoUrl);
  const [arDraft, setArDraft] = useState(nameAr);
  const [enDraft, setEnDraft] = useState(nameEn);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError(t('branding.errorFormat'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('branding.errorSize'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      setLogoUrl(result);
      setUrlDraft(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('branding.title')}</CardTitle>
        <CardDescription>{t('branding.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-w-2xl">
        {/* Preview */}
        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <Logo size="lg" />
          <div className="min-w-0">
            <div className="font-semibold truncate">{nameAr}</div>
            <div className="text-xs text-muted-foreground truncate" dir="ltr">{nameEn}</div>
          </div>
          {logoUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="ms-auto text-destructive hover:text-destructive"
              onClick={() => { setLogoUrl(''); setUrlDraft(''); }}
            >
              <Trash2 className="h-4 w-4" />
              {t('branding.removeLogo')}
            </Button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={mode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('upload')}
          >
            <Upload className="h-4 w-4" />
            {t('branding.uploadFromDevice')}
          </Button>
          <Button
            type="button"
            variant={mode === 'url' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('url')}
          >
            <LinkIcon className="h-4 w-4" />
            {t('branding.fromUrl')}
          </Button>
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <div className="space-y-2">
            <Label>{t('branding.chooseImage')}</Label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/40 transition-colors"
            >
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm font-medium">{t('branding.dropOrClick')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('branding.formats')}</div>
            </button>
          </div>
        )}

        {/* URL mode */}
        {mode === 'url' && (
          <div className="space-y-2">
            <Label htmlFor="logo-url">{t('branding.imageUrl')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="logo-url"
                dir="ltr"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <Button
                onClick={async () => {
                  const url = urlDraft.trim();
                  setLogoUrl(url);
                  setError(null);
                  try {
                    await api.put('/admin/settings', {
                      settings: [{ key: 'platform.logoUrl', value: url }],
                    });
                  } catch (err) { notify.error(err, 'فشل حفظ الشعار في قاعدة البيانات'); }
                }}
                disabled={!urlDraft.trim() || urlDraft === logoUrl}
              >
                {tc('buttons.save')}
              </Button>
            </div>
          </div>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}

        {/* Name fields */}
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor="brand-name-ar">{t('branding.nameAr')}</Label>
            <Input
              id="brand-name-ar"
              value={arDraft}
              onChange={(e) => setArDraft(e.target.value)}
              placeholder="نِطاق"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-name-en">{t('branding.nameEn')}</Label>
            <Input
              id="brand-name-en"
              dir="ltr"
              value={enDraft}
              onChange={(e) => setEnDraft(e.target.value)}
              placeholder="Nitaq"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={async () => {
                const ar = arDraft.trim() || nameAr;
                const en = enDraft.trim() || nameEn;
                setName({ nameAr: ar, nameEn: en });
                try {
                  await api.put('/admin/settings', {
                    settings: [
                      { key: 'platform.nameAr', value: ar },
                      { key: 'platform.nameEn', value: en },
                    ],
                  });
                } catch (err) { notify.error(err, 'فشل حفظ الاسم في قاعدة البيانات'); }
              }}
              disabled={arDraft === nameAr && enDraft === nameEn}
            >
              {t('branding.saveNames')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm(t('branding.confirmReset'))) {
                  reset();
                  setArDraft('نِطاق');
                  setEnDraft('Nitaq');
                  setUrlDraft('');
                }
              }}
            >
              <RotateCcw className="h-4 w-4" />
              {t('branding.resetDefaults')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
