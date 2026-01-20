import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { animations } from '@/lib/designSystem';

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  dataSection?: string;
  animate?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
}

/**
 * Reusable section wrapper with consistent spacing and optional animation
 */
export function Section({ 
  children, 
  className = '', 
  containerClassName = '',
  dataSection,
  animate = false,
  centered = false,
  fullHeight = false,
}: SectionProps) {
  const sectionClasses = `
    py-20 md:py-32
    ${fullHeight ? 'min-h-screen flex items-center' : ''}
    ${className}
  `.trim();

  const containerClasses = `
    container mx-auto px-6
    ${centered ? 'flex flex-col items-center text-center' : ''}
    ${containerClassName}
  `.trim();

  const content = (
    <div className={containerClasses}>
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.section 
        {...animations.fadeIn}
        className={sectionClasses}
        data-section={dataSection}
      >
        {content}
      </motion.section>
    );
  }

  return (
    <section className={sectionClasses} data-section={dataSection}>
      {content}
    </section>
  );
}

