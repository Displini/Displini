/**
 * Performance Utilities
 * 
 * Helper functions for optimizing application performance
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>): void {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request idle callback polyfill for better browser compatibility
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (callback: IdleRequestCallback) => {
        const start = Date.now();
        return setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          });
        }, 1);
      };

/**
 * Cancel idle callback polyfill
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

/**
 * Batch DOM reads to prevent layout thrashing
 */
export function batchDOMReads<T>(reads: Array<() => T>): T[] {
  return reads.map(read => read());
}

/**
 * Batch DOM writes to prevent layout thrashing
 */
export function batchDOMWrites(writes: Array<() => void>): void {
  requestAnimationFrame(() => {
    writes.forEach(write => write());
  });
}

/**
 * Measure component render performance
 */
export function measureRender(componentName: string, callback: () => void) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    callback();
    const end = performance.now();
    console.log(`[Performance] ${componentName} rendered in ${(end - start).toFixed(2)}ms`);
  } else {
    callback();
  }
}

/**
 * Check if device is low-end (for conditional optimizations)
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check for device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    return true;
  }

  // Check for hardware concurrency (number of CPU cores)
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (hardwareConcurrency && hardwareConcurrency < 4) {
    return true;
  }

  return false;
}

/**
 * Preload a component (for lazy loaded components)
 */
export function preloadComponent(
  importFunc: () => Promise<any>
): Promise<any> {
  return importFunc();
}

