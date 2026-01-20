import React, { useState, useCallback, useRef } from 'react';
import { Task } from '@/types/types';
import { timeToMinutes, minutesToTime, snapTo15Minutes } from '../utils/timeHelpers';
import { TimelineBounds } from '../utils/timelineCalculations';

interface TaskDragHandlerProps {
  task: Task;
  timelineBounds: TimelineBounds;
  timelineHeight: number;
  timelineRef: React.RefObject<HTMLDivElement>;
  onDragStart?: (task: Task) => void;
  onDragEnd?: (task: Task, newTime: string) => void;
  onDragMove?: (task: Task, newTime: string) => void;
  children: (props: DragHandlerProps) => React.ReactNode;
}

interface DragHandlerProps {
  isDragging: boolean;
  dragPreviewTime: string | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

export function TaskDragHandler({
  task,
  timelineBounds,
  timelineHeight,
  timelineRef,
  onDragStart,
  onDragEnd,
  onDragMove,
  children,
}: TaskDragHandlerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreviewTime, setDragPreviewTime] = useState<string | null>(null);
  const dragStartY = useRef(0);
  const originalTimeMinutes = useRef(0);

  const calculateTimeFromY = useCallback((clientY: number): string => {
    if (!timelineRef.current) return task.time || '00:00';
    
    const rect = timelineRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const percent = (y / rect.height) * 100;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    
    const minutes = timelineBounds.startMinutes + 
      (clampedPercent / 100) * timelineBounds.rangeMinutes;
    
    // Snap to 15-minute increments
    const snappedMinutes = snapTo15Minutes(minutes);
    
    return minutesToTime(snappedMinutes);
  }, [timelineBounds, timelineRef, task.time]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!task.time) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    dragStartY.current = e.clientY;
    originalTimeMinutes.current = timeToMinutes(task.time);
    setIsDragging(true);
    setDragPreviewTime(task.time);
    
    onDragStart?.(task);
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newTime = calculateTimeFromY(e.clientY);
      setDragPreviewTime(newTime);
      onDragMove?.(task, newTime);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newTime = calculateTimeFromY(e.clientY);
      const newTimeMinutes = timeToMinutes(newTime);
      
      // Only update if moved at least 15 minutes
      if (Math.abs(newTimeMinutes - originalTimeMinutes.current) >= 15) {
        onDragEnd?.(task, newTime);
      }
      
      setIsDragging(false);
      setDragPreviewTime(null);
      document.body.style.userSelect = '';
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [task, isDragging, calculateTimeFromY, onDragStart, onDragMove, onDragEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!task.time) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    dragStartY.current = touch.clientY;
    originalTimeMinutes.current = timeToMinutes(task.time);
    setIsDragging(true);
    setDragPreviewTime(task.time);
    
    onDragStart?.(task);
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling
      
      const touch = e.touches[0];
      const newTime = calculateTimeFromY(touch.clientY);
      setDragPreviewTime(newTime);
      onDragMove?.(task, newTime);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const touch = e.changedTouches[0];
      const newTime = calculateTimeFromY(touch.clientY);
      const newTimeMinutes = timeToMinutes(newTime);
      
      if (Math.abs(newTimeMinutes - originalTimeMinutes.current) >= 15) {
        onDragEnd?.(task, newTime);
      }
      
      setIsDragging(false);
      setDragPreviewTime(null);
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [task, isDragging, calculateTimeFromY, onDragStart, onDragMove, onDragEnd]);

  return (
    <>
      {children({
        isDragging,
        dragPreviewTime,
        onMouseDown: handleMouseDown,
        onTouchStart: handleTouchStart,
      })}
      {isDragging && dragPreviewTime && (
        <div
          className="fixed pointer-events-none z-50 bg-primary text-primary-foreground px-2 py-1 rounded text-sm"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)',
          }}
        >
          {dragPreviewTime}
        </div>
      )}
    </>
  );
}

