import { Task } from "@/app/types/types";
import { timeToMinutes, calculateDuration } from "./timeHelpers";
import { TimelineBounds } from "./timelineCalculations";

// 3-Tier Task Sizing Constants
export const SHORT_TASK_MAX = 60;      // 1 hour in minutes (Category 1)
export const MEDIUM_TASK_MAX = 120;    // 2 hours in minutes (Category 2)
export const LONG_TASK_MAX = 240;      // 4 hours in minutes (Category 3, cap)

export interface TaskDisplayMetrics {
  actualDuration: number; // Real duration in minutes
  displayDuration: number; // Normalized duration for display
  startPercent: number;
  endPercent: number;
  heightPercent: number;
  centerPercent: number;
}

/**
 * Get normalized display duration for task using 3-tier system
 * Category 1: 0-60 min → returns actual duration
 * Category 2: 60-120 min → returns actual duration
 * Category 3: 120+ min → returns actual duration capped at 240 min (4 hours)
 */
export function getTaskDisplayDuration(task: Task): number {
  if (!task.time) return SHORT_TASK_MAX; // 60 minutes default
  
  let actualDuration: number;
  
  if (task.endTime) {
    actualDuration = calculateDuration(task.time, task.endTime);
  } else {
    // Tasks without endTime default to Category 1 (60 minutes)
    return SHORT_TASK_MAX;
  }
  
  // Handle invalid durations
  if (actualDuration <= 0) {
    return SHORT_TASK_MAX;
  }
  
  // Category 1 (Short): 0-60 minutes - return actual duration
  if (actualDuration <= SHORT_TASK_MAX) {
    return actualDuration;
  }
  
  // Category 2 (Medium): 60-120 minutes - return actual duration
  if (actualDuration <= MEDIUM_TASK_MAX) {
    return actualDuration;
  }
  
  // Category 3 (Long): 120+ minutes - cap at 240 minutes (4 hours)
  return Math.min(actualDuration, LONG_TASK_MAX);
}

/**
 * Calculate task display metrics for positioning
 */
export function calculateTaskMetrics(
  task: Task,
  bounds: { startMinutes: number; rangeMinutes: number }
): TaskDisplayMetrics {
  if (!task.time) {
    throw new Error('Task must have a time to calculate metrics');
  }

  // Prevent division by zero
  if (bounds.rangeMinutes <= 0) {
    return {
      actualDuration: 0,
      displayDuration: SHORT_TASK_MAX, // 60 minutes default
      startPercent: 0,
      endPercent: 0,
      heightPercent: 0,
      centerPercent: 0,
    };
  }

  const taskStartMinutes = timeToMinutes(task.time);
  const actualDuration = task.endTime
    ? calculateDuration(task.time, task.endTime)
    : SHORT_TASK_MAX; // 60 minutes default for no endTime
  
  const displayDuration = getTaskDisplayDuration(task);
  const displayEndMinutes = taskStartMinutes + displayDuration;

  const startPercent = ((taskStartMinutes - bounds.startMinutes) / bounds.rangeMinutes) * 100;
  const endPercent = ((displayEndMinutes - bounds.startMinutes) / bounds.rangeMinutes) * 100;
  const heightPercent = endPercent - startPercent;
  const centerPercent = (startPercent + endPercent) / 2;

  return {
    actualDuration,
    displayDuration,
    startPercent: Math.max(0, Math.min(100, startPercent)),
    endPercent: Math.max(0, Math.min(100, endPercent)),
    heightPercent: Math.max(0, heightPercent),
    centerPercent: Math.max(0, Math.min(100, centerPercent)),
  };
}


