export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'SAR',
  locale: 'ar' | 'en' = 'ar',
): string {
  if (amount === null || amount === undefined) return '—';
  const intlLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(
  value: number | null | undefined,
  locale: 'ar' | 'en' = 'ar',
): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(value);
}

export function formatDate(
  date: string | Date | null | undefined,
  pattern: string = 'd MMMM yyyy',
  locale: 'ar' | 'en' = 'ar',
): string {
  if (!date) return '—';
  const d = new Date(date);
  const intlLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: pattern.includes('MMMM') ? 'long' : 'short',
    year: 'numeric',
  };
  if (pattern.includes('HH:mm')) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
    opts.hour12 = false;
  }
  return new Intl.DateTimeFormat(intlLocale, opts).format(d);
}

export function formatDateTime(
  date: string | Date | null | undefined,
  locale: 'ar' | 'en' = 'ar',
): string {
  return formatDate(date, 'd MMM yyyy HH:mm', locale);
}

export function formatRelative(
  date: string | Date | null | undefined,
  locale: 'ar' | 'en' = 'ar',
): string {
  if (!date) return '—';
  const diffMs = new Date(date).getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { numeric: 'auto' });
  if (absMs < 60_000) return rtf.format(Math.round(diffMs / 1000), 'second');
  if (absMs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), 'minute');
  if (absMs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), 'hour');
  if (absMs < 2_592_000_000) return rtf.format(Math.round(diffMs / 86_400_000), 'day');
  if (absMs < 31_536_000_000) return rtf.format(Math.round(diffMs / 2_592_000_000), 'month');
  return rtf.format(Math.round(diffMs / 31_536_000_000), 'year');
}

export function formatWeight(kg: number | null | undefined): string {
  if (kg === null || kg === undefined) return '—';
  if (kg >= 1000) return `${formatNumber(kg / 1000)} طن`;
  return `${formatNumber(kg)} كجم`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('966')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return phone;
}

export function truncate(text: string | null | undefined, max: number = 60): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
