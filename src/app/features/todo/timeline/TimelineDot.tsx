import React from 'react';
import { MissedAlertBadge } from './MissedAlertBadge';

interface TimelineDotProps {
  time: string;
  position: number;
  type: 'wake' | 'sleep' | 'water' | 'medication' | 'journal' | 'start' | 'end';
  isCompleted?: boolean;
  hasPassed?: boolean;
  isMissed?: boolean;
  onClick?: () => void;
  emoji?: string;
}

const DOT_SIZE = 48; // Increased to 48px for better visibility

export function TimelineDot({
  time,
  position,
  type,
  isCompleted = false,
  hasPassed = false,
  isMissed = false,
  onClick,
  emoji,
}: TimelineDotProps) {
  const getDotColor = () => {
    if (isCompleted || hasPassed) {
      return 'hsl(var(--primary))';
    }
    return 'hsl(var(--muted))';
  };
  
  const dotColor = getDotColor();
  
  return (
    <div
      className="absolute flex items-center z-40"
      style={{
        left: '4px', // Center of 8px timeline bar (w-2 = 8px, center = 4px)
        top: `${position}%`,
        transform: 'translate(-50%, -50%)', // Center both horizontally and vertically
      }}
    >
      {/* Background blocker to prevent liquid fill overlap */}
      <div
        className="absolute"
        style={{
          left: '0',
          width: `${DOT_SIZE}px`,
          height: `${DOT_SIZE}px`,
          backgroundColor: dotColor,
          borderRadius: '50%',
          zIndex: -1,
          transform: 'translateX(-50%)', // Center the blocker
        }}
      />
      
      {/* Dot button - Increased size to 48px (w-12 h-12) */}
      <button
        onClick={onClick}
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 relative`}
        style={{
          backgroundColor: dotColor,
          borderColor: dotColor,
          boxShadow: 'none',
        }}
        aria-label={`${type} at ${time}`}
      >
        {emoji && (
          <span className="text-lg">{emoji}</span>
        )}
        
        {/* Missed alert badge */}
        {isMissed && (
          <MissedAlertBadge isMissed={true} size="sm" />
        )}
      </button>
      
      {/* Time label - positioned to the right of the dot */}
      <div
        className="absolute left-14 text-sm font-sans text-muted-foreground whitespace-nowrap z-50"
        style={{
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      >
        {time}
      </div>
    </div>
  );
}

