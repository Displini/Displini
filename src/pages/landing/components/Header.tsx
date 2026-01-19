import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ComingSoonDialog } from "@/components/general/ComingSoonDialog";
import { Sun, Moon, LogOut, Settings } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * Landing page header
 * - Fixed position with transparent/white states
 * - Scroll-based color switching
 * - Sign in and Get started CTAs
 */
export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  // Check if we're on landing page - if not, always show black logo
  const isLandingPage = window.location.pathname === '/';
  const [isScrolled, setIsScrolled] = useState(!isLandingPage); // Default to scrolled state on non-landing pages
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  
  // Toggle between modes: 'login' or 'coming-soon'
  const headerMode = 'login'; // Change to 'coming-soon' to show popup instead of navigating

  useEffect(() => {
    // Skip scroll detection on non-landing pages
    if (!isLandingPage) {
      setIsScrolled(true);
      return;
    }
    
    const handleScroll = () => {
      // Check both window scroll and potential container scroll
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Also try to find custom scroll container (for Landing page)
      const scrollContainer = Array.from(document.querySelectorAll('div')).find(el => {
        const style = el.getAttribute('style');
        return style?.includes('overflowY') || style?.includes('overflow-y') || 
               (el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY !== 'hidden');
      }) as HTMLElement | null;
      
      const containerScrollY = scrollContainer ? scrollContainer.scrollTop : 0;
      const effectiveScrollY = Math.max(scrollY, containerScrollY);
      
      // Change header after scrolling past Hero (about 70% of viewport)
      setIsScrolled(effectiveScrollY > window.innerHeight * 0.7);
    };
    
    // Listen to both window scroll and find container scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Try to attach to custom scroll container
    const tryAttachToContainer = () => {
      const scrollContainer = Array.from(document.querySelectorAll('div')).find(el => {
        const style = el.getAttribute('style');
        const computedStyle = getComputedStyle(el);
        return style?.includes('overflowY') || style?.includes('overflow-y') || 
               (el.scrollHeight > el.clientHeight && computedStyle.overflowY !== 'hidden');
      }) as HTMLElement | null;
      
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return scrollContainer;
      }
      return null;
    };
    
    // Retry finding container
    let scrollContainer: HTMLElement | null = null;
    const timer = setTimeout(() => {
      scrollContainer = tryAttachToContainer();
      handleScroll(); // Check initial state
    }, 100);
    
    handleScroll(); // Check immediately for non-landing pages
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleCTA = () => {
    if (isAuthenticated) {
      // If logged in, "Go to app" goes to app
      navigate('/app');
    } else {
      // Get started leads to sign up
      navigate('/auth/signup');
    }
  };

  const handleSignIn = () => {
    if (!isAuthenticated) {
      // Sign in leads to login
      navigate('/auth/login');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfileSettings = () => {
    navigate('/app/profile');
    // Trigger settings dialog to open after navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openSettings', { detail: true }));
    }, 300);
  };

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>
      
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/20 dark:bg-gray-900/20 backdrop-blur-md text-gray-900 dark:text-white shadow-sm animate-fade-in border-b border-white/20 dark:border-gray-700/20' 
          : 'bg-transparent text-white'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="h-14 group cursor-pointer">
              {/* Mobile: Show icon only, Desktop: Show logo with text */}
              <img 
                src={isDark || !isScrolled ? "/logos/Displini_Icon_white.svg" : "/logos/Displini_Icon_black.svg"}
                alt="Displini" 
                width="56"
                height="56"
                className="md:hidden h-full w-auto transition-all duration-300 group-hover:scale-105 group-hover:opacity-80"
                loading="eager"
              />
              <img 
                src={isDark || !isScrolled ? "/logos/Displini_Logo_text_white.svg" : "/logos/Displini_Logo_text_black.svg"}
                alt="Displini" 
                width="200"
                height="56"
                className="hidden md:block h-full w-auto transition-all duration-300 group-hover:scale-105 group-hover:opacity-80"
                loading="eager"
              />
            </a>
            <div className="flex items-center space-x-6">
              {!isAuthenticated ? (
                <>
              <button 
                    onClick={handleSignIn}
                className="font-bold hover:text-displini-400 transition-colors cursor-pointer"
                aria-label="Sign in to Displini"
              >
                Sign in
              </button>
              <Button 
                onClick={handleCTA}
                className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-full font-medium transition-colors border-0"
                aria-label="Get started with Displini"
              >
                Get started
              </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleCTA}
                    className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-full font-medium transition-colors border-0"
                    aria-label="Go to app"
                  >
                    Go to app
                  </Button>
                </>
              )}
              
              {/* Right side items: Switch Account, Profile, Dark Mode, User Account */}
              <div className="flex items-center space-x-4">
                {/* No extra icons here on landing when authenticated */}
                
                {/* Dark Mode Toggle - Hidden on mobile */}
              <button
                onClick={toggleDarkMode}
                className="hidden md:flex p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
                
                {/* User Account Avatar - All the way to the right */}
                {isAuthenticated && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        aria-label="User account menu"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleProfileSettings}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Coming Soon Dialog - Only shows if headerMode is 'coming-soon' */}
      {(headerMode as string) === 'coming-soon' && (
        <ComingSoonDialog 
          open={comingSoonOpen} 
          onOpenChange={setComingSoonOpen}
          title="Coming Soon!"
          description="We're putting the finishing touches on Displini. Sign up below to be notified when we launch!"
        />
      )}
    </>
  );
}

