/**
 * Sajani color palette — derived from Stitch "Heritage Handloom Luxury" design system.
 * Colors sourced from natural organic dyes and temple architecture of Odisha:
 * madder root maroon, pattachitra terracotta, raw tussar ivory, ritual metallic gold.
 */
export const colors = {
  // ── Primary ──
  primary: '#6B1D2A',         // Deep maroon — CTAs, active nav, brand anchors
  primaryDark: '#4D0516',     // Darker maroon
  primaryContainer: '#6B1D2A',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#EF848F',

  // ── Secondary (Gold) ──
  secondary: '#C4A265',       // Heirloom gold — certifications, luxury highlights
  secondaryLight: '#D4B87A',
  secondaryContainer: '#FED896',
  onSecondary: '#FFFFFF',

  // ── Tertiary (Terracotta) ──
  tertiary: '#C67B4B',        // Terracotta — stock alerts, artisan callouts
  tertiaryContainer: '#602A00',
  onTertiary: '#FFFFFF',

  // ── Surfaces ──
  surface: '#FFF8F4',         // Warm ivory canvas (NOT pure white)
  surfaceDim: '#E1D9D2',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FBF2EB',
  surfaceContainer: '#F5ECE6',
  surfaceContainerHigh: '#EFE7E0',
  surfaceContainerHighest: '#E9E1DA',
  background: '#FFF8F4',

  // ── On Surface ──
  onSurface: '#1E1B17',       // Primary text
  onSurfaceVariant: '#554243', // Secondary text, captions
  inverseSurface: '#34302B',
  inverseOnSurface: '#F8EFE8',

  // ── Outline ──
  outline: '#877273',
  outlineVariant: '#DAC0C1',
  border: '#E6DFD5',          // Hairline borders

  // ── Functional ──
  success: '#2D6A4F',         // Forest green — "In Stock", authenticity
  warning: '#FF9500',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',

  // ── Special ──
  whatsapp: '#25D366',        // WhatsApp concierge
  neutral: '#5A5550',         // Softened slate — captions, specs

  // ── Convenience ──
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;
