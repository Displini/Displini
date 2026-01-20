import { useState, useEffect, useRef, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarouselScrollIndicator } from "@/components/general/CarouselScrollIndicator";
import { CAROUSEL_FEATURES, CAROUSEL } from "../constants";
import { useThrottle, useWindowSize } from "../hooks";
import { colors } from "@/lib/designSystem";
import styles from "../landing.module.css";
import type { CarouselFeature } from "../constants";

/**
 * Dynamic carousel showcasing additional features
 * - Infinite scroll on desktop and mobile
 * - Custom cursor with directional arrows
 * - QR code section below carousel
 * - Drag support on desktop
 */
function LandingCarousel() {
  const { isMobile } = useWindowSize();
  
  // Defensive check for constants
  if (!CAROUSEL_FEATURES || CAROUSEL_FEATURES.length === 0) {
    return (
      <section 
        data-section="carousel" 
        className={`flex items-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300 px-6 section-viewport ${styles.scrollSnapStart}`}
        style={{ scrollSnapStop: 'always', minHeight: 'calc(100vh - 80px)' }}
      >
        <div className="w-full text-center">
          <p className="text-gray-600">Loading carousel...</p>
        </div>
      </section>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(1);
  const [scrollIndex, setScrollIndex] = useState((CAROUSEL.TOTAL_COPIES / 2) * CAROUSEL_FEATURES.length + 1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0, show: false });
  const [cursorDirection, setCursorDirection] = useState<'left' | 'right'>('right');
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const HEADER_HEIGHT = 80; // Header height in pixels

  // Check if cursor should be visible based on position
  const shouldShowCursor = useCallback((x: number, y: number): boolean => {
    // Hide if cursor is in header area
    if (y < HEADER_HEIGHT) {
      return false;
    }
    
    // Hide if cursor is outside page bounds
    if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
      return false;
    }
    
    // Check if cursor is within section bounds
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        return false;
      }
    }
    
    return true;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const direction = x < rect.width / 2 ? 'left' : 'right';
    
    // Update direction immediately (no delay) for real-time response
    if (direction !== cursorDirection) {
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
        cursorTimeoutRef.current = null;
      }
      setCursorDirection(direction);
    }
    
    // Check if cursor should be visible
    const shouldShow = shouldShowCursor(e.clientX, e.clientY);
    
    // Update position immediately for smooth movement
    setCursorPosition({ x: e.clientX, y: e.clientY, show: shouldShow });
  }, [cursorDirection, shouldShowCursor]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // Hide cursor when leaving section
    setCursorPosition((prev) => ({ ...prev, show: false }));
  }, []);

  // Track last known mouse position
  const lastMousePositionRef = useRef({ x: 0, y: 0 });

  // Global mouse move listener to detect when cursor is outside section or in header
  useEffect(() => {
    if (isMobile) return; // Only on desktop
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Store last known position
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
      
      // Only update if we're not already handling it in the section
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const isInSection = 
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom;
        
        if (!isInSection) {
          // Cursor is outside section, check if it should be hidden
          const shouldShow = shouldShowCursor(e.clientX, e.clientY);
          setCursorPosition({ x: e.clientX, y: e.clientY, show: shouldShow });
        }
      }
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isMobile, shouldShowCursor]);

  // Check cursor visibility on scroll to show it when section comes into view
  useEffect(() => {
    if (isMobile) return; // Only on desktop
    
    const checkCursorVisibility = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const mouseX = lastMousePositionRef.current.x;
      const mouseY = lastMousePositionRef.current.y;
      
      // Check if mouse is over the section
      const isInSection = 
        mouseX >= rect.left && 
        mouseX <= rect.right && 
        mouseY >= rect.top && 
        mouseY <= rect.bottom;
      
      if (isInSection) {
        // Mouse is over section, check if cursor should be visible
        const shouldShow = shouldShowCursor(mouseX, mouseY);
        setCursorPosition({ x: mouseX, y: mouseY, show: shouldShow });
      }
    };
    
    // Check on scroll
    window.addEventListener('scroll', checkCursorVisibility, { passive: true });
    
    // Also check on any scroll container
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkCursorVisibility, { passive: true });
    }
    
    // Use Intersection Observer to check when section enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Section is in view, check if mouse is over it
            checkCursorVisibility();
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      window.removeEventListener('scroll', checkCursorVisibility);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkCursorVisibility);
      }
      observer.disconnect();
    };
  }, [isMobile, shouldShowCursor]);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cache container width to avoid repeated queries
  const containerWidthRef = useRef<number>(0);
  
  useEffect(() => {
    if (carouselRef.current) {
      containerWidthRef.current = carouselRef.current.offsetWidth;
    }
    const handleResize = () => {
      if (carouselRef.current) {
        containerWidthRef.current = carouselRef.current.offsetWidth;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // Only handle clicks on desktop
    if (isMobile) return;
    
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (x < rect.width / 2) {
      setScrollIndex(prev => prev - 1);
      setCurrentIndex((prev) => (prev - 1 + CAROUSEL_FEATURES.length) % CAROUSEL_FEATURES.length);
    } else {
      setScrollIndex(prev => prev + 1);
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_FEATURES.length);
    }
  }, [isMobile]);

  // Auto-scroll when scrollIndex changes
  useEffect(() => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardWidth = 400 + 24;
      const containerWidth = containerWidthRef.current || container.offsetWidth;
      if (!containerWidthRef.current) containerWidthRef.current = containerWidth;
      const scrollPosition = (scrollIndex * cardWidth) - (containerWidth / 2) + (cardWidth / 2);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      
      const totalCards = CAROUSEL.TOTAL_COPIES * CAROUSEL_FEATURES.length;
      const safeZoneStart = 5;
      const safeZoneEnd = totalCards - 5;
      
      if (scrollIndex < safeZoneStart || scrollIndex > safeZoneEnd) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          const middlePosition = (CAROUSEL.TOTAL_COPIES / 2) * CAROUSEL_FEATURES.length + currentIndex;
          setScrollIndex(middlePosition);
          const newScrollPosition = (middlePosition * cardWidth) - (containerWidth / 2) + (cardWidth / 2);
          container.scrollTo({
            left: newScrollPosition,
            behavior: 'auto'
          });
        }, 600);
      }
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollIndex, currentIndex]);
  
  // Initialize desktop carousel
  useEffect(() => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardWidth = 400 + 24;
      const containerWidth = containerWidthRef.current || container.offsetWidth;
      if (!containerWidthRef.current) containerWidthRef.current = containerWidth;
      const scrollPosition = (scrollIndex * cardWidth) - (containerWidth / 2) + (cardWidth / 2);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'auto'
      });
    }
  }, []);

  // Handle window resize to recalculate carousel position
  useEffect(() => {
    const handleResize = () => {
      if (carouselRef.current) {
        const container = carouselRef.current;
        const cardWidth = CAROUSEL.CARD_WIDTH_DESKTOP + CAROUSEL.CARD_GAP;
        const containerWidth = container.offsetWidth;
        const scrollPosition = (scrollIndex * cardWidth) - (containerWidth / 2) + (cardWidth / 2);
        
        container.scrollTo({
          left: scrollPosition,
          behavior: 'auto'
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [scrollIndex]);

  // Initialize mobile carousel
  useEffect(() => {
    if (!mobileCarouselRef.current) return;

    const container = mobileCarouselRef.current;
    const cardWidth = CAROUSEL.CARD_WIDTH_MOBILE + CAROUSEL.CARD_GAP;
    const totalCards = 10 * CAROUSEL_FEATURES.length;
    const middlePosition = (totalCards / 2) * cardWidth;

    container.scrollLeft = middlePosition;

    // Cache dimensions to avoid repeated queries
    let cachedScrollWidth = container.scrollWidth;
    let cachedClientWidth = container.clientWidth;
    
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      // Update cache periodically, not on every scroll
      if (mobileScrollTimeoutRef.current === null) {
        cachedScrollWidth = container.scrollWidth;
        cachedClientWidth = container.clientWidth;
      }
      const maxScroll = cachedScrollWidth - cachedClientWidth;

      if (mobileScrollTimeoutRef.current) {
        clearTimeout(mobileScrollTimeoutRef.current);
      }

      mobileScrollTimeoutRef.current = setTimeout(() => {
        if (scrollLeft < cardWidth * 5) {
          container.scrollLeft = middlePosition;
        } else if (scrollLeft > maxScroll - cardWidth * 5) {
          container.scrollLeft = middlePosition;
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (mobileScrollTimeoutRef.current) {
        clearTimeout(mobileScrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle mobile carousel resize
  useEffect(() => {
    const handleResize = () => {
      if (mobileCarouselRef.current) {
        const container = mobileCarouselRef.current;
        const cardWidth = CAROUSEL.CARD_WIDTH_MOBILE + CAROUSEL.CARD_GAP;
        const totalCards = 10 * CAROUSEL_FEATURES.length;
        const middlePosition = (totalCards / 2) * cardWidth;
        container.scrollLeft = middlePosition;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (startX - x) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft + walk;
  }, [isDragging, startX, scrollLeft]);

  return (
    <section 
      ref={sectionRef}
      data-section="carousel" 
      className={`flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300 px-6 section-viewport ${styles.scrollSnapStart}`}
      style={{ 
        scrollSnapStop: 'always', 
        minHeight: 'calc(100vh - 80px)',
        height: 'calc(100vh - 80px)',
        position: 'relative',
        zIndex: 1,
        cursor: 'none'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={!isMobile ? handleClick : undefined}
      onWheel={!isMobile ? (e) => {
        // Only handle horizontal scrolling, let vertical scrolling pass through
        const isWideScreen = window.innerWidth >= 1024; // lg breakpoint
        if (isWideScreen) {
          return; // Don't prevent default or handle wheel on wide screens
        }
        
        // Only intercept if horizontal scroll is dominant
        const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        
        if (!isHorizontalScroll) {
          // Allow vertical scrolling to pass through for page navigation
          return;
        }
        
        // Capture horizontal scroll for carousel (only on smaller screens)
        if (carouselRef.current && isHorizontalScroll) {
          e.preventDefault();
          e.stopPropagation();
          
          // Throttle scroll updates for better performance using requestAnimationFrame
          if (carouselRef.current.dataset.scrolling === 'true') return;
          carouselRef.current.dataset.scrolling = 'true';
          
          const scrollContainer = carouselRef.current;
          const scrollAmount = e.deltaX * 0.3;
          
          requestAnimationFrame(() => {
            if (scrollContainer) {
              scrollContainer.scrollBy({
                left: scrollAmount,
                behavior: 'auto'
              });
              scrollContainer.dataset.scrolling = 'false';
            }
          });
        }
      } : undefined}
    >
      {/* Custom Cursor - Rendered at section level so it works everywhere - Hidden on mobile */}
      {!isMobile && (
        <div 
          className="fixed pointer-events-none z-[9999]"
          style={{ 
            left: `${cursorPosition.x}px`, 
            top: `${cursorPosition.y}px`,
            transform: 'translate(-50%, -50%)',
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            pointerEvents: 'none',
            opacity: cursorPosition.show ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: colors.neutral.charcoal,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.2)'
            }}
          >
            {cursorDirection === 'left' ? (
              <ChevronLeft className="w-7 h-7 text-white" strokeWidth={3} />
            ) : (
              <ChevronRight className="w-7 h-7 text-white" strokeWidth={3} />
            )}
          </div>
        </div>
      )}

      <div className="w-full flex flex-col items-center justify-center" style={{ minHeight: '100%' }}>
        {/* Title */}
        <div className="text-center mb-12 px-6 w-full flex justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Not just a generic Timeline!
          </h2>
        </div>

        {/* Desktop Carousel */}
        <div 
          className="relative cursor-none hidden md:block overflow-hidden w-full"
          style={{ pointerEvents: 'auto', cursor: 'none' }}
        >
          {/* Carousel Container */}
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 pt-4"
            style={{ 
              scrollBehavior: 'auto',
              paddingLeft: 'calc(50vw - 200px)',
              paddingRight: 'calc(50vw - 200px)',
              overflowY: 'visible',
              willChange: 'scroll-position'
            }}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onMouseMove={handleDragMove}
          >
            {Array.from({ length: CAROUSEL.TOTAL_COPIES }).flatMap(() => CAROUSEL_FEATURES).map((feature, idx) => {
              const IconComponent = feature.icon;
              
              return (
                <div
                  key={`${feature.title}-${idx}`}
                  className="flex-shrink-0 w-[400px] bg-white/60 backdrop-blur-xl rounded-3xl p-10 border border-white/80 transition-all duration-500 shadow-xl select-none"
                >
                  <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <IconComponent className="w-12 h-12" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 select-none">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed select-none">
                    {feature.description}
                  </p>
                  <div 
                    className="mt-6 h-1 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative w-full flex items-center justify-center">
          <div 
            ref={mobileCarouselRef}
            className="overflow-x-auto scrollbar-hide w-full"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              overscrollBehaviorX: 'contain',
              overscrollBehaviorY: 'auto',
              scrollBehavior: 'auto',
              willChange: 'scroll-position'
            }}
            onTouchStart={(e) => {
              if (!mobileCarouselRef.current) return;
              const touch = e.touches[0];
              const startX = touch.clientX;
              const startY = touch.clientY;
              const startScrollLeft = mobileCarouselRef.current.scrollLeft;
              
              let isDragging = false;
              
              const handleTouchMove = (moveEvent: TouchEvent) => {
                if (!mobileCarouselRef.current) return;
                const moveTouch = moveEvent.touches[0];
                const deltaX = moveTouch.clientX - startX;
                const deltaY = Math.abs(moveTouch.clientY - startY);
                
                // If horizontal movement is dominant, enable dragging
                if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
                  isDragging = true;
                  moveEvent.preventDefault();
                  moveEvent.stopPropagation();
                  // Smooth scroll based on drag distance
                  mobileCarouselRef.current.scrollLeft = startScrollLeft - deltaX;
                }
              };
              
              const handleTouchEnd = () => {
                document.removeEventListener('touchmove', handleTouchMove, { passive: false } as any);
                document.removeEventListener('touchend', handleTouchEnd);
                isDragging = false;
              };
              
              document.addEventListener('touchmove', handleTouchMove, { passive: false });
              document.addEventListener('touchend', handleTouchEnd);
            }}
          >
            <div className="flex gap-6 pb-6 justify-center" style={{ 
              paddingLeft: 'calc(50vw - 140px)',
              paddingRight: 'calc(50vw - 140px)',
              width: 'max-content',
              margin: '0 auto'
            }}>
              {Array.from({ length: 10 }).flatMap(() => CAROUSEL_FEATURES).map((feature, idx) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={`${feature.title}-mobile-${idx}`}
                    className="flex-shrink-0 w-[280px] bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-lg select-none"
                  >
                    <div 
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <IconComponent className="w-10 h-10" style={{ color: feature.color }} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 select-none">{feature.title}</h3>
                    <p className="text-gray-600 text-base leading-relaxed select-none">{feature.description}</p>
                    <div 
                      className="mt-6 h-1 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
        
        {/* Horizontal Scroll Indicator - Below carousel on mobile */}
        {isMobile && (
          <div className="w-full flex justify-center mt-4">
            <CarouselScrollIndicator />
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}      </style>
    </section>
  );
}

// Memoize component for performance
export const LandingCarouselMemo = memo(LandingCarousel);
export { LandingCarouselMemo as LandingCarousel };

