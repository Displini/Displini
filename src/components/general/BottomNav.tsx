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
  const [showShortcuts, setShowShortcuts] = useState(false);

  const leftTabs = [
    { path: "/app/reminders", label: "Reminder", icon: Bell },
    { path: "/app/todo", label: "To Do", icon: CheckSquare },
  ];
  const rightTabs = [
    { path: "/app/calendar", label: "Calendar", icon: Calendar },
    { path: "/app/ai", label: "AI", icon: Sparkles },
  ];
  const tabs = [...leftTabs, ...rightTabs];

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
      {/* Nav: Reminder+ToDo | + (center) | Calendar+AI */}
      <div className="flex justify-center items-center gap-2 w-full max-w-[min(100%,420px)] mx-auto">
        <nav 
          className="bottom-header backdrop-blur-2xl bg-white/40 dark:bg-gray-900/40 shadow-2xl border border-white/30 dark:border-gray-700/30 px-2 sm:px-3 py-2.5 sm:py-3 flex items-stretch relative overflow-hidden flex-1"
          style={{ 
            borderRadius: '9999px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            minWidth: '200px',
          }}
        >
          {/* Left tabs: Reminder, To Do */}
          {leftTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex-1 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[56px]"
                data-testid={`link-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
              >
                <button
                  className={`relative z-10 w-full flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-1 transition-all duration-300 rounded-full ${
                    isActive ? "text-primary font-semibold scale-105" : "text-muted-foreground hover:scale-105"
                  }`}
                  data-testid={`button-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap truncate w-full text-center">{tab.label}</span>
                </button>
              </Link>
            );
          })}
          
          {/* Center: + button */}
          <div className="flex-shrink-0 flex items-center justify-center px-1">
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
              className="rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14"
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
          
          {/* Right tabs: Calendar, AI */}
          {rightTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex-1 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[56px]"
                data-testid={`link-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
              >
                <button
                  className={`relative z-10 w-full flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-1 transition-all duration-300 rounded-full ${
                    isActive ? "text-primary font-semibold scale-105" : "text-muted-foreground hover:scale-105"
                  }`}
                  data-testid={`button-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap truncate w-full text-center">{tab.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Shortcuts Dialog */}
      <Shortcuts 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />
    </div>
  );
}
