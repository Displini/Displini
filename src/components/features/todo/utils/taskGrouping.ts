import { Task } from "@/types/types";
import { timeToMinutes } from "./timeHelpers";
import { TimelineBounds } from "./timelineCalculations";
import { MIN_GAP_PERCENT } from "./timelineConfig";

export interface TaskGroup {
  id: string;
  tasks: Task[];
  startTime: string;
  endTime: string;
  startPercent: number;
  endPercent: number;
  heightPercent: number;
}

// Merge overlapping tasks; keep tiny gaps so same-time entries don't fuse
export function groupTasks(tasks: Task[], bounds: TimelineBounds): TaskGroup[] {
  const sorted = [...tasks]
    .filter(t => t.time && !t.allDay)
    .sort((a, b) => timeToMinutes(a.time!) - timeToMinutes(b.time!));

  const groups: TaskGroup[] = [];
  const pct = (time: string) =>
    Math.max(0, Math.min(100, ((timeToMinutes(time) - bounds.startMinutes) / bounds.rangeMinutes) * 100));

  for (const t of sorted) {
    const startP = pct(t.time!);
    const endP = t.endTime ? pct(t.endTime) : startP;

    const g: TaskGroup = {
      id: t.id,
      tasks: [t],
      startTime: t.time!,
      endTime: t.endTime || t.time!,
      startPercent: startP,
      endPercent: endP,
      heightPercent: Math.max(0.5, endP - startP),
    };

    const overlap = groups.find(m => g.startPercent < m.endPercent && g.endPercent > m.startPercent);
    if (overlap) {
      overlap.tasks.push(...g.tasks);
      overlap.startTime = timeToMinutes(g.startTime) < timeToMinutes(overlap.startTime) ? g.startTime : overlap.startTime;
      overlap.endTime = timeToMinutes(g.endTime) > timeToMinutes(overlap.endTime) ? g.endTime : overlap.endTime;
      overlap.startPercent = Math.min(overlap.startPercent, g.startPercent);
      overlap.endPercent = Math.max(overlap.endPercent, g.endPercent);
      overlap.heightPercent = Math.max(0.5, overlap.endPercent - overlap.startPercent);
    } else {
      groups.push(g);
    }
  }

  groups.sort((a, b) => a.startPercent - b.startPercent);
  for (let i = 1; i < groups.length; i++) {
    if (groups[i].startPercent <= groups[i - 1].endPercent) {
      groups[i].startPercent = groups[i - 1].endPercent + MIN_GAP_PERCENT;
      if (groups[i].startPercent > groups[i].endPercent) {
        groups[i].endPercent = groups[i].startPercent + 0.5;
      }
      groups[i].heightPercent = Math.max(0.5, groups[i].endPercent - groups[i].startPercent);
    }
  }

  return groups;
}
