import { Task } from "@/app/types/types";
import { timeToMinutes, minutesToTime } from "./timeHelpers";
import { calculateTaskMetrics } from "./taskSizing";
import { TimelineBounds } from "./timelineCalculations";

export interface TaskGroup {
  id: string; // Unique ID for the group
  tasks: Task[];
  startTime: string;
  endTime: string;
  displayDuration: number;
  startPercent: number;
  endPercent: number;
  heightPercent: number;
  centerPercent: number;
}

/**
 * Check if two tasks overlap based on their actual times
 * Adds a small gap (15 minutes) between tasks that end and start at the same time
 * Special handling: Tasks without endTime don't overlap with tasks that start very close after
 * (Display duration normalization happens later in rendering)
 */
function tasksOverlap(task1: Task, task2: Task): boolean {
  if (!task1.time || !task2.time) return false;
  
  const GAP_MINUTES = 15; // Small gap between tasks (prevents exact overlap)
  const MIN_START_GAP = 1; // If task has no endTime, don't overlap if next task starts within 1 minute
  
  const start1 = timeToMinutes(task1.time);
  const end1 = task1.endTime 
    ? timeToMinutes(task1.endTime)
    : null; // No endTime - treat specially
  
  const start2 = timeToMinutes(task2.time);
  const end2 = task2.endTime 
    ? timeToMinutes(task2.endTime)
    : null; // No endTime - treat specially
  
  // Special case: If tasks start at the EXACT same time, they should overlap (group together)
  // Only if they actually overlap in their time ranges
  if (start1 === start2) {
    // Same start time - check if they actually overlap
    if (end1 !== null && end2 !== null) {
      // Both have end times - they overlap if at least one extends beyond the other
      return true; // Same start time means they overlap
    }
    // Continue to normal overlap check below for other cases
  }
  
  // Special case: Task1 has no endTime and Task2 starts very close after (within 1 minute)
  // Don't overlap - they should be separate tasks
  if (!end1 && end2 !== null) {
    const timeDiff = start2 - start1;
    if (timeDiff > 0 && timeDiff <= MIN_START_GAP) {
      return false; // Don't overlap - task2 starts too close after task1 without endTime
    }
  }
  
  // Special case: Task2 has no endTime and Task1 ends exactly when it starts
  // Don't overlap - task ending at 13:00 and task starting at 13:00 should NOT fuse
  if (!end2 && end1 !== null) {
    if (start2 === end1) {
      return false; // Task ends exactly when next starts - no overlap, leave gap
    }
    const timeDiff = start2 - end1;
    if (timeDiff > 0 && timeDiff <= MIN_START_GAP) {
      return false; // Don't overlap - task2 without endTime starts too close after task1 ends
    }
  }
  
  // Both tasks have endTimes - use normal overlap logic
  // Tasks only overlap if they actually overlap (not just touch)
  // Task ending at 13:00 and task starting at 13:00 should NOT overlap
  // Only overlap if: task1 ends after task2 starts (e.g., task1 ends 13:02, task2 starts 13:00)
  if (end1 !== null && end2 !== null) {
    // Tasks overlap if their time ranges actually intersect (not just touch)
    // Overlap if: start1 < end2 AND end1 > start2 (no gap, actual overlap)
    // This means: task ending at 13:00 and starting at 13:00 do NOT overlap
    return start1 < end2 && end1 > start2;
  }
  
  // One or both tasks have no endTime - check if starts overlap
  // If task1 has no endTime, it extends indefinitely, so check if task2 starts within gap
  if (!end1) {
    // Task1 extends indefinitely - don't overlap if task2 starts with gap after task1
    return start2 < (start1 + GAP_MINUTES);
  }
  
  // Task2 has no endTime - check if it starts within gap of task1's end
  if (!end2) {
    return start2 < (end1 + GAP_MINUTES);
  }
  
  return false;
}

/**
 * Check if tasks should be grouped together
 * (Some task types shouldn't be grouped even if they overlap)
 */
function shouldGroupTasks(task1: Task, task2: Task): boolean {
  // Allow startup tasks to group with other startup tasks
  if (task1.source === 'startup' && task2.source === 'startup') return true;
  // Allow winddown tasks to group with other winddown tasks
  if (task1.source === 'winddown' && task2.source === 'winddown') return true;
  
  // Don't group startup with winddown
  if (task1.source === 'startup' && task2.source === 'winddown') return false;
  if (task1.source === 'winddown' && task2.source === 'startup') return false;
  
  // Don't group startup/winddown with regular tasks - they should appear separately
  if (task1.source === 'startup' && task2.source !== 'startup') return false;
  if (task1.source === 'winddown' && task2.source !== 'winddown') return false;
  if (task2.source === 'startup' && task1.source !== 'startup') return false;
  if (task2.source === 'winddown' && task1.source !== 'winddown') return false;
  
  // Don't group system tasks (sleep, water, medication) with regular tasks or startup/winddown
  const systemSources = ['sleep', 'water', 'medication', 'steps'];
  if (systemSources.includes(task1.source) && !systemSources.includes(task2.source)) return false;
  if (systemSources.includes(task2.source) && !systemSources.includes(task1.source)) return false;
  
  // Work tasks can group with other work tasks or regular tasks
  // School tasks can group with other school tasks or regular tasks
  // Regular tasks can group with each other
  
  return true;
}

