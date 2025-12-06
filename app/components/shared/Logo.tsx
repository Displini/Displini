interface LogoProps {
  variant?: 'black' | 'white';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Reusable Displini logo component
 * Automatically switches between black and white variants
 */
export function Logo({ 
  variant = 'black', 
  className = '',
  size = 'md' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-14',
    lg: 'h-20',
    xl: 'h-28',
  };

  const logoSrc = variant === 'white' 
    ? '/logos/Displini_Logo_text_white.svg'
    : '/logos/Displini_Logo_text_black.svg';

  return (
    <img 
      src={logoSrc}
      alt="Displini" 
      className={`${sizeClasses[size]} w-auto transition-opacity duration-300 ${className}`}
    />
  );
}

