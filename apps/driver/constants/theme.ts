import { Platform } from 'react-native';

export const COLORS = {
  // Brand
  primary:       '#0A7EA4',
  primaryDark:   '#065F7E',
  primaryLight:  '#E0F2FE',
  primaryGlow:   'rgba(10,126,164,0.25)',

  // Semantic
  success:      '#16A34A',
  successLight: 'rgba(22,163,74,0.15)',
  warning:      '#F59E0B',
  warningLight: 'rgba(245,158,11,0.15)',
  danger:       '#DC2626',
  dangerLight:  'rgba(220,38,38,0.15)',
  info:         '#0284C7',
  infoLight:    'rgba(2,132,199,0.15)',

  // Dark backgrounds
  bg:           '#0F172A',
  bgCard:       '#1E293B',
  bgSurface:    '#263548',
  bgElevated:   '#2D3F55',

  // Text
  text:         '#F8FAFC',
  textSecondary:'#CBD5E1',
  textMuted:    '#64748B',
  textInverse:  '#0F172A',
  white:        '#FFFFFF',

  // Borders
  border:       '#334155',
  borderLight:  '#1E293B',

  // Other
  overlay:      'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(15,23,42,0.6)',
};

export const GRADIENTS = {
  primary:   ['#0A7EA4', '#065F7E'] as string[],
  success:   ['#16A34A', '#15803D'] as string[],
  danger:    ['#DC2626', '#B91C1C'] as string[],
  dark:      ['#1E293B', '#0F172A'] as string[],
  card:      ['#263548', '#1E293B'] as string[],
  overlay:   ['transparent', 'rgba(15,23,42,0.95)'] as string[],
};

export const FONTS = {
  regular:  'Cairo_400Regular',
  medium:   'Cairo_500Medium',
  semiBold: 'Cairo_600SemiBold',
  bold:     'Cairo_700Bold',
};

export const FONT_SIZE = {
  display: 32,
  title:   24,
  heading: 20,
  body:    16,
  label:   14,
  caption: 13,
  micro:   11,
};

export const SPACING = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const RADIUS = {
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  full:  9999,
};

export const SHADOW = {
  sm: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    android: { elevation: 3 },
  }) ?? {},
  md: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
    android: { elevation: 6 },
  }) ?? {},
  lg: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16 },
    android: { elevation: 12 },
  }) ?? {},
  primary: Platform.select({
    ios:     { shadowColor: '#0A7EA4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
    android: { elevation: 8 },
  }) ?? {},
};

export const STATUS_LABEL: Record<string, string> = {
  PENDING:    'في الانتظار',
  ASSIGNED:   'مُسند',
  CONFIRMED:  'مؤكَّد',
  IN_TRANSIT: 'في الطريق',
  DELIVERED:  'تم التسليم',
  COMPLETED:  'مكتمل',
  CANCELLED:  'ملغي',
  DISPUTED:   'نزاع',
};

export const STATUS_COLOR: Record<string, { bg: string; text: string; glow?: string }> = {
  PENDING:    { bg: 'rgba(245,158,11,0.15)',  text: '#F59E0B',  glow: 'rgba(245,158,11,0.3)' },
  ASSIGNED:   { bg: 'rgba(10,126,164,0.15)',  text: '#0A7EA4',  glow: 'rgba(10,126,164,0.3)' },
  CONFIRMED:  { bg: 'rgba(2,132,199,0.15)',   text: '#0284C7',  glow: 'rgba(2,132,199,0.3)' },
  IN_TRANSIT: { bg: 'rgba(245,158,11,0.15)',  text: '#F59E0B',  glow: 'rgba(245,158,11,0.3)' },
  DELIVERED:  { bg: 'rgba(22,163,74,0.15)',   text: '#16A34A',  glow: 'rgba(22,163,74,0.3)' },
  COMPLETED:  { bg: 'rgba(22,163,74,0.15)',   text: '#16A34A',  glow: 'rgba(22,163,74,0.3)' },
  CANCELLED:  { bg: 'rgba(220,38,38,0.15)',   text: '#DC2626' },
  DISPUTED:   { bg: 'rgba(220,38,38,0.15)',   text: '#DC2626' },
};
