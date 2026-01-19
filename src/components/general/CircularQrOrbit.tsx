import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * Circular text orbit animation around a QR code
 * - Rotating text on circular path
 * - Pauses on hover
 * - Respects prefers-reduced-motion
 * - Customizable speed and text
 */

interface CircularQrOrbitProps {
  qrSrc: string;
  size?: number;
  speedSec?: number;
  words?: string[];
}

export function CircularQrOrbit({ 
  qrSrc, 
  size = 260, 
  speedSec = 12,
  words = ['Discipline', 'Improve', 'Benefit', 'Energy', 'Calm', 'Focus', 'Growth', 'Balance', 'Aware']
}: CircularQrOrbitProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const rotation = useMotionValue(0);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animate rotation - seamless infinite loop (continues on mouse leave)
  useEffect(() => {
    if (prefersReducedMotion) {
      rotation.set(0);
      return;
    }

    // Only animate if not on mobile (text is hidden on mobile)
    if (isMobile) {
      return;
    }

    // Start from current position to avoid jumps
    const currentRotation = rotation.get();
    const controls = animate(rotation, [currentRotation, currentRotation + 360], {
      duration: speedSec,
      repeat: Infinity,
      ease: 'linear',
      repeatType: 'loop',
      repeatDelay: 0
    });

    return () => {
      controls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, speedSec, isMobile]);

  const radius = (size - 60) / 2; // Account for text size
  const text = words.join(' • '); // Increased spacing for better visibility

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {/* Rotating SVG Text - Hidden on mobile */}
      {!isMobile && (
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 pointer-events-none"
        style={{ 
          rotate: rotation,
          transformOrigin: 'center'
        }}
      >
        <defs>
          <path
            id="circlePath"
            d={`
              M ${size / 2}, ${size / 2}
              m -${radius}, 0
              a ${radius},${radius} 0 1,1 ${radius * 2},0
              a ${radius},${radius} 0 1,1 -${radius * 2},0
            `}
          />
        </defs>
        <text
          className="text-base font-bold uppercase tracking-wider"
          fill="currentColor"
          style={{ letterSpacing: '0.15em', fontSize: '14px' }}
        >
          <textPath
            href="#circlePath"
            startOffset="0%"
            textAnchor="middle"
          >
            {text} • {text}
          </textPath>
        </text>
      </motion.svg>
      )}

      {/* Center QR Code */}
      <div className="absolute inset-0 flex items-center justify-center">
        <a 
          href="https://linktr.ee/displini"
          target="_blank"
          rel="noopener noreferrer"
          className="relative group block"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="absolute inset-0 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}
          ></div>
          
          <div 
            className="relative w-40 h-40 rounded-2xl p-3 flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
          >
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' fill='%23666666'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '150px 150px',
                mixBlendMode: 'multiply'
              }}
            ></div>
            
            <img 
              src={qrSrc}
              alt="QR Code"
              className="w-full h-full object-contain relative z-10"
              style={{ maxWidth: '128px', maxHeight: '128px', filter: 'none' }}
              loading="lazy"
            />
          </div>
        </a>
      </div>
    </div>
  );
}

