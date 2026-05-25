import * as React from 'react';
import { FileText, Check, Clock, X } from 'lucide-react';
import { cn } from '../utils/cn';

export type KycDocState = 'pending' | 'approved' | 'rejected' | 'missing';

export interface KycDocProps {
  label: string;
  fileName?: string;
  uploadedAt?: string;
  state: KycDocState;
  onView?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
}

const META = {
  pending:  { bg: 'bg-warning/15', text: 'text-warning', label: 'بانتظار',  icon: Clock },
  approved: { bg: 'bg-success/15', text: 'text-success', label: 'معتمد',     icon: Check },
  rejected: { bg: 'bg-destructive/15',   text: 'text-destructive',   label: 'مرفوض',    icon: X },
  missing:  { bg: 'bg-muted',    text: 'text-muted-foreground', label: 'لم يُرفع', icon: FileText },
} as const;

export function KycDoc({ label, fileName, uploadedAt, state, onView, onApprove, onReject, className }: KycDocProps) {
  const m = META[state];
  const Icon = m.icon;
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border border-border bg-card',
      className,
    )}>
      <div className="shrink-0 w-10 h-10 rounded-md bg-muted text-muted-foreground grid place-items-center">
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-base font-semibold text-foreground">{label}</h4>
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', m.bg, m.text)}>
            <Icon className="w-3 h-3" />
            {m.label}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground truncate font-num">
          {fileName ?? '— لا يوجد ملف —'}
          {uploadedAt && <> · {uploadedAt}</>}
        </div>
      </div>
      {state !== 'missing' && (
        <div className="shrink-0 flex items-center gap-1">
          {onView && <BtnLink onClick={onView}>عرض</BtnLink>}
          {state === 'pending' && onApprove && <BtnLink tone="success" onClick={onApprove}>اعتماد</BtnLink>}
          {state === 'pending' && onReject && <BtnLink tone="error" onClick={onReject}>رفض</BtnLink>}
        </div>
      )}
    </div>
  );
}

function BtnLink({ children, onClick, tone = 'default' }: { children: React.ReactNode; onClick?: () => void; tone?: 'default' | 'success' | 'error' }) {
  const cls =
    tone === 'success' ? 'text-success hover:bg-success/15' :
    tone === 'error'   ? 'text-destructive hover:bg-destructive/15' :
                         'text-foreground hover:bg-muted';
  return (
    <button onClick={onClick} className={cn('h-8 px-3 rounded-md text-xs font-semibold transition-colors', cls)}>
      {children}
    </button>
  );
}
