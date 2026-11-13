import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

/**
 * Typography system from Stitch "Heritage Handloom Luxury" design.
 *
 * Headings: Playfair Display (literary high-contrast serif)
 * Body/Labels: Plus Jakarta Sans (clear geometric sans)
 *
 * Note: Custom fonts loaded via expo-font in App.tsx.
 * Falls back to system fonts until loaded.
 */

const headlineFamily = Platform.select({
  web: '"Playfair Display", Georgia, serif',
  default: 'PlayfairDisplay',
});

const bodyFamily = Platform.select({
  web: '"Plus Jakarta Sans", -apple-system, sans-serif',
  default: 'PlusJakartaSans',
});

export const typography = StyleSheet.create({
  // ── Headlines (Playfair Display) ──
  headlineXl: {
    fontFamily: headlineFamily,
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.onSurface,
  },
  headlineLg: {
    fontFamily: headlineFamily,
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 32,
    letterSpacing: -0.26,
    color: colors.onSurface,
  },
  headlineMd: {
    fontFamily: headlineFamily,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 26,
    color: colors.onSurface,
  },

  // ── Body (Plus Jakarta Sans) ──
  bodyLg: {
    fontFamily: bodyFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: 0.16,
    color: colors.onSurface,
  },
  bodyMd: {
    fontFamily: bodyFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0.14,
    color: colors.onSurface,
  },
  bodySm: {
    fontFamily: bodyFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.24,
    color: colors.onSurfaceVariant,
  },

  // ── Labels (Plus Jakarta Sans, uppercase tracking) ──
  labelLg: {
    fontFamily: bodyFamily,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 1.04, // 0.08em
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  labelMd: {
    fontFamily: bodyFamily,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 1.32, // 0.12em
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  labelSm: {
    fontFamily: bodyFamily,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    letterSpacing: 1.26, // 0.14em
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },

  // ── Currency (Plus Jakarta Sans, tabular) ──
  currencyMd: {
    fontFamily: bodyFamily,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.15,
    color: colors.primary,
  },
  currencyStrike: {
    fontFamily: bodyFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.neutral,
    textDecorationLine: 'line-through',
  },

  // ── Button ──
  button: {
    fontFamily: bodyFamily,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 1.04,
    textTransform: 'uppercase',
  },
});
