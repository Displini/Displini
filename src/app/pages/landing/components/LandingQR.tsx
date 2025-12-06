import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CircularQrOrbit } from "@/app/components/shared/CircularQrOrbit";
import { CheckSquare, Users, TrendingUp } from "lucide-react";
import styles from "../landing.module.css";

/**
 * QR Code download section with animated stats
 * - Separate section for downloading the app
 * - Centered QR code with rotating text orbit
 * - Animated counters on scroll
 */

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      countRef.current = Math.floor(start + (end - start) * easeOut);
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration, start]);

  return { count, ref };
}

export function LandingQR() {
  // Animated counters
  const tasksCount = useCountUp(10000000); // 10M+
  const usersCount = useCountUp(500000); // 500K+
  const satisfactionCount = useCountUp(98); // 98%
  const [qrSize, setQrSize] = useState(320);
  
  useEffect(() => {
    const updateSize = () => {
      setQrSize(window.innerWidth < 768 ? 200 : 320);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const isSectionInView = useInView(sectionRef, { once: false, amount: 0.1 });

  return (
    <section 
      ref={sectionRef}
      className={`relative px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 section-viewport ${styles.scrollSnapStart} flex items-center justify-center`}
      data-section="qr-code"
      style={{ minHeight: 'calc(100vh - 80px)' }}
    >
      <div className="container mx-auto max-w-4xl w-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4 text-center w-full">
            Download Displini
          </h2>
          <p className="text-sm md:text-lg text-gray-700 dark:text-gray-300 mb-6 md:mb-12 text-center">
            Scan the QR code to download Displini on your phone
          </p>
          
          {/* QR Code - Clickable */}
          <motion.div 
            className="mb-4 md:mb-6 inline-block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isSectionInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <CircularQrOrbit 
              qrSrc="/images/Qr_code.svg"
              size={qrSize}
              speedSec={8}
              words={['Discipline', 'Improve', 'Benefit', 'Energy', 'Calm', 'Focus', 'Growth', 'Balance', 'Aware']}
            />
          </motion.div>
          
          {/* App Store buttons */}
          <div className="flex gap-4 md:gap-8 items-end mb-4 md:mb-6">
            <a 
              href="#" 
              className="transition-all duration-300 hover:scale-110 hover:opacity-70 flex items-end"
              aria-label="Download on the App Store"
            >
              <img 
                src="/icons/Apple_icon.svg" 
                alt="Download on the App Store" 
                width="32"
                height="32"
                className="h-8 w-8 object-contain dark:invert"
                style={{ display: 'block' }}
                loading="lazy"
              />
            </a>
            <a 
              href="#" 
              className="transition-all duration-300 hover:scale-110 hover:opacity-70 flex items-end"
              aria-label="Get it on Google Play"
            >
              <img 
                src="/icons/Googleplay_icon.svg" 
                alt="Get it on Google Play" 
                width="32"
                height="32"
                className="h-8 w-8 object-contain dark:invert"
                style={{ display: 'block' }}
                loading="lazy"
              />
            </a>
          </div>

          {/* Stats Section - Below QR Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-3 gap-2 md:gap-8 lg:gap-16 w-full max-w-4xl px-2 md:px-4"
          >
            <div className="text-center px-1">
              <div className="flex flex-col items-center justify-center mb-1 md:mb-2">
                <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-gray-900 dark:text-white mb-1" />
                <div ref={tasksCount.ref} className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                {tasksCount.count.toLocaleString()}+
                </div>
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">Tasks Completed</div>
            </div>
            <div className="text-center px-1">
              <div className="flex flex-col items-center justify-center mb-1 md:mb-2">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-900 dark:text-white mb-1" />
                <div ref={usersCount.ref} className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                {usersCount.count.toLocaleString()}+
                </div>
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center px-1">
              <div className="flex flex-col items-center justify-center mb-1 md:mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gray-900 dark:text-white mb-1" />
                <div ref={satisfactionCount.ref} className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                {satisfactionCount.count}%
                </div>
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">Satisfaction Rate</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

