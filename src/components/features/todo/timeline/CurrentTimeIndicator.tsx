import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { calculatePosition, TimelineBounds } from '../utils/timelineCalculations';
import { formatTimeString, getCurrentTime } from '@/lib/timeUtils';
import { timeToMinutes, minutesToTime } from '../utils/timeHelpers';
import { TaskGroup } from '../utils/taskGrouping';

// Constants for timeline styling
const CANDY_CONE_STRIPE_SIZE = 6;
const CANDY_CONE_STRIPE_PATTERN = 12;
const CANDY_CONE_MIN_HEIGHT = 4;
const CANDY_CONE_OPACITY = 0.8;
const TIMELINE_BAR_CENTER_OFFSET = 4;
const ANIMATION_DURATION = 0.5;
const BELOW_TIMELINE_OFFSET = 16;

// Time window (in ms) to consider a task as "just completed" for animation
const RECENTLY_COMPLETED_THRESHOLD_MS = 10000; // Increased to 10 seconds for debugging

interface PositionedGroup {
  group: TaskGroup;
  topPx: number;
  heightPx: number;
}

interface CurrentTimeIndicatorProps {
  bounds: TimelineBounds;
  isToday: boolean;
  fillPercentage: number;
  lastTaskEndTime?: number;
  taskGroups?: TaskGroup[];
  positionedGroups?: PositionedGroup[];
  timelineHeight?: number;
  currentTime?: string;
  isPastDate?: boolean;
  startOffsetPercent?: number;
  visualStartPx?: number;
  visualEndPx?: number;
  currentPosPx?: number;
  pxPerMinute?: number;
}

