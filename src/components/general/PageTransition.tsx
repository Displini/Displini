import { useEffect, useState, useRef, memo, useMemo } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

const tabs = ["/app/reminders", "/app/todo", "/app/calendar", "/app/ai"];

// Memoize the PageTransition to avoid unnecessary re-renders
function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const prevPathRef = useRef<string>(pathname);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      const currentIndex = tabs.indexOf(pathname);
      const prevPath = typeof prevPathRef.current === 'string' ? prevPathRef.current : pathname;
      const prevIndex = tabs.indexOf(prevPath);

      if (currentIndex !== -1 && prevIndex !== -1) {
        const direction = currentIndex > prevIndex ? 'right' : 'left';
        setAnimationClass(`slide-${direction}`);
        const timer = setTimeout(() => {
          requestAnimationFrame(() => {
            setAnimationClass('');
            prevPathRef.current = pathname;
          });
        }, 500);
        return () => clearTimeout(timer);
      }
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  const animationStyle = useMemo(
    () => ({
      animation:
        animationClass
          ? `${animationClass === 'slide-right' ? 'slideInFromRight' : 'slideInFromLeft'} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`
          : 'none',
    }),
    [animationClass]
  );

  return (
    <div className="relative w-full overflow-x-hidden">
      <div key={pathname} className="w-full" style={animationStyle}>
        {children}
      </div>
    </div>
  );
}

// Export memoized version
export default memo(PageTransition);

