import { motion } from "framer-motion";
import { BookHeart, Target, Users, Heart } from "lucide-react";
import { useState, useRef, useEffect, memo, useCallback } from "react";
import { colors } from "@/lib/designSystem";
import { useWindowSize } from "../hooks";
import styles from "../landing.module.css";

/**
 * About Us / Our Story section
 * - Glass morphism containers with floating animation
 * - Responsive layout (desktop: left/right, mobile: stacked)
 * - Hover effects with cursor glow
 * - Dark mode support
 */

interface StoryCard {
  icon: React.ElementType;
  title: string;
  text: string;
  color?: string;
}

const smallCards: StoryCard[] = [
  {
    icon: Target,
    title: "Mission",
    text: "To simplify self-discipline by turning everyday goals into habits that feel natural and rewarding.",
    color: colors.features.calendar // Green
  },
  {
    icon: Users,
    title: "Unity",
    text: "We grow better together — Displini connects people through shared routines, motivation, and encouragement.",
    color: colors.features.reminders // Pink
  },
  {
    icon: Heart,
    title: "Care",
    text: "Designed with mindfulness at its core, every feature supports your mental clarity, rest, and personal rhythm.",
    color: colors.features.ai // Yellow
  }
];

function LandingAbout() {
  const { isMobile } = useWindowSize();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  const storyCardRef = useRef<HTMLDivElement>(null);
  const missionCardRef = useRef<HTMLDivElement>(null);
  const unityCardRef = useRef<HTMLDivElement>(null);
  const careCardRef = useRef<HTMLDivElement>(null);
  
  // Invalidate cached rect on resize
  useEffect(() => {
    const handleResize = () => {
      cachedRectRef.current = null;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Throttle mouse move to reduce reflows
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cachedRectRef = useRef<DOMRect | null>(null);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseMoveTimeoutRef.current) return;
    
    mouseMoveTimeoutRef.current = setTimeout(() => {
      if (sectionRef.current) {
        // Cache rect to avoid repeated queries
        if (!cachedRectRef.current) {
          cachedRectRef.current = sectionRef.current.getBoundingClientRect();
        }
        const rect = cachedRectRef.current;
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        mouseMoveTimeoutRef.current = null;
      }
    }, 16); // ~60fps throttling
  }, []);
  
  const handleStoryCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseMoveTimeoutRef.current) return;
    
    mouseMoveTimeoutRef.current = setTimeout(() => {
      if (storyCardRef.current) {
        const cardRect = storyCardRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - cardRect.left,
          y: e.clientY - cardRect.top
        });
        mouseMoveTimeoutRef.current = null;
      }
    }, 16);
  }, []);

  return (
    <>
      {/* Desktop Version - Single Section */}
      <section 
        ref={sectionRef}
        data-section="about"
        className={`hidden lg:flex relative px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 items-center justify-center section-viewport ${styles.scrollSnapStart}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="container mx-auto max-w-7xl w-full flex items-center justify-center">
          {/* Desktop Layout: Left (Our Story) + Right (3 cards stacked) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center mx-auto w-full max-w-6xl">
          {/* Left Side - Our Story (Large Card) */}
          <motion.div
            className="relative h-full flex items-center justify-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            onMouseEnter={() => setHoveredCard('story')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <motion.div
              ref={storyCardRef}
              className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden h-full flex items-center justify-center"
              animate={{
                y: [0, -10, 0],
                scale: hoveredCard === 'story' ? 1.02 : 1,
                boxShadow: hoveredCard === 'story' 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              transition={{ 
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.3 },
                boxShadow: { duration: 0.3 }
              }}
              onMouseMove={handleStoryCardMouseMove}
            >
              {/* Cursor Glow Effect */}
              {hoveredCard === 'story' && (
                <motion.div
                  className="absolute pointer-events-none rounded-full blur-3xl dark:opacity-30 opacity-50"
                  style={{
                    width: isMobile ? '200px' : '300px',
                    height: isMobile ? '200px' : '300px',
                    background: `radial-gradient(circle, ${colors.features.todo}66 0%, transparent 70%)`,
                    position: 'absolute',
                  }}
                  animate={{
                    left: mousePosition.x - (isMobile ? 100 : 150),
                    top: mousePosition.y - (isMobile ? 100 : 150),
                  }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
                {/* Icon */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${colors.features.todo}20` }}
                >
                  <BookHeart className="w-8 h-8" style={{ color: colors.features.todo }} />
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Our Story
                </h3>

                {/* Text */}
                <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-md">
                  Displini was born from the idea that structure brings freedom. We built a space where focus, balance, and wellbeing work together — helping you stay consistent without losing calm.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Three Small Cards Stacked */}
          <div className="flex flex-col gap-8">
            {smallCards.map((card, index) => {
              const Icon = card.icon;
              const cardId = card.title.toLowerCase();
              
              // Get the appropriate ref for each card
              const getCardRef = () => {
                if (cardId === 'mission') return missionCardRef;
                if (cardId === 'unity') return unityCardRef;
                if (cardId === 'care') return careCardRef;
                return null;
              };
              
              const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
                if (mouseMoveTimeoutRef.current) return;
                
                mouseMoveTimeoutRef.current = setTimeout(() => {
                  const cardRef = getCardRef();
                  if (cardRef?.current) {
                    const cardRect = cardRef.current.getBoundingClientRect();
                    setMousePosition({
                      x: e.clientX - cardRect.left,
                      y: e.clientY - cardRect.top
                    });
                    mouseMoveTimeoutRef.current = null;
                  }
                }, 16); // ~60fps throttling
              };
              
              return (
                <motion.div
                  key={cardId}
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredCard(cardId)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <motion.div
                    ref={getCardRef()}
                    className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 md:p-8 shadow-xl overflow-hidden"
                    animate={{
                      y: [0, -8, 0],
                      scale: hoveredCard === cardId ? 1.02 : 1,
                      boxShadow: hoveredCard === cardId 
                        ? '0 20px 40px -10px rgba(0, 0, 0, 0.25)' 
                        : '0 10px 20px -5px rgba(0, 0, 0, 0.1)'
                    }}
                    transition={{ 
                      y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 },
                      scale: { duration: 0.3 },
                      boxShadow: { duration: 0.3 }
                    }}
                    onMouseMove={handleCardMouseMove}
                  >
                    {/* Cursor Glow Effect - Uses card-relative mouse position */}
                    {hoveredCard === cardId && (
                      <motion.div
                        className="absolute pointer-events-none rounded-full blur-3xl dark:opacity-30 opacity-50"
                        style={{
                          width: isMobile ? '150px' : '250px',
                          height: isMobile ? '150px' : '250px',
                          background: `radial-gradient(circle, ${card.color}66 0%, transparent 70%)`,
                          position: 'absolute',
                        }}
                        animate={{
                          left: mousePosition.x - (isMobile ? 75 : 125),
                          top: mousePosition.y - (isMobile ? 75 : 125),
                        }}
                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center text-center">
                      {/* Icon */}
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${card.color}20` }}
                      >
                        <Icon className="w-7 h-7" style={{ color: card.color }} />
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {card.title}
                      </h3>

                      {/* Text */}
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                        {card.text}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          </div>
        </div>
      </section>

      {/* Mobile Version - Split into Two Sections */}
      
      {/* Section 1: Our Story */}
      <section
        ref={sectionRef}
        data-section="about-story"
        className={`lg:hidden relative px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center section-viewport ${styles.scrollSnapStart}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="container mx-auto max-w-md w-full flex items-center justify-center px-4">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            onMouseEnter={() => setHoveredCard('story-mobile')}
          >
            <motion.div
              className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden"
              animate={{
                y: [0, -10, 0],
                scale: hoveredCard === 'story-mobile' ? 1.02 : 1,
                boxShadow: hoveredCard === 'story-mobile' 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              transition={{ 
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.3 },
                boxShadow: { duration: 0.3 }
              }}
            >
              {/* Cursor Glow Effect */}
              {hoveredCard === 'story-mobile' && (
                <motion.div
                  className="absolute pointer-events-none rounded-full blur-3xl dark:opacity-30 opacity-50"
                  style={{
                    width: isMobile ? '200px' : '300px',
                    height: isMobile ? '200px' : '300px',
                    background: `radial-gradient(circle, ${colors.features.todo}66 0%, transparent 70%)`,
                    position: 'absolute',
                  }}
                  animate={{
                    left: mousePosition.x - (isMobile ? 100 : 150),
                    top: mousePosition.y - (isMobile ? 100 : 150),
                  }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icon */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${colors.features.todo}20` }}
                >
                  <BookHeart className="w-8 h-8" style={{ color: colors.features.todo }} />
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Our Story
                </h3>

                {/* Text */}
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  Displini was born from the idea that structure brings freedom. We built a space where focus, balance, and wellbeing work together — helping you stay consistent without losing calm.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Mission, Unity, Care */}
      <section
        ref={sectionRef}
        data-section="about-values"
        className={`lg:hidden relative px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center section-viewport ${styles.scrollSnapStart}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="container mx-auto max-w-md w-full flex items-center justify-center px-4">
          <div className="flex flex-col gap-4 md:gap-8 items-center justify-center w-full max-w-sm">
            {smallCards.map((card, index) => {
              const Icon = card.icon;
              const cardId = `${card.title.toLowerCase()}-mobile`;
              
              return (
                <motion.div
                  key={cardId}
                  className="relative w-full flex justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredCard(cardId)}
                >
                  <motion.div
                    className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl p-3 md:p-6 shadow-xl overflow-hidden w-full"
                    animate={{
                      y: [0, -8, 0],
                      scale: hoveredCard === cardId ? 1.02 : 1,
                      boxShadow: hoveredCard === cardId 
                        ? '0 20px 40px -10px rgba(0, 0, 0, 0.25)' 
                        : '0 10px 20px -5px rgba(0, 0, 0, 0.1)'
                    }}
                    transition={{ 
                      y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 },
                      scale: { duration: 0.3 },
                      boxShadow: { duration: 0.3 }
                    }}
                  >
                    {/* Cursor Glow Effect - Uses global mouse position */}
                    {hoveredCard === cardId && (
                      <motion.div
                        className="absolute pointer-events-none rounded-full blur-3xl dark:opacity-30 opacity-50"
                        style={{
                          width: isMobile ? '150px' : '250px',
                          height: isMobile ? '150px' : '250px',
                          background: `radial-gradient(circle, ${card.color}66 0%, transparent 70%)`,
                          position: 'absolute',
                        }}
                        animate={{
                          left: mousePosition.x - (isMobile ? 75 : 125),
                          top: mousePosition.y - (isMobile ? 75 : 125),
                        }}
                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center text-center">
                      {/* Icon */}
                      <div 
                        className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} rounded-full flex items-center justify-center ${isMobile ? 'mb-2' : 'mb-4'}`}
                        style={{ backgroundColor: `${card.color}20` }}
                      >
                        <Icon className={isMobile ? 'w-5 h-5' : 'w-7 h-7'} style={{ color: card.color }} />
                      </div>

                      {/* Title */}
                      <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 dark:text-white ${isMobile ? 'mb-2' : 'mb-3'}`}>
                        {card.title}
                      </h3>

                      {/* Text */}
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 dark:text-gray-300 leading-relaxed`}>
                        {card.text}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

// Memoize component for performance
export const LandingAboutMemo = memo(LandingAbout);
export { LandingAboutMemo as LandingAbout };
