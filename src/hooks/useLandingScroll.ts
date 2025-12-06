import { useEffect } from 'react';

/**
 * Custom hook for landing page scroll position persistence
 * - Saves current section to localStorage
 * - Restores scroll position on page load
 */
export function useLandingScroll() {
  useEffect(() => {
    // Restore scroll position on mount - only if user was previously on device-sync section
    const savedSection = localStorage.getItem('landingSection');
    const targetSection = savedSection === 'device-sync' ? 'device-sync' : null;
    
    // Only auto-scroll if user was previously on device-sync section
    if (targetSection) {
      // Wait for lazy-loaded sections and page to fully render
      const restoreScroll = () => {
        const section = document.querySelector(`[data-section="${targetSection}"]`);
        if (section) {
          // Find the scroll container
          const scrollContainer = document.querySelector('[style*="overflowY: scroll"]') as HTMLElement;
          if (scrollContainer) {
            const sectionTop = (section as HTMLElement).offsetTop;
            scrollContainer.scrollTo({
              top: sectionTop,
              behavior: 'smooth'
            });
          } else {
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      };

      // Try multiple times with increasing delays to ensure content is loaded
      setTimeout(restoreScroll, 1000);
      setTimeout(restoreScroll, 1500);
      setTimeout(restoreScroll, 2000);
    }

    // Track current section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionName = entry.target.getAttribute('data-section');
            if (sectionName) {
              localStorage.setItem('landingSection', sectionName);
            }
          }
        });
      },
      {
        threshold: 0.5, // Section is considered "current" when 50% visible
        rootMargin: '-100px 0px -100px 0px'
      }
    );

    // Wait for all sections to be rendered (including lazy-loaded)
    const startObserving = () => {
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((section) => observer.observe(section));
      return sections;
    };

    // Initial observation
    let sections = startObserving();

    // Re-observe after a delay to catch lazy-loaded sections
    const reObserveTimer = setTimeout(() => {
      sections.forEach((section) => observer.unobserve(section));
      sections = startObserving();
    }, 2000);

    return () => {
      clearTimeout(reObserveTimer);
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);
}

