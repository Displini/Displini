import React from 'react';
import { calculatePosition, TimelineBounds } from '../utils/timelineCalculations';
import { formatTimeString, getCurrentTime } from '@/lib/timeUtils';
import { timeToMinutes, minutesToTime, hasTimePassed } from '../utils/timeHelpers';
import { TaskGroup } from '../utils/taskGrouping';

interface CurrentTimeIndicatorProps {
  bounds: TimelineBounds;
  isToday: boolean;
  fillPercentage: number;
  lastTaskEndTime?: number; // Last task end time in minutes to cap the indicator
  taskGroups?: TaskGroup[]; // Task groups for candy cone pattern calculation
  currentTime?: string; // Current time string for missed task detection
  isPastDate?: boolean; // Whether viewing a past date
}

export function CurrentTimeIndicator({
  bounds,
  isToday,
  fillPercentage,
  lastTaskEndTime,
  taskGroups = [],
  currentTime: propCurrentTime,
  isPastDate = false,
}: CurrentTimeIndicatorProps) {
  if (!isToday) return null;
  
  const currentTime = propCurrentTime || formatTimeString(getCurrentTime());
  const currentTimeMinutes = timeToMinutes(currentTime);
  
  // Get user's primary color from CSS variable (automatically uses theme color)
  // If user has set a custom primary color in their theme, it will be used
  const primaryColor = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    : '';
  
  // Calculate position using adaptive scaling if available (from algorithm)
  let position: number;
  
  if (bounds.rangeMinutes === 0) {
    position = 0;
  } else {
    // Cap at last task end time if provided and time has passed
    let effectiveTime = currentTime;
    if (lastTaskEndTime !== undefined && currentTimeMinutes > lastTaskEndTime) {
      effectiveTime = minutesToTime(lastTaskEndTime);
    }
    
    // Use calculatePosition which handles adaptive scaling automatically
    position = calculatePosition(effectiveTime, bounds);
  }
  
  // Ensure fill percentage is valid
  const validFillPercentage = Math.max(0, Math.min(100, fillPercentage));
  
  // Use user's primary color (from CSS variable, which respects theme settings)
  const colorStyle = primaryColor ? `hsl(${primaryColor})` : 'hsl(var(--primary))';
  
  // Calculate candy cone pattern segments for missed tasks
  const candyConeSegments: Array<{ startPercent: number; heightPercent: number }> = [];
  
  if (taskGroups && taskGroups.length > 0 && currentTime) {
    taskGroups.forEach((group) => {
      // Skip system tasks
      if (group.tasks.some(t => ['water', 'medication', 'sleep', 'steps'].includes(t.source))) {
        return;
      }
      
      // Only show for tasks that should have candy cone pattern
      const hasAllowedSource = group.tasks.some(task => {
        const allowedSources = ['manual', 'work', 'school'];
        const workBreakPrefix = 'work-';
        return allowedSources.includes(task.source) || task.source?.startsWith(workBreakPrefix);
      });
      
      if (!hasAllowedSource) return;
      
      // Check if any task in group is missed
      const hasUncompletedMissedTask = group.tasks.some(task => {
        if (task.completed) return false;
        if (!task.time) return false;
        
        if (isPastDate) return true;
        if (!isToday) return false;
        
        if (!currentTime) return false;
        return hasTimePassed(task.time, currentTime);
      });
      
      if (hasUncompletedMissedTask) {
        candyConeSegments.push({
          startPercent: group.startPercent,
          heightPercent: group.heightPercent,
        });
      }
    });
  }

  return (
    <>
      {/* Liquid fill - always show if fillPercentage > 0 */}
      {validFillPercentage > 0 && (
        <div
          className="absolute left-0 w-2 transition-all duration-300 ease-out"
          style={{
            top: '0%',
            height: `${validFillPercentage}%`,
            backgroundColor: colorStyle,
            borderRadius: validFillPercentage === 100 
              ? '0' // No rounding when full
              : '0 0 9999px 9999px', // Rounded bottom
            zIndex: 10, // Above timeline bar (z-0) but below dots
            pointerEvents: 'none',
          }}
        >
          {/* Candy cone pattern integrated into fill for missed tasks */}
          {candyConeSegments.map((segment, index) => {
            // Only show if segment is within the fill range
            if (segment.startPercent + segment.heightPercent > validFillPercentage) {
              const visibleHeight = Math.max(0, validFillPercentage - segment.startPercent);
              if (visibleHeight <= 0) return null;
              
              return (
                <div
                  key={`candy-${index}`}
                  className="absolute left-0 w-full"
                  style={{
                    top: `${segment.startPercent}%`,
                    height: `${visibleHeight}%`,
                    background: `repeating-linear-gradient(
                      45deg,
                      hsl(var(--primary)) 0px,
                      hsl(var(--primary)) 6px,
                      hsl(var(--background)) 6px,
                      hsl(var(--background)) 12px
                    )`,
                    opacity: 0.6,
                    zIndex: 1,
                  }}
                />
              );
            }
            
            return (
              <div
                key={`candy-${index}`}
                className="absolute left-0 w-full"
                style={{
                  top: `${segment.startPercent}%`,
                  height: `${segment.heightPercent}%`,
                  background: `repeating-linear-gradient(
                    45deg,
                    hsl(var(--primary)) 0px,
                    hsl(var(--primary)) 6px,
                    hsl(var(--background)) 6px,
                    hsl(var(--background)) 12px
                  )`,
                  opacity: 0.6,
                  zIndex: 1,
                }}
              />
            );
          })}
        </div>
      )}
      
      {/* Current time marker dot - centered on timeline */}
      <div
        className="absolute flex items-center z-30"
        style={{
          left: '4px', // Center of 8px timeline bar (w-2 = 8px, center = 4px)
          top: `${position}%`,
          transform: 'translate(-50%, -50%)', // Center both horizontally and vertically
        }}
      >
        <div
          className="w-4 h-4 rounded-full border-2 border-background shadow-lg"
          style={{
            backgroundColor: colorStyle,
          }}
        />
        
        {/* Current time label - always show actual current time */}
        <div
          className="absolute left-6 text-xs font-semibold whitespace-nowrap z-50"
          style={{
            color: colorStyle,
            pointerEvents: 'none',
          }}
        >
          {currentTime}
        </div>
      </div>
    </>
  );
}

