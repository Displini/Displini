import React, { useEffect, useMemo, useRef, useState } from "react";
import { Task } from "@/types/types";
import { getCurrentTime, formatTimeString } from "@/lib/timeUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Clock } from "lucide-react";
import { TimelineBar } from "./timeline/TimelineBar";
import { TimelineDot } from "./timeline/TimelineDot";
import { CurrentTimeIndicator } from "./timeline/CurrentTimeIndicator";
import { TaskCard } from "./tasks/TaskCard";
import { buildTimelineItems } from "./utils/buildTimelineItems";
import { calculatePosition, calculateTimelineBounds, TimelineBounds } from "./utils/timelineCalculations";
import { groupTasks, TaskGroup } from "./utils/taskGrouping";
import { FREE_GAP_MINUTES } from "./utils/timelineConfig";
import { timeToMinutes, minutesToTime } from "./utils/timeHelpers";
import { heightForDurationMinutes } from "./utils/taskSizing";

interface AddTaskPayload {
  time?: string;
  endTime?: string;
  allDay?: boolean;
}

interface Props {
  tasks: Task[];
  date?: Date;
  onToggleTask: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string, deleteFuture?: boolean) => void;
  onAddTaskClick?: (payload: string | AddTaskPayload) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}

export default function LiquidTimeline({
  tasks,
  date,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onAddTaskClick,
  onToggleSubtask,
}: Props) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startInterval = (ms: number) => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      setCurrentTime(getCurrentTime());
      clockIntervalRef.current = setInterval(() => setCurrentTime(getCurrentTime()), ms);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        startInterval(30000); // Throttle to 30s when tab is in background
      } else {
        startInterval(1000); // 1s when tab is visible
      }
    };

    // Start with appropriate interval based on current visibility
    startInterval(document.hidden ? 30000 : 1000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const currentTimeStr = formatTimeString(currentTime);

  const timeTasks = useMemo(
    () => tasks.filter(t => t.time && !t.allDay && !['sleep', 'medication', 'water'].includes(t.source || '')),
    [tasks]
  );

  const medicationTimes = useMemo(() => {
    return tasks
      .filter(t => t.time && t.source === 'medication')
      .map(t => t.time!)
      .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  }, [tasks]);

  const sleepMarkers = useMemo(() => {
    const wakeTimes: string[] = [];
    const bedTimes: string[] = [];
    tasks.forEach(t => {
      if (t.source !== 'sleep' || !t.time) return;
      if ((t as any).sleepAction === 'wake') {
        wakeTimes.push(t.time);
      } else {
        bedTimes.push(t.time);
      }
    });
    const uniq = (arr: string[]) => Array.from(new Set(arr)).sort();
    return { wakeTimes: uniq(wakeTimes), bedTimes: uniq(bedTimes) };
  }, [tasks]);

  const timelineItems = useMemo(() => buildTimelineItems(timeTasks), [timeTasks]);

  const timelineItemsWithSleep = useMemo(() => {
    const items = [...timelineItems];
    sleepMarkers.wakeTimes.forEach(time => items.push({ time, tasks: [] }));
    sleepMarkers.bedTimes.forEach(time => items.push({ time, tasks: [] }));
    medicationTimes.forEach(time => items.push({ time, tasks: [] }));
    return items.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [timelineItems, sleepMarkers, medicationTimes]);

  const bounds: TimelineBounds = useMemo(
    () => calculateTimelineBounds(timelineItemsWithSleep),
    [timelineItemsWithSleep]
  );
  const taskGroups: TaskGroup[] = useMemo(() => groupTasks(timeTasks, bounds), [timeTasks, bounds]);
  const isToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const viewing = date ? date.toISOString().split("T")[0] : today;
    return today === viewing;
  }, [date]);

  const lastTaskEnd = useMemo(() => {
    const mins: number[] = [];
    timelineItems.forEach(item => {
      item.tasks.forEach(t => mins.push(timeToMinutes(t.endTime || t.time!)));
    });
    sleepMarkers.bedTimes.forEach(t => mins.push(timeToMinutes(t)));
    medicationTimes.forEach(t => mins.push(timeToMinutes(t)));
    return mins.length ? Math.max(...mins) : undefined;
  }, [timelineItems, sleepMarkers, medicationTimes]);

  const isSingleTask = timelineItems.length === 1 && timelineItems[0].tasks.length === 1;
  const singleTask = isSingleTask ? timelineItems[0].tasks[0] : null;
  const isEmpty = timelineItems.length === 0;

  // Base height from range; will be increased if stacking pushes further
  const baseHeight = Math.max(500, bounds.rangeMinutes * 1.6);
  const pxPerMinute = Math.max(2.5, baseHeight / Math.max(1, bounds.rangeMinutes));

  // Resolve visual overlaps by assigning pixel positions with a minimum buffer
  const { positionedGroups, finalHeight, startPx, endPx } = useMemo(() => {
    let lastBottom = 0;
    const MIN_GAP_PX = 18;
    const MIN_DISPLAY_MIN = 1;
    let startPxLocal = 0;
    let endPxLocal = 0;
    let prevEndMinutes = bounds.startMinutes;

    const positioned = taskGroups.map(group => {
      const rawDuration = Math.max(0, timeToMinutes(group.endTime) - timeToMinutes(group.startTime));
      const clampedDuration = Math.min(rawDuration, 240); // cap at 4 hours
      const durationMinutes = Math.max(clampedDuration, MIN_DISPLAY_MIN);
      const bucketHeight = heightForDurationMinutes(durationMinutes);
      const timeHeight = durationMinutes * pxPerMinute;
      const heightPx = Math.max(bucketHeight, timeHeight);

      const startMinutes = timeToMinutes(group.startTime);
      const gapMinutes = Math.max(0, startMinutes - prevEndMinutes);
      const extraGapPx = gapMinutes >= FREE_GAP_MINUTES ? 16 : 0;

      let topPx = (startMinutes - bounds.startMinutes) * pxPerMinute;
      if (topPx < lastBottom + MIN_GAP_PX + extraGapPx) topPx = lastBottom + MIN_GAP_PX + extraGapPx;

      const bottom = topPx + heightPx;
      lastBottom = bottom;
      prevEndMinutes = timeToMinutes(group.endTime || group.startTime);
      return { group, topPx, heightPx, bottom };
    });

    if (positioned.length > 0) {
      startPxLocal = positioned[0].topPx;
      const last = positioned[positioned.length - 1];
      endPxLocal = last.topPx + last.heightPx;
    }

    const addButtonHeight = onAddTaskClick && positioned.length <= 3 ? 52 : 0;
    const neededHeight = Math.max(baseHeight, endPxLocal + 48 + addButtonHeight);
    return { positionedGroups: positioned, finalHeight: neededHeight, startPx: startPxLocal, endPx: endPxLocal };
  }, [taskGroups, pxPerMinute, bounds.startMinutes, baseHeight, onAddTaskClick]);

  // Free gaps computed from positioned groups with pixel alignment
  const freeGaps = useMemo(() => {
    const gaps: { id: string; topPx: number; displayText: string; startTimeMinutes: number; endTimeMinutes: number; isPassed: boolean }[] = [];
    if (positionedGroups.length < 2) return gaps;
    const sorted = [...positionedGroups].sort((a, b) => a.topPx - b.topPx);
    const currentTimeMinutes = timeToMinutes(currentTimeStr);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const gapStartMinutes = timeToMinutes(a.group.endTime || a.group.startTime);
      const gapEndMinutes = timeToMinutes(b.group.startTime);
      const gapMinutes = Math.max(0, gapEndMinutes - gapStartMinutes);
      
      if (gapMinutes >= FREE_GAP_MINUTES) {
        const hours = Math.floor(gapMinutes / 60);
        const minutes = gapMinutes % 60;
        const text = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        const isPassed = currentTimeMinutes > gapEndMinutes;
        
        gaps.push({
          id: `gap-${a.group.id}-${b.group.id}`,
          topPx: a.topPx + a.heightPx + 8,
          displayText: `Free time: ${text}`,
          startTimeMinutes: gapStartMinutes,
          endTimeMinutes: gapEndMinutes,
          isPassed: isPassed,
        });
      }
    }
    return gaps;
  }, [positionedGroups, currentTimeStr]);

  // Task time bounds for dots/bar/fill (purely time-based, no buffers)
  const taskStartMinutes = useMemo(() => {
    const mins: number[] = [];
    timeTasks.forEach(t => {
      if (t.time) mins.push(timeToMinutes(t.time));
    });
    return mins.length ? Math.min(...mins) : bounds.startMinutes;
  }, [timeTasks, bounds.startMinutes]);

  const taskEndMinutes = useMemo(() => {
    const mins: number[] = [];
    timeTasks.forEach(t => {
      if (t.endTime) mins.push(timeToMinutes(t.endTime));
      else if (t.time) mins.push(timeToMinutes(t.time));
    });
    return mins.length ? Math.max(...mins) : bounds.endMinutes;
  }, [timeTasks, bounds.endMinutes]);

  const taskStartPercent = useMemo(() => calculatePosition(minutesToTime(taskStartMinutes), bounds), [taskStartMinutes, bounds]);
  const taskEndPercent = useMemo(() => calculatePosition(minutesToTime(taskEndMinutes), bounds), [taskEndMinutes, bounds]);

  const startPxTime = useMemo(() => (taskStartPercent / 100) * finalHeight, [taskStartPercent, finalHeight]);
  const endPxTime = useMemo(() => (taskEndPercent / 100) * finalHeight, [taskEndPercent, finalHeight]);

  // Current position in px (mapped linearly by bounds), then clamped to task range
  const { visualStartPx, visualEndPx } = useMemo(() => {
    if (!positionedGroups.length) {
      return { visualStartPx: startPxTime, visualEndPx: endPxTime };
    }
    const first = positionedGroups[0];
    const last = positionedGroups[positionedGroups.length - 1];
    const start = Math.min(startPxTime, first.topPx);
    const end = Math.max(endPxTime, last.topPx + last.heightPx);
    return { visualStartPx: start, visualEndPx: end };
  }, [positionedGroups, startPxTime, endPxTime]);

  // Position current time using the same overlap-adjusted layout as task groups so the dot is past earlier tasks (e.g. 22:07 past 22:00)
  const currentPosPx = useMemo(() => {
    const now = currentTime;
    const curMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    if (!positionedGroups.length) {
      const rawPx = (curMin - bounds.startMinutes) * pxPerMinute;
      return Math.max(0, Math.min(finalHeight, rawPx));
    }
    const sorted = [...positionedGroups].sort((a, b) => timeToMinutes(a.group.startTime) - timeToMinutes(b.group.startTime));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstStart = timeToMinutes(first.group.startTime);
    const lastEnd = timeToMinutes(last.group.endTime || last.group.startTime);
    if (curMin < firstStart) {
      const rawPx = (curMin - bounds.startMinutes) * pxPerMinute;
      return Math.max(0, rawPx);
    }
    if (curMin > lastEnd) {
      const rawPx = last.topPx + last.heightPx + (curMin - lastEnd) * pxPerMinute;
      return Math.min(finalHeight, rawPx);
    }
    for (let i = 0; i < sorted.length; i++) {
      const g = sorted[i];
      const startMin = timeToMinutes(g.group.startTime);
      const endMin = timeToMinutes(g.group.endTime || g.group.startTime);
      if (curMin >= startMin && curMin <= endMin) {
        const frac = endMin > startMin ? (curMin - startMin) / (endMin - startMin) : 0;
        return g.topPx + frac * g.heightPx;
      }
      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        const gapEnd = timeToMinutes(next.group.startTime);
        if (curMin > endMin && curMin < gapEnd) {
          const gapStartPx = g.topPx + g.heightPx;
          const gapEndPx = next.topPx;
          const frac = gapEnd > endMin ? (curMin - endMin) / (gapEnd - endMin) : 0;
          return gapStartPx + frac * (gapEndPx - gapStartPx);
        }
      }
    }
    const rawPx = (curMin - bounds.startMinutes) * pxPerMinute;
    return Math.max(0, Math.min(finalHeight, rawPx));
  }, [currentTime, bounds.startMinutes, pxPerMinute, finalHeight, positionedGroups]);

  const startOffsetPercent = useMemo(() => (visualStartPx > 0 ? (visualStartPx / finalHeight) * 100 : 0), [visualStartPx, finalHeight]);
  const currentFillPercent = useMemo(
    () => (visualEndPx > 0 && finalHeight > 0 ? Math.max(0, Math.min(100, (currentPosPx / finalHeight) * 100)) : 0),
    [currentPosPx, visualEndPx, finalHeight, currentTimeStr]
  );

  const dotNodes = useMemo(() => {
    if (!positionedGroups.length || finalHeight === 0) return null;
    const hasSleep = sleepMarkers.wakeTimes.length > 0 || sleepMarkers.bedTimes.length > 0;
    // Use first task's topPx for start dot when no sleep - aligns dot with line/candy cone
    const firstTopPx = positionedGroups[0]?.topPx ?? visualStartPx;
    const startPos = hasSleep ? (visualStartPx / finalHeight) * 100 : (firstTopPx / finalHeight) * 100;
    const endPos = (visualEndPx / finalHeight) * 100;
    const dotSize = hasSleep ? 28 : 24;
    return (
      <>
        <TimelineDot
          key="start-dot"
          time={minutesToTime(taskStartMinutes)}
          position={startPos}
          type="start"
          hasPassed={isToday && taskStartMinutes <= timeToMinutes(currentTimeStr)}
          showLabel={true}
          labelPlacement="left"
          sizePx={dotSize}
        />
        {hasSleep && sleepMarkers.wakeTimes.length > 0 && (
          <div
            className="absolute text-[12px] font-medium text-foreground whitespace-nowrap z-50"
            style={{
              left: '0.5rem',
              top: `${startPos - 8}%`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
            }}
          >
            Wake up
          </div>
        )}
        <TimelineDot
          key="end-dot"
          time={minutesToTime(taskEndMinutes)}
          position={endPos}
          type="end"
          hasPassed={isToday && taskEndMinutes <= timeToMinutes(currentTimeStr)}
          showLabel={true}
          labelPlacement="left"
          sizePx={dotSize}
        />
        {hasSleep && sleepMarkers.bedTimes.length > 0 && (
          <div
            className="absolute text-[12px] font-medium text-foreground whitespace-nowrap z-50"
            style={{
              left: '0.5rem',
              top: `${endPos + 6}%`,
              transform: 'translate(-50%, 0%)',
              pointerEvents: 'none',
            }}
          >
            Sleeping time
          </div>
        )}
      </>
    );
  }, [positionedGroups, finalHeight, visualStartPx, visualEndPx, taskStartMinutes, taskEndMinutes, isToday, currentTimeStr, sleepMarkers]);

  const sleepDots = useMemo(() => {
    if (finalHeight === 0) return null;
    const nodes: React.ReactNode[] = [];
    sleepMarkers.wakeTimes.forEach((time, idx) => {
      const position = calculatePosition(time, bounds);
      nodes.push(
        <TimelineDot
          key={`wake-${time}-${idx}`}
          time={time}
          position={position}
          type="wake"
          hasPassed={isToday && timeToMinutes(time) <= timeToMinutes(currentTimeStr)}
          showLabel={true}
          labelPlacement="left"
          emoji="☀️"
          sizePx={28}
        />
      );
    });
    medicationTimes.forEach((time, idx) => {
      const position = calculatePosition(time, bounds);
      nodes.push(
        <TimelineDot
          key={`med-${time}-${idx}`}
          time={time}
          position={position}
          type="medication"
          hasPassed={isToday && timeToMinutes(time) <= timeToMinutes(currentTimeStr)}
          showLabel={true}
          labelPlacement="left"
          emoji="💊"
          sizePx={28}
        />
      );
    });
    sleepMarkers.bedTimes.forEach((time, idx) => {
      const position = calculatePosition(time, bounds);
      nodes.push(
        <TimelineDot
          key={`bed-${time}-${idx}`}
          time={time}
          position={position}
          type="sleep"
          hasPassed={isToday && timeToMinutes(time) <= timeToMinutes(currentTimeStr)}
          showLabel={true}
          labelPlacement="left"
          emoji="🌙"
          sizePx={28}
        />
      );
    });
    return nodes.length ? nodes : null;
  }, [sleepMarkers, bounds, isToday, currentTimeStr, finalHeight]);

  const gutterLabels = useMemo(() => {
    const seen = new Set<string>();
    const nodes: React.ReactNode[] = [];
    const firstStartTime = minutesToTime(taskStartMinutes);
    const lastEndTime = minutesToTime(taskEndMinutes);
    positionedGroups.forEach(({ group, topPx, heightPx }, idx) => {
      const start = group.startTime;
      const end = group.endTime && group.endTime !== group.startTime ? group.endTime : null;

      // Skip first start time in gutter to avoid double label with the start dot
      if (start && !seen.has(start) && start !== firstStartTime) {
        nodes.push(
          <div
            key={`gutter-start-${idx}`}
            className="absolute flex flex-col items-end gap-[2px]"
            style={{ top: `${topPx}px` }}
          >
            <div className="font-medium">{start}</div>
          </div>
        );
        seen.add(start);
      }

      // Skip final end time so it's only shown beside the end dot
      if (end && !seen.has(end) && end !== lastEndTime) {
        nodes.push(
          <div
            key={`gutter-end-${idx}`}
            className="absolute flex flex-col items-end gap-[2px]"
            style={{ top: `${topPx + heightPx - 2}px` }}
          >
            <div className="font-medium">{end}</div>
          </div>
        );
        seen.add(end);
      }
    });
    return nodes;
  }, [positionedGroups, taskStartMinutes, taskEndMinutes]);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center py-12 px-4 text-muted-foreground">
        <p className="text-lg font-medium">No scheduled tasks for today</p>
        <p className="text-sm mt-2">Add tasks with specific times to see your timeline</p>
        {onAddTaskClick && (
          <Button onClick={() => onAddTaskClick({ allDay: false })} className="mt-4 rounded-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>
    );
  }

  if (isSingleTask && singleTask) {
    return (
      <div className="w-full mx-auto pl-1 pr-0 sm:px-2 md:px-4 mb-8">
        <div className="pt-1 pb-12 pr-1 sm:pr-2">
          <Card className={`bg-card border border-border shadow-sm rounded-lg transition-all duration-200 ${singleTask.completed ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div 
                className="flex items-center gap-3 w-full cursor-pointer"
                onClick={() => onToggleTask(singleTask.id)}
              >
                {/* Task emoji - in colored circle on the left */}
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: singleTask.color || 'hsl(var(--primary))',
                      border: `2px solid ${singleTask.color || 'hsl(var(--primary))'}`,
                    }}
                  >
                    <span className="text-2xl">{singleTask.emoji || '📝'}</span>
                  </div>
                </div>
                
                {/* Task details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        singleTask.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {singleTask.title}
                    </h3>
                  </div>
                  
                  {/* Time */}
                  {singleTask.time && (
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {singleTask.time}
                      {singleTask.endTime && ` - ${singleTask.endTime}`}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Add another task button - below single task with minimal gap */}
          {onAddTaskClick && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" className="rounded-full transition-opacity hover:opacity-90" onClick={() => onAddTaskClick({ allDay: false })}>
                <Plus className="w-4 h-4 mr-2" /> Add another task to build the timeline
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto pl-1 pr-0 sm:px-2 md:px-4 mb-8">
      <div 
        className="pt-0 pb-24 pr-1 sm:pr-2 overflow-visible"
        style={{
          paddingTop: visualStartPx > 0 ? `${visualStartPx}px` : '2px',
        }}
      >
        <div 
          ref={timelineRef}
          className="relative overflow-visible" 
          style={{ 
            height: `${finalHeight}px`, 
            marginLeft: "3.5rem", 
            marginRight: "0.75rem",
          }}
        >
          {/* Time gutter on the left of the timeline */}
          <div
            className="absolute inset-y-0 left-0 pr-0 text-right text-[13px] leading-tight text-foreground pointer-events-none z-30"
            style={{ width: "3rem", left: "-3.25rem" }}
          >
            {gutterLabels}
          </div>

          <TimelineBar
            bounds={bounds}
            timelineHeight={finalHeight}
            startPx={positionedGroups.length && !sleepMarkers.wakeTimes.length && !sleepMarkers.bedTimes.length
              ? positionedGroups[0].topPx
              : visualStartPx}
            endPx={visualEndPx}
          />
          
          <CurrentTimeIndicator 
            bounds={bounds} 
            isToday={isToday} 
            fillPercentage={currentFillPercent}
            lastTaskEndTime={lastTaskEnd}
            taskGroups={taskGroups}
            positionedGroups={positionedGroups}
            timelineHeight={finalHeight}
            currentTime={currentTimeStr}
            isPastDate={false}
            startOffsetPercent={startPx > 0 && finalHeight > 0 ? (startPx / finalHeight) * 100 : 0}
            visualStartPx={visualStartPx}
            visualEndPx={visualEndPx}
            currentPosPx={currentPosPx}
            pxPerMinute={pxPerMinute}
          />

          {dotNodes}
        {sleepDots}

          {/* Task groups */}
          {positionedGroups.map(({ group, topPx, heightPx }) => (
              <div
                key={group.id}
                className="absolute bg-card border border-border shadow-sm rounded-lg p-2 flex flex-col gap-2 transition-shadow duration-200 hover:shadow-md"
                style={{
                  top: `${topPx}px`,
                  left: "3rem",
                  right: "0.75rem",
                  minHeight: `${heightPx}px`,
                  zIndex: 5,
                }}
              >
                <div className="flex flex-col gap-2 flex-1">
                  {group.tasks.map(task => {
                    const start = task.time ? timeToMinutes(task.time) : 0;
                    const hasNoEndTime = !task.endTime;
                    const end = hasNoEndTime ? start + 30 : timeToMinutes(task.endTime!);
                    const now = currentTime;
                    const currentMinWithSec = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
                    const isOverdue = hasNoEndTime ? currentMinWithSec >= start : currentMinWithSec > end;
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isInGroup={true}
                        isOverdue={isOverdue}
                        onToggle={onToggleTask}
                        onEdit={onUpdateTask ? (t) => onUpdateTask(t.id, t) : undefined}
                        onDelete={onDeleteTask}
                        onToggleSubtask={onToggleSubtask}
                      />
                    );
                  })}
                </div>
              </div>
          ))}

          {/* Free gaps (>=config min) shown just below prior task */}
          {freeGaps.map(gap => (
            <div
              key={gap.id}
              className="absolute text-[12px] z-30 flex items-center gap-2 px-2 py-1 text-muted-foreground pointer-events-auto"
              style={{
                top: `${gap.topPx}px`,
                left: "3rem",
                right: "0.75rem",
                maxWidth: "320px"
              }}
            >
              <span>{gap.displayText}</span>
              {onAddTaskClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 rounded-full text-[11px] border-muted-foreground/40 text-muted-foreground hover:text-foreground"
          onClick={() => onAddTaskClick({
            time: minutesToTime(gap.startTimeMinutes),
            endTime: minutesToTime(gap.endTimeMinutes),
            allDay: false,
          })}
                >
                  Add task
                </Button>
              )}
            </div>
          ))}

          {/* Add another task button - positioned below last task with minimal gap */}
          {onAddTaskClick && positionedGroups.length <= 3 && (
            <div
              className="absolute flex justify-center left-0 right-0 z-10"
              style={{
                top: positionedGroups.length > 0
                  ? positionedGroups[positionedGroups.length - 1].topPx +
                    positionedGroups[positionedGroups.length - 1].heightPx + 12
                  : 0,
              }}
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-full transition-opacity hover:opacity-90"
                onClick={() => onAddTaskClick({ allDay: false })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add another task to build the timeline
              </Button>
            </div>
          )}
              </div>
            </div>
    </div>
  );
}


