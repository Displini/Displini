import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  gradient?: 'primary' | 'secondary' | 'tertiary' | 'full';
}

/**
 * Reusable gradient text component
 * Used across landing page and app for consistent gradient styling
 */
export function GradientText({ 
  children, 
  className = '', 
  gradient = 'primary' 
}: GradientTextProps) {
  const gradients = {
    primary: 'from-blue-500 to-purple-600',
    secondary: 'from-purple-600 to-green-400',
    tertiary: 'from-blue-500 to-green-400',
    full: 'from-blue-500 via-purple-600 to-green-400',
  };

  return (
    <span 
      className={`bg-gradient-to-r ${gradients[gradient]} bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  );
}

