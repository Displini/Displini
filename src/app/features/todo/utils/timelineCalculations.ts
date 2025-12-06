import { Task } from "@/app/types/types";
import { timeToMinutes, minutesToTime } from "./timeHelpers";
import { DensityMap, analyzeTaskDensity, calculateSpaceAllocation, createTimeMapping, getAdaptivePosition } from "./timelineDensity";

export interface TimelineBounds {
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  rangeMinutes: number;
  hasWakeUp: boolean;
  hasBedTime: boolean;
  densityMap?: DensityMap;        // Optional density map for adaptive scaling
  useAdaptiveScaling?: boolean;   // Feature flag, default true
}

export interface TimelineItem {
  time: string;
  tasks: Task[];
  waterReminder?: boolean;
  medicationReminder?: boolean;
  journalReminder?: boolean;
  stepReminder?: boolean;
  meditationReminder?: boolean;
  glucoseReminder?: boolean;
  isWakeUp?: boolean;
  isBedTime?: boolean;
}

interface SleepSchedule {
  wakeTime?: string;
  bedtime?: string;
}

/**
 * Calculate smart timeline boundaries using only actual task/reminder times
 * and sleep schedule (no hardcoded defaults)
 * 
 * @param timelineItems - Array of timeline items (tasks + reminders)
 * @param sleepSchedule - Optional sleep schedule with wakeTime and bedtime
 * @param useAdaptiveScaling - Whether to use adaptive density-based scaling (default: true)
 * @param timelineHeight - Optional timeline height in pixels. If not provided, will be estimated based on range.
 */
