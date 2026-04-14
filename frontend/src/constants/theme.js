// ─────────────────────────────────────────────────────────────────────────────
// theme.js — Bubbly 3D redesign
//
// Two complete color palettes (unchanged hues from v1):
//   lightColors — warm off-white backgrounds, teal primary, orange accent
//   darkColors  — near-black backgrounds, rust-orange primary, teal accent
//
// Spacing, fonts, radii, and shadows are theme-independent.
// ─────────────────────────────────────────────────────────────────────────────

export const lightColors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary:      '#0F766E',   // teal green — headers, buttons, labels
  primaryDark:  '#0a524d',   // 3D button bottom-edge / pressed state
  primaryLight: '#E5F5EA',   // tinted backgrounds (icon containers, pills)

  // ── Accent ─────────────────────────────────────────────────────────────────
  accent:       '#F97316',   // orange — secondary CTAs, highlights
  accentDark:   '#C2520A',   // 3D button bottom-edge for accent buttons

  // ── Semantic ───────────────────────────────────────────────────────────────
  green:        '#84CC16',
  greenDark:    '#65A30D',
  error:        '#EF4444',

  // ── Backgrounds ────────────────────────────────────────────────────────────
  // Page background is warm off-white so pure-white cards visibly float above it
  background:   '#F5F2EE',   // warm off-white screen / page background
  backgroundAlt:'#EDE9E3',   // slightly deeper for nested sections
  surface:      '#FFFFFF',   // cards, modals, inputs — always pure white
  surfaceAlt:   '#F7F5F2',   // slightly warm surface for nested cards

  // ── Borders ────────────────────────────────────────────────────────────────
  border:       '#E5E7EB',
  borderLight:  '#F3F4F6',

  // ── Text ───────────────────────────────────────────────────────────────────
  text:          '#111827',
  textSecondary: '#6B7280',
  textLight:     '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // ── Fixed ──────────────────────────────────────────────────────────────────
  splash: '#00A859',

  isDark: false,
};

export const darkColors = {
  // ── Brand (rust orange is primary in dark mode) ────────────────────────────
  primary:      '#C2410C',
  primaryDark:  '#9A3412',   // 3D button bottom-edge in dark mode
  primaryLight: '#3D1505',

  // ── Accent (teal is accent in dark mode) ───────────────────────────────────
  accent:       '#0F766E',
  accentDark:   '#0D6660',

  // ── Semantic ───────────────────────────────────────────────────────────────
  green:        '#84CC16',
  greenDark:    '#65A30D',
  error:        '#F87171',

  // ── Backgrounds ────────────────────────────────────────────────────────────
  background:   '#0A0A0A',
  backgroundAlt:'#111111',
  surface:      '#161616',
  surfaceAlt:   '#1F1F1F',

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

// ── Theme-independent design tokens ──────────────────────────────────────────

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

// Bubbly 3D radius scale — everything is more rounded than before
export const radii = {
  sm:   8,    // small badges, chips within compact areas
  md:   16,   // input fields, small cards
  lg:   20,   // medium surfaces, perk rows
  xl:   24,   // main content cards
  xxl:  28,   // screen headers, modals, large panels
  full: 999,  // pills, chips, avatar borders
};

// Shadow scale — three tiers for different elevations
export const shadows = {
  // Subtle — for small chips and inline elements
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  // Standard card lift — the workhorse
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
  },
  // Floating panels — BottomNav, modals, hero banners
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  // Alias kept for backward compat
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
  },
};

// ── Legacy default export (backward compat) ───────────────────────────────────
export const colors = lightColors;
