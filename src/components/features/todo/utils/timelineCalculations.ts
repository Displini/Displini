import { timeToMinutes, minutesToTime } from "./timeHelpers";
import { TimelineItem } from "./buildTimelineItems";
import { MIN_RANGE_MINUTES, TIMELINE_PADDING_MINUTES } from "./timelineConfig";

export interface TimelineBounds {
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  rangeMinutes: number;
}

// Calculate bounds purely from task times (no hardcoded day bounds)
export function calculateTimelineBounds(items: TimelineItem[]): TimelineBounds {
  const PAD = TIMELINE_PADDING_MINUTES;
  const times: number[] = [];

  items.forEach(item => {
    times.push(timeToMinutes(item.time));
    item.tasks.forEach(t => {
      if (t.endTime) times.push(timeToMinutes(t.endTime));
      else times.push(timeToMinutes(t.time!) + 30); // minimal span for tasks without end
    });
  });

  if (times.length === 0) {
    const range = MIN_RANGE_MINUTES;
    return {
      startTime: "00:00",
      endTime: minutesToTime(range),
      startMinutes: 0,
      endMinutes: range,
      rangeMinutes: range,
    };
  }

  const minT = Math.max(0, Math.min(...times) - PAD);
  const maxT = Math.min(1440, Math.max(...times) + PAD);
  const range = Math.max(MIN_RANGE_MINUTES, maxT - minT);

  return {
    startTime: minutesToTime(minT),
    endTime: minutesToTime(minT + range),
    startMinutes: minT,
    endMinutes: minT + range,
    rangeMinutes: range,
  };
}

// Linear position calculation (0-100%)
export function calculatePosition(time: string, bounds: TimelineBounds): number {
  const timeMinutes = timeToMinutes(time);
  if (bounds.rangeMinutes === 0) return 0;
  const position = ((timeMinutes - bounds.startMinutes) / bounds.rangeMinutes) * 100;
  if (timeMinutes < bounds.startMinutes) return 0;
  if (timeMinutes > bounds.endMinutes) return 100;
  return Math.max(0, Math.min(100, position));
}
