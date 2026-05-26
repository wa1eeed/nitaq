import { DEFAULT_LEGAL_DOCS } from '@naqla/shared-utils';
import { PageShell } from '@/components/page-shell';
import { Markdown } from '@/components/markdown';

export const metadata = {
  title: 'شروط وأحكام النقل — نِطاق',
  description: 'شروط وأحكام النقل لمنصة نِطاق',
};

export default function TransportTermsPage() {
  const doc = DEFAULT_LEGAL_DOCS.transport;
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
