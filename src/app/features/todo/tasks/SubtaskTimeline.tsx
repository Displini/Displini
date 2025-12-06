import React from 'react';
import { Subtask } from '@/app/types/types';
import { CheckCircle2, Circle } from 'lucide-react';

interface SubtaskTimelineProps {
  subtasks: Subtask[];
  onToggleSubtask: (id: string) => void;
}

export function SubtaskTimeline({
  subtasks,
  onToggleSubtask,
}: SubtaskTimelineProps) {
  return (
    <div className="space-y-2 pl-8 border-l-2 border-muted relative">
      {subtasks.map((subtask, index) => (
        <div
          key={subtask.id}
          className="flex items-center gap-2 py-1 relative"
        >
          {/* Connection line */}
          {index < subtasks.length - 1 && (
            <div
              className="absolute left-4 w-0.5 h-6 bg-muted"
              style={{ marginTop: '24px' }}
            />
          )}
          
          {/* Subtask checkbox */}
          <button
            onClick={() => onToggleSubtask(subtask.id)}
            className="flex-shrink-0"
            aria-label={subtask.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {subtask.completed ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          {/* Subtask text */}
          <span
            className={`text-sm ${
              subtask.completed
                ? 'line-through text-muted-foreground'
                : 'text-foreground'
            }`}
          >
            {subtask.text}
          </span>
        </div>
      ))}
    </div>
  );
}

