import React from 'react';
import { Task } from '@/app/types/types';
import { hasTimePassed } from '../utils/timeHelpers';

interface CandyConePatternProps {
  task: Task;
  startPercent: number;
  heightPercent: number;
  currentTime: string;
  isToday: boolean;
  isPastDate: boolean;
}

const ALLOWED_SOURCES = ['manual', 'work', 'school'];
const WORK_BREAK_PREFIX = 'work-';

export function CandyConePattern({
  task,
  startPercent,
  heightPercent,
  currentTime,
  isToday,
  isPastDate,
}: CandyConePatternProps) {
  // Check if should show candy cone
  const shouldShow = () => {
    // Only for allowed sources
    const isAllowedSource = ALLOWED_SOURCES.includes(task.source) ||
      task.source?.startsWith(WORK_BREAK_PREFIX);
    
    if (!isAllowedSource) return false;
    
    // Don't show if completed
    if (task.completed) return false;
    
    // Check if time has passed
    if (!task.time) return false;
    
    if (isPastDate) return true; // Always show for past dates
    if (!isToday) return false; // Don't show for future dates
    
    return hasTimePassed(task.time, currentTime);
  };
  
  if (!shouldShow()) return null;
  
  // Ensure height doesn't exceed task bounds (cap at 100%)
  const cappedHeightPercent = Math.min(heightPercent, 100 - startPercent);
  
  return (
    <div
      className="absolute w-2 overflow-hidden pointer-events-none"
      style={{
        left: '4px', // Align with timeline bar (which is at left: 0 with width: 8px)
        top: `${startPercent}%`,
        height: `${cappedHeightPercent}%`, // Cap height to prevent extending beyond task
        zIndex: 15,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            hsl(var(--primary)) 0px,
            hsl(var(--primary)) 6px,
            hsl(var(--background)) 6px,
            hsl(var(--background)) 12px
          )`,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

