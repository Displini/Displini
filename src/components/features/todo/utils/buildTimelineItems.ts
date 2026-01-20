import { Task } from "@/types/types";

export interface TimelineItem {
  time: string;
  tasks: Task[];
}

// Build timeline items purely from time-based tasks (no sleep/med/water yet)
export function buildTimelineItems(tasks: Task[]): TimelineItem[] {
  const itemsMap: Record<string, TimelineItem> = {};

  tasks
    .filter(t => t.time && !t.allDay && !['sleep', 'water'].includes(t.source || ''))
    .forEach(task => {
      const key = task.time!;
      if (!itemsMap[key]) itemsMap[key] = { time: key, tasks: [] };
      itemsMap[key].tasks.push(task);
    });

  return Object.values(itemsMap).sort((a, b) => a.time.localeCompare(b.time));
}
