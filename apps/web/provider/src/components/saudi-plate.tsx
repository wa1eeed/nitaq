import { cn } from '@/lib/utils';

/**
 * The 17 officially-allowed Saudi plate letters with their Latin equivalents.
 * Letters NOT on this list: ت، ث، ج، ذ، ز، ش، ض، ظ، غ، ف، خ، ة، ء، ى
 */
export const SAUDI_PLATE_LETTERS = [
  { ar: 'أ',  en: 'A' },
  { ar: 'ب',  en: 'B' },
  { ar: 'ح',  en: 'J' },
  { ar: 'د',  en: 'D' },
  { ar: 'ر',  en: 'R' },
  { ar: 'س',  en: 'S' },
  { ar: 'ص',  en: 'X' },
  { ar: 'ط',  en: 'T' },
  { ar: 'ع',  en: 'E' },
  { ar: 'ق',  en: 'G' },
  { ar: 'ك',  en: 'K' },
  { ar: 'ل',  en: 'L' },
  { ar: 'م',  en: 'Z' },
  { ar: 'ن',  en: 'N' },
  { ar: 'هـ', en: 'H' },
  { ar: 'و',  en: 'U' },
  { ar: 'ي',  en: 'V' },
] as const;

export type SaudiLetter = (typeof SAUDI_PLATE_LETTERS)[number];
export type PlateType = 'light' | 'public';

export interface SaudiPlateProps {
  /** Up to 3 Arabic letters, e.g. ['أ', 'ب', 'ح']. */
  letters?: (string | undefined | null)[];
  /** Up to 3 Latin equivalents. If omitted, inferred from `letters`. */
  lettersEn?: (string | undefined | null)[];
  /** Plate digits (Western, e.g. "1234"). 1-4 chars. */
  numbers?: string;
  /** Registration type — controls sidebar color (blue=light, yellow=public). */
  type?: PlateType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: {
    box: 'w-[180px] h-[60px]', sidebar: 'w-3.5',
    title: 'text-[14px]',      emblem: 18,
    letterAr: 'text-[12px]',   letterEn: 'text-[9px]',
    digitAr: 'text-[12px]',    digitEn: 'text-[11px]',
    cellPad: 'px-1.5',
  },
  md: {
    box: 'w-[240px] h-[78px]', sidebar: 'w-5',
    title: 'text-[18px]',      emblem: 26,
    letterAr: 'text-[16px]',   letterEn: 'text-[13px]',
    digitAr: 'text-[16px]',    digitEn: 'text-[15px]',
    cellPad: 'px-2',
  },
  lg: {
    box: 'w-[320px] h-[100px]',sidebar: 'w-7',
    title: 'text-[22px]',      emblem: 34,
    letterAr: 'text-[20px]',   letterEn: 'text-[16px]',
    digitAr: 'text-[20px]',    digitEn: 'text-[18px]',
    cellPad: 'px-2.5',
  },
} as const;

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabicDigits = (s: string) =>
  s.replace(/[0-9]/g, (d) => AR_DIGITS[parseInt(d, 10)] ?? d);

function inferEnglish(arLetters?: (string | null | undefined)[]): string[] {
  return (arLetters ?? []).map((l) => {
    if (!l) return '';
    const match = SAUDI_PLATE_LETTERS.find((x) => x.ar === l);
    return match?.en ?? '';
  });
}

/**
 * KSA emblem — tall palm tree above two crossed swords with decorative
 * curled grip-hilts at the base. Matches the official monochrome silhouette.
 */
