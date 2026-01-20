import { useState, useEffect, useCallback, useRef } from 'react';

// Cache for localStorage reads to prevent redundant parsing
const storageCache = new Map<string, any>();
let cacheTimestamps = new Map<string, number>();
const CACHE_DURATION = 100; // 100ms cache duration

/**
 * Optimized localStorage hook with caching and batching
 * Reduces blocking localStorage operations
 */
export function useOptimizedLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    cacheDuration?: number;
  }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    cacheDuration = CACHE_DURATION,
  } = options || {};

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state from cache or localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check cache first
      const now = Date.now();
      const cachedTimestamp = cacheTimestamps.get(key) || 0;
      
      if (storageCache.has(key) && now - cachedTimestamp < cacheDuration) {
        return storageCache.get(key) as T;
      }

      // Read from localStorage
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = deserialize(item);
        storageCache.set(key, parsed);
        cacheTimestamps.set(key, now);
        return parsed;
      }
      
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Batched update function
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Clear existing timeout
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        // Update state immediately
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          
          // Update cache
          storageCache.set(key, valueToStore);
          cacheTimestamps.set(key, Date.now());
          
          // Batch localStorage write with requestIdleCallback or setTimeout
          updateTimeoutRef.current = setTimeout(() => {
            try {
              window.localStorage.setItem(key, serialize(valueToStore));
              // Dispatch storage event for cross-tab communication
              window.dispatchEvent(new StorageEvent('storage', {
                key,
                newValue: serialize(valueToStore),
                url: window.location.href,
              }));
            } catch (error) {
              console.error(`Error writing localStorage key "${key}":`, error);
            }
          }, 50); // 50ms debounce

          return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize]
  );

  // Refresh function to force reload from localStorage
  const refresh = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = deserialize(item);
        storageCache.set(key, parsed);
        cacheTimestamps.set(key, Date.now());
        setStoredValue(parsed);
      }
    } catch (error) {
      console.warn(`Error refreshing localStorage key "${key}":`, error);
    }
  }, [key, deserialize]);

  // Listen for storage events (changes from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = deserialize(e.newValue);
          storageCache.set(key, parsed);
          cacheTimestamps.set(key, Date.now());
          setStoredValue(parsed);
        } catch (error) {
          console.warn(`Error handling storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return [storedValue, setValue, refresh];
}

/**
 * Clears the localStorage cache for a specific key or all keys
 */
export function clearStorageCache(key?: string) {
  if (key) {
    storageCache.delete(key);
    cacheTimestamps.delete(key);
  } else {
    storageCache.clear();
    cacheTimestamps.clear();
  }
}

/**
 * Batch multiple localStorage operations
 */
export function batchLocalStorageUpdates(updates: Array<{ key: string; value: any }>) {
  requestIdleCallback(() => {
    updates.forEach(({ key, value }) => {
      try {
        const serialized = JSON.stringify(value);
        window.localStorage.setItem(key, serialized);
        storageCache.set(key, value);
        cacheTimestamps.set(key, Date.now());
      } catch (error) {
        console.error(`Error in batch update for key "${key}":`, error);
      }
    });
  });
}
