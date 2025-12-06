import { Task } from "@/app/types/types";
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
  timelineItems: Array<{ isWakeUp?: boolean; isBedTime?: boolean; time: string }>
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
  
  // Calculate free time from wake up to first task
  const wakeUpItem = timelineItems.find(item => item.isWakeUp);
  const firstGroup = sortedGroups[0];
  
  if (wakeUpItem && firstGroup) {
    // Check if there are startup tasks - if so, don't show free time
    const hasStartupTasks = taskGroups.some(group => 
      group.tasks.some(t => t.source === 'startup')
    );
    
    if (!hasStartupTasks) {
      const wakeUpMinutes = timeToMinutes(wakeUpItem.time);
      const firstTaskMinutes = timeToMinutes(firstGroup.startTime);
      const diffMinutes = firstTaskMinutes - wakeUpMinutes;
      
      if (diffMinutes >= 30) {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        
        if (hours > 0 || minutes > 0) {
          const startPercent = calculatePosition(wakeUpItem.time, bounds);
          const endPercent = firstGroup.startPercent;
          
          let displayText = '';
          if (hours === 0) {
            displayText = `${minutes}m`;
          } else if (minutes === 0) {
            displayText = `${hours}h`;
          } else {
            displayText = `${hours}h ${minutes}m`;
          }
          
          segments.push({
            id: `free-wakeup-${firstGroup.id}`,
            startTime: wakeUpItem.time,
            endTime: firstGroup.startTime,
            durationMinutes: diffMinutes,
            startPercent,
            endPercent,
            hours,
            minutes,
            displayText,
          });
        }
      }
    }
  }
  
  // Calculate free time from last task to sleep
  const sleepItem = timelineItems.find(item => item.isBedTime);
  const lastGroup = sortedGroups[sortedGroups.length - 1];
  
  if (sleepItem && lastGroup) {
    const lastGroupEndTime = lastGroup.endTime || lastGroup.startTime;
    const lastGroupEndMinutes = timeToMinutes(lastGroupEndTime);
    const sleepMinutes = timeToMinutes(sleepItem.time);
    const diffMinutes = sleepMinutes - lastGroupEndMinutes;
    
    if (diffMinutes >= 30) {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      
      if (hours > 0 || minutes > 0) {
        const startPercent = lastGroup.endPercent || lastGroup.startPercent;
        const endPercent = calculatePosition(sleepItem.time, bounds);
        
        let displayText = '';
        if (hours === 0) {
          displayText = `${minutes}m`;
        } else if (minutes === 0) {
          displayText = `${hours}h`;
        } else {
          displayText = `${hours}h ${minutes}m`;
        }
        
        segments.push({
          id: `free-${lastGroup.id}-sleep`,
          startTime: lastGroupEndTime,
          endTime: sleepItem.time,
          durationMinutes: diffMinutes,
          startPercent,
          endPercent,
          hours,
          minutes,
          displayText,
        });
      }
    }
  }
  
  return segments;
}

