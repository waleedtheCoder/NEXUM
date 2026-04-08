// ─────────────────────────────────────────────────────────────────────────────
// theme.js
//
// Two complete color palettes:
//   lightColors — white backgrounds, teal primary
//   darkColors  — near-black backgrounds, rust-orange primary
//
// fonts / spacing / radii / shadows are theme-independent — they never change.
//
// Usage in screens:
//   import { useTheme } from '../hooks/useTheme';
//   const { colors } = useTheme();
// ─────────────────────────────────────────────────────────────────────────────

export const lightColors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary:      '#0F766E',   // teal green — headers, buttons, labels
  primaryDark:  '#0D6660',   // pressed state
  primaryLight: '#E5F5EA',   // tinted backgrounds (icon containers, pills)

  // ── Accent (secondary action color) ────────────────────────────────────────
  accent:       '#F97316',   // orange — secondary CTAs, highlights
  accentDark:   '#EA580C',

  // ── Semantic ───────────────────────────────────────────────────────────────
  green:        '#84CC16',   // lime — verified badges, new dots
  greenDark:    '#65A30D',
  error:        '#EF4444',

  // ── Backgrounds ────────────────────────────────────────────────────────────
  background:   '#FFFFFF',   // page / screen background
  backgroundAlt:'#F9FAFB',   // subtle off-white for inner sections
  surface:      '#FFFFFF',   // cards, modals, inputs
  surfaceAlt:   '#F3F4F6',   // slightly darker surface (nested cards)

  // ── Borders ────────────────────────────────────────────────────────────────
  border:       '#E5E7EB',
  borderLight:  '#F3F4F6',

  // ── Text ───────────────────────────────────────────────────────────────────
  text:          '#111827',
  textSecondary: '#6B7280',
  textLight:     '#9CA3AF',
  textOnPrimary: '#FFFFFF',  // text on primary-colored backgrounds

  // ── Fixed (never change between themes) ────────────────────────────────────
  splash: '#00A859',         // logo / splash screen green

  isDark: false,
};

export const darkColors = {
  // ── Brand (rust orange becomes primary in dark mode) ───────────────────────
  primary:      '#C2410C',   // rust orange — headers, buttons, labels
  primaryDark:  '#9A3412',   // pressed state
  primaryLight: '#3D1505',   // tinted backgrounds (low-opacity rust tint)

  // ── Accent (teal becomes secondary in dark mode) ───────────────────────────
  accent:       '#0F766E',   // teal — secondary CTAs
  accentDark:   '#0D6660',

  // ── Semantic ───────────────────────────────────────────────────────────────
  green:        '#84CC16',   // same — semantic, doesn't shift with theme
  greenDark:    '#65A30D',
  error:        '#F87171',   // slightly lighter red for dark backgrounds

  // ── Backgrounds ────────────────────────────────────────────────────────────
  background:   '#0A0A0A',   // near-black screen background
  backgroundAlt:'#111111',   // slightly lighter inner sections
  surface:      '#161616',   // cards, modals
  surfaceAlt:   '#1F1F1F',   // nested cards

  // ── Borders ────────────────────────────────────────────────────────────────
  border:       '#2A2A2A',
  borderLight:  '#1E1E1E',

  // ── Text ───────────────────────────────────────────────────────────────────
  text:          '#F5F5F5',
  textSecondary: '#A3A3A3',
  textLight:     '#525252',
  textOnPrimary: '#FFFFFF',

  // ── Fixed ──────────────────────────────────────────────────────────────────
  splash: '#00A859',

  isDark: true,
};

// ── Theme-independent tokens (never change) ───────────────────────────────────
export const fonts = {
  regular:  'Montserrat-Regular',
  medium:   'Montserrat-Medium',
  semiBold: 'Montserrat-SemiBold',
  bold:     'Montserrat-Bold',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const radii = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  xxl:  20,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
};

// ── Legacy default export (backward compat — prefer useTheme() in components) ─
export const colors = lightColors;