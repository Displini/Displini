import React, { useState } from 'react';
import { Task } from '@/app/types/types';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, ExternalLink, Pencil } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { SubtaskTimeline } from './SubtaskTimeline';

interface TaskCardProps {
  task: Task;
  isInGroup?: boolean;
  onToggle: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  getSourceBadge?: (source: Task["source"]) => { label: string; className: string } | null;
  onSourceShortcut?: (source: Task["source"]) => void;
  onDragStart?: (task: Task, e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  isInGroup = false,
  onToggle,
  onEdit,
  onDelete,
  onToggleSubtask,
  getSourceBadge,
  onSourceShortcut,
  onDragStart,
  isDragging = false,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  
  // Check if task is draggable
  const isDraggable = !task.allDay && task.time && 
    task.source !== 'water' && 
    task.source !== 'medication' && 
    task.source !== 'steps' && 
    task.source !== 'sleep' &&
    task.source !== 'work' &&
    task.source !== 'school' &&
    task.source !== 'workout' &&
    task.source !== 'food' &&
    task.source !== 'winddown' &&
    task.source !== 'startup' &&
    !task.isContainer;
  
  // Handle click to toggle completion (but allow drag and buttons)
  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    // Only toggle if task is not draggable, or if draggable but not currently dragging
    if (!isDraggable || !isDragging) {
      onToggle(task.id);
    }
  };

  return (
    <div
      className={`${
        isInGroup 
          ? '' // No styling when in group container - container provides the card styling
          : 'bg-card border border-border shadow-md rounded-lg p-4' // Full card styling when standalone
      } ${task.completed ? 'opacity-60' : ''} ${isDragging ? 'opacity-70' : ''}`}
      onClick={handleClick}
      onMouseDown={isDraggable && onDragStart ? (e) => {
        e.stopPropagation();
        onDragStart(task, e);
      } : undefined}
      onTouchStart={isDraggable && onDragStart ? (e) => {
        e.stopPropagation();
        onDragStart(task, e);
      } : undefined}
      style={{
        cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      }}
    >
      {/* Main task content */}
      <div className="flex items-center gap-3 w-full">
        {/* Task emoji - in colored circle in middle left */}
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: task.completed 
                ? 'hsl(var(--primary))' 
                : 'hsl(var(--primary) / 0.2)',
              border: `2px solid ${task.completed ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'}`,
            }}
          >
            <span className="text-2xl">{task.emoji || '📝'}</span>
          </div>
        </div>
        
        {/* Task details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold ${
                task.completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {task.title}
            </h3>
            
            {/* Non-editable tasks: Show shortcut icon instead of edit */}
            {(() => {
              const nonEditableSources = ['water', 'medication', 'sleep', 'office', 'steps'];
              const isNonEditable = task.source && nonEditableSources.includes(task.source);
              
              if (isNonEditable && onSourceShortcut && task.source) {
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSourceShortcut(task.source!);
                    }}
                    className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors ml-auto"
                    aria-label={`Open ${task.source} settings`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                );
              }
              
              // Editable tasks: Show edit button
              if (onEdit && !isNonEditable) {
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors ml-auto"
                    aria-label="Edit task"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                );
              }
              
              return null;
            })()}
          </div>
          
          {/* Time - only show if NOT in group (group container shows time) */}
          {!isInGroup && task.time && (
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.time}
              {task.endTime && ` - ${task.endTime}`}
            </div>
          )}
          
          {/* Source badge */}
          {getSourceBadge && task.source && (() => {
            const badge = getSourceBadge(task.source);
            if (!badge) return null;
            return (
              <Badge variant="secondary" className={`${badge.className} text-xs mt-1`}>
                {badge.label}
              </Badge>
            );
          })()}
          
          {/* Subtask summary */}
          {hasSubtasks && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>
                  {completedSubtasks}/{totalSubtasks} subtasks
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Expanded subtasks */}
      {hasSubtasks && isExpanded && onToggleSubtask && (
        <div className="mt-4">
          <SubtaskTimeline
            subtasks={task.subtasks!}
            onToggleSubtask={(subtaskId) => {
              onToggleSubtask(task.id, subtaskId);
            }}
          />
        </div>
      )}
    </div>
  );
}

