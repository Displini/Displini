import React from 'react';
import { Task } from '@/types/types';
import { TaskGroup } from '../utils/taskGrouping';
import { TaskCard } from './TaskCard';

interface TaskGroupContainerProps {
  group: TaskGroup;
  timelineHeight: number;
  onToggleTask: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<any>) => void;
  onDeleteTask?: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  getSourceBadge?: (source: Task["source"]) => { label: string; className: string } | null;
  onSourceShortcut?: (source: Task["source"]) => void;
  onDragStart?: (task: Task, e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: (task: Task) => boolean;
  onEditTask?: (task: Task) => void;
}

export function TaskGroupContainer({
  group,
  timelineHeight,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onToggleSubtask,
  getSourceBadge,
  onSourceShortcut,
  onDragStart,
  isDragging,
  onEditTask,
}: TaskGroupContainerProps) {
  // Check if this is a task without endTime (displayDuration is 0 or very small)
  const hasNoEndTime = group.tasks.some(t => !t.endTime);
  const hasGap = hasNoEndTime && group.endPercent > group.startPercent;
  
  // Calculate height in pixels based on timeline height
  // For tasks without endTime with gap, use gap height to create visible separation
  let heightPx: number | string;
  if (hasGap) {
    // Task without endTime but has calculated gap - use the gap height to enforce boundary
    const gapHeightPx = ((group.endPercent - group.startPercent) / 100) * timelineHeight;
    // Use the gap height, but ensure it's at least enough for content
    heightPx = Math.max(gapHeightPx, 80); // Minimum 80px for content visibility
  } else if (hasNoEndTime) {
    // Task without endTime and no gap - use fit-content
    heightPx = 'fit-content';
  } else {
    // Normal task with endTime - use calculated height
    heightPx = group.heightPercent > 0 
      ? (group.heightPercent / 100) * timelineHeight 
      : 'auto';
  }
  
  // Calculate top position - position container at the task start time
  const containerTop = `${group.startPercent}%`;
  
  // Use calculated height
  const actualHeightPx = typeof heightPx === 'number' && heightPx > 0
    ? heightPx
    : heightPx;
  
  // Handle click on entire container
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only toggle if clicking directly on container, not on buttons/links inside
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target !== e.currentTarget) {
      return;
    }
    // Toggle first task in group
    if (group.tasks.length > 0) {
      onToggleTask(group.tasks[0].id);
    }
  };

  return (
    <div
      className="absolute bg-card border border-border shadow-md rounded-lg p-2 flex flex-col gap-2 cursor-pointer"
      onClick={handleContainerClick}
      style={{
        top: containerTop,
        left: '6rem', // Moved right to make room for timeline bar, current time indicator, and dots
        right: '1rem',
        width: 'auto',
        // For tasks without endTime with gap, use calculated height to enforce gap boundary
        height: typeof actualHeightPx === 'number' && actualHeightPx > 0 
          ? `${actualHeightPx}px` 
          : actualHeightPx,
        minHeight: hasGap
          ? '80px' // Minimum for content when gap exists
          : (hasNoEndTime ? 'fit-content' : (group.heightPercent > 0 ? '60px' : 'auto')),
        // Enforce gap: container cannot extend beyond endPercent - this creates the visible gap
        maxHeight: hasGap
          ? `${((group.endPercent - group.startPercent) / 100) * timelineHeight}px`
          : 'none',
        overflow: 'hidden', // Prevent content from spilling out
        borderRadius: group.tasks.length > 1 ? '16px' : '8px',
        zIndex: 30,
      }}
    >
      {/* Time label - show inside container */}
      {group.tasks.length > 0 && (
        <div className="text-xs text-muted-foreground px-2 pb-1 flex-shrink-0">
          {group.startTime}
          {/* Only show end time if at least one task originally had an endTime */}
          {group.endTime && 
           group.endTime !== group.startTime && 
           group.tasks.some(t => t.endTime) && 
           ` - ${group.endTime}`}
        </div>
      )}
      
      {/* Stacked task cards - use flex with proper overflow handling */}
      <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
        {group.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isInGroup={true}
            onToggle={onToggleTask}
            onEdit={onEditTask || ((task) => onUpdateTask?.(task.id, task))}
            onDelete={onDeleteTask}
            onToggleSubtask={onToggleSubtask}
            getSourceBadge={getSourceBadge}
            onSourceShortcut={onSourceShortcut}
            onDragStart={onDragStart}
            isDragging={isDragging?.(task) || false}
          />
        ))}
      </div>
    </div>
  );
}

