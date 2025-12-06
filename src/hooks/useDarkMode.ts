import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook for dark mode management
 * - On desktop: Persists preference in localStorage
 * - On mobile: Follows system preference automatically (unless manually toggled)
 * - Applies dark class to document
 * - Returns current state and toggle function
 */
export function useDarkMode() {
  const isManualRef = useRef(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    const isMobile = window.innerWidth < 768;
    
    // Check if user has manually set dark mode
    const manualSetting = localStorage.getItem('darkModeManual');
    if (manualSetting !== null) {
      isManualRef.current = true;
      return manualSetting === 'true';
    }
    
    // On mobile, follow system preference without saving
    if (isMobile) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // On desktop, check old localStorage format for backward compatibility
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      isManualRef.current = true;
      return stored === 'true';
    }
    
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Auto-update based on system preference on mobile (only if no manual setting)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile || isManualRef.current) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Only update if user hasn't manually set it
      if (!isManualRef.current) {
        setIsDark(e.matches);
      }
    };
    
    // Set initial state
    handleChange(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggle = () => {
    setIsDark(prev => {
      const newValue = !prev;
      // Mark as manual setting and save
      isManualRef.current = true;
      localStorage.setItem('darkModeManual', String(newValue));
      // Also save to old key for backward compatibility
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  return { isDark, toggle };
}

