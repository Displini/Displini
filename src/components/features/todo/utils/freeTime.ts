import { TaskGroup } from "./taskGrouping";
import { FREE_GAP_MINUTES } from "./timelineConfig";

export interface FreeGap {
  id: string;
  topPercent: number;
  displayText: string;
}

// Compute gaps of at least FREE_GAP_MINUTES between task groups
export function calculateFreeGaps(taskGroups: TaskGroup[]): FreeGap[] {
  const gaps: FreeGap[] = [];
  const sorted = [...taskGroups].sort((a, b) => a.startPercent - b.startPercent);

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const gapMinutes = minutesBetween(a.endTime, b.startTime);
    if (gapMinutes >= FREE_GAP_MINUTES) {
      const hours = Math.floor(gapMinutes / 60);
      const minutes = gapMinutes % 60;
      const text = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      gaps.push({
        id: `gap-${a.id}-${b.id}`,
        topPercent: a.endPercent,
        displayText: `Free time: ${text}`,
      });
    }
  }

  return gaps;
}

function minutesBetween(a: string, b: string): number {
  return timeToMinutesSafe(b) - timeToMinutesSafe(a);
}

function timeToMinutesSafe(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
import { Task } from "@/types/types";
import { TaskGroup } from "./taskGrouping";
import { TimelineBounds } from "./timelineCalculations";
import { timeToMinutes, minutesToTime } from "./timeHelpers";
import { calculatePosition } from "./timelineCalculations";

export interface FreeTimeSegment {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  startPercent: number;
  endPercent: number;
  hours: number;
  minutes: number;
  displayText: string;
}

/**
 * Calculate free time segments between task groups
 * This is part of the timeline algorithm - calculates gaps where users can add tasks
 */
export function calculateFreeTimeSegments(
  taskGroups: TaskGroup[],
  bounds: TimelineBounds,
  timelineItems: Array<{ time: string; tasks: Task[] }>
): FreeTimeSegment[] {
  const segments: FreeTimeSegment[] = [];
  
  // Filter out system tasks for free time calculation
  const nonSystemGroups = taskGroups.filter(group => 
    !group.tasks.some(t => ['water', 'medication', 'sleep', 'steps'].includes(t.source))
  );
  
  if (nonSystemGroups.length === 0) return segments;
  
  // Sort by start time
  const sortedGroups = [...nonSystemGroups].sort((a, b) => 
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  
  // Calculate free time between consecutive task groups
  for (let i = 0; i < sortedGroups.length - 1; i++) {
    const currentGroup = sortedGroups[i];
    const nextGroup = sortedGroups[i + 1];
    
    // Skip if current group has winddown or work tasks
    if (currentGroup.tasks.some(t => t.source === 'winddown' || t.source === 'work' || t.source?.startsWith('work-'))) {
      continue;
    }
    
    // Skip if next group has startup or work tasks
    if (nextGroup.tasks.some(t => t.source === 'startup' || t.source === 'work' || t.source?.startsWith('work-'))) {
      continue;
    }
    
    // Get end time of current task group
    const currentEndTime = currentGroup.endTime || currentGroup.startTime;
    const currentEndMinutes = timeToMinutes(currentEndTime);
    const nextStartMinutes = timeToMinutes(nextGroup.startTime);
    const diffMinutes = nextStartMinutes - currentEndMinutes;
    
    // Only create segment if gap is at least 30 minutes
    if (diffMinutes < 30) continue;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours === 0 && minutes === 0) continue;
    
    // Calculate positions using task group end percent for accurate positioning
    const startPercent = currentGroup.endPercent || currentGroup.startPercent;
    const endPercent = nextGroup.startPercent;
    
    let displayText = '';
    if (hours === 0) {
      displayText = `${minutes}m`;
    } else if (minutes === 0) {
      displayText = `${hours}h`;
    } else {
      displayText = `${hours}h ${minutes}m`;
    }
    
    segments.push({
      id: `free-${currentGroup.id}-${nextGroup.id}`,
      startTime: currentEndTime,
      endTime: nextGroup.startTime,
      durationMinutes: diffMinutes,
      startPercent,
      endPercent,
      hours,
      minutes,
      displayText,
    });
  }
  
  return segments;
}

