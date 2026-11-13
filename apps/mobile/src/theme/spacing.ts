/**
 * Spacing and border radius from Stitch design system.
 * Layout optimized for 375px mobile viewport with 4-column fluid grid.
 */
export const spacing = {
  xs: 4,    // space-xs: 0.25rem
  sm: 8,    // space-sm: 0.5rem
  md: 16,   // space-md: 1rem
  lg: 24,   // space-lg: 1.5rem
  xl: 40,   // space-xl: 2.5rem
  gutter: 12, // gutter: 0.75rem (card gaps)
  margin: 16,  // canvas margin: 1rem
} as const;

export const borderRadius = {
  sm: 4,     // 0.25rem
  DEFAULT: 8,  // 0.5rem — buttons, badges, inputs
  md: 12,    // 0.75rem
  lg: 16,    // 1rem — cards, modals
  xl: 24,    // 1.5rem — photography containers
  full: 9999,  // pills, tags, cart counters
} as const;

export const elevation = {
  /** Flat tier — hairline border, no shadow */
  flat: {
    borderWidth: 1,
    borderColor: '#E6DFD5',
  },
  /** Raised tier — warm diffused shadow tinted with primary */
  raised: {
    shadowColor: '#6B1D2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  /** Bottom nav — translucent backdrop */
  nav: {
    borderTopWidth: 1,
    borderTopColor: '#E6DFD5',
  },
} as const;