function KsaEmblem({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* PALM CROWN — 9 fronds fanning out from the top of the trunk */}
      <g>
        {/* Center vertical frond */}
        <ellipse cx="50" cy="14" rx="3" ry="11" />
        {/* Right-side fronds, rotated around the trunk-top pivot (50,25) */}
        <ellipse cx="50" cy="14" rx="3" ry="11" transform="rotate(22 50 25)" />
        <ellipse cx="50" cy="14" rx="3" ry="11" transform="rotate(44 50 25)" />
        <ellipse cx="50" cy="14" rx="3" ry="11" transform="rotate(66 50 25)" />
        <ellipse cx="50" cy="14" rx="3" ry="11" transform="rotate(86 50 25)" />
        {/* Left-side fronds (mirror) */}
        <ellipse cx="50" cy="14" rx="3" ry="11" transform="rotate(-22 50 25)" />
        <ellipse cx="50" cy="14" rx="3" ry="11" transform="rotate(-44 50 25)" />
        <ellipse cx="50" cy="14" rx="3" ry="11" transform="rotate(-66 50 25)" />
        <ellipse cx="50" cy="14" rx="3" ry="11" transform="rotate(-86 50 25)" />
      </g>

      {/* TRUNK — tall, with segmented rings */}
      <rect x="47" y="24" width="6" height="40" />
      <rect x="44" y="30" width="12" height="2" />
      <rect x="44" y="38" width="12" height="2" />
      <rect x="44" y="46" width="12" height="2" />
      <rect x="44" y="54" width="12" height="2" />

      {/* CROSSED SWORDS — curved blades sweeping outward like wings */}
      {/* Right blade (left base → up-right tip) */}
      <path d="M50 64 Q72 56 94 64 Q95 67 92 68 Q72 62 50 70 Z" />
      {/* Left blade (right base → up-left tip) */}
      <path d="M50 64 Q28 56 6 64 Q5 67 8 68 Q28 62 50 70 Z" />

      {/* GRIP HILTS — decorative curled pommels at the bottom */}
      {/* Inner left curl */}
      <path
        d="M44 70 Q40 76 44 82 Q49 84 50 79 Q50 75 47 75 Q45 75 45 77"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Outer left curl */}
      <path
        d="M34 72 Q28 78 32 85 Q38 88 40 82 Q40 77 36 77 Q33 77 33 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Inner right curl */}
      <path
        d="M56 70 Q60 76 56 82 Q51 84 50 79 Q50 75 53 75 Q55 75 55 77"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Outer right curl */}
      <path
        d="M66 72 Q72 78 68 85 Q62 88 60 82 Q60 77 64 77 Q67 77 67 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Saudi license plate component — matches the official KSA layout:
 *
 *   ┌──────────────────────────────────────┬──────┐
 *   │             السعودية                  │      │
 *   │  ٠٠٠٠    🌴 (شعار)    أ ب ح          │      │
 *   │  0000                  J B A          │  📘  │  ← sidebar RIGHT
 *   └──────────────────────────────────────┴──────┘
 *
 * - Arabic letters & digits use Arial.
 * - English letters appear under the Arabic letters (right column).
 * - English digits appear under the Arabic digits (left column).
 * - Sidebar color: blue (#1B3A6B) for light transport, yellow (#F5C518) for public.
 */
export function SaudiPlate({
  letters = [],
  lettersEn,
  numbers = '',
  type = 'light',
  size = 'md',
  className,
}: SaudiPlateProps) {
  const s = SIZES[size];
  const ar = [0, 1, 2].map((i) => letters[i] ?? '');
  const en = lettersEn ?? inferEnglish(ar);
  // Reverse English letters so they read in the same physical order as Arabic
  const enReversed = [en[2] ?? '', en[1] ?? '', en[0] ?? ''];
  const sidebarBg = type === 'light' ? 'bg-[#1B3A6B]' : 'bg-[#F5C518]';
  const arabicNums = numbers ? toArabicDigits(numbers.slice(0, 4)) : '';
  const englishNums = numbers ? numbers.slice(0, 4) : '';
  const phDigits = size === 'lg' ? '٠٠٠٠' : size === 'md' ? '٠٠٠' : '٠٠';
  const phEnDigits = size === 'lg' ? '0000' : size === 'md' ? '000' : '00';
  const arial = { fontFamily: 'Arial, "Arial Unicode MS", sans-serif' };
  const inter = { fontFamily: 'Inter, system-ui, sans-serif' };

  return (
    <div
      dir="ltr"
      className={cn(
        'inline-flex overflow-hidden rounded-lg border-2 bg-white text-[#1a1a1a] shadow-sm',
        'border-[#B0B0B0]',
        s.box,
        className,
      )}
    >
      {/* Main content (left side) */}
      <div className="flex-1 flex flex-col">
        {/* Top: السعودية */}
        <div
          className={cn('text-center font-bold leading-none pt-1 pb-0.5 text-[#1a1a1a]', s.title)}
          style={arial}
        >
          السعودية
        </div>

        {/* Body — 3 cols: Arabic digits LEFT, emblem CENTER, Arabic letters RIGHT */}
        <div className={cn('flex-1 grid grid-cols-[1fr_auto_1fr] items-center', s.cellPad)}>
          {/* Left column — digits stacked (Arabic top, English bottom) */}
          <div className="flex flex-col items-center justify-center leading-tight">
            <div className={cn('font-bold text-[#1a1a1a] tabular-nums', s.digitAr)} style={arial}>
              {arabicNums || <span className="opacity-30">{phDigits}</span>}
            </div>
            <div className={cn('font-black text-[#1a1a1a] tabular-nums', s.digitEn)} style={inter}>
              {englishNums || <span className="opacity-30">{phEnDigits}</span>}
            </div>
          </div>

          {/* Center — emblem */}
          <div className="flex items-center justify-center px-1 border-x border-[#E0E0E0] h-full">
            <KsaEmblem size={s.emblem} />
          </div>

          {/* Right column — letters stacked (Arabic top, English bottom) */}
          <div className="flex flex-col items-center justify-center leading-tight" dir="rtl">
            <div className={cn('font-bold text-[#1a1a1a] tracking-[0.2em]', s.letterAr)} style={arial}>
              {ar.some(Boolean) ? ar.filter(Boolean).join(' ') : <span className="opacity-30">— — —</span>}
            </div>
            <div className={cn('font-bold text-[#1a1a1a] tracking-[0.15em]', s.letterEn)} style={inter} dir="ltr">
              {enReversed.some(Boolean) ? enReversed.filter(Boolean).join(' ') : <span className="opacity-30">— — —</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar — RIGHT side */}
      <div className={cn('shrink-0', s.sidebar, sidebarBg)} />
    </div>
  );
}

/** Parse legacy plate string like "أ ب ج 1234" into structured form. */
export function parsePlateString(input: string): { letters: string[]; numbers: string } {
  const match = input.trim().match(/^([^\d]+?)\s*(\d{1,4})\s*$/);
  if (!match) return { letters: [], numbers: '' };
  const letters = (match[1] ?? '').trim().split(/\s+/).slice(0, 3);
  return { letters, numbers: match[2] ?? '' };
}
