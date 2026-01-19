import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Scroll indicator component - shows on mobile to indicate scrollable content
 * - Appears at the bottom center of the screen
 * - Animated bounce effect
 * - Fades out on scroll
 */
export function ScrollIndicator() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsVisible(false);
      
      // Show again after user stops scrolling for 3 seconds
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Only show if not at the bottom of the page
        const scrollPosition = window.scrollY + window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition < pageHeight - 100) {
          setIsVisible(true);
        }
      }, 3000);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div 
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 md:hidden transition-opacity duration-500 pointer-events-none ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-1 animate-bounce">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-full p-3 shadow-xl">
          <ChevronDown className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

