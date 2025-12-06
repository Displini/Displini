import { useEffect, useState, useRef, memo, useMemo } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

const tabs = ["/reminders", "/todo", "/calendar", "/ai"];

// Memoize the PageTransition to avoid unnecessary re-renders
function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const prevLocationRef = useRef(location);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (location !== prevLocationRef.current) {
      const currentIndex = tabs.indexOf(location);
      const prevIndex = tabs.indexOf(prevLocationRef.current);
      
      if (currentIndex !== -1 && prevIndex !== -1) {
        // Calculate direction
        const direction = currentIndex > prevIndex ? 'right' : 'left';
        
        // Set animation class based on direction
        setAnimationClass(`slide-${direction}`);
        
        // Clear animation after it completes - use requestAnimationFrame for better performance
        const timer = setTimeout(() => {
          requestAnimationFrame(() => {
            setAnimationClass('');
            prevLocationRef.current = location;
          });
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        prevLocationRef.current = location;
      }
    }
  }, [location]);

  // Memoize animation style to prevent recalculation
  const animationStyle = useMemo(() => ({
    animation: animationClass 
      ? `${animationClass === 'slide-right' ? 'slideInFromRight' : 'slideInFromLeft'} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)` 
      : 'none',
  }), [animationClass]);

  return (
    <div className="relative w-full">
      <div
        key={location}
        className={`w-full ${animationClass}`}
        style={animationStyle}
      >
        {children}
      </div>
    </div>
  );
}

// Export memoized version
export default memo(PageTransition);

