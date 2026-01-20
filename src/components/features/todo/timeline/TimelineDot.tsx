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
  showLabel?: boolean;
  labelPlacement?: 'left' | 'right';
  sizePx?: number;
}

const DOT_SIZE = 24; // Reduced to 24px for better proportion

export function TimelineDot({
  time,
  position,
  type,
  isCompleted = false,
  hasPassed = false,
  isMissed = false,
  onClick,
  emoji,
  showLabel = true,
  labelPlacement = 'right',
  sizePx = DOT_SIZE,
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
      <button
        onClick={onClick}
        className="rounded-full flex items-center justify-center flex-shrink-0 relative"
        style={{
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          backgroundColor: dotColor,
          border: 'none',
        }}
        aria-label={`${type} at ${time}`}
      >
        {emoji && (
          <span className="text-xs">{emoji}</span>
        )}
        
        {/* Missed alert badge */}
        {isMissed && (
          <MissedAlertBadge isMissed={true} size="sm" />
        )}
      </button>
      
      {/* Time label - positioned to the right of the dot */}
      {showLabel && (
      <div
          className={`absolute text-[13px] font-medium text-foreground whitespace-nowrap z-50 ${
            labelPlacement === 'right' ? 'left-8' : 'right-8 text-right'
          }`}
        style={{
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      >
        {time}
      </div>
      )}
    </div>
  );
}

