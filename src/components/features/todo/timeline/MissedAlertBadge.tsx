import React from 'react';
import { AlertCircle } from 'lucide-react';

interface MissedAlertBadgeProps {
  isMissed: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MissedAlertBadge({ isMissed, size = 'md' }: MissedAlertBadgeProps) {
  if (!isMissed) return null;
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  return (
    <div
      className="absolute -top-1 -right-1 bg-red-500 rounded-full flex items-center justify-center z-50 animate-pulse"
      style={{
        boxShadow: '0 0 0 2px hsl(var(--background))',
      }}
    >
      <AlertCircle className={`${sizeClasses[size]} text-white`} />
    </div>
  );
}

