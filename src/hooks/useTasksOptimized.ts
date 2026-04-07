import { useMemo, useCallback } from 'react';
import { Task } from '@/types/types';
import { isSameDay } from 'date-fns';

/**
 * Optimized task filtering and computation hook
 * Uses memoization to prevent unnecessary recalculations
 */
export function useTasksOptimized(tasks: Task[], selectedDate: Date) {
  // Memoize tasks for selected date
  const tasksForDate = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      return isSameDay(taskDate, selectedDate);
    });
  }, [tasks, selectedDate]);

  // Memoize countable tasks (excludes system tasks and child tasks)
  const countableTasks = useMemo(() => {
    return tasksForDate.filter(
      t => t.source !== 'water' && 
           t.source !== 'sleep' && 
           t.source !== 'steps' &&
           !t.parentId
    );
  }, [tasksForDate]);

  // Memoize completion stats
  const stats = useMemo(() => {
    const completedCount = countableTasks.filter(t => t.completed).length;
    const totalCount = countableTasks.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const allComplete = totalCount > 0 && completedCount === totalCount;

    return {
      completedCount,
      totalCount,
      percentage,
      allComplete,
    };
  }, [countableTasks]);

  // Memoize all-day tasks
  const allDayTasks = useMemo(() => {
    return tasksForDate.filter(t => t.allDay || (!t.time && !t.allDay));
  }, [tasksForDate]);

  // Memoize timed tasks
  const timedTasks = useMemo(() => {
    return tasksForDate.filter(t => t.time && !t.allDay);
  }, [tasksForDate]);

  return {
    tasksForDate,
    countableTasks,
    stats,
    allDayTasks,
    timedTasks,
  };
}

/**
 * Optimized task actions hook with memoized callbacks
 */
export function useTaskActions(
  tasks: Task[],
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
) {
  const handleToggleTask = useCallback(
    (id: string) => {
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === id 
            ? { 
                ...t, 
                completed: !t.completed,
                completedAt: !t.completed ? new Date().toISOString() : undefined
              } 
            : t
        )
      );
    },
    [setTasks]
  );

  const handleDeleteTask = useCallback(
    (id: string, deleteFuture?: boolean) => {
      if (!deleteFuture) {
        setTasks(prevTasks => prevTasks.filter(t => t.id !== id));
      } else {
        const taskToDelete = tasks.find(t => t.id === id);
        if (!taskToDelete) return;
        
        const taskDate = taskToDelete.dueDate 
          ? (taskToDelete.dueDate instanceof Date ? taskToDelete.dueDate : new Date(taskToDelete.dueDate))
          : new Date();
        const taskDateStr = taskDate.toISOString().split('T')[0];
        
        setTasks(prevTasks => prevTasks.filter(t => {
          if (t.id === id) return false;
          
          if (taskToDelete.repeat && t.repeat === taskToDelete.repeat && 
              t.title === taskToDelete.title && t.time === taskToDelete.time) {
            if (t.dueDate && new Date(t.dueDate).toISOString().split('T')[0] < taskDateStr) return true;
            return false;
          }
          
          if (!taskToDelete.repeat && t.title === taskToDelete.title && t.time === taskToDelete.time) {
            if (t.dueDate && new Date(t.dueDate).toISOString().split('T')[0] < taskDateStr) return true;
            return false;
          }
          
          return true;
        }));
      }
    },
    [tasks, setTasks]
  );

  const handleAddTask = useCallback(
    (task: Omit<Task, 'id'>) => {
      const newTask = { 
        ...task, 
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
    },
    [setTasks]
  );

  const handleUpdateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      );
    },
    [setTasks]
  );

  return {
    handleToggleTask,
    handleDeleteTask,
    handleAddTask,
    handleUpdateTask,
  };
}