/**
 * Group overlapping tasks into containers
 */
export function groupOverlappingTasks(
  tasks: Task[],
  bounds: TimelineBounds
): TaskGroup[] {
  // Get display preferences for water/medication
  let waterDisplayMode = 'dot';
  try {
    if (typeof localStorage !== 'undefined') {
      const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
      waterDisplayMode = waterSettings.displayMode || 'dot';
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Filter to tasks with times, excluding water/medication/sleep if user prefers dots
  const tasksWithTimes = tasks.filter(t => {
    if (!t.time) return false;
    // Filter out sleep tasks (wake/bedtime) - they only show as dots
    if (t.source === 'sleep') return false;
    // Filter out water tasks if user prefers dots
    if (t.source === 'water' && waterDisplayMode === 'dot') return false;
    // Medication always uses dots for now
    if (t.source === 'medication') return false;
    return true;
  });
  
  if (tasksWithTimes.length === 0) return [];
  
  // Sort by start time
  const sortedTasks = [...tasksWithTimes].sort((a, b) => 
    timeToMinutes(a.time!) - timeToMinutes(b.time!)
  );
  
  const groups: TaskGroup[] = [];
  const processedTaskIds = new Set<string>();
  
  for (const task of sortedTasks) {
    if (processedTaskIds.has(task.id)) continue;
    
    // Find all tasks that overlap with this task
    const overlappingTasks: Task[] = [task];
    processedTaskIds.add(task.id);
    
    for (const otherTask of sortedTasks) {
      if (processedTaskIds.has(otherTask.id)) continue;
      if (!shouldGroupTasks(task, otherTask)) continue;
      
      if (tasksOverlap(task, otherTask)) {
        overlappingTasks.push(otherTask);
        processedTaskIds.add(otherTask.id);
      }
    }
    
    // Calculate group metrics
    const startTimes = overlappingTasks.map(t => timeToMinutes(t.time!));
    const endTimes = overlappingTasks.map(t => 
      t.endTime ? timeToMinutes(t.endTime) : timeToMinutes(t.time!) + 30
    );
    
    const earliestStart = Math.min(...startTimes);
    const latestEnd = Math.max(...endTimes);
    
    const startTime = overlappingTasks.find(t => 
      timeToMinutes(t.time!) === earliestStart
    )!.time!;
    
    // Find end time (use actual endTime if exists, otherwise calculate from latest end)
    const taskWithLatestEnd = overlappingTasks.find(t => {
      const taskEnd = t.endTime ? timeToMinutes(t.endTime) : timeToMinutes(t.time!) + 30;
      return taskEnd === latestEnd;
    });
    const endTime = taskWithLatestEnd?.endTime || minutesToTime(latestEnd);
    
    // Calculate display metrics for the group
    const groupTask: Task = {
      ...task,
      time: startTime,
      endTime: endTime,
    };
    
    const metrics = calculateTaskMetrics(groupTask, bounds);
    
    groups.push({
      id: `group-${task.id}`,
      tasks: overlappingTasks,
      startTime,
      endTime,
      displayDuration: metrics.displayDuration,
      startPercent: metrics.startPercent,
      endPercent: metrics.endPercent,
      heightPercent: metrics.heightPercent,
      centerPercent: metrics.centerPercent,
    });
  }
  
  // Add non-overlapping tasks as single-task groups (including those without endTime)
  // This includes startup/winddown tasks that don't overlap with others
  // Filter out sleep/water/medication tasks - they only show as dots, not containers
  const nonOverlappingTasks = tasks.filter(t => {
    if (!t.time || processedTaskIds.has(t.id)) return false;
    // Skip sleep tasks (wake/bedtime) - they only show as dots
    if (t.source === 'sleep') return false;
    // Skip water tasks if user prefers dots over containers
    if (t.source === 'water' && waterDisplayMode === 'dot') return false;
    // Medication always uses dots for now (can be extended later)
    if (t.source === 'medication') return false; // Always show as dots, not containers
    return true;
  });
  
  for (const task of nonOverlappingTasks) {
    // For startup/winddown tasks without endTime, use a reasonable default duration
    // Otherwise use default 30 min
    let defaultDuration = 30;
    if ((task.source === 'startup' || task.source === 'winddown') && !task.endTime) {
      // Default startup/winddown to 1 hour if no endTime specified
      defaultDuration = 60;
    }
    
    // Create a task with default endTime if missing
    const taskWithEndTime: Task = {
      ...task,
      endTime: task.endTime || minutesToTime(timeToMinutes(task.time!) + defaultDuration),
    };
    
    const metrics = calculateTaskMetrics(taskWithEndTime, bounds);
    groups.push({
      id: `group-${task.id}`,
      tasks: [task],
      startTime: task.time!,
      endTime: taskWithEndTime.endTime!,
      displayDuration: metrics.displayDuration,
      startPercent: metrics.startPercent,
      endPercent: metrics.endPercent,
      heightPercent: metrics.heightPercent,
      centerPercent: metrics.centerPercent,
    });
  }
  
  return groups.sort((a, b) => 
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
}

/**
 * Check if a task belongs to a group
 */
export function getTaskGroup(
  taskId: string,
  groups: TaskGroup[]
): TaskGroup | null {
  return groups.find(g => g.tasks.some(t => t.id === taskId)) || null;
}