export function calculateTimelineBounds(
  timelineItems: TimelineItem[],
  sleepSchedule?: SleepSchedule,
  useAdaptiveScaling: boolean = true,
  timelineHeight?: number
): TimelineBounds {
  const PADDING_MINUTES = 60; // 1 hour padding before/after
  
  // Estimate timeline height if not provided
  // This will be refined after calculating bounds
  const estimatedHeight = timelineHeight ?? 600;

  // Check for wake/sleep times
  const wakeUpItem = timelineItems.find(item => item.isWakeUp);
  const bedTimeItem = timelineItems.find(item => item.isBedTime);
  
  let startTime: string;
  let endTime: string;

  // Get ALL tasks from timeline items (including normal tasks, startup, winddown, etc.)
  const allTasks = timelineItems.flatMap(item => item.tasks.filter(t => t.time));
  
  // Also include reminder times (water, medication, etc.) from items without tasks
  const reminderTimes = timelineItems
    .filter(item => item.tasks.length === 0)
    .map(item => item.time);

  if (timelineItems.length === 0) {
    // No items: Use sleep schedule only (no hardcoded defaults)
    if (sleepSchedule?.wakeTime && sleepSchedule?.bedtime) {
      startTime = sleepSchedule.wakeTime;
      endTime = sleepSchedule.bedtime;
    } else if (sleepSchedule?.wakeTime) {
      // Only wake time: create minimal range
      startTime = sleepSchedule.wakeTime;
      const wakeMinutes = timeToMinutes(sleepSchedule.wakeTime);
      endTime = minutesToTime(Math.min(1440, wakeMinutes + 60)); // 1 hour minimum
    } else if (sleepSchedule?.bedtime) {
      // Only bedtime: create minimal range
      const bedMinutes = timeToMinutes(sleepSchedule.bedtime);
      startTime = minutesToTime(Math.max(0, bedMinutes - 60)); // 1 hour minimum
      endTime = sleepSchedule.bedtime;
    } else {
      // No sleep schedule: return minimal bounds (will be handled by component)
      startTime = '00:00';
      endTime = '01:00'; // 1 hour minimum range
    }
  } else if (timelineItems.length < 3) {
    // Few items (< 3): Try to use actual task times if available
    
    if (allTasks.length === 0) {
      // No tasks, just reminders: Use reminder times or sleep schedule
      const reminderTimesMinutes = reminderTimes.map(timeToMinutes);
      
      if (reminderTimesMinutes.length > 0) {
        const earliestReminder = Math.min(...reminderTimesMinutes);
        const latestReminder = Math.max(...reminderTimesMinutes);
        
        let paddedStart = Math.max(0, earliestReminder - PADDING_MINUTES);
        let paddedEnd = Math.min(1440, latestReminder + PADDING_MINUTES);
        
        // Include wake/sleep if available
        if (wakeUpItem) {
          const wakeMinutes = timeToMinutes(wakeUpItem.time);
          paddedStart = Math.min(paddedStart, Math.max(0, wakeMinutes - PADDING_MINUTES));
        } else if (sleepSchedule?.wakeTime) {
          const wakeMinutes = timeToMinutes(sleepSchedule.wakeTime);
          paddedStart = Math.min(paddedStart, Math.max(0, wakeMinutes - PADDING_MINUTES));
        }
        
        if (bedTimeItem) {
          const bedMinutes = timeToMinutes(bedTimeItem.time);
          paddedEnd = Math.max(paddedEnd, Math.min(1440, bedMinutes + PADDING_MINUTES));
        } else if (sleepSchedule?.bedtime) {
          const bedMinutes = timeToMinutes(sleepSchedule.bedtime);
          paddedEnd = Math.max(paddedEnd, Math.min(1440, bedMinutes + PADDING_MINUTES));
        }
        
        startTime = minutesToTime(paddedStart);
        endTime = minutesToTime(paddedEnd);
      } else {
        // No reminders, use wake/sleep times only
        if (wakeUpItem && bedTimeItem) {
          startTime = wakeUpItem.time;
          endTime = bedTimeItem.time;
        } else if (sleepSchedule?.wakeTime && sleepSchedule?.bedtime) {
          startTime = sleepSchedule.wakeTime;
          endTime = sleepSchedule.bedtime;
        } else {
          // Minimal fallback
          startTime = wakeUpItem?.time || sleepSchedule?.wakeTime || '00:00';
          endTime = bedTimeItem?.time || sleepSchedule?.bedtime || '01:00';
        }
      }
    } else if (allTasks.length === 1) {
      // Single task: Use task time with reasonable padding
      const singleTask = allTasks[0];
      const taskStartMinutes = timeToMinutes(singleTask.time!);
      const taskEndMinutes = singleTask.endTime 
        ? timeToMinutes(singleTask.endTime)
        : taskStartMinutes + 60; // Default 1 hour duration if no endTime
      
      let paddedStart = Math.max(0, taskStartMinutes - PADDING_MINUTES);
      let paddedEnd = Math.min(1440, taskEndMinutes + PADDING_MINUTES);
      
      // Always include wake/sleep times in bounds
      if (wakeUpItem) {
        const wakeMinutes = timeToMinutes(wakeUpItem.time);
        paddedStart = Math.min(paddedStart, Math.max(0, wakeMinutes - PADDING_MINUTES));
      }
      if (bedTimeItem) {
        const bedMinutes = timeToMinutes(bedTimeItem.time);
        paddedEnd = Math.max(paddedEnd, Math.min(1440, bedMinutes + PADDING_MINUTES));
      }
      
      startTime = minutesToTime(paddedStart);
      endTime = minutesToTime(paddedEnd);
    } else if (allTasks.length > 1) {
      // Multiple tasks but < 3 timeline items: Use actual task times with padding
      const allStartTimes = allTasks.map(t => timeToMinutes(t.time!));
      const allEndTimes = allTasks.map(t => {
        if (t.endTime) {
          return timeToMinutes(t.endTime);
        }
        // If no endTime, use 60 min default (Category 1)
        return timeToMinutes(t.time!) + 60;
      });
      
      const earliestTime = Math.min(...allStartTimes);
      const latestTime = Math.max(...allEndTimes);
      
      // Ensure minimum range to spread tasks properly
      const minRangeMinutes = Math.max(240, (latestTime - earliestTime) + PADDING_MINUTES * 2); // At least 4 hours
      const actualRange = latestTime - earliestTime;
      const paddingNeeded = Math.max(PADDING_MINUTES, (minRangeMinutes - actualRange) / 2);
      
      let paddedStart = Math.max(0, earliestTime - paddingNeeded);
      let paddedEnd = Math.min(1440, latestTime + paddingNeeded);
      
      // Ensure wake/sleep times are always included in bounds
      if (wakeUpItem) {
        const wakeMinutes = timeToMinutes(wakeUpItem.time);
        paddedStart = Math.min(paddedStart, Math.max(0, wakeMinutes - PADDING_MINUTES));
      }
      if (bedTimeItem) {
        const bedMinutes = timeToMinutes(bedTimeItem.time);
        paddedEnd = Math.max(paddedEnd, Math.min(1440, bedMinutes + PADDING_MINUTES));
      }
      
      startTime = minutesToTime(paddedStart);
      endTime = minutesToTime(paddedEnd);
    }
    // Removed else block - handled above in allTasks.length === 0 case
  } else {
    // Many items: Use actual first/last with padding
    // Get earliest task time (considering tasks with endTime)
    const allStartTimes = timelineItems.flatMap(item => 
      item.tasks
        .filter(t => t.time)
        .map(t => timeToMinutes(t.time!))
    );
    
    const allEndTimes = timelineItems.flatMap(item =>
      item.tasks
        .filter(t => t.endTime)
        .map(t => {
          // Calculate end time: use endTime if exists, otherwise add 60 min default
          const startMins = timeToMinutes(t.time!);
          return timeToMinutes(t.endTime || minutesToTime(startMins + 60));
        })
    );

    // For items without tasks, use the item's time
    const itemTimes = timelineItems
      .filter(item => item.tasks.length === 0)
      .map(item => timeToMinutes(item.time));

    const allTimes = [...allStartTimes, ...allEndTimes, ...itemTimes];
    
    // Calculate earliest/latest times with fallbacks
    const earliestTime = allTimes.length > 0
      ? Math.min(...allTimes)
      : (allStartTimes.length > 0 
        ? Math.min(...allStartTimes)
        : timeToMinutes(timelineItems[0]?.time || '00:00'));
    
    const latestTime = allTimes.length > 0
      ? Math.max(...allTimes)
      : (allEndTimes.length > 0
        ? Math.max(...allEndTimes)
        : timeToMinutes(timelineItems[timelineItems.length - 1]?.time || '23:59'));

    // Apply padding
    let paddedStart = Math.max(0, earliestTime - PADDING_MINUTES);
    let paddedEnd = Math.min(1440, latestTime + PADDING_MINUTES); // Max 24:00

    // Ensure wake/sleep times are always included in bounds
    if (wakeUpItem) {
      const wakeMinutes = timeToMinutes(wakeUpItem.time);
      paddedStart = Math.min(paddedStart, Math.max(0, wakeMinutes - PADDING_MINUTES));
    }
    if (bedTimeItem) {
      const bedMinutes = timeToMinutes(bedTimeItem.time);
      paddedEnd = Math.max(paddedEnd, Math.min(1440, bedMinutes + PADDING_MINUTES));
    }

    startTime = minutesToTime(paddedStart);
    endTime = minutesToTime(paddedEnd);
  }

  // Final check: ensure wake/sleep times are always within bounds
  if (wakeUpItem) {
    const wakeMinutes = timeToMinutes(wakeUpItem.time);
    const startMinutes = timeToMinutes(startTime);
    if (wakeMinutes < startMinutes) {
      startTime = minutesToTime(Math.max(0, wakeMinutes - PADDING_MINUTES));
    }
  }
  if (bedTimeItem) {
    const bedMinutes = timeToMinutes(bedTimeItem.time);
    const endMinutes = timeToMinutes(endTime);
    if (bedMinutes > endMinutes) {
      endTime = minutesToTime(Math.min(1440, bedMinutes + PADDING_MINUTES));
    }
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  let rangeMinutes = endMinutes - startMinutes;
  
  // Ensure we always have a valid range (minimum 60 minutes / 1 hour)
  if (rangeMinutes <= 0) {
    // Fallback: Create minimal valid range
    rangeMinutes = 60; // 1 hour minimum
    endTime = minutesToTime(startMinutes + rangeMinutes);
  }

  // Generate density map if adaptive scaling is enabled
  // This is the most expensive operation, so it's memoized at the component level
  // The density map uses the provided timelineHeight for accurate pixel-to-percentage mapping
  let densityMap: DensityMap | undefined;
  if (useAdaptiveScaling && timelineItems.length > 0 && rangeMinutes > 0) {
    try {
      const windows = analyzeTaskDensity(timelineItems, startMinutes, endMinutes);
      const allocatedWindows = calculateSpaceAllocation(windows);
      // Use provided timelineHeight for accurate density mapping
      // If not provided, uses estimated height (will be refined on next render)
      densityMap = createTimeMapping(allocatedWindows, startMinutes, endMinutes, estimatedHeight);
    } catch (error) {
      // If density calculation fails, continue without it (fallback to linear)
      console.warn('Failed to generate density map, using linear scaling:', error);
    }
  }

  return {
    startTime,
    endTime,
    startMinutes,
    endMinutes: timeToMinutes(endTime),
    rangeMinutes,
    hasWakeUp: !!wakeUpItem,
    hasBedTime: !!bedTimeItem,
    densityMap,
    useAdaptiveScaling,
  };
}

/**
 * Calculate position percentage on timeline
 * Uses adaptive density-based scaling if available, otherwise falls back to linear
 */
export function calculatePosition(
  time: string,
  bounds: TimelineBounds
): number {
  const timeMinutes = timeToMinutes(time);
  
  // Use adaptive scaling if available
  if (bounds.densityMap && bounds.useAdaptiveScaling) {
    return getAdaptivePosition(timeMinutes, bounds.densityMap, bounds);
  }
  
  // Fall back to linear calculation
  if (bounds.rangeMinutes === 0) return 0; // Prevent division by zero
  
  const position = ((timeMinutes - bounds.startMinutes) / bounds.rangeMinutes) * 100;
  
  // For times before start, clamp to 0% (top)
  if (timeMinutes < bounds.startMinutes) return 0;
  // For times after end, clamp to 100% (bottom)
  if (timeMinutes > bounds.endMinutes) return 100;
  
  return Math.max(0, Math.min(100, position)); // Clamp 0-100%
}

/**
 * Calculate position for time range (start to end)
 */
export function calculateRangePosition(
  startTime: string,
  endTime: string,
  bounds: TimelineBounds
): { startPercent: number; endPercent: number; heightPercent: number } {
  const startPercent = calculatePosition(startTime, bounds);
  const endPercent = calculatePosition(endTime, bounds);
  const heightPercent = endPercent - startPercent;
  
  return {
    startPercent: Math.max(0, Math.min(100, startPercent)),
    endPercent: Math.max(0, Math.min(100, endPercent)),
    heightPercent: Math.max(0, heightPercent),
  };
}

