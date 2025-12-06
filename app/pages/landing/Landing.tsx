import React, { memo, lazy, Suspense, useState, useEffect } from "react";
import { SEO } from "@/app/components/shared/SEO";
import { colors } from "@/lib/designSystem";
import { useLandingScroll } from "@/hooks/useLandingScroll";
import { Header, LandingHero, LandingFeatures } from "./components";
import { ErrorBoundary } from "@/app/components/shared/ErrorBoundary";
import { ChatButton } from "@/app/components/shared/ChatButton";
import styles from "./landing.module.css";

// Lazy load heavy sections for better initial load performance
const LandingCarousel = lazy(() => import("./components").then(m => ({ default: m.LandingCarousel })));
const LandingQR = lazy(() => import("./components").then(m => ({ default: m.LandingQR })));
const LandingAbout = lazy(() => import("./components").then(m => ({ default: m.LandingAbout })));
const LandingFAQ = lazy(() => import("./components").then(m => ({ default: m.LandingFAQ })));
const LandingDeviceSync = lazy(() => import("./components").then(m => ({ default: m.LandingDeviceSync })));
const LandingFooter = lazy(() => import("./components").then(m => ({ default: m.LandingFooter })));

// Main Landing Component - Memoized for performance
function Landing() {
  // Track scroll position for restoration on reload
  useLandingScroll();
  
  // Prevent scrolling past footer and past hero section
  useEffect(() => {
    const scrollContainer = document.querySelector('[data-scroll-container]') as HTMLElement | null;
    if (!scrollContainer) return;
    
    const handleWheel = (e: WheelEvent) => {
      const hero = document.querySelector('[data-section="hero"]') || document.querySelector('section:first-of-type');
      const footer = document.querySelector('footer');
      
      // Prevent scrolling up past hero
      if (hero) {
        const heroRect = hero.getBoundingClientRect();
        const isAtTop = scrollContainer.scrollTop <= 5;
        
        // If hero is at top and user tries to scroll up, prevent it
        if (heroRect.top >= 0 && heroRect.top <= 100 && e.deltaY < 0 && isAtTop) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
      
      // Prevent scrolling down past footer
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 5;
        
        // If footer is visible and user tries to scroll down, prevent it
        if (footerRect.top < window.innerHeight && e.deltaY > 0 && isAtBottom) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const hero = document.querySelector('[data-section="hero"]') || document.querySelector('section:first-of-type');
      const footer = document.querySelector('footer');
      
      // Prevent scrolling up past hero
      if (hero) {
        const heroRect = hero.getBoundingClientRect();
        const isAtTop = scrollContainer.scrollTop <= 5;
        
        if (heroRect.top >= 0 && heroRect.top <= 100 && isAtTop) {
          const touch = e.touches[0];
          const startTouch = (e as TouchEvent & { startTouch?: Touch }).startTouch || touch;
          if (touch.clientY > startTouch.clientY) {
            e.preventDefault();
            return;
          }
        }
      }
      
      // Prevent scrolling down past footer
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 5;
        
        if (footerRect.top < window.innerHeight && isAtBottom) {
          const touch = e.touches[0];
          const startTouch = (e as TouchEvent & { startTouch?: Touch }).startTouch || touch;
          if (touch.clientY < startTouch.clientY) {
            e.preventDefault();
          }
        }
      }
    };
    
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
  
  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300 overflow-x-hidden ${styles.scrollContainer}`} data-scroll-container>
      <SEO
        title="Stay Focused, Build Better Habits"
        description="Displini helps you build structure, improve your health and routines. Track water intake, sleep schedule, menstrual cycle, medication, workouts, and more."
        keywords="habit tracker, productivity app, health tracker, water intake, sleep schedule, todo list, calendar, menstrual cycle, medication reminder"
        url="https://displini.com"
      />
      <Header />
      
      {/* Main content wrapper for skip link */}
      <main id="main-content">
      <LandingHero />
      <LandingFeatures />
      
      {/* Lazy loaded sections with Suspense boundaries and error boundaries */}
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
        <ErrorBoundary>
          <LandingCarousel />
        </ErrorBoundary>
        <ErrorBoundary>
          <LandingQR />
        </ErrorBoundary>
        <ErrorBoundary>
          <LandingAbout />
        </ErrorBoundary>
        <ErrorBoundary>
          <LandingFAQ />
        </ErrorBoundary>
        <ErrorBoundary>
          <LandingDeviceSync />
        </ErrorBoundary>
        <ErrorBoundary>
          <LandingFooter />
        </ErrorBoundary>
      </Suspense>

      </main>
      <ChatButton />
    </div>
  );
}

// Export memoized version
export default memo(Landing);
