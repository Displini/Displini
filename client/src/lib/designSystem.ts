/**
 * Displini Design System
 * ======================
 * Central source of truth for all design tokens, typography, colors, and styles.
 * Import this file whenever you need consistent styling across the app.
 */

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    primary: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    secondary: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
  },

  // Font Sizes
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Brand Colors
  brand: {
    primary: '#30C4FF',      // Displini Blue
    secondary: '#DB1DD8',    // Displini Pink
    tertiary: '#00FF99',     // Displini Green
  },

  // Feature Colors - Consistent across landing and app
  features: {
    reminders: '#DB1DD8',    // Pink - Reminders
    todo: '#30C4FF',         // Blue - To-Do
    calendar: '#00FF99',     // Green - Calendar
    ai: '#FFF600',           // Yellow - AI Assistant
    menstrual: '#FF3B5F',    // Red - Menstrual Cycle
    sleep: '#4B1DDB',        // Purple - Sleep Schedule
    water: '#3FD2FF',        // Light Blue - Water Intake
    sport: '#FF7A1D',        // Orange - Sport/Fitness
    office: '#00FF99',       // Green - Office/Work
    journal: '#C69C6D',      // Brown - Journal
    medication: '#00CC7A',  // Darker green, distinct from office   // Green - Medication (same as office/calendar)
    school: '#FFD400',       // Yellow - School
  },

  // Gradient Combinations
  gradients: {
    primary: 'linear-gradient(135deg, #30C4FF, #DB1DD8)',
    secondary: 'linear-gradient(135deg, #DB1DD8, #00FF99)',
    tertiary: 'linear-gradient(135deg, #30C4FF, #00FF99)',
    full: 'linear-gradient(135deg, #30C4FF, #DB1DD8, #00FF99)',
    radial: 'radial-gradient(circle, #30C4FF, #DB1DD8)',
  },

  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    offWhite: '#F5F5F5',
    lightGray: '#E5E5E5',
    gray: '#9CA3AF',
    darkGray: '#4B5563',
    charcoal: '#1F2937',
    black: '#000000',
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Background Colors
  background: {
    light: '#F0F0F0',
    dark: '#0F0F0F',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    muted: '#6B7280',
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
  '5xl': '8rem',   // 128px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glow: '0 0 20px rgba(48, 196, 255, 0.3)',
  glowPink: '0 0 20px rgba(219, 29, 216, 0.3)',
  glowGreen: '0 0 20px rgba(0, 255, 153, 0.3)',
} as const;

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  // Durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Easing Functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Framer Motion Variants
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3 },
  },

  bounce: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 0.5 },
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
  max: 9999,
} as const;

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const components = {
  // Button Styles
  button: {
    base: 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
    
    variants: {
      primary: 'bg-black hover:bg-gray-800 text-white focus:ring-black',
      secondary: 'bg-white hover:bg-gray-100 text-black border border-gray-200 focus:ring-gray-300',
      gradient: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white focus:ring-purple-500',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 focus:ring-gray-300',
      danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    },
    
    sizes: {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3 text-lg',
      xl: 'px-10 py-4 text-xl',
    },
  },

  // Input Styles
  input: {
    base: 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2',
    variants: {
      default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
    },
  },

  // Card Styles
  card: {
    base: 'bg-white rounded-2xl shadow-lg overflow-hidden',
    hover: 'transition-all duration-300 hover:shadow-xl hover:scale-[1.02]',
    glass: 'bg-white/60 backdrop-blur-xl border border-white/80',
  },

  // Container Styles
  container: {
    default: 'container mx-auto px-6',
    narrow: 'container mx-auto px-6 max-w-4xl',
    wide: 'container mx-auto px-6 max-w-7xl',
  },

  // Section Styles
  section: {
    base: 'py-20 md:py-32',
    hero: 'min-h-screen flex items-center justify-center',
    centered: 'flex flex-col items-center text-center',
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate Tailwind class strings from design tokens
 */
export const utils = {
  /**
   * Get gradient background class
   */
  gradient: (type: keyof typeof colors.gradients = 'primary') => {
    return {
      background: colors.gradients[type],
    };
  },

  /**
   * Get responsive font size classes
   */
  responsiveText: (base: string, md?: string, lg?: string) => {
    let classes = base;
    if (md) classes += ` md:${md}`;
    if (lg) classes += ` lg:${lg}`;
    return classes;
  },

  /**
   * Get shadow with color
   */
  coloredShadow: (color: string, intensity: 'sm' | 'md' | 'lg' = 'md') => {
    const intensityMap = {
      sm: '0 4px 12px',
      md: '0 8px 24px',
      lg: '0 12px 48px',
    };
    return {
      boxShadow: `${intensityMap[intensity]} ${color}40`,
    };
  },
} as const;

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  typography,
  colors,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  components,
  utils,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TypographyToken = typeof typography;
export type ColorToken = typeof colors;
export type SpacingToken = typeof spacing;
export type BorderRadiusToken = typeof borderRadius;
export type ShadowToken = typeof shadows;
export type AnimationToken = typeof animations;
export type BreakpointToken = typeof breakpoints;
export type ZIndexToken = typeof zIndex;
export type ComponentToken = typeof components;

