import { CheckSquare, Plus, Calendar, Sparkles, Bell } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Shortcuts from "@/components/general/Shortcuts";

interface BottomNavProps {
  onAddTask?: () => void;
  onAddReminder?: () => void;
  onAddEvent?: () => void;
  onAiClick?: () => void;
}

export default function BottomNav({ onAddTask, onAddReminder, onAddEvent, onAiClick }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const tabs = [
    { path: "/app/reminders", label: "Reminder", icon: Bell },
    { path: "/app/todo", label: "To Do", icon: CheckSquare },
    { path: "/app/calendar", label: "Calendar", icon: Calendar },
    { path: "/app/ai", label: "AI", icon: Sparkles },
  ];

  // Update indicator position when location changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeButton = buttonRefs.current[location.pathname];
      if (activeButton && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        setIndicatorStyle({
          left: buttonRect.left - navRect.left,
          width: buttonRect.width,
        });
      }
    };

    // Initial update with small delay to ensure DOM is ready
    const timer = setTimeout(updateIndicator, 0);
    updateIndicator();
    
    // Re-calculate on window resize for responsive behavior
    const handleResize = () => {
      requestAnimationFrame(updateIndicator);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [location]);

  // Swipe gesture detection
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let isEdgeSwipe = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      // Check if swipe starts near edges (within 50px)
      isEdgeSwipe = touchStartX < 50 || touchStartX > window.innerWidth - 50;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipe) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
        const currentIndex = tabs.findIndex(tab => tab.path === location.pathname);
        if (deltaX > 0 && currentIndex > 0) {
          // Swipe right - go to previous tab
          navigate(tabs[currentIndex - 1].path);
        } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
          // Swipe left - go to next tab
          navigate(tabs[currentIndex + 1].path);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [location, navigate, tabs]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-5 px-3 sm:pb-6 sm:px-4">
      {/* Nav centered with button on the right */}
      <div className="flex justify-center items-center gap-3">
        <nav 
          ref={navRef}
          className="bottom-header backdrop-blur-2xl bg-white/40 dark:bg-gray-900/40 shadow-2xl border border-white/30 dark:border-gray-700/30 px-5 sm:px-6 py-2 sm:py-3 flex items-center gap-3 sm:gap-3 relative overflow-hidden"
          style={{ 
            borderRadius: '9999px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          {/* Animated sliding indicator with swooping motion */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${indicatorStyle.left + 3}px`,
              width: `${indicatorStyle.width - 6}px`,
              height: 'calc(100% - 10px)',
              top: '5px',
              backgroundColor: 'hsl(var(--primary))',
              borderRadius: '9999px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              transform: 'translateZ(0)',
              transition: 'left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              willChange: 'left, width',
            }}
          />
          
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            
            return (
              <Link
                key={tab.path}
                to={tab.path}
                data-testid={`link-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
              >
                <button
                  ref={(el) => (buttonRefs.current[tab.path] = el)}
                  className={`relative z-10 flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-3 xs:px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 transition-all duration-300 rounded-full ${
                    isActive
                      ? "text-primary-foreground scale-105"
                      : "text-muted-foreground hover:scale-105"
                  }`}
                  data-testid={`button-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-[10px] xs:text-[10px] sm:text-xs font-medium whitespace-nowrap">{tab.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>
        
        {/* Floating Action Button - Always visible on the right */}
        <button
          onClick={() => {
            if (location.pathname === '/app/todo' && onAddTask) {
              onAddTask();
            } else if (location.pathname === '/app/reminders' && onAddReminder) {
              onAddReminder();
            } else if (location.pathname === '/app/calendar' && onAddEvent) {
              onAddEvent();
            } else if (location.pathname === '/app/ai' || location.pathname !== '/app/todo') {
              setShowShortcuts(true);
            }
          }}
          className="rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center flex-shrink-0"
          style={{ 
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            minWidth: '48px',
            minHeight: '48px',
          }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      {/* Shortcuts Dialog */}
      <Shortcuts 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />
    </div>
  );
}
