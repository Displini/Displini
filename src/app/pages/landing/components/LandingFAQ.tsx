import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/card";
import { Plus } from "lucide-react";
import { colors } from "@/lib/designSystem";
import styles from "../landing.module.css";

/**
 * FAQ section with expandable questions and sticky arrow
 * - Accordion-style FAQ items
 * - Sticky arrow (acts like fixed but contained in section)
 * - No lag into other sections!
 */
interface LandingFAQProps {
  showHelpText?: boolean;
}

export function LandingFAQ({ showHelpText = true }: LandingFAQProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([]);
  const [showArrow, setShowArrow] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowArrow(true);
            setAnimationKey(prev => prev + 1);
          } else {
            setShowArrow(false);
          }
        });
      },
      { threshold: 0.3 }
    );

    const currentRef = arrowRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const faqs = [
    {
      question: "What is Displini and how does it help me?",
      answer: "Displini is a comprehensive productivity and health tracking application that helps you build better routines, stay organized, and maintain your wellness. It combines task management, health monitoring, food tracking, fitness logging, and calendar integration in one unified platform."
    },
    {
      question: "Can I sync Displini with my calendar?",
      answer: "Yes! Displini offers seamless calendar integration, allowing you to sync with popular calendar applications and keep all your scheduling in one place. You can import existing events and create new ones directly from the app."
    },
    {
      question: "Is my health and schedule data private and editable?",
      answer: "Absolutely. Your privacy is our priority. All your data is encrypted and stored securely. You have full control over your information and can edit, export, or delete it at any time. We never share your personal data with third parties."
    },
    {
      question: "How do I get support or request features?",
      answer: "We offer multiple ways to get support and share feedback. You can reach us through our contact form, join our Discord community, or follow us on social media. We actively listen to user feedback and regularly add new features based on community requests."
    }
  ];

  return (
    <section id="faq" data-section="faq" className={`flex flex-col items-center justify-center relative bg-gray-50 dark:bg-gray-900 transition-colors duration-300 px-6 section-viewport ${styles.scrollSnapStart}`} style={{ zIndex: 10, minHeight: 'calc(100vh - 80px)' }}>
      <div className="container mx-auto px-6 w-full flex flex-col items-center justify-center relative z-30" style={{ minHeight: '100%' }}>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-16 text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto w-full relative z-30">
          <Card className="bg-white/60 backdrop-blur-xl border-white/80 overflow-hidden shadow-2xl relative z-30">
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <button
                    className="w-full px-4 md:px-6 py-4 flex items-center gap-3 md:gap-4 hover:bg-white/50 transition-colors justify-center md:justify-start"
                    onClick={() => {
                      setOpenIndices(prev => 
                        prev.includes(index) 
                          ? prev.filter(i => i !== index)
                          : [...prev, index]
                      );
                    }}
                  >
                    <span 
                      className={`transition-all duration-300 flex-shrink-0 ${openIndices.includes(index) ? 'rotate-45' : ''}`}
                      style={{ color: colors.brand.primary }}
                    >
                      <Plus className="w-5 h-5 md:w-6 md:h-6" />
                    </span>
                    <span className="text-sm md:text-lg font-medium text-gray-900 text-center md:text-left flex-1">{faq.question}</span>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ${
                      openIndices.includes(index) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-4 pl-16">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Arrow & Text - ABSOLUTE AT BOTTOM OF SECTION - Hidden on mobile and when showHelpText is false */}
        {showHelpText && (
        <div ref={arrowRef} className="hidden md:block absolute" style={{ zIndex: 40, bottom: '-200px', left: '40px', transform: 'translateY(0)' }}>
          <AnimatePresence mode="wait">
            {showArrow && (
              <motion.div 
                className="relative z-40"
                style={{
                  marginLeft: '0px',
                  width: 'fit-content'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Text */}
                <motion.p 
                  className="text-gray-900 dark:text-gray-300 font-medium text-sm whitespace-nowrap mb-4"
                  style={{ marginTop: '20px' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeOut"
                  }}
                >
                  we can help you
                </motion.p>
                
                {/* Arrow below text */}
                <motion.div
                  style={{ 
                    marginLeft: '-20px',
                    marginTop: '12px'
                  }}
                  initial={{ opacity: 0, scale: 0, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: -15 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2, type: "tween" } }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 10,
                    mass: 0.8
                  }}
                >
                  <img 
                    src="/images/arrow.svg" 
                    alt="Arrow pointing to chat"
                    className="dark:invert dark:brightness-75"
                    style={{ 
                      width: '100px',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
      </div>
    </section>
  );
}

