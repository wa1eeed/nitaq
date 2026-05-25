'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle, BadgeCheck, Check, Crown, MoreVertical, Pencil, Plus, Trash2, X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  availableRolesFor, formatDate, permissionsFor, teamMembersFor,
  type CompanyKind, type CompanyRole, type TeamMember,
} from '@naqla/shared-utils';
import { cn } from '@/lib/utils';

interface TeamTabProps {
  companyId: string;
  companyKind: CompanyKind;
  /** Current viewer's role — controls which actions are enabled */
  currentRole: CompanyRole;
}

/**
 * Team Members tab — list, add, edit role, suspend, remove.
 * Wired to `messages/{ar,en}/settings.json` so it fully respects the locale.
 */
export function TeamTab({ companyId, companyKind, currentRole }: TeamTabProps) {
  const t = useTranslations('settings.team');
  const tRoles = useTranslations('settings.team.roles');

  const [members, setMembers] = useState<TeamMember[]>(() => teamMembersFor(companyId));
  const [addOpen, setAddOpen] = useState(false);

  const canManageTeam = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Sort: OWNER first, then ADMIN, then by addedAt desc
  const sorted = useMemo(() => {
    const rank: Record<CompanyRole, number> = { OWNER: 0, ADMIN: 1, DISPATCH: 2, STAFF: 2, FINANCE: 3 };
    return [...members].sort((a, b) => rank[a.role] - rank[b.role]
      || new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }, [members]);

  // Permission guard banner
  if (!canManageTeam) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-warning/15 text-warning mx-auto grid place-items-center mb-3">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-lg">{t('noPermissionTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('noPermissionBody')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addMember')}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{t('noMembers')}</CardContent></Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          {sorted.map((m, i) => (
            <MemberRow
              key={m.id}
              member={m}
              isLast={i === sorted.length - 1}
              tRoles={tRoles}
              t={t}
              onSuspend={() => setMembers((s) => s.map((x) => x.id === m.id ? { ...x, status: 'SUSPENDED' } : x))}
              onActivate={() => setMembers((s) => s.map((x) => x.id === m.id ? { ...x, status: 'ACTIVE' } : x))}
              onRemove={() => setMembers((s) => s.filter((x) => x.id !== m.id))}
            />
          ))}
        </div>
      )}

      <AddMemberDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        companyKind={companyKind}
        onAdd={(member) => {
          setMembers((s) => [...s, member]);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────

function MemberRow({
  member, isLast, t, tRoles, onSuspend, onActivate, onRemove,
}: {
  member: TeamMember; isLast: boolean;
  t: ReturnType<typeof useTranslations>;
  tRoles: ReturnType<typeof useTranslations>;
  onSuspend: () => void; onActivate: () => void; onRemove: () => void;
}) {
  const initials = member.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('');
  return (
    <div className={cn('flex items-center gap-3 p-4', !isLast && 'border-b')}>
      <Avatar className="h-10 w-10">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold truncate">{member.fullName}</span>
          {member.isOwner && <Crown className="h-4 w-4 text-warning shrink-0" />}
          {member.status === 'SUSPENDED' && <Badge variant="destructive" className="text-[10px]">{t('suspended')}</Badge>}
          {member.status === 'PENDING_ACTIVATION' && <Badge variant="warning" className="text-[10px]">{t('pendingActivation')}</Badge>}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="num" dir="ltr">{member.phone}</span>
          {member.email && <span dir="ltr">· {member.email}</span>}
          <span>· {t('addedAt')} {formatDate(member.addedAt)}</span>
        </div>
      </div>
      <div className="hidden sm:block shrink-0">
        <RoleBadge role={member.role} tRoles={tRoles} />
      </div>
      <div className="shrink-0">
        {member.isOwner ? (
          <Badge variant="outline" className="gap-1">
            <BadgeCheck className="h-3 w-3" /> {t('owner')}
          </Badge>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Pencil className="h-3.5 w-3.5" /> {t('actions.editRole')}</DropdownMenuItem>
              {member.status === 'ACTIVE' ? (
                <DropdownMenuItem onClick={() => { if (confirm(t('actions.confirmSuspend'))) onSuspend(); }}>
                  <X className="h-3.5 w-3.5" /> {t('actions.suspend')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onActivate}>
                  <Check className="h-3.5 w-3.5" /> {t('actions.activate')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => { if (confirm(t('actions.confirmRemoveBody'))) onRemove(); }}
              >
                <Trash2 className="h-3.5 w-3.5" /> {t('actions.remove')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role, tRoles }: { role: CompanyRole; tRoles: ReturnType<typeof useTranslations> }) {
  const tone: Record<CompanyRole, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
    OWNER: 'warning', ADMIN: 'default', STAFF: 'outline', DISPATCH: 'outline', FINANCE: 'success',
  };
  return (
    <Badge variant={tone[role]} className="gap-1">
      <span>{tRoles(`${role}.icon`)}</span>
      {tRoles(`${role}.label`)}
    </Badge>
  );
}

// ─── Add Member Dialog ──────────────────────────────────────────────

function AddMemberDialog({
  open, onClose, companyKind, onAdd,
}: {
  open: boolean; onClose: () => void; companyKind: CompanyKind;
  onAdd: (m: TeamMember) => void;
}) {
  const t = useTranslations('settings.team');
  const tRoles = useTranslations('settings.team.roles');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CompanyRole | null>(null);

  const roles = availableRolesFor(companyKind);
  const valid = fullName.trim().length > 1 && /^(\+?966|0)?5\d{8}$/.test(phone.replace(/\s+/g, '')) && !!role;

  const submit = () => {
    if (!valid || !role) return;
    onAdd({
      id: `TM-${Date.now().toString(36)}`,
      companyId: 'PENDING',
      fullName: fullName.trim(),
      phone,
      email: email.trim() || undefined,
      role,
      status: 'PENDING_ACTIVATION',
      addedAt: new Date().toISOString(),
    });
    setFullName(''); setPhone(''); setEmail(''); setRole(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <DialogTitle>{t('addMemberTitle')}</DialogTitle>
          <DialogDescription>{t('addMemberSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('fullName')}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="—" />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input dir="ltr" className="text-end" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5XX XXX XXXX" />
              <p className="text-xs text-muted-foreground">{t('phoneRequired')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('email')}</Label>
            <Input dir="ltr" className="text-end" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.sa" />
          </div>

          <div className="space-y-3">
            <Label>{t('selectRole')}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map((r) => (
                <RoleCard
                  key={r}
                  role={r}
                  companyKind={companyKind}
                  selected={role === r}
                  onSelect={() => setRole(r)}
                  tRoles={tRoles}
                  tBase={t}
                />
              ))}
            </div>
          </div>

          <div className="rounded-md bg-info/10 border border-info/30 p-3 text-xs text-muted-foreground">
            📱 {t('smsNotice')}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>إلغاء / Cancel</Button>
          <Button onClick={submit} disabled={!valid}>
            <Plus className="h-4 w-4" /> {t('addMember')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleCard({
  role, companyKind, selected, onSelect, tRoles, tBase,
}: {
  role: CompanyRole;
  companyKind: CompanyKind;
  selected: boolean;
  onSelect: () => void;
  tRoles: ReturnType<typeof useTranslations>;
  tBase: ReturnType<typeof useTranslations>;
}) {
  const perms = permissionsFor(companyKind, role);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col p-4 rounded-lg border-2 text-start transition-colors',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl" aria-hidden>{tRoles(`${role}.icon`)}</span>
        <span className="font-bold">{tRoles(`${role}.label`)}</span>
      </div>
      <ul className="space-y-1.5 mb-2">
        {perms.can.map((p, i) => (
          <li key={`y-${i}`} className="flex items-start gap-1.5 text-xs">
            <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
            <span className="leading-relaxed">{p}</span>
          </li>
        ))}
      </ul>
      {perms.cannot.length > 0 && (
        <ul className="space-y-1.5">
          {perms.cannot.map((p, i) => (
            <li key={`n-${i}`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}
