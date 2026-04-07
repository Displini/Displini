/**
 * Cross-platform haptics utility (web).
 * - Mobile Web (Android): navigator.vibrate() with short patterns.
 * - Mobile Web (iOS Safari): vibration often unsupported; fails silently.
 * - Desktop (Windows/Mac): vibrate may no-op; fails silently.
 * - For Capacitor native builds: add @capacitor/haptics and use it in a platform-specific wrapper.
 * Never throws; all methods fail silently when unsupported.
 */

const HAPTIC_SETTING_KEY = "hapticFeedbackEnabled";

/** Detect if device is likely mobile (touch-first). */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const hasTouch =
    "ontouchstart" in window ||
    (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 0;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    hasTouch
  );
}

/** User has requested reduced motion (accessibility). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Whether haptics should run. Respects:
 * - localStorage "hapticFeedbackEnabled" (explicit user choice)
 * - prefers-reduced-motion: reduce (off unless user explicitly enabled)
 * - Default: ON for mobile, OFF for desktop
 */
export function getHapticsEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  const reduced = prefersReducedMotion();
  const stored = localStorage.getItem(HAPTIC_SETTING_KEY);
  if (stored !== null) {
    const enabled = stored === "true";
    if (reduced && !enabled) return false;
    return enabled;
  }
  if (reduced) return false;
  return isMobileDevice();
}

export function setHapticsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(HAPTIC_SETTING_KEY, String(enabled));
    window.dispatchEvent(new Event("hapticSettingChanged"));
  } catch {
    // ignore
  }
}

/** Value to show in Settings UI (stored or default: ON mobile, OFF desktop). */
export function getHapticsSettingDisplay(): boolean {
  if (typeof localStorage === "undefined") return false;
  const stored = localStorage.getItem(HAPTIC_SETTING_KEY);
  if (stored !== null) return stored === "true";
  return isMobileDevice();
}

type ImpactLevel = "light" | "medium" | "heavy";

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}

function trigger(pattern: number | number[]): void {
  if (!getHapticsEnabled()) return;
  vibrate(pattern);
}

export const haptics = {
  /** Success feedback (e.g. task completed). */
  success(): void {
    trigger([30, 20, 30]);
  },

  /** Light tap (e.g. task unchecked). */
  light(): void {
    trigger([10]);
  },

  /** Selection change (e.g. picker). */
  selection(): void {
    trigger([5]);
  },

  /** Error / warning. */
  error(): void {
    trigger([80, 40, 80]);
  },

  /** Impact with level. */
  impact(level: ImpactLevel): void {
    const pattern =
      level === "light" ? [15] : level === "medium" ? [30, 20] : [50, 30, 50];
    trigger(pattern);
  },
};
