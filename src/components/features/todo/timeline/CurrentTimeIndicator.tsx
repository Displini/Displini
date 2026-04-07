import React, { useState, useEffect, useRef } from 'react';
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
const BELOW_TIMELINE_OFFSET = 16;
const COMPLETION_FILL_ANIMATION_MS = 650;

// Module-level: persists across date switches (Todo page remounts timeline via key)
const hasAnimatedCompletionSet = new Set<string>();

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
  const [, setTick] = useState(0);
  const scheduledCompletionsRef = useRef<string>('');
  const lastCompletionSegmentsRef = useRef<Array<{ taskId: string; startPx: number; heightPx: number; color: string; completedAt: string }>>([]);
  const [uncompleteSegmentsToShow, setUncompleteSegmentsToShow] = useState<Array<{ taskId: string; startPx: number; heightPx: number; color: string }>>([]);
  const [animatingSegmentKeys, setAnimatingSegmentKeys] = useState<Set<string>>(new Set());
  const currentTime = propCurrentTime || formatTimeString(getCurrentTime());
  const currentTimeMinutes = timeToMinutes(currentTime);
  const now = getCurrentTime();
  const currentMinWithSec = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

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
  const completionSegments: Array<{ taskId: string; startPx: number; heightPx: number; color: string; completedAt: string }> = [];

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
          ? currentMinWithSec >= start
          : currentMinWithSec > end;

        // Use the group's positioned topPx and heightPx to match the container
        // For multiple tasks in a group, divide the height proportionally
        let taskTopPx: number;
        let taskHeightPx: number;

        if (tasksCount === 1) {
          taskTopPx = topPx;
          taskHeightPx = heightPx;
        } else {
          const padding = 8;
          const gapSize = 8;
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
          // Only show completion bar / fill animation for tasks that are in the past (overdue)
          if (t.completed && t.completedAt && isOverdue) {
            completionSegments.push({
              taskId: t.id,
              startPx: taskTopPx,
              heightPx: taskHeightPx,
              color: t.color || 'hsl(var(--primary))',
              completedAt: typeof t.completedAt === 'string' ? t.completedAt : t.completedAt.toISOString(),
            });
          }
        }
      });
    });
  }

  // Schedule a single re-render 650ms after we see a new completion, so candy cone hides only after the fill animation finishes
  const completionKeys = completionSegments.map((s) => `${s.taskId}-${s.completedAt}`).sort().join(',');
  useEffect(() => {
    if (completionSegments.length === 0) return;
    if (completionKeys === scheduledCompletionsRef.current) return;
    scheduledCompletionsRef.current = completionKeys;
    const id = setTimeout(() => setTick((n) => n + 1), COMPLETION_FILL_ANIMATION_MS);
    return () => clearTimeout(id);
  }, [completionKeys, completionSegments.length]);

  // Detect unmarked tasks: show reverse (unfill) animation for 650ms, then keep ref in sync
  useEffect(() => {
    const prev = lastCompletionSegmentsRef.current;
    const currentIds = new Set(completionSegments.map((s) => s.taskId));
    const uncomplete = prev.filter((p) => !currentIds.has(p.taskId));
    if (uncomplete.length > 0) {
      setUncompleteSegmentsToShow((prevSegs) => [
        ...prevSegs.filter((s) => !uncomplete.some((u) => u.taskId === s.taskId)),
        ...uncomplete.map(({ taskId, startPx, heightPx, color }) => ({ taskId, startPx, heightPx, color })),
      ]);
      const id = setTimeout(() => {
        setUncompleteSegmentsToShow((prevSegs) =>
          prevSegs.filter((s) => !uncomplete.some((u) => u.taskId === s.taskId))
        );
      }, COMPLETION_FILL_ANIMATION_MS);
      lastCompletionSegmentsRef.current = completionSegments.map((s) => ({ ...s }));
      return () => clearTimeout(id);
    }
    lastCompletionSegmentsRef.current = completionSegments.map((s) => ({ ...s }));
  }, [completionKeys, completionSegments.length]);

  // Trigger fill animation on next frame so initial scaleY(0) is painted first (fixes broken fill)
  useEffect(() => {
    if (completionSegments.length === 0) return;
    const keysToAnimate = completionSegments
      .filter((seg) => {
        const key = `${seg.taskId}-${seg.completedAt}`;
        const elapsed = Date.now() - new Date(seg.completedAt).getTime();
        return elapsed < COMPLETION_FILL_ANIMATION_MS && !hasAnimatedCompletionSet.has(key);
      })
      .map((seg) => `${seg.taskId}-${seg.completedAt}`);
    if (keysToAnimate.length === 0) return;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimatingSegmentKeys((prev) => {
          const next = new Set(prev);
          keysToAnimate.forEach((k) => next.add(k));
          return next;
        });
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [completionKeys, completionSegments.length]);

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

  // Clip liquid fill around overdue completed task rows so only the completion bar shows there (no blue + bar)
  const liquidTopPx = (offset / 100) * timelineHeight;
  const liquidHeightPx = (adjustedHeight / 100) * timelineHeight;
  const liquidBottomPx = liquidTopPx + liquidHeightPx;
  const completedSegments = candyConeSegments
    .filter((s) => s.isCompleted && s.heightPx > 0 && s.isOverdue)
    .map((s) => ({ start: s.startPx, end: s.startPx + s.heightPx }))
    .sort((a, b) => a.start - b.start);
  const gaps: Array<{ top: number; height: number }> = [];
  let cursor = liquidTopPx;
  for (const seg of completedSegments) {
    if (seg.end <= cursor || seg.start >= liquidBottomPx) continue;
    const gapStart = cursor;
    const gapEnd = Math.min(seg.start, liquidBottomPx);
    if (gapEnd > gapStart) gaps.push({ top: gapStart, height: gapEnd - gapStart });
    cursor = Math.max(cursor, seg.end);
  }
  if (cursor < liquidBottomPx) {
    gaps.push({ top: cursor, height: liquidBottomPx - cursor });
  }
  const showSingleLiquidFill = completedSegments.length === 0;
  
  return (
    <>
      {/* Main liquid fill - shows current time progress; clipped so completed task rows show only their completion bar */}
      {adjustedHeight > 0 &&
        (showSingleLiquidFill ? (
          <div
            className="absolute left-0 w-2 liquid-fill-bar"
            style={{
              top: `${offset}%`,
              height: `${adjustedHeight}%`,
              backgroundColor: baseFillColor,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ) : (
          <>
            {gaps.map((gap, i) => (
              <div
                key={i}
                className="absolute left-0 w-2 pointer-events-none liquid-fill-bar"
                style={{
                  top: `${gap.top}px`,
                  height: `${gap.height}px`,
                  backgroundColor: baseFillColor,
                  zIndex: 0,
                }}
              />
            ))}
          </>
        ))}
      
      {/* Candy cone: show for overdue incomplete; for just-completed, keep visible until fill animation ends (650ms). Grey timeline bar shows through; opacity stays constant during animation. */}
      {candyConeSegments
        .filter((segment) => {
          // Only show candy cone for overdue incomplete, or just-completed (within 650ms) and in the past
          if (!segment.isCompleted) return segment.isOverdue;
          if (!segment.completedAt || !segment.isOverdue) return false;
          const elapsed = Date.now() - new Date(segment.completedAt).getTime();
          return elapsed < COMPLETION_FILL_ANIMATION_MS;
        })
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
              backgroundAttachment: 'local',
              backgroundPosition: '0 0',
              opacity: CANDY_CONE_OPACITY,
              zIndex: 1,
              minHeight: `${CANDY_CONE_MIN_HEIGHT}px`,
              contain: 'layout style paint',
            }}
          />
        ))}

      {/* Completion bars: no wrapper background so candy cone shows until fill animates over it.
          Only animate if just completed (within 650ms) AND we haven't already animated it (prevents retrigger on date switch). */}
      {completionSegments.map((seg) => {
        const segKey = `${seg.taskId}-${seg.completedAt}`;
        const elapsed = Date.now() - new Date(seg.completedAt).getTime();
        const isJustCompleted = elapsed < COMPLETION_FILL_ANIMATION_MS;
        const alreadyAnimated = hasAnimatedCompletionSet.has(segKey);
        const shouldAnimate = isJustCompleted && !alreadyAnimated;
        const useInitial = shouldAnimate && !animatingSegmentKeys.has(segKey);
        const useAnimation = shouldAnimate && animatingSegmentKeys.has(segKey);
        if (useAnimation) hasAnimatedCompletionSet.add(segKey);
        const fillClass = useInitial ? 'task-complete-fill-bar-initial' : useAnimation ? 'task-complete-fill-bar' : 'task-complete-fill-bar-static';
        return (
          <div
            key={segKey}
            className="absolute left-0 w-2 overflow-hidden pointer-events-none"
            style={{
              top: `${seg.startPx}px`,
              height: `${seg.heightPx}px`,
              zIndex: 5,
              contain: 'layout style',
            }}
          >
            <div
              className={fillClass}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundColor: seg.color,
              }}
            />
          </div>
        );
      })}

      {/* Reverse (uncomplete) bars: animate from full to empty over candy cone */}
      {uncompleteSegmentsToShow.map((seg) => (
        <div
          key={`uncomplete-${seg.taskId}`}
          className="absolute left-0 w-2 overflow-hidden pointer-events-none"
          style={{
            top: `${seg.startPx}px`,
            height: `${seg.heightPx}px`,
            zIndex: 5,
            contain: 'layout style',
          }}
        >
          <div
            className="task-complete-fill-bar-reverse"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              backgroundColor: seg.color,
            }}
          />
        </div>
      ))}

      {/* Current time: dot on the bar, icon + text on the left (gutter) with rounded bg */}
      {showBelowTimeline ? null : (
        <>
          <div
            className="absolute flex items-center z-40"
            style={{
              left: `${TIMELINE_BAR_CENTER_OFFSET}px`,
              top: `${position}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="w-2 h-6 rounded-full flex-shrink-0"
              style={{
                backgroundColor: colorStyle,
                border: 'none',
                boxShadow: 'none',
              }}
            />
            <div
              className="absolute text-[13px] font-semibold whitespace-nowrap flex items-center gap-1 rounded-full px-2 py-0.5 right-full mr-1"
              style={{
                color: colorStyle,
                pointerEvents: 'none',
                backgroundColor: 'hsl(var(--background))',
              }}
            >
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{currentTime}</span>
            </div>
          </div>
        </>
      )}

      {showBelowTimeline && (
        <div
          className="absolute flex flex-col items-center z-30 rounded-full px-2 py-1"
          style={{
            left: `${TIMELINE_BAR_CENTER_OFFSET}px`,
            top: timelineHeight > 0 && visualEndPx > 0 
              ? `${visualEndPx + BELOW_TIMELINE_OFFSET}px`
              : `${Math.min(100, (lastTaskEndTime !== undefined ? calculatePosition(minutesToTime(lastTaskEndTime), bounds) : 100) + 4)}%`,
            marginTop: '0px',
            transform: 'translateX(-50%)',
            backgroundColor: 'hsl(var(--background))',
          }}
        >
          <div
            className="text-xs font-semibold whitespace-nowrap flex items-center gap-1"
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
