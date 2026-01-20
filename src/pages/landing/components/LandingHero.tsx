import { ChevronDown } from "lucide-react";
import { colors } from "@/lib/designSystem";
import styles from "../landing.module.css";

/**
 * Hero section for landing page
 * - Full-screen hero with curved video
 * - App store icons
 * - Tagline and description
 * - Scroll indicator
 */
export function LandingHero() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section data-section="hero" className={`relative overflow-hidden dark:bg-gray-900 flex flex-col ${styles.heroSection}`}>
      {/* Video with Outward Curved Bottom - Starts at top, header overlays it */}
      <div className={`relative w-full h-96 md:h-[500px] lg:h-[600px] ${styles.videoContainer}`}>
        <video 
          className={`w-full h-full object-cover [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-panel]:hidden [&::-webkit-media-controls-play-button]:hidden [&::-webkit-media-controls-start-playback-button]:hidden pointer-events-none ${styles.videoElement}`}
          autoPlay 
          muted 
          loop 
          playsInline
          controls={false}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noplaybackrate"
          preload="metadata"
          poster="/images/OG_Image.png"
          width="1920"
          height="1080"
          aria-label="Displini app demonstration video showing productivity and health tracking features"
          style={{
            backgroundColor: colors.neutral.black,
          }}
          onLoadedMetadata={(e) => {
            // Start playing after metadata loads
            e.currentTarget.play().catch(() => {});
          }}
        >
          <source src="/placeholder.mp4" type="video/mp4" />
          <track kind="captions" srcLang="en" label="English captions" />
          {/* Fallback for screen readers and when video fails */}
          <div className="w-full h-full bg-gradient-to-br from-displini-600 to-displini-800 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-4">Displini</h1>
              <p className="text-xl">Productivity and Health Tracking App</p>
            </div>
          </div>
        </video>
        
        {/* Apple and Google Play Icons overlay at bottom of video */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-end justify-center space-x-6 z-10">
          {/* Apple Icon - Left */}
          <div className="hover:opacity-80 transition-opacity cursor-pointer flex items-end">
            <img 
              src="/icons/Apple_icon.svg" 
              alt="Download on App Store"
              width="24"
              height="24"
              className={`w-6 h-6 filter brightness-0 invert object-contain ${styles.blockDisplay}`}
              loading="lazy"
            />
          </div>
          {/* Google Play Icon - Right */}
          <div className="hover:opacity-80 transition-opacity cursor-pointer flex items-end">
            <img 
              src="/icons/Googleplay_icon.svg" 
              alt="Get it on Google Play"
              width="24"
              height="24"
              className={`w-6 h-6 filter brightness-0 invert object-contain ${styles.blockDisplay}`}
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Text Section Below Curved Video */}
      <div className={`relative pt-16 pb-8 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex-1 ${styles.heroTextSection}`}>
        <div className="text-center px-6 flex-1 flex flex-col justify-center">
          <div className="flex justify-center mb-6 animate-fade-in">
            <img 
              src="/logos/Displini_text_black.svg" 
              alt="Displini" 
              width="200"
              height="64"
              className="h-12 md:h-16 w-auto dark:brightness-0 dark:invert"
              fetchpriority="high"
              loading="eager"
            />
          </div>
          <p className={`text-base md:text-lg mb-4 max-w-3xl mx-auto animate-fade-in text-gray-900 dark:text-gray-100 font-medium ${styles.animationDelay200}`}>
            Displini is an application that helps you build structure, improve your health and routines.
          </p>
          <p className={`text-xl md:text-2xl italic text-gray-900 dark:text-displini-400 mb-8 animate-fade-in font-semibold ${styles.animationDelay400}`}>
            Stay focused. Stay Displini.
          </p>
        </div>
      </div>
      
      {/* Scroll Down Indicator - At Very Bottom of Section */}
      <div className={`absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 cursor-pointer animate-bounce ${styles.scrollIndicator}`} onClick={scrollToFeatures}>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scroll</span>
        <ChevronDown className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </div>
    </section>
  );
}

