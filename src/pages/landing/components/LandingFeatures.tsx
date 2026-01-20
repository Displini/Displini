import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { FEATURES, TIMELINE, ANIMATION, SCROLL } from "../constants";
import { useWindowSize } from "../hooks";
import { colors } from "@/lib/designSystem";
import styles from "../landing.module.css";
import type { Feature } from "../constants";

/**
 * Interactive feature showcase with tab switching
 * - Shows Reminders, To-Do, Calendar, AI features
 * - Typewriter effect for descriptions
 * - iPhone mockup with glow effects
 * - Wheel event hijacking for smooth tab switching
 */
export interface Task {
  id: string;
  title: string;
  time?: string;
  completed: boolean;
  emoji?: string;
}

function LandingFeatures() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();
  const [activeFeature, setActiveFeature] = useState(0);
  
  const sectionRef = useRef<HTMLElement>(null);
  const lastChangeRef = useRef<number>(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  
  // Ensure activeFeature is always within bounds
  useEffect(() => {
    if (activeFeature < 0 || activeFeature >= FEATURES.length) {
      setActiveFeature(0);
    }
  }, [activeFeature]);

  // Swipe functionality for tabs - works on both mobile and desktop
  useEffect(() => {
    if (!sectionRef.current) return;
    
    let touchStartTime = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime = Date.now();
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    };
    
    const handleTouchEnd = () => {
      if (!touchStartX.current || !touchEndX.current) return;
      
      const deltaX = touchStartX.current - touchEndX.current;
      const deltaY = Math.abs(touchStartY.current - touchEndY.current);
      const deltaTime = Date.now() - touchStartTime;
      const minSwipeDistance = 50;
      const maxSwipeTime = 500;
      
      // Only trigger if horizontal swipe is dominant and fast enough
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime) {
        const now = Date.now();
        if (now - lastChangeRef.current < SCROLL.COOLDOWN) return;
        
        if (deltaX > 0) {
          // Swipe left - next tab
          lastChangeRef.current = now;
          setActiveFeature((prev) => {
            if (prev < FEATURES.length - 1) return prev + 1;
            return prev;
          });
        } else {
          // Swipe right - previous tab
          lastChangeRef.current = now;
          setActiveFeature((prev) => {
            if (prev > 0) return prev - 1;
            return prev;
          });
        }
      }
      
      touchStartX.current = 0;
      touchEndX.current = 0;
      touchStartY.current = 0;
      touchStartTime = 0;
    };
    
    const section = sectionRef.current;
    section.addEventListener('touchstart', handleTouchStart, { passive: true });
    section.addEventListener('touchmove', handleTouchMove, { passive: true });
    section.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      section.removeEventListener('touchstart', handleTouchStart);
      section.removeEventListener('touchmove', handleTouchMove);
      section.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeFeature]);
  
  // To-Do Demo State
  const [todoTasks, setTodoTasks] = useState<Task[]>([
    { id: '1', title: 'Morning coffee', time: '08:00', completed: false, emoji: '☕' },
    { id: '2', title: 'Team meeting', time: '10:00', completed: false, emoji: '👥' },
  ]);
  
  // Helper to format time for display - memoized
  const formatTimeDisplay = useCallback((time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }, []);
  
  // Helper functions - memoized
  const timeToMinutes = useCallback((time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }, []);
  
  // Sort tasks by time and remove duplicates - memoized
  const sortedTasks = useMemo(() => {
    return [...todoTasks]
      .filter((task, index, self) => 
        index === self.findIndex(t => t.title === task.title && t.time === task.time)
      )
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  }, [todoTasks]);
  
  // Get start and end times for timeline - memoized
  const timelineRange = useMemo(() => ({
    start: TIMELINE.WAKE_UP,
    end: TIMELINE.BEDTIME,
  }), []);
  
  // Calculate timeline positions (percentage from top) - memoized
  const getTaskPositionPercent = useCallback((time: string, startTime: string, endTime: string): number => {
    if (!time) return 0;
    const taskMinutes = timeToMinutes(time);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const position = ((taskMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
    return Math.max(0, Math.min(100, position));
  }, [timeToMinutes]);
  
  // Calculate liquid fill percentage - memoized
  const calculateFillPercentage = useCallback((): number => {
    if (sortedTasks.length === 0) return 0;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(timelineRange.start);
    const endMinutes = timeToMinutes(timelineRange.end);
    
    // Calculate fill based on current time relative to timeline range
    if (currentMinutes < startMinutes) return 0;
    if (currentMinutes > endMinutes) return 100;
    
    const fill = ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
    return Math.max(0, Math.min(100, fill));
  }, [sortedTasks.length, timeToMinutes, timelineRange]);
  
  const [fillPercentage, setFillPercentage] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [promoWiggle, setPromoWiggle] = useState(false);
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (activeFeature === 1) {
      const percentage = calculateFillPercentage();
      setFillPercentage(percentage);
      // Trigger animation after a short delay
      setTimeout(() => {
        setHasAnimated(true);
      }, 100);
    } else {
      setHasAnimated(false);
      setFillPercentage(0);
    }
  }, [activeFeature, calculateFillPercentage, currentTime]);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter animation
  useEffect(() => {
    // Reset when feature changes
    setDisplayedText('');
    setIsTyping(false);
    
    if (!FEATURES || FEATURES.length === 0) return;
    if (activeFeature < 0 || activeFeature >= FEATURES.length) return;
    if (!FEATURES[activeFeature] || !FEATURES[activeFeature].description) return;
    
    const fullText = FEATURES[activeFeature].description;
    if (!fullText) return;
    
    setIsTyping(true);
    setDisplayedText('');
    
    let currentIndex = 0;
    let typingInterval: NodeJS.Timeout | null = null;
    
    const startTyping = () => {
      typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
          }
          setIsTyping(false);
        }
      }, ANIMATION.TYPING_SPEED);
    };
    
    // Small delay to ensure state is ready
    const timeoutId = setTimeout(startTyping, 50);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
      }
      setIsTyping(false);
    };
  }, [activeFeature]);

  // Improved snap detection with faster activation
  const [canChangeTab, setCanChangeTab] = useState(false);
  const snapCompleteRef = useRef(false);
  
  // Cache viewport height to avoid repeated queries
  const viewportHeightRef = useRef(window.innerHeight);
  
  useEffect(() => {
    // Update viewport height on resize
    const handleResize = () => {
      viewportHeightRef.current = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    // Detect when section is centered and stable
    const checkIfCentered = () => {
      if (!sectionRef.current || snapCompleteRef.current) return;
      
      // Batch DOM reads
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = viewportHeightRef.current;
      const isCentered = Math.abs(rect.top + rect.height / 2 - viewportHeight / 2) < 100;
      
      if (isCentered) {
        // Shorter delay for faster response
        setTimeout(() => {
          snapCompleteRef.current = true;
          setCanChangeTab(true);
        }, 500);
      }
    };
    
    // Check less frequently to reduce reflows
    const interval = setInterval(checkIfCentered, 100);
    
    // Fallback timeout - quicker activation
    const fallbackTimer = setTimeout(() => {
      snapCompleteRef.current = true;
      setCanChangeTab(true);
    }, 1500);
    
    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (!isVisible) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveFeature((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveFeature((prev) => (prev < FEATURES.length - 1 ? prev + 1 : prev));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Wheel event - change tabs on vertical OR horizontal scroll
  useEffect(() => {
    if (!canChangeTab || !FEATURES || FEATURES.length === 0) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (!sectionRef.current || !FEATURES || FEATURES.length === 0) return;
      
      // Batch DOM reads
      const rect = sectionRef.current.getBoundingClientRect();
      const now = Date.now();
      const viewportHeight = viewportHeightRef.current;
      
      // Strict centering check - section must be centered
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const isCentered = Math.abs(sectionCenter - viewportCenter) < 100;
      
      if (isCentered) {
        // Prevent rapid changes
        if (now - lastChangeRef.current < SCROLL.COOLDOWN) {
          e.preventDefault();
          return;
        }
        
        const scrollThreshold = SCROLL.THRESHOLD;
        const deltaX = Math.abs(e.deltaX);
        const deltaY = Math.abs(e.deltaY);
        
        // Check for horizontal scrolling (swiping sideways with trackpad/mouse wheel)
        // More sensitive: horizontal movement must be at least 1.5x vertical movement
        if (deltaX > 0 && deltaX > deltaY * 1.5 && deltaX > scrollThreshold) {
          // Horizontal scroll detected
          if (e.deltaX > 0) {
            // Scroll right - next tab
            if (activeFeature < FEATURES.length - 1) {
              e.preventDefault();
              e.stopPropagation();
              lastChangeRef.current = now;
              setActiveFeature((prev) => prev + 1);
            }
          } else {
            // Scroll left - previous tab
            if (activeFeature > 0) {
              e.preventDefault();
              e.stopPropagation();
              lastChangeRef.current = now;
              setActiveFeature((prev) => prev - 1);
            }
          }
          return;
        }
        
        // Vertical scrolling (existing functionality)
        if (deltaY > scrollThreshold && deltaY > deltaX * 1.5) {
          if (e.deltaY > 0) {
            // Scrolling down
            if (activeFeature < FEATURES.length - 1) {
              // Not at last tab - prevent scroll and change tab
              e.preventDefault();
              e.stopPropagation();
              lastChangeRef.current = now;
              setActiveFeature((prev) => prev + 1);
            }
            // At last tab - allow normal scroll to next section
          } else if (e.deltaY < 0) {
            // Scrolling up
            if (activeFeature > 0) {
              // Not at first tab - prevent scroll and change tab
              e.preventDefault();
              e.stopPropagation();
              lastChangeRef.current = now;
              setActiveFeature((prev) => prev - 1);
            }
            // At first tab - allow normal scroll to previous section
          }
        }
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', handleWheel, { capture: true });
  }, [activeFeature, canChangeTab]);

  return (
    <motion.section 
      ref={sectionRef}
      data-section="interactive-showcase"
      id="features"
      className={`px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden section-viewport ${styles.featuresSection}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="container mx-auto max-w-7xl w-full">
        {/* Glassmorphic Container */}
        <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-white/60 shadow-2xl overflow-visible">
          {/* Gradient glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-[300px_1fr_300px] lg:gap-4 lg:items-center">
            {/* Description Text - Bottom on mobile (order-3), Left on desktop */}
            <div className="order-3 mt-6 lg:mt-0 lg:order-1" role="tabpanel" id={`feature-panel-${activeFeature}`} aria-live="polite">
              <div className="transition-all duration-300 ease-in-out text-justify min-h-[100px]">
                <p className="text-gray-600 text-sm md:text-base lg:text-lg leading-relaxed whitespace-pre-line max-w-xs mx-auto lg:mx-0 lg:max-w-none">
                  {displayedText || (FEATURES[activeFeature]?.description || '')}
                  {isTyping && <span className="animate-pulse" aria-hidden="true">|</span>}
                </p>
              </div>
            </div>

            {/* Center Container - Phone and Buttons */}
            <div className="flex flex-col items-center mx-auto order-2 lg:order-2">
              {/* Feature Buttons - Below Phone on Desktop */}
              {!isMobile && (
                <div 
                  ref={tabsContainerRef}
                  className="order-1 lg:order-2 flex flex-row gap-2 md:gap-4 w-full max-w-md mb-4 lg:mb-0 lg:mt-8 overflow-x-auto scrollbar-hide pb-2 lg:pb-0 justify-center md:justify-start"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-y pan-x'
                  }}
                  role="tablist"
                  aria-label="Feature selection tabs"
                >
                  {FEATURES.map((feature, index) => {
                    if (!feature || !feature.icon) return null;
                    const IconComponent = feature.icon;
                    return (
                      <motion.button
                        key={feature.id || index}
                        onClick={() => setActiveFeature(index)}
                        className="relative group flex-shrink-0 px-2 md:px-4 py-2 md:py-3 font-medium transition-all duration-300"
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        role="tab"
                        aria-selected={activeFeature === index}
                        aria-controls={`feature-panel-${index}`}
                        aria-label={`Switch to ${feature.title} feature`}
                        tabIndex={activeFeature === index ? 0 : -1}
                      >
                        <motion.div 
                          className="flex flex-col items-center gap-1 md:gap-2"
                          animate={{
                            scale: activeFeature === index ? 1.1 : 1,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <IconComponent 
                            className={`transition-all duration-300 ${activeFeature === index ? 'w-4 h-4 md:w-7 md:h-7' : 'w-3 h-3 md:w-6 md:h-6'}`}
                            style={{ color: activeFeature === index ? (feature.color || colors.neutral.gray) : colors.neutral.gray }}
                          />
                          <span 
                            className={`text-xs md:text-sm transition-all duration-300 whitespace-nowrap ${activeFeature === index ? 'font-bold' : 'font-normal'}`}
                            style={{ color: activeFeature === index ? (feature.color || colors.text.secondary) : colors.text.secondary }}
                          >
                            {feature.title || `Feature ${index + 1}`}
                          </span>
                        </motion.div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* iPhone Mockup - Center (mobile icons moved below to avoid overlap) */}
              <div className="order-2 lg:order-1 relative overflow-visible mx-auto">
                {/* Glow effect behind phone */}
                <div 
                  className={`absolute inset-0 rounded-[3rem] transition-all duration-700 ${isMobile ? 'blur-2xl opacity-30' : 'blur-3xl opacity-50'}`}
                  style={{ 
                    backgroundColor: FEATURES[activeFeature]?.color || colors.features.todo,
                    transform: isMobile ? 'scale(1.05)' : 'scale(1.1)',
                    overflow: 'visible'
                  }}
                ></div>
                
                {/* iPhone Frame */}
                <div className="relative bg-gray-900 rounded-[2.5rem] p-2.5 shadow-2xl mx-auto" style={{ 
                  width: isMobile ? '220px' : isTablet ? '240px' : '260px', 
                  height: isMobile ? '440px' : isTablet ? '480px' : '520px', 
                  maxWidth: '85vw' 
                }}>
                  {/* Notch */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${isMobile ? 'w-20 h-4' : isTablet ? 'w-28 h-5' : 'w-32 h-6'} bg-gray-900 rounded-b-3xl z-20`}></div>
                  
                  {/* Screen - Reflects dark/light mode */}
                  <div className="relative w-full h-full dark:bg-gray-900 bg-white rounded-[2.5rem] overflow-hidden flex flex-col">
                    {/* Noise texture overlay */}
                    <div 
                      className="absolute inset-0 opacity-[0.15] pointer-events-none z-0"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        backgroundSize: '200px 200px'
                      }}
                    />
                    
                    {/* To-Do Demo Content */}
                    {activeFeature === 1 ? (
                      <div className="relative z-10 flex flex-col h-full bg-gray-50 dark:bg-gray-900" style={{ position: 'relative' }}>
                        {/* Header */}
                        <div className={`${isMobile ? 'px-3 pt-4 pb-1.5' : isTablet ? 'px-3 pt-5 pb-1.5' : 'px-4 pt-6 pb-2'} border-b border-gray-200 dark:border-gray-700`}>
                          <h3 className={`${isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white ${isMobile ? 'mb-0.5' : 'mb-1'}`}>Today</h3>
                          <p className={`${isMobile ? 'text-[10px]' : isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400`}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                        </div>
                        
                        {/* Timeline Container - Matching App Style */}
                        {(() => {
                          const timelineHeight = isMobile ? 280 : isTablet ? 300 : 320;
                          const paddingLeft = isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem';
                          const paddingTop = isMobile ? '1.5rem' : isTablet ? '2rem' : '2.25rem';
                          const paddingBottom = isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem';
                          
                          return (
                            <div className="flex-1 relative overflow-visible" style={{ 
                              paddingLeft, 
                              paddingRight: '0.5rem', 
                              paddingTop, 
                              paddingBottom, 
                              height: `${timelineHeight}px`,
                              marginTop: isMobile ? '0.5rem' : '0'
                            }}>
                              {/* Timeline Items Container */}
                              <div className="relative" style={{ height: `${timelineHeight}px` }}>
                                {/* Liquid Timeline Background */}
                                <div className="absolute" style={{ left: isMobile ? '32px' : isTablet ? '28px' : '30px', top: '0px', width: isMobile ? '6px' : isTablet ? '7px' : '8px', height: `${timelineHeight}px`, zIndex: 0 }}>
                                  {/* Background bar */}
                                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                  {/* Liquid Fill */}
                                  <div 
                                    className="absolute top-0 left-0 w-full bg-blue-500 transition-all duration-1000 ease-out rounded-full"
                                    style={{ 
                                      height: hasAnimated ? `${fillPercentage}%` : '0%',
                                    }}
                                  />
                                </div>
                                
                                {/* Wake-up dot - ON TOP of timeline bar */}
                                {(() => {
                                  const wakeUpPositionPercent = getTaskPositionPercent(timelineRange.start, timelineRange.start, timelineRange.end);
                                  const wakeUpPositionPx = (wakeUpPositionPercent / 100) * timelineHeight;
                                  
                                  return (
                                    <>
                                      {/* Time Label - LEFT of timeline bar */}
                                      <div
                                        className="absolute"
                                        style={{ 
                                          top: `${wakeUpPositionPx}px`,
                                          left: isMobile ? '-24px' : isTablet ? '-28px' : '-36px',
                                          transform: 'translateY(-50%)',
                                          width: isMobile ? '24px' : isTablet ? '28px' : '36px',
                                          textAlign: 'right'
                                        }}
                                      >
                                        <span className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-[9px]' : 'text-[10px]'} font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap`}>
                                          {formatTimeDisplay(timelineRange.start)}
                                        </span>
                                      </div>
                                      
                                      {/* Sleep schedule dot - ON TOP of timeline bar (centered) */}
                                      <div
                                        className="absolute"
                                        style={{ 
                                          top: `${wakeUpPositionPx}px`,
                                          left: isMobile ? '32px' : isTablet ? '28px' : '30px', // Timeline bar left edge
                                          width: isMobile ? '6px' : isTablet ? '7px' : '8px', // Same as timeline bar width
                                          height: isMobile ? '28px' : isTablet ? '32px' : '40px', // Dot height
                                          transform: 'translateY(-50%)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          zIndex: 20
                                        }}
                                      >
                                        <div className={`${isMobile ? 'w-6 h-6' : isTablet ? 'w-7 h-7' : 'w-9 h-9'} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg bg-blue-500`}>
                                          <span className={`text-white ${isMobile ? 'text-[9px]' : isTablet ? 'text-[9px]' : 'text-[11px]'} font-bold`}>☀️</span>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                                
                                {/* Bedtime dot - ON TOP of timeline bar */}
                                {(() => {
                                  const bedtimePositionPercent = getTaskPositionPercent(timelineRange.end, timelineRange.start, timelineRange.end);
                                  const bedtimePositionPx = (bedtimePositionPercent / 100) * timelineHeight;
                                  
                                  return (
                                    <>
                                      {/* Time Label - LEFT of timeline bar */}
                                      <div
                                        className="absolute"
                                        style={{ 
                                          top: `${bedtimePositionPx}px`,
                                          left: isMobile ? '-24px' : isTablet ? '-28px' : '-36px',
                                          transform: 'translateY(-50%)',
                                          width: isMobile ? '24px' : isTablet ? '28px' : '36px',
                                          textAlign: 'right'
                                        }}
                                      >
                                        <span className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-[9px]' : 'text-[10px]'} font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap`}>
                                          {formatTimeDisplay(timelineRange.end)}
                                        </span>
                                      </div>
                                      
                                      {/* Sleep schedule dot - ON TOP of timeline bar (centered) */}
                                      <div
                                        className="absolute"
                                        style={{ 
                                          top: `${bedtimePositionPx}px`,
                                          left: isMobile ? '32px' : isTablet ? '28px' : '30px', // Timeline bar left edge
                                          width: isMobile ? '6px' : isTablet ? '7px' : '8px', // Same as timeline bar width
                                          height: isMobile ? '28px' : isTablet ? '32px' : '40px', // Dot height
                                          transform: 'translateY(-50%)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          zIndex: 20
                                        }}
                                      >
                                        <div className={`${isMobile ? 'w-6 h-6' : isTablet ? 'w-7 h-7' : 'w-9 h-9'} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg bg-blue-500`}>
                                          <span className={`text-white ${isMobile ? 'text-[9px]' : isTablet ? 'text-[9px]' : 'text-[11px]'} font-bold`}>🌙</span>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                                
                                {/* Current Time Indicator */}
                                {(() => {
                                  const now = currentTime;
                                  const currentHours = now.getHours();
                                  const currentMinutes = now.getMinutes();
                                  const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
                                  const currentPositionPercent = getTaskPositionPercent(currentTimeStr, timelineRange.start, timelineRange.end);
                                  const currentPositionPx = (currentPositionPercent / 100) * timelineHeight;
                                  
                                  // Only show if current time is within timeline range
                                  const startMinutes = timeToMinutes(timelineRange.start);
                                  const endMinutes = timeToMinutes(timelineRange.end);
                                  const currentTotalMinutes = currentHours * 60 + currentMinutes;
                                  
                                  if (currentTotalMinutes < startMinutes || currentTotalMinutes > endMinutes) {
                                    return null;
                                  }
                                  
                                  return (
                                    <>
                                      {/* Current Time Label - LEFT of timeline bar */}
                                      <div
                                        className="absolute"
                                        style={{ 
                                          top: `${currentPositionPx}px`,
                                          left: isMobile ? '-18px' : isTablet ? '-28px' : '-36px',
                                          transform: 'translateY(-50%)',
                                          width: isMobile ? '20px' : isTablet ? '28px' : '36px',
                                          textAlign: 'right'
                                        }}
                                      >
                                        <span className={`${isMobile ? 'text-[8px]' : isTablet ? 'text-[9px]' : 'text-[10px]'} font-mono font-bold text-blue-500 dark:text-blue-400 whitespace-nowrap`}>
                                          {formatTimeDisplay(currentTimeStr)}
                                        </span>
                                      </div>
                                      
                                      {/* Current Time Dot - ON TOP of timeline bar */}
                                      <div
                                        className="absolute"
                                        style={{ 
                                          top: `${currentPositionPx}px`,
                                          left: isMobile ? '32px' : isTablet ? '28px' : '30px', // Timeline bar left edge
                                          width: isMobile ? '6px' : isTablet ? '7px' : '8px', // Same as timeline bar width
                                          height: isMobile ? '16px' : isTablet ? '18px' : '20px', // Dot height
                                          transform: 'translateY(-50%)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          zIndex: 25
                                        }}
                                      >
                                        <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 shadow-lg flex items-center justify-center flex-shrink-0`}></div>
                                      </div>
                                    </>
                                  );
                                })()}
                                
                                {/* Tasks - Positioned ON the timeline */}
                                {sortedTasks.map((task, index) => {
                                  if (!task.time) return null;
                                  
                                  const positionPercent = getTaskPositionPercent(task.time, timelineRange.start, timelineRange.end);
                                  const positionPx = (positionPercent / 100) * timelineHeight;
                                  
                                  return (
                                    <div key={task.id}>
                                      {/* Time Label - LEFT of timeline bar (skip for promo task) */}
                                      {task.id !== 'promo-task' && (
                                        <div
                                          className="absolute"
                                          style={{ 
                                            top: `${positionPx}px`,
                                          left: isMobile ? '-18px' : isTablet ? '-26px' : '-34px',
                                          transform: 'translateY(-50%)',
                                          width: isMobile ? '20px' : isTablet ? '26px' : '34px',
                                             textAlign: 'right'
                                           }}
                                          >
                                          <span className={`${isMobile ? 'text-[8px]' : isTablet ? 'text-[9px]' : 'text-[10px]'} font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap`}>
                                            {formatTimeDisplay(task.time)}
                                          </span>
                                        </div>
                                      )}
                                      
                                      {/* Task Card - RIGHT of timeline bar */}
                                      <div
                                        className="absolute"
                                        style={{ 
                                          top: `${positionPx}px`,
                                          left: isMobile ? '44px' : isTablet ? '48px' : '52px', // Right of timeline bar: 12px/16px + 6px/8px + 6px/8px spacing
                                          transform: 'translateY(-50%)',
                                          zIndex: task.id === 'promo-task' ? 35 : 30,
                                          pointerEvents: 'auto'
                                        }}
                                      >
                                        {task.id === 'promo-task' ? (
                                          <motion.div
                                            className={`bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg ${isMobile ? 'p-1.5' : isTablet ? 'p-1.5' : 'p-2'} border border-blue-400 dark:border-blue-500 shadow-lg`}
                                            style={{ maxWidth: isMobile ? '110px' : isTablet ? '115px' : '135px' }}
                                            animate={promoWiggle ? {
                                              rotate: [0, -10, 10, -10, 10, 0],
                                              scale: [1, 1.05, 1, 1.05, 1],
                                            } : {}}
                                            transition={{
                                              duration: 0.6,
                                              ease: "easeInOut"
                                            }}
                                          >
                                            <div className={`flex flex-col ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                                              <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                                                <span className={`${isMobile ? 'text-[10px]' : isTablet ? 'text-[9px]' : 'text-[10px]'} flex-shrink-0`}>{task.emoji || '🚀'}</span>
                                                <span className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-[8px]' : 'text-[9px]'} font-medium text-white`}>
                                                  {task.title}
                                                </span>
                                              </div>
                                              <a
                                                href="#"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  // Navigate to sign up page
                                                  navigate('/auth/signup');
                                                }}
                                                className={`${isMobile ? 'text-[9px] px-1 py-0.5' : isTablet ? 'text-[8px] px-0.5 py-0.5' : 'text-[9px] px-1 py-0.5'} font-bold text-white bg-white/20 hover:bg-white/30 rounded text-center transition-all`}
                                              >
                                                Get started!
                                              </a>
                                            </div>
                                          </motion.div>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTodoTasks(tasks =>
                                                tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
                                              );
                                            }}
                                            className={`bg-white dark:bg-gray-800 rounded-lg ${isMobile ? 'p-2' : isTablet ? 'p-1.5' : 'p-2'} border transition-all text-left cursor-pointer ${
                                              task.completed 
                                                ? 'border-gray-200 dark:border-gray-700 opacity-60' 
                                                : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                                            }`}
                                            style={{ maxWidth: isMobile ? '110px' : isTablet ? '110px' : '120px' }}
                                          >
                                            <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1'}`}>
                                              <span className={`${isMobile ? 'text-xs' : isTablet ? 'text-[10px]' : 'text-xs'} flex-shrink-0`}>{task.emoji || '📝'}</span>
                                              <span className={`${isMobile ? 'text-[10px]' : isTablet ? 'text-[9px]' : 'text-[10px]'} font-medium truncate ${
                                                task.completed 
                                                  ? 'line-through text-gray-400 dark:text-gray-500' 
                                                  : 'text-gray-900 dark:text-white'
                                              }`}>
                                                {task.title}
                                              </span>
                                              {task.completed && (
                                                <span className="text-blue-500 text-xs flex-shrink-0">✓</span>
                                              )}
                                            </div>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Floating + Button - Bottom Right - Positioned relative to screen container */}
                        <div 
                          className={`absolute ${isMobile ? 'bottom-1.5 right-6' : 'bottom-4 right-4'} z-20`} 
                          style={{ 
                            position: 'absolute',
                            pointerEvents: 'auto'
                          }}
                        >
                          <style>{`
                            @keyframes breathe {
                              0%, 100% {
                                transform: scale(1);
                                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                              }
                              50% {
                                transform: scale(1.05);
                                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
                              }
                            }
                            
                            .breathing-button {
                              animation: breathe 2s ease-in-out infinite;
                            }
                            
                            @keyframes breathe {
                              0%, 100% {
                                transform: scale(1);
                                opacity: 1;
                              }
                              50% {
                                transform: scale(1.1);
                                opacity: 0.9;
                              }
                            }
                            
                            .try-me-text {
                              animation: breathe 2s ease-in-out infinite;
                            }
                          `}</style>
                          <button
                            onClick={() => {
                              // Add a demo task
                              const demoTasks = [
                                { title: 'Lunch break', time: '12:00', emoji: '🍽️' },
                                { title: 'Workout', time: '15:00', emoji: '🏋️' },
                                { title: 'Evening reading', time: '20:00', emoji: '📚' },
                              ];
                              
                              // Check if evening reading has been added
                              const eveningReadingAdded = todoTasks.some(t => 
                                t.title === 'Evening reading' && t.time === '20:00'
                              );
                              
                              // Check if all demo tasks have been added
                              const allTasksAdded = demoTasks.every(demoTask =>
                                todoTasks.some(t => t.title === demoTask.title && t.time === demoTask.time)
                              );
                              
                              if (allTasksAdded && eveningReadingAdded) {
                                // Add promotional task after evening reading is shown
                                const promoTask: Task = {
                                  id: 'promo-task',
                                  title: 'Wanna add more tasks?',
                                  time: '19:30',
                                  completed: false,
                                  emoji: '🚀',
                                };
                                
                                // Check if promo task already exists
                                const promoExists = todoTasks.some(t => t.id === 'promo-task');
                                if (!promoExists) {
                                  setTodoTasks([...todoTasks, promoTask]);
                                } else {
                                  // Trigger wiggle animation if promo task already exists
                                  setPromoWiggle(true);
                                  setTimeout(() => setPromoWiggle(false), 600);
                                }
                              } else {
                                // Add tasks in order: lunch break first, then workout, then reading
                                const availableTasks = demoTasks.filter(demoTask =>
                                  !todoTasks.some(t => t.title === demoTask.title && t.time === demoTask.time)
                                );
                                
                                if (availableTasks.length > 0) {
                                  // Priority order: Lunch break -> Workout -> Evening reading
                                  const lunchBreak = availableTasks.find(t => t.title === 'Lunch break');
                                  const workout = availableTasks.find(t => t.title === 'Workout');
                                  const eveningReading = availableTasks.find(t => t.title === 'Evening reading');
                                  
                                  const taskToAdd = lunchBreak || workout || eveningReading || availableTasks[0];
                                  
                                  const newTask: Task = {
                                    id: Date.now().toString(),
                                    title: taskToAdd.title,
                                    time: taskToAdd.time,
                                    completed: false,
                                    emoji: taskToAdd.emoji,
                                  };
                                  setTodoTasks([...todoTasks, newTask]);
                                }
                              }
                            }}
                            className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center flex-shrink-0 breathing-button`}
                            style={{ transformOrigin: 'center', backfaceVisibility: 'hidden' }}
                          >
                            <Plus className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                          <p className="text-sm">Preview coming soon</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Mobile feature buttons below phone to avoid overlap */}
                {isMobile && (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {FEATURES.map((feature, idx) => {
                      const IconComponent = feature.icon;
                      return (
                        <motion.button
                          key={feature.id}
                          onClick={() => setActiveFeature(idx)}
                          className="relative group flex-shrink-0 px-3 py-2 font-medium transition-all duration-300 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 shadow-sm"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <motion.div 
                            className="flex items-center gap-2"
                            animate={{
                              scale: activeFeature === idx ? 1.05 : 1,
                            }}
                            transition={{ duration: 0.15 }}
                          >
                            <IconComponent 
                              className={`transition-all duration-300 ${activeFeature === idx ? 'w-4 h-4' : 'w-3.5 h-3.5'}`}
                              style={{ color: activeFeature === idx ? feature.color : colors.neutral.gray }}
                            />
                            <span 
                              className={`text-xs transition-all duration-300 whitespace-nowrap ${activeFeature === idx ? 'font-semibold' : 'font-normal'}`}
                              style={{ color: activeFeature === idx ? feature.color : colors.text.secondary }}
                            >
                              {feature.title}
                            </span>
                          </motion.div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Empty third column for balance */}
            <div className="hidden lg:block lg:order-3"></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// Memoize component for performance
export const LandingFeaturesMemo = memo(LandingFeatures);
export { LandingFeaturesMemo as LandingFeatures };

