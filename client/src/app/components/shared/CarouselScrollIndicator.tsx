import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Carousel scroll indicator - shows on mobile to indicate horizontal scrollable carousel
 * - Appears at the center bottom of carousel
 * - Animated left-right motion
 * - No background, just text and icons
 */
export function CarouselScrollIndicator() {
  return (
    <div className="md:hidden flex justify-center mt-6 mb-4">
      <div className="flex items-center gap-2">
        <ChevronLeft className="w-5 h-5 text-gray-900 animate-slide-left" strokeWidth={2.5} />
        <span className="text-gray-900 text-sm font-semibold">Swipe</span>
        <ChevronRight className="w-5 h-5 text-gray-900 animate-slide-right" strokeWidth={2.5} />
      </div>

      <style>{`
        @keyframes slideLeft {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-6px);
          }
        }
        @keyframes slideRight {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(6px);
          }
        }
        .animate-slide-left {
          animation: slideLeft 1.5s ease-in-out infinite;
        }
        .animate-slide-right {
          animation: slideRight 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

