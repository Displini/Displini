import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../constants';

export interface WindowSize {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1920,
        height: 1080,
      };
    }
    
    const width = window.innerWidth;
    return {
      isMobile: width < BREAKPOINTS.MOBILE,
      isTablet: width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET,
      isDesktop: width >= BREAKPOINTS.TABLET,
      width,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({
        isMobile: width < BREAKPOINTS.MOBILE,
        isTablet: width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET,
        isDesktop: width >= BREAKPOINTS.TABLET,
        width,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

