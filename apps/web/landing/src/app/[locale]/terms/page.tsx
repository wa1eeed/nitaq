import { DEFAULT_LEGAL_DOCS } from '@naqla/shared-utils';
import { PageShell } from '@/components/page-shell';
import { Markdown } from '@/components/markdown';

export const metadata = {
  title: 'شروط الاستخدام — نقلة لوجيستك',
  description: 'شروط الاستخدام لمنصة نقلة لوجيستك',
};

export default function TermsPage() {
  const doc = DEFAULT_LEGAL_DOCS.terms;
  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-xs text-muted-foreground mb-2">
          الإصدار <span className="num font-mono">v{doc.version}</span>
        </div>
        <Markdown content={doc.content} />
      </div>
    </PageShell>
  );
}