export function CurrentTimeIndicator({
  bounds,
  isToday,
  fillPercentage,
  lastTaskEndTime,
  taskGroups = [],
  positionedGroups = [],
  timelineHeight = 0,
  currentTime: propCurrentTime,
  isPastDate = false,
  startOffsetPercent = 0,
  visualStartPx = 0,
  visualEndPx = 0,
  currentPosPx = 0,
  pxPerMinute = 0,
}: CurrentTimeIndicatorProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Track which task IDs have already been animated (to prevent re-animating on re-renders)
  const animatedTaskIdsRef = useRef<Set<string>>(new Set());
  
  // Use state to track segments that are currently animating
  const [animatingSegments, setAnimatingSegments] = useState<Map<string, {
    startPx: number;
    heightPx: number;
    taskId: string;
    animationKey: string;
  }>>(new Map());
  
  const currentTime = propCurrentTime || formatTimeString(getCurrentTime());
  const currentTimeMinutes = timeToMinutes(currentTime);
  
  // Get user's primary color from CSS variable
  const primaryColor = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    : '';
  
  const colorStyle = primaryColor ? `hsl(${primaryColor})` : 'hsl(var(--primary))';
  const baseFillColor = colorStyle;
  
  // Build candy cone segments for overdue incomplete tasks
  // Use positioned groups to get EXACT same positions as task containers
  const candyConeSegments: Array<{
    taskId: string;
    startPx: number;
    heightPx: number;
    isOverdue: boolean;
    isCompleted: boolean;
    completedAt?: string;
  }> = [];
  
  if (isToday && positionedGroups.length > 0 && timelineHeight > 0) {
    positionedGroups.forEach(({ group, topPx, heightPx }) => {
      // For groups with multiple tasks, calculate each task's position within the group
      const tasksCount = group.tasks?.length || 0;
      
      group.tasks?.forEach((t, taskIndex) => {
        if (!t.time) return;
        if (['medication', 'water', 'sleep'].includes(t.source || '')) return;
        
        const start = timeToMinutes(t.time);
        const hasNoEndTime = !t.endTime;
        const end = hasNoEndTime ? start + 30 : timeToMinutes(t.endTime!);
        const isOverdue = hasNoEndTime 
          ? currentTimeMinutes >= start
          : currentTimeMinutes > end;
        
        // Use the group's positioned topPx and heightPx to match the container
        // For multiple tasks in a group, divide the height proportionally
        let taskTopPx: number;
        let taskHeightPx: number;
        
        if (tasksCount === 1) {
          // Single task - use the full group dimensions
          taskTopPx = topPx;
          taskHeightPx = heightPx;
        } else {
          // Multiple tasks - calculate this task's portion
          // Subtract padding (p-2 = 8px) and gaps (gap-2 = 8px per gap)
          const padding = 8; // p-2
          const gapSize = 8; // gap-2
          const totalGaps = (tasksCount - 1) * gapSize;
          const availableHeight = heightPx - (padding * 2) - totalGaps;
          const perTaskHeight = Math.max(CANDY_CONE_MIN_HEIGHT, availableHeight / tasksCount);
          
          taskTopPx = topPx + padding + (taskIndex * (perTaskHeight + gapSize));
          taskHeightPx = perTaskHeight;
        }
        
        if (taskHeightPx > 0 && taskTopPx >= 0) {
          candyConeSegments.push({
            taskId: t.id,
            startPx: taskTopPx,
            heightPx: taskHeightPx,
            isOverdue,
            isCompleted: t.completed || false,
            completedAt: t.completedAt 
              ? (typeof t.completedAt === 'string' ? t.completedAt : t.completedAt.toISOString())
              : undefined,
          });
        }
      });
    });
  }
  
  // Effect to handle animations for newly completed tasks
  useEffect(() => {
    if (!isToday) return;

    const now = Date.now();

    console.log('🎯 Animation effect triggered:', {
      isToday,
      candyConeSegmentsCount: candyConeSegments.length,
      completedSegmentsCount: candyConeSegments.filter(s => s.isCompleted).length,
      animatingSegmentsCount: animatingSegments.size,
    });

    setAnimatingSegments(prev => {
      const updated = new Map(prev);

      // Get current completed task IDs
      const currentCompletedTaskIds = new Set(
        candyConeSegments
          .filter(s => s.isCompleted)
          .map(s => s.taskId)
      );

      // Remove segments for tasks that are no longer completed (unmarked)
      prev.forEach((segment, key) => {
        if (!currentCompletedTaskIds.has(segment.taskId)) {
          updated.delete(key);
          animatedTaskIdsRef.current.delete(segment.taskId);
        }
      });
      
      // Add segments for tasks that were JUST completed AND were overdue (had candy cone)
      candyConeSegments.forEach(segment => {
        console.log('🔍 Checking segment for animation:', {
          taskId: segment.taskId,
          isCompleted: segment.isCompleted,
          hasCompletedAt: !!segment.completedAt,
          startPx: segment.startPx,
          heightPx: segment.heightPx,
        });

        if (!segment.isCompleted) {
          console.log('❌ Skipping - not completed');
          return;
        }
        if (!segment.completedAt) {
          console.log('❌ Skipping - no completedAt timestamp');
          return;
        }

        // Skip if already animated this task
        if (animatedTaskIdsRef.current.has(segment.taskId)) {
          console.log('❌ Skipping - already animated');
          return;
        }

        // Check if this task was completed recently (within threshold)
        const completedAt = segment.completedAt as string;
        const completedAtMs = new Date(completedAt).getTime();
        const timeSinceCompletion = now - completedAtMs;

        console.log('⏰ Completion timing:', {
          completedAt,
          completedAtMs,
          now,
          timeSinceCompletion,
          threshold: RECENTLY_COMPLETED_THRESHOLD_MS,
          isRecent: timeSinceCompletion <= RECENTLY_COMPLETED_THRESHOLD_MS,
        });

        // Only animate if completed within the last few seconds
        if (timeSinceCompletion > RECENTLY_COMPLETED_THRESHOLD_MS) {
          console.log('❌ Skipping - completed too long ago, marking as animated');
          // Task was completed too long ago - mark as already animated
          animatedTaskIdsRef.current.add(segment.taskId);
          return;
        }

        // Check if already animating
        const animatingTaskIds = new Set(Array.from(prev.values()).map(s => s.taskId));
        if (animatingTaskIds.has(segment.taskId)) {
          console.log('❌ Skipping - already animating');
          return;
        }

        // CRITICAL: Only animate if the task WAS OVERDUE when completed (had candy cone showing)
        // This means we need to check if the completion time was after the task's due time
        const task = segment; // segment contains task info
        const completedAtDate = new Date(completedAt);
        const completedAtMinutes = completedAtDate.getHours() * 60 + completedAtDate.getMinutes();

        // Find the task's time info to determine if it was overdue when completed
        // We need to get the original task data from the positionedGroups
        let wasOverdueWhenCompleted = false;
        for (const { group } of positionedGroups) {
          const foundTask = group.tasks?.find(t => t.id === segment.taskId);
          if (foundTask && foundTask.time) {
            const start = timeToMinutes(foundTask.time);
            const hasNoEndTime = !foundTask.endTime;
            const end = hasNoEndTime ? start + 30 : timeToMinutes(foundTask.endTime!);

            console.log('📅 Checking overdue status:', {
              taskId: segment.taskId,
              foundTaskTime: foundTask.time,
              start,
              end,
              hasNoEndTime,
              completedAtMinutes,
              completedAtDate: completedAtDate.toISOString(),
            });

            // Task was overdue if completion time was after the task's end time
            if (hasNoEndTime) {
              wasOverdueWhenCompleted = completedAtMinutes >= start;
            } else {
              wasOverdueWhenCompleted = completedAtMinutes > end;
            }

            console.log('⚠️ Overdue result:', {
              wasOverdueWhenCompleted,
              completedAtMinutes,
              taskEndMinutes: hasNoEndTime ? start : end,
            });
            break;
          }
        }

        // Only animate if the task was overdue when completed (had candy cone pattern)
        if (!wasOverdueWhenCompleted) {
          console.log('❌ Skipping - task was not overdue when completed');
          // Task was completed on time - no animation needed
          animatedTaskIdsRef.current.add(segment.taskId);
          return;
        }

        console.log('🎉 TRIGGERING ANIMATION for task:', segment.taskId);

        // Mark as animated
        animatedTaskIdsRef.current.add(segment.taskId);

        const animationKey = `fill-${segment.taskId}-${completedAt}`;

        // Add to animating segments - only for this specific task's area
        updated.set(animationKey, {
          startPx: segment.startPx,
          heightPx: segment.heightPx,
          taskId: segment.taskId,
          animationKey,
        });
      });
      
      return updated;
    });
  }, [isToday, candyConeSegments.map(s => `${s.taskId}-${s.isCompleted}`).join(',')]);
  
  // Convert state map to array for rendering
  const animatingSegmentsList = Array.from(animatingSegments.values());
  
  // Early return AFTER all hooks
  if (!isToday) return null;
  
  // Calculate position for current time indicator
  let position: number;
  let showBelowTimeline = false;
  
  if (timelineHeight > 0 && currentPosPx > 0) {
    position = (currentPosPx / timelineHeight) * 100;
    if (lastTaskEndTime !== undefined && currentTimeMinutes > lastTaskEndTime) {
      showBelowTimeline = true;
      position = visualEndPx > 0 ? (visualEndPx / timelineHeight) * 100 : 100;
    } else {
      position = Math.min(100, Math.max(0, position));
    }
  } else {
    const endPositionPercent =
      lastTaskEndTime !== undefined
        ? Math.min(100, calculatePosition(minutesToTime(lastTaskEndTime), bounds))
        : 100;

    if (bounds.rangeMinutes === 0) {
      position = 0;
    } else {
      let effectiveTime = currentTime;
      if (lastTaskEndTime !== undefined && currentTimeMinutes > lastTaskEndTime) {
        showBelowTimeline = true;
        effectiveTime = minutesToTime(lastTaskEndTime);
        position = endPositionPercent;
      } else {
        position = calculatePosition(effectiveTime, bounds);
        position = Math.min(100, position);
      }
    }
  }
  
  // Calculate fill percentage
  let maxFillPercent = 100;
  if (lastTaskEndTime !== undefined && timelineHeight > 0) {
    if (visualEndPx > 0) {
      maxFillPercent = (visualEndPx / timelineHeight) * 100;
    } else {
      maxFillPercent = Math.min(100, calculatePosition(minutesToTime(lastTaskEndTime), bounds));
    }
  }
  
  const validFillPercentage = Math.max(0, Math.min(maxFillPercent, fillPercentage));
  const offset = Math.max(0, Math.min(100, startOffsetPercent));
  const adjustedHeight = Math.max(0, validFillPercentage - offset);
  
  return (
    <>
      {/* Main liquid fill - shows current time progress */}
      {adjustedHeight > 0 && (
        <div
          className="absolute left-0 w-2"
          style={{
            top: `${offset}%`,
            height: `${adjustedHeight}%`,
            backgroundColor: baseFillColor,
            borderRadius: validFillPercentage === 100 ? '0' : '0 0 9999px 9999px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      
      {/* Candy cone pattern for overdue INCOMPLETE tasks only */}
      {candyConeSegments
        .filter(segment => !segment.isCompleted && segment.isOverdue)
        .map((segment) => (
          <div
            key={`candy-${segment.taskId}`}
            className="absolute left-0 w-2 pointer-events-none"
            style={{
              top: `${segment.startPx}px`,
              height: `${segment.heightPx}px`,
              background: `repeating-linear-gradient(
                45deg,
                hsl(var(--primary)) 0px,
                hsl(var(--primary)) ${CANDY_CONE_STRIPE_SIZE}px,
                hsl(var(--background)) ${CANDY_CONE_STRIPE_SIZE}px,
                hsl(var(--background)) ${CANDY_CONE_STRIPE_PATTERN}px
              )`,
              opacity: CANDY_CONE_OPACITY,
              zIndex: 1,
              minHeight: `${CANDY_CONE_MIN_HEIGHT}px`,
            }}
          />
        ))}
      
      {/* Animated fill for tasks that were JUST marked complete */}
      {animatingSegmentsList.map((segment) => {
        console.log('🎨 Rendering FillAnimation component:', {
          taskId: segment.taskId,
          animationKey: segment.animationKey,
          top: segment.startPx,
          height: segment.heightPx,
          color: colorStyle,
        });

        return (
          <FillAnimation
            key={segment.animationKey}
            top={segment.startPx}
            height={segment.heightPx}
            color={colorStyle}
            taskId={segment.taskId}
            animationKey={segment.animationKey}
            onAnimationComplete={() => {
              console.log('✅ Animation completed for task:', segment.taskId);
              setAnimatingSegments(prev => {
                const updated = new Map(prev);
                updated.delete(segment.animationKey);
                return updated;
              });
            }}
          />
        );
      })}
      
      {/* Current time marker dot */}
      {showBelowTimeline ? null : (
        <div
          className="absolute flex items-center z-40"
          style={{
            left: `${TIMELINE_BAR_CENTER_OFFSET}px`,
            top: `${position}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="w-2 h-6 rounded-full"
            style={{
              backgroundColor: colorStyle,
              border: 'none',
              boxShadow: 'none',
            }}
          />
          
          <div
            className="absolute text-[13px] font-semibold whitespace-nowrap z-50 flex items-center gap-1"
            style={{
              color: colorStyle,
              pointerEvents: 'none',
              transform: 'translateY(-50%)',
              left: '-3.6rem',
              textAlign: 'right',
              minWidth: '3rem',
              justifyContent: 'flex-end',
            }}
          >
            <Clock className="w-3 h-3" />
            <span>{currentTime}</span>
          </div>
        </div>
      )}

      {showBelowTimeline && (
        <div
          className="absolute flex flex-col items-center z-30"
          style={{
            left: `${TIMELINE_BAR_CENTER_OFFSET}px`,
            top: timelineHeight > 0 && visualEndPx > 0 
              ? `${visualEndPx + BELOW_TIMELINE_OFFSET}px`
              : `${Math.min(100, (lastTaskEndTime !== undefined ? calculatePosition(minutesToTime(lastTaskEndTime), bounds) : 100) + 4)}%`,
            marginTop: '0px',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="text-xs font-semibold whitespace-nowrap z-50 flex items-center gap-1"
            style={{
              color: colorStyle,
              pointerEvents: 'none',
            }}
          >
            <Clock className="w-3 h-3" />
            <span>{currentTime}</span>
          </div>
        </div>
      )}
    </>
  );
}

// Animation component for fill effect when task is completed
function FillAnimation({
  top,
  height,
  color,
  taskId,
  animationKey,
  onAnimationComplete
}: {
  top: number;
  height: number;
  color: string;
  taskId: string;
  animationKey: string;
  onAnimationComplete?: () => void;
}) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);

  console.log('🎬 FillAnimation mounted:', {
    taskId,
    animationKey,
    top,
    height,
    color,
    shouldAnimate,
  });

  useLayoutEffect(() => {
    console.log('🔄 FillAnimation useLayoutEffect triggered:', {
      taskId,
      animationKey,
    });

    setShouldAnimate(false);
    hasCompletedRef.current = false;
    
    const timer = setTimeout(() => {
      console.log('⏳ FillAnimation timer fired, preparing animation:', {
        taskId,
        animationKey,
      });

      if (divRef.current) {
        void divRef.current.offsetHeight; // Force reflow
        console.log('🔄 Forced reflow for task:', taskId);
      }

      requestAnimationFrame(() => {
        console.log('🎭 Starting animation for task:', taskId);
        setShouldAnimate(true);

        if (onAnimationComplete) {
          setTimeout(() => {
            if (!hasCompletedRef.current) {
              hasCompletedRef.current = true;
              console.log('🏁 Animation timeout completed for task:', taskId);
              onAnimationComplete();
            }
          }, (ANIMATION_DURATION * 1000) + 100);
        }
      });
    }, 20);
    
    return () => {
      console.log('🧹 Cleaning up animation for task:', taskId);
      clearTimeout(timer);
      setShouldAnimate(false);
    };
  }, [animationKey, onAnimationComplete]);
  
  const handleAnimationEnd = useCallback((e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'fillFromTopScaleY' && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 100);
      }
    }
  }, [onAnimationComplete]);
  
  return (
    <div
      className="absolute left-0 w-2"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        zIndex: 3,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      data-task-id={taskId}
    >
      <div
        ref={divRef}
        className={shouldAnimate ? 'fill-animation-scaleY' : ''}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          backgroundColor: color,
          transformOrigin: 'top',
          transform: 'scaleY(0)',
        }}
        onAnimationEnd={handleAnimationEnd}
      />
    </div>
  );
}
