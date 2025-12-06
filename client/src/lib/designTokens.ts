/**
 * Design Tokens - Centralized design system
 * Use these tokens throughout the app for consistency
 */

export const designTokens = {
  // Timeline specific tokens
  timeline: {
    bar: {
      width: 'w-2',
      position: 'left-0',
    },
    timeLabel: {
      position: '-7rem', // Distance from timeline bar
      fontSize: 'text-sm sm:text-base',
      fontFamily: 'font-mono',
      width: 'w-20 sm:w-24',
      textAlign: 'text-right',
    },
    task: {
      leftOffset: '2rem', // Distance from left edge
      rightOffset: '0.5rem',
      minHeight: '100px',
      borderRadius: {
        default: '8px',
        overlap: '16px',
      },
      borderWidth: '4px',
    },
    container: {
      padding: 'py-8 pl-24 sm:pl-28 md:pl-32 pr-1 sm:pr-2',
      overflow: 'overflow-visible',
    },
    wakeSleep: {
      offsetAbove: '-250%',
      offsetBelow: '150%',
      fontSize: 'text-sm',
      fontWeight: 'font-medium',
    },
  },

  // Button tokens
  button: {
    icon: {
      size: 'w-4 h-4',
      containerSize: 'h-8 w-8',
    },
    headerButton: {
      variant: 'outline' as const,
      size: 'icon' as const,
    },
  },

  // Card tokens
  card: {
    minimizable: {
      headerPadding: 'pb-2',
      contentClass: 'relative',
    },
  },

  // Spacing tokens
  spacing: {
    container: {
      mobile: 'px-0',
      tablet: 'sm:px-2',
      desktop: 'md:px-4',
    },
    section: 'space-y-4',
    gap: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
    },
  },

  // Typography tokens
  typography: {
    pageTitle: 'text-xl font-bold',
    sectionTitle: 'text-lg font-semibold',
    cardTitle: 'text-sm font-semibold',
    body: 'text-sm',
    caption: 'text-xs text-muted-foreground',
  },

  // Color tokens (referencing Tailwind/shadcn)
  colors: {
    primary: 'hsl(var(--primary))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    border: 'hsl(var(--border))',
  },

  // Status colors
  status: {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  },

  // Animation tokens
  animation: {
    transition: 'transition-all',
    duration: {
      fast: 'duration-150',
      normal: 'duration-200',
      slow: 'duration-300',
    },
    hover: {
      scale: 'hover:scale-110',
      opacity: 'hover:opacity-80',
    },
  },

  // Shadow tokens
  shadows: {
    timeLabel: {
      textShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.7), 0 0 12px rgba(255, 255, 255, 0.5)',
      filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))',
    },
  },
} as const;

// Helper functions for design tokens
export const getTimelinePadding = () => designTokens.timeline.container.padding;
export const getTimeLabelPosition = () => designTokens.timeline.timeLabel.position;
export const getTaskLeftOffset = () => designTokens.timeline.task.leftOffset;

