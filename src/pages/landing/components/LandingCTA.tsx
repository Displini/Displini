import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Instagram, Youtube, CheckCircle2, Loader2 } from "lucide-react";

/**
 * Call-to-action section with email signup
 * - Animated gradient blobs (mouse-following effect)
 * - Email subscription form (backend integration pending)
 * - Loading and success states with animations
 * - Social media links
 */
export function LandingCTA() {
  const [email, setEmail] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [animatedPos, setAnimatedPos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return; // Don't track mouse on mobile
      // Normalize mouse position to -1 to 1 range
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isMobile]);

  // Animated loop for mobile
  useEffect(() => {
    if (!isMobile) {
      // Reset animated position when not mobile
      setAnimatedPos({ x: 0, y: 0 });
      return;
    }

    const animate = () => {
      timeRef.current += 0.015;
      // Create smooth circular motion - different speeds for variety
      const x = Math.sin(timeRef.current) * 0.8;
      const y = Math.cos(timeRef.current * 0.7) * 0.8;
      setAnimatedPos({ x, y });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation immediately
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMobile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);
    
    // TODO: Connect to backend API when ready
    // For now, simulate success
    setTimeout(() => {
      setIsSuccess(true);
      setEmail('');
      setIsLoading(false);
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    }, 800);
  };
  
  return (
    <section className="relative py-20 pt-32 overflow-hidden bg-gray-900 dark:bg-gray-950 z-40" style={{ 
      boxShadow: 'inset 0 20px 40px rgba(0,0,0,0.3), inset 0 40px 80px rgba(0,0,0,0.2), inset 0 60px 120px rgba(0,0,0,0.1), inset 0 80px 160px rgba(0,0,0,0.05)',
      marginTop: '-200px',
      scrollSnapAlign: 'start',
      scrollSnapStop: isMobile ? 'normal' : 'always'
    }}>
      {/* Animated Background Blobs - Follow Mouse on desktop, animated loop on mobile */}
      <div 
        className={`absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full opacity-60 blur-3xl ${isMobile ? '' : 'transition-transform duration-1000 ease-out'}`}
        style={{ 
          transform: `translate(${(isMobile ? animatedPos.x : mousePos.x) * 50}px, ${(isMobile ? animatedPos.y : mousePos.y) * 50}px)`,
        }}
      ></div>
      
      <div 
        className={`absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-500 to-green-700 rounded-full opacity-60 blur-3xl ${isMobile ? '' : 'transition-transform duration-1000 ease-out'}`}
        style={{ 
          transform: `translate(${-(isMobile ? animatedPos.x : mousePos.x) * 50}px, ${-(isMobile ? animatedPos.y : mousePos.y) * 50}px)`,
        }}
      ></div>
      
      <div 
        className={`absolute top-1/2 left-1/4 w-60 h-60 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-40 blur-2xl ${isMobile ? '' : 'transition-transform duration-700 ease-out'}`}
        style={{ 
          transform: `translate(${(isMobile ? animatedPos.x : mousePos.x) * 30}px, ${(isMobile ? animatedPos.y : mousePos.y) * 30}px)`,
        }}
      ></div>
      
      <div 
        className={`absolute top-1/3 right-1/4 w-60 h-60 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-40 blur-2xl ${isMobile ? '' : 'transition-transform duration-700 ease-out'}`}
        style={{ 
          transform: `translate(${-(isMobile ? animatedPos.x : mousePos.x) * 30}px, ${-(isMobile ? animatedPos.y : mousePos.y) * 30}px)`,
        }}
      ></div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-green-900/20"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white text-center">
          Keep in touch
        </h2>
        <p className="text-xl mb-8 max-w-2xl text-gray-100 text-center">
          Get updates on new features and be the first to know when we launch.
        </p>
        
        {/* Email Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md mb-12 relative">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center gap-3 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-6 py-3 text-white"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="font-medium">Successfully subscribed!</span>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 justify-center"
              >
                <Input
                  id="email-signup"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white/90 backdrop-blur-sm disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium transition-all duration-300 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Subscribing...</span>
                    </div>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        
        {/* Social Media Links */}
        <div className="flex justify-center space-x-6">
          <a 
            href="https://x.com/displini_" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-300" 
            aria-label="Follow us on X"
          >
            <svg className="w-8 h-8" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.6 0.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867 -5.07 -4.425 5.07H0.316l5.733 -6.57L0 0.75h5.063l3.495 4.633L12.601 0.75Zm-0.86 13.028h1.36L4.323 2.145H2.865z"/>
            </svg>
          </a>
          <a 
            href="https://www.instagram.com/displini/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-300" 
            aria-label="Follow us on Instagram"
          >
            <Instagram className="w-8 h-8" />
          </a>
          <a 
            href="https://www.tiktok.com/@displini?lang=en" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-300" 
            aria-label="Follow us on TikTok"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
          <a 
            href="https://www.youtube.com/@Displini" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-300" 
            aria-label="Subscribe on YouTube"
          >
            <Youtube className="w-8 h-8" />
          </a>
        </div>
      </div>
    </section>
  );
}

