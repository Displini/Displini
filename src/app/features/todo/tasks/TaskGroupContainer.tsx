import React from 'react';
import { Task } from '@/app/types/types';
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
  // Calculate height in pixels based on timeline height
  const heightPx = group.heightPercent > 0 
    ? (group.heightPercent / 100) * timelineHeight 
    : 'auto';
  
  // Calculate top position - position container at the task start time
  const containerTop = `${group.startPercent}%`;
  
  // Use actual task height instead of normalized height to prevent extension
  const actualHeightPx = group.heightPercent > 0 && typeof heightPx === 'number'
    ? heightPx
    : 'auto';
  
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
        height: typeof actualHeightPx === 'number' && actualHeightPx > 0 ? `${actualHeightPx}px` : 'auto',
        minHeight: group.heightPercent > 0 ? '60px' : 'auto',
        overflow: 'hidden', // Prevent content from spilling out
        borderRadius: group.tasks.length > 1 ? '16px' : '8px',
        zIndex: 30,
      }}
    >
      {/* Time label - show inside container */}
      {group.tasks.length > 0 && (
        <div className="text-xs text-muted-foreground px-2 pb-1 flex-shrink-0">
          {group.startTime}
          {group.endTime && group.endTime !== group.startTime && ` - ${group.endTime}`}
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

