import { useState, useEffect, useRef, useMemo, useCallback, memo, lazy, Suspense } from "react";
import { SEO } from "@/components/general/SEO";
import LiquidTimeline from "@/components/features/todo/LiquidTimeline";
import AllDayTasks from "@/components/features/todo/AllDayTasks";
import AddTask from "@/components/features/todo/AddTask";
import { Task } from "@/types/types";
import WaterAmountDialog from "@/components/features/reminders/WaterAmountDialog";

// Lazy load heavy dialog components
const MonthlyStatsModal = lazy(() => import("@/components/general/MonthlyStatsModal"));
const Settings = lazy(() => import("@/components/general/Settings"));
const Work = lazy(() => import("@/components/features/todo/Work"));
const Student = lazy(() => import("@/components/features/todo/Student"));
const JournalReflection = lazy(() => import("@/components/features/todo/JournalReflection"));

import { ConfettiEffect } from "@/components/general/ConfettiEffect";
import { EmojiPicker } from "@/components/general/EmojiPicker";
import { DateCarousel } from "@/components/general/DateCarousel";
import CircularProgress from "@/components/general/CircularProgress";
import { QuoteOfTheDay, getQuoteSettings } from "@/components/features/todo/QuoteOfTheDay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UniversalDialog, PageHeader, FeatureDialogs, FeaturesSidebar } from "@/components/general";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Menu } from "lucide-react";
import { format, addDays, startOfWeek, isToday, isSameDay, subDays } from "date-fns";
import { useOptimizedLocalStorage } from "@/hooks/useLocalStorage";
import { useTasksOptimized } from "@/hooks/useTasksOptimized";

export default function Todo() {
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [waterDialogOpen, setWaterDialogOpen] = useState(false);
  const [pendingWaterTask, setPendingWaterTask] = useState<Task | null>(null);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [addTaskPrefill, setAddTaskPrefill] = useState<{ time?: string; endTime?: string; allDay?: boolean } | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const hasShownConfettiRef = useRef<string>(''); // Track date-hash of completed tasks
  const isInitialLoadRef = useRef(true); // Track if this is the initial page load
  const [editingAllDayTask, setEditingAllDayTask] = useState<Task | null>(null);
  const [isOfficeDialogOpen, setIsOfficeDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [quoteSettings, setQuoteSettings] = useState(getQuoteSettings());
  
  // Listen for openAddTask event from bottom nav
  useEffect(() => {
    const handleOpenAddTask = () => {
      setAddTaskDialogOpen(true);
    };
    
    const handleOpenStudentDialog = () => {
      setIsStudentDialogOpen(true);
    };
    
    const handleOpenWaterIntake = () => {
      window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'water' } }));
    };
    
    const handleOpenMedication = () => {
      window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'medication' } }));
    };
    
    const handleOpenSleepSchedule = () => {
      window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'sleep' } }));
    };
    
    const handleOpenMenstrualCycle = () => {
      window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'menstrual' } }));
    };
    
    const handleOpenWork = () => {
      window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'work' } }));
    };
    
    const handleOpenSchool = () => {
      window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'school' } }));
    };
    
    const handleOpenStandSitReminder = (e: any) => {
      const taskId = e.detail?.taskId;
      // TODO: Open stand/sit reminder dialog component
      // For now, log the taskId - component to be implemented
      console.log('Open Stand/Sit Reminder for task:', taskId);
    };
    
    const handleOpenEyeBreakReminder = (e: any) => {
      const taskId = e.detail?.taskId;
      // TODO: Open eye break reminder dialog component
      // For now, log the taskId - component to be implemented
      console.log('Open Eye Break Reminder for task:', taskId);
    };
    
    const handleOpenPomodoro = (e: any) => {
      const taskId = e.detail?.taskId;
      // TODO: Open pomodoro timer dialog component
      // For now, log the taskId - component to be implemented
      console.log('Open Pomodoro Timer for task:', taskId);
    };
    
    window.addEventListener('openAddTask', handleOpenAddTask);
    window.addEventListener('openStudentDialog', handleOpenStudentDialog);
    window.addEventListener('openWaterIntake', handleOpenWaterIntake);
    window.addEventListener('openMedication', handleOpenMedication);
    window.addEventListener('openSleepSchedule', handleOpenSleepSchedule);
    window.addEventListener('openMenstrualCycle', handleOpenMenstrualCycle);
    window.addEventListener('openWork', handleOpenWork);
    window.addEventListener('openSchool', handleOpenSchool);
    window.addEventListener('openStandSitReminder', handleOpenStandSitReminder);
    window.addEventListener('openEyeBreakReminder', handleOpenEyeBreakReminder);
    window.addEventListener('openPomodoro', handleOpenPomodoro);
    
    return () => {
      window.removeEventListener('openAddTask', handleOpenAddTask);
      window.removeEventListener('openStudentDialog', handleOpenStudentDialog);
      window.removeEventListener('openWaterIntake', handleOpenWaterIntake);
      window.removeEventListener('openMedication', handleOpenMedication);
      window.removeEventListener('openSleepSchedule', handleOpenSleepSchedule);
      window.removeEventListener('openMenstrualCycle', handleOpenMenstrualCycle);
      window.removeEventListener('openWork', handleOpenWork);
      window.removeEventListener('openSchool', handleOpenSchool);
      window.removeEventListener('openStandSitReminder', handleOpenStandSitReminder);
      window.removeEventListener('openEyeBreakReminder', handleOpenEyeBreakReminder);
      window.removeEventListener('openPomodoro', handleOpenPomodoro);
    };
  }, []);

  // Listen for openJournal event from winddown tasks
  useEffect(() => {
    const handleOpenJournal = (e: any) => {
      setIsJournalDialogOpen(true);
      // You could pass the prompt detail to the journal if needed
    };
    window.addEventListener('openJournal', handleOpenJournal);
    return () => window.removeEventListener('openJournal', handleOpenJournal);
  }, []);

  // Listen for openJournalWrite event from journal tasks in timeline
  useEffect(() => {
    const handleOpenJournalWrite = (e: any) => {
      setIsJournalDialogOpen(true);
      // Dispatch event to JournalFeature to open write dialog
      window.dispatchEvent(new CustomEvent('openJournal', { detail: e.detail }));
    };
    window.addEventListener('openJournalWrite', handleOpenJournalWrite);
    return () => window.removeEventListener('openJournalWrite', handleOpenJournalWrite);
  }, []);


  // Listen for quote settings changes
  useEffect(() => {
    const handleQuoteSettingsChange = () => {
      setQuoteSettings(getQuoteSettings());
    };
    window.addEventListener('quoteSettingsChanged', handleQuoteSettingsChange);
    return () => window.removeEventListener('quoteSettingsChanged', handleQuoteSettingsChange);
  }, []);
  
  // Debug: log triggerConfetti changes
  useEffect(() => {
    // Confetti state changed
  }, [triggerConfetti]);

  // Use optimized localStorage hook with caching and batching
  const [tasks, setTasks] = useOptimizedLocalStorage<Task[]>("todos", [], {
    deserialize: (value) => {
      const parsed = JSON.parse(value);
      return parsed.map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
      }));
    },
    serialize: (value) => JSON.stringify(value),
  });

  // Seed quick test tasks once if none exist
  useEffect(() => {
    if (tasks.length === 0 && !localStorage.getItem("seeded_test_tasks")) {
      const seed: Task[] = [
        { id: "seed-06-no-end", title: "task with no endtime", time: "06:00", completed: false, source: "manual", emoji: "📝" },
        { id: "seed-0601-0602", title: "task one minute", time: "06:01", endTime: "06:02", completed: false, source: "manual", emoji: "🚗" },
        { id: "seed-0700-0800", title: "task one hour", time: "07:00", endTime: "08:00", completed: false, source: "manual" },
        { id: "seed-0800-1000", title: "task two hours", time: "08:00", endTime: "10:00", completed: false, source: "manual" },
        { id: "seed-1000-1300", title: "task three hours", time: "10:00", endTime: "13:00", completed: false, source: "manual" },
      ];
      setTasks(seed);
      localStorage.setItem("seeded_test_tasks", "1");
    }
  }, [tasks, setTasks]);

  // Listen for external updates to todos (from Food, Sport, etc.)
  useEffect(() => {
    const handleTodosUpdated = (e: Event) => {
      // Reload tasks from localStorage when external sources update
      const saved = localStorage.getItem("todos");
      if (saved) {
        const parsed = JSON.parse(saved);
        const tasksWithDates = parsed.map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        }));
        setTasks(tasksWithDates);
      }
    };

    window.addEventListener('todosUpdated', handleTodosUpdated);
    return () => window.removeEventListener('todosUpdated', handleTodosUpdated);
  }, []);

  // Listen for menstrual data updates
  useEffect(() => {
    const handleMenstrualUpdate = () => {
      // Reload tasks to get updated menstrual predictions
      const saved = localStorage.getItem("todos");
      if (saved) {
        const parsed = JSON.parse(saved);
        const tasksWithDates = parsed.map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        }));
        setTasks(tasksWithDates);
      }
    };

    window.addEventListener('menstrualDataUpdated', handleMenstrualUpdate);
    return () => window.removeEventListener('menstrualDataUpdated', handleMenstrualUpdate);
  }, []);

  // Listen for startup settings changes
  useEffect(() => {
    const checkStartupSettings = () => {
      const startupSettings = localStorage.getItem('startupSettings');
      if (startupSettings) {
      }
    };
    
    checkStartupSettings();
    
    // Check on storage events
    window.addEventListener('storage', checkStartupSettings);
    return () => window.removeEventListener('storage', checkStartupSettings);
  }, []);

  // Sync work tasks on page load if work is set up
  useEffect(() => {
    const syncWorkTasksOnLoad = () => {
      const workSettings = JSON.parse(localStorage.getItem('work_settings') || '{}');
      if (!workSettings.isSetupComplete || !workSettings.workSchedule) return;

      const todos = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTodos = todos.filter((t: any) => t.source !== 'work');
      
      const today = new Date();
      for (let i = -30; i < 335; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        if (workSettings.workSchedule.workDays && workSettings.workSchedule.workDays.includes(dayName)) {
          const dateStr = date.toISOString().split('T')[0];
          const existingWorkTask = filteredTodos.find((t: any) => t.id === `work-${dateStr}`);
          if (!existingWorkTask && workSettings.workSchedule.startTime && workSettings.workSchedule.endTime) {
            const workTask = {
              id: `work-${dateStr}`,
              title: 'Work',
              emoji: '💼',
              time: workSettings.workSchedule.startTime,
              endTime: workSettings.workSchedule.endTime,
              completed: false,
              source: 'work' as const,
              dueDate: dateStr,
              color: workSettings.workSchedule.color || '#3b82f6',
              breakTimes: workSettings.workSchedule.breakTimes || [],
            };
            filteredTodos.push(workTask);
          }
        }
      }
      
      localStorage.setItem('todos', JSON.stringify(filteredTodos));
      window.dispatchEvent(new Event('todosUpdated'));
    };

    syncWorkTasksOnLoad();
    
    // Also sync when date changes to ensure tasks are up to date
    const handleDateChange = () => {
      syncWorkTasksOnLoad();
    };
    window.addEventListener('dateChanged', handleDateChange);
    return () => window.removeEventListener('dateChanged', handleDateChange);
  }, [selectedDate]);

  // Sync school tasks on page load if school schedules are set up
  useEffect(() => {
    const syncSchoolTasksOnLoad = () => {
      const schoolSchedules = JSON.parse(localStorage.getItem('school_schedules') || '[]');
      if (!schoolSchedules || schoolSchedules.length === 0) return;

      const todos = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTodos = todos.filter((t: any) => t.source !== 'school' && !t.source?.startsWith('school-'));
      
      const today = new Date();
      for (let i = -30; i < 335; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        schoolSchedules.forEach((schedule: any) => {
          if (schedule.isActive && schedule.days && schedule.days.includes(dayName)) {
            const dateStr = date.toISOString().split('T')[0];
            const taskId = `school-${schedule.id}-${dateStr}`;
            const existingSchoolTask = filteredTodos.find((t: any) => t.id === taskId);
            if (!existingSchoolTask && schedule.startTime && schedule.endTime) {
              const schoolTask = {
                id: taskId,
                title: schedule.name || 'School',
                emoji: schedule.emoji || '🎓',
                time: schedule.startTime,
                endTime: schedule.endTime,
                completed: false,
                source: 'school' as const,
                dueDate: dateStr,
                color: schedule.color || '#FFD400',
              };
              filteredTodos.push(schoolTask);
            }
          }
        });
      }
      
      localStorage.setItem('todos', JSON.stringify(filteredTodos));
      window.dispatchEvent(new Event('todosUpdated'));
    };

    syncSchoolTasksOnLoad();
    
    // Also sync when date changes
    const handleDateChange = () => {
      syncSchoolTasksOnLoad();
    };
    window.addEventListener('dateChanged', handleDateChange);
    window.addEventListener('schoolSchedulesUpdated', syncSchoolTasksOnLoad);
    return () => {
      window.removeEventListener('dateChanged', handleDateChange);
      window.removeEventListener('schoolSchedulesUpdated', syncSchoolTasksOnLoad);
    };
  }, [selectedDate]);

  // Check for confetti trigger whenever tasks change (NOT on date change)
  useEffect(() => {
    // Skip confetti check on initial page load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    
    const confettiEnabled = localStorage.getItem("confettiEnabled") !== "false";
    
    if (!confettiEnabled) {
      return;
    }

    // Only count actual task containers, not system tasks or child tasks
    const tasksForDate = tasks.filter(t => {
      if (!t.dueDate) return false;
      const taskDate = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
      const isSameDateResult = isSameDay(taskDate, selectedDate);
      if (!isSameDateResult) return false;
      
      // Exclude system tasks and child tasks from confetti calculation
      // Don't exclude medication - it's included in countableTasks and should trigger confetti
      if (t.source === 'water') return false;
      if (t.source === 'sleep') return false;
      if (t.source === 'steps') return false;
      if (t.parentId) return false; // Exclude child tasks
      
      return true;
    });

    const completedTasks = tasksForDate.filter(t => t.completed);
    const allTasksComplete = tasksForDate.length > 0 && tasksForDate.every(t => t.completed);
    
    // Create a unique hash for this completion state (date + task IDs)
    const completionHash = allTasksComplete 
      ? `${selectedDate.toISOString().split('T')[0]}-${tasksForDate.map(t => t.id).sort().join('-')}`
      : '';

    if (allTasksComplete && completionHash !== hasShownConfettiRef.current) {
      hasShownConfettiRef.current = completionHash;
      setTriggerConfetti(true);
    } else if (!allTasksComplete) {
      // Reset when tasks are not complete
      if (triggerConfetti) {
        setTriggerConfetti(false);
      }
      hasShownConfettiRef.current = '';
    }
  }, [tasks, triggerConfetti, selectedDate]); // Include selectedDate to check correct date

  const handleToggleTask = useCallback((id: string) => {
    const task = tasks.find((t) => t.id === id);
    const isCompleting = !task?.completed;
    
    // Handle water reminders specially - show amount dialog
    if (task && task.source === "water" && isCompleting) {
      setPendingWaterTask(task);
      setWaterDialogOpen(true);
      return;
    }
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map((t) => 
        t.id === id 
          ? { 
              ...t, 
              completed: !t.completed,
              completedAt: isCompleting ? new Date().toISOString() : undefined
            } 
          : t
      );
      
      return updatedTasks;
    });
    
    // Delete reminder when task from reminder is completed
    if (task && task.source === "reminder" && task.reminderId && isCompleting) {
      const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
      const updatedReminders = reminders.filter((r: any) => r.id !== task.reminderId);
      localStorage.setItem('reminders', JSON.stringify(updatedReminders));
      window.dispatchEvent(new Event('remindersUpdated'));
    }

    // Handle medication completion
    if (task && task.source === "medication" && isCompleting) {
      const medications = JSON.parse(localStorage.getItem("medications") || "[]");
      const medicationIndex = medications.findIndex((m: any) => m.id === task.medicationId);
      if (medicationIndex !== -1) {
        medications[medicationIndex].lastTaken = new Date().toISOString();
        localStorage.setItem("medications", JSON.stringify(medications));

        window.dispatchEvent(
          new CustomEvent("medication-completed", {
            detail: { medicationId: task.medicationId },
          })
        );
      }
    }
    
    // Handle workout completion - add to recent workouts
    if (task && task.source === "workout" && isCompleting) {
      const completedWorkouts = JSON.parse(localStorage.getItem("completedWorkouts") || "[]");
      const workoutData = {
        id: `completed-${task.id}`,
        name: task.title.replace(/\s*\(\d+min\)$/, ''), // Remove duration from title
        emoji: task.emoji || "🏃",
        duration: parseInt(task.title.match(/\((\d+)min\)/)?.[1] || "30"),
        type: "completed",
        date: new Date().toISOString(),
      };
      completedWorkouts.unshift(workoutData);
      // Keep only last 10 completed workouts
      if (completedWorkouts.length > 10) completedWorkouts.length = 10;
      localStorage.setItem("completedWorkouts", JSON.stringify(completedWorkouts));
    }
    
    // Handle food task completion - move scheduled meal to consumed
    if (task && task.source === "food" && isCompleting && (task as any).mealId) {
      const meals = JSON.parse(localStorage.getItem("meals") || "[]");
      const scheduledMeal = meals.find((m: any) => m.id === (task as any).mealId);
      
      if (scheduledMeal && scheduledMeal.schedule) {
        // Create consumed meal from scheduled meal
        const consumedMeal = {
          ...scheduledMeal,
          id: Date.now().toString(),
          date: selectedDate.toISOString().split('T')[0], // Use selectedDate instead of today
          schedule: undefined,
        };
        meals.push(consumedMeal);
        localStorage.setItem("meals", JSON.stringify(meals));
        window.dispatchEvent(new Event("mealsUpdated"));
      }
    }
  }, [tasks, selectedDate, setTasks]);

  const handleDeleteTask = useCallback((id: string, deleteFuture?: boolean) => {
    if (!deleteFuture) {
      // Delete only this specific task
      setTasks(prevTasks => prevTasks.filter((t) => t.id !== id));
    } else {
      // Delete this task and all future instances
      const taskToDelete = tasks.find(t => t.id === id);
      if (!taskToDelete) return;
      
      const taskDate = taskToDelete.dueDate 
        ? (taskToDelete.dueDate instanceof Date ? taskToDelete.dueDate : new Date(taskToDelete.dueDate))
        : new Date();
      const taskDateStr = taskDate.toISOString().split('T')[0];
      
      setTasks(tasks.filter(t => {
        // Keep if it's the same task ID (we'll delete it)
        if (t.id === id) return false;
        
        // For recurring tasks with repeat field, delete all instances with same title, time, and repeat pattern
        if (taskToDelete.repeat && t.repeat === taskToDelete.repeat && t.title === taskToDelete.title && t.time === taskToDelete.time) {
          // Keep if it's before the task being deleted
          if (t.dueDate && new Date(t.dueDate).toISOString().split('T')[0] < taskDateStr) return true;
          // Delete this task and future ones
          return false;
        }
        
        // For non-recurring tasks, check title and time match
        if (!taskToDelete.repeat && t.title === taskToDelete.title && t.time === taskToDelete.time) {
          // Keep if it's before the task being deleted
          if (t.dueDate && new Date(t.dueDate).toISOString().split('T')[0] < taskDateStr) return true;
          // Delete this task and future ones
          return false;
        }
        
        // Keep all other tasks
        return true;
      }));
    }
  }, [tasks, setTasks]);

  const handleAddTask = useCallback((task: Omit<Task, "id">) => {
    const newTask = { ...task, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, newTask];
      
      // Check if user has scheduled many tasks for the selected date
      const tasksForDate = updatedTasks.filter(t => {
        if (t.dueDate) {
          return isSameDay(new Date(t.dueDate), selectedDate);
        }
        return false;
      });
      
      // Break reminder removed per user request
      
      return updatedTasks;
    });
  }, [selectedDate, setTasks]);

  const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id 
          ? { ...task, ...updates }
          : task
      )
    );
  }, [setTasks]);

  const handleWaterAmountConfirm = useCallback((amount: number) => {
    // Add water entry to water tracker
    const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
    const unit = waterSettings.unit || 'ml';
    
    const now = new Date();
    const waterEntries = JSON.parse(localStorage.getItem('water_entries') || '[]');
    
    // Use the reminder time if available, otherwise use current time
    const reminderTime = pendingWaterTask?.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const newEntry = {
      id: Date.now().toString(),
      amount,
      unit,
      time: reminderTime, // Use reminder time
      date: selectedDate.toISOString().split('T')[0], // Use selected date, not today
    };
    
    waterEntries.unshift(newEntry);
    localStorage.setItem('water_entries', JSON.stringify(waterEntries));
    
    // Fire event to update timeline
    window.dispatchEvent(new Event('waterEntryAdded'));
    window.dispatchEvent(new Event('todosUpdated'));

    // Note: Water entries don't trigger confetti - only regular tasks in the counter do

    // Close dialog
    setWaterDialogOpen(false);
    setPendingWaterTask(null);
  }, [selectedDate]);

  const handleWaterReminderClick = useCallback((time: string) => {
    setPendingWaterTask({ 
      id: `water-reminder-${time}`, 
      title: `Drink water at ${time}`,
      source: "water" as const,
      completed: false,
      time: time, // Store the reminder time
    } as Task);
    setWaterDialogOpen(true);
  }, []);

  const handleAddTaskFromTimeline = useCallback((payload: string | { time?: string; endTime?: string; allDay?: boolean }) => {
    if (typeof payload === 'string') {
      setAddTaskPrefill(payload ? { time: payload, allDay: false } : { allDay: false });
    } else {
      setAddTaskPrefill({
        ...payload,
        allDay: payload.allDay === undefined ? false : payload.allDay,
      });
    }
    setAddTaskDialogOpen(true);
  }, []);

  const handleEditAllDayTask = useCallback((task: Task) => {
    setEditingAllDayTask(task);
  }, []);

  const handleSaveAllDayTaskEdit = useCallback(() => {
    if (!editingAllDayTask) return;
    
    handleUpdateTask(editingAllDayTask.id, editingAllDayTask);
    setEditingAllDayTask(null);
  }, [editingAllDayTask, handleUpdateTask]);

  const getWaterUnit = useCallback(() => {
    const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
    return waterSettings.unit || 'ml';
  }, []);

  const getTasksForDate = useCallback((date: Date, excludeWater = false) => {
    const filtered = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      const isSameDate = isSameDay(taskDate, date);
      
      // Filter out water tasks if excludeWater is true
      if (excludeWater && task.source === "water") {
        return false;
      }
      
      return isSameDate;
    });
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Log all tasks with their dueDate to debug
    if (filtered.length > 0) {
      // Tasks found for this date
    } else {
      // If no tasks found, check what tasks exist in localStorage
      // No tasks found for this date
    }
    
    return filtered;
  }, [tasks]);

  const getWeekDays = useMemo(() => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
  }, []);

  const getSourceBadge = useCallback((source: Task["source"]) => {
    if (!source || source === "manual") {
      return null; // Don't show badge for manual tasks
    }
    
    const config: Record<string, { label: string; className: string }> = {
      food: { label: "Food", className: "bg-chart-2/20 text-chart-2" },
      calendar: { label: "Calendar", className: "bg-chart-1/20 text-chart-1" },
      medication: { label: "Health", className: "bg-destructive/20 text-destructive" },
      workout: { label: "Sport", className: "bg-success/20 text-success" },
      sleep: { label: "Sleep", className: "bg-primary/20 text-primary" },
      water: { label: "Water", className: "bg-blue-500/20 text-blue-500" },
      breathing: { label: "Breathing", className: "bg-teal-500/20 text-teal-500" },
      reminder: { label: "Reminder", className: "bg-amber-500/20 text-amber-500" },
      steps: { label: "Steps", className: "bg-orange-500/20 text-orange-500" },
      work: { label: "Work", className: "bg-blue-600/20 text-blue-600" },
      menstrual: { label: "Menstrual", className: "bg-pink-500/20 text-pink-500" },
      winddown: { label: "Winddown", className: "bg-indigo-500/20 text-indigo-500" },
      startup: { label: "Startup", className: "bg-yellow-500/20 text-yellow-500" },
    };
    return config[source] || null;
  }, []);

  // Memoize tasks for selected date using optimized hook
  const todayTasks = useMemo(() => getTasksForDate(selectedDate), [getTasksForDate, selectedDate]);
  const weekDays = getWeekDays;

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  }, []);

  // Memoize completion stats for selected date - only count actual tasks, not system tasks or child tasks
  const { countableTasks, completedCount, totalCount } = useMemo(() => {
    const countable = todayTasks.filter(t => 
      t.source !== 'water' && 
      t.source !== 'sleep' && 
      t.source !== 'steps' &&
      t.source !== 'startup' && // Exclude startup container tasks
      t.source !== 'winddown' && // Exclude winddown container tasks
      !t.parentId && // Exclude child tasks
      !t.isContainer // Exclude container tasks
    );
    const completed = countable.filter(t => t.completed).length;
    const total = countable.length;
    
    return {
      countableTasks: countable,
      completedCount: completed,
      totalCount: total,
    };
  }, [todayTasks]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="To-Do"
        description="Manage your tasks and stay productive"
        noindex={true}
      />
      {/* Sticky Header */}
      <PageHeader>
        {/* Header Row with Date and Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowFeaturesMenu(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Date Carousel */}
        <DateCarousel 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </PageHeader>

      <main className="px-4 py-6">
        
        {/* Progress Indicators */}
        <div className="flex flex-nowrap justify-center items-start gap-6 mb-6">
          {/* Food Tracker - Show on left side if configured */}
          {(() => {
            const foodSettings = JSON.parse(localStorage.getItem('food_settings') || '{}');
            if (!foodSettings.isSetupComplete) return null;
            
            const calorieGoal = foodSettings.calorieGoal || 2000;
            const proteinGoal = foodSettings.proteinGoal || 150;
            const meals = JSON.parse(localStorage.getItem('meals') || '[]');
            const todayDate = new Date(selectedDate);
            const todayStr = todayDate.toISOString().split('T')[0];
            
            // Filter meals for today (consumed meals)
            const todayMeals = meals.filter((meal: any) => {
              if (meal.consumedAt) {
                const consumedDate = new Date(meal.consumedAt);
                return consumedDate.toISOString().split('T')[0] === todayStr;
              }
              if (meal.date) {
                return meal.date === todayStr;
              }
              return false;
            });
            
            const totalCalories = todayMeals.reduce((sum: number, meal: any) => sum + (meal.kcal || 0), 0);
            const totalProtein = todayMeals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0);
            const calorieProgress = calorieGoal > 0 ? Math.min((totalCalories / calorieGoal) * 100, 100) : 0;
            const proteinProgress = proteinGoal > 0 ? Math.min((totalProtein / proteinGoal) * 100, 100) : 0;
            const overallProgress = (calorieProgress + proteinProgress) / 2;
            
            // Create a custom circular progress for food (showing percentage)
            const size = 100;
            const strokeWidth = 8;
            const radius = (size - strokeWidth) / 2;
            const circumference = radius * 2 * Math.PI;
            const strokeDashoffset = circumference - (overallProgress / 100 * circumference);
            
            const getFoodColor = (progress: number) => {
              if (progress === 0) return "stroke-muted-foreground/20";
              if (progress <= 30) return "stroke-red-500";
              if (progress <= 60) return "stroke-yellow-500";
              if (progress <= 90) return "stroke-orange-500";
              return "stroke-green-500";
            };

            const getFoodBackgroundColor = (progress: number) => {
              if (progress === 0) return "stroke-muted-foreground/10";
              if (progress <= 30) return "stroke-red-100";
              if (progress <= 60) return "stroke-yellow-100";
              if (progress <= 90) return "stroke-orange-100";
              return "stroke-green-100";
            };

            return (
              <div 
                className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'food' } }));
                }}
              >
                <div className="relative inline-flex items-center justify-center">
                  <svg
                    width={size}
                    height={size}
                    className="transform -rotate-90"
                  >
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="currentColor"
                      strokeWidth={strokeWidth}
                      fill="none"
                      className={getFoodBackgroundColor(overallProgress)}
                    />
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="currentColor"
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className={`transition-all duration-300 ease-in-out ${getFoodColor(overallProgress)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-lg font-bold text-foreground">
                      {Math.round(overallProgress)}%
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {totalCalories} / {calorieGoal} kcal
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {totalProtein} / {proteinGoal} g protein
                </p>
              </div>
            );
          })()}
          
          <div className="flex flex-col items-center gap-2">
            <CircularProgress 
              completed={completedCount}
              total={totalCount}
              size={100}
              strokeWidth={8}
            />
            <p className="text-sm text-muted-foreground">
              {completedCount} / {totalCount} tasks
            </p>
          </div>
          
          {/* Water Intake - Only show if user has actually configured it */}
          {(() => {
            const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
            const dailyGoal = waterSettings.dailyGoal;
            const remindersEnabled = waterSettings.remindersEnabled;

            // Only show if daily goal is explicitly set (truthy and greater than 0) AND reminders are enabled
            if (!dailyGoal || dailyGoal <= 0 || !remindersEnabled) {
              return null;
            }
            
            const goal = dailyGoal;
            const unit = waterSettings.unit || 'ml';
            const waterEntries = JSON.parse(localStorage.getItem('water_entries') || '[]');
            const todayDate = new Date(selectedDate);
            const todayStr = todayDate.toISOString().split('T')[0];
            const todayEntries = waterEntries.filter((entry: any) => {
              if (entry.timestamp) {
                return new Date(entry.timestamp).toDateString() === todayDate.toDateString();
              }
              if (entry.date) {
                return entry.date === todayStr;
              }
              return false;
            });
            const totalIntake = todayEntries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
            const percentage = goal > 0 ? Math.min((totalIntake / goal) * 100, 100) : 0;
            const progress = goal > 0 ? totalIntake / goal : 0;
            
            // Always use primary color (same as liquid timeline) for all states
            const getColor = () => "stroke-primary"; // Always match liquid timeline color

            const getBackgroundColor = () => "stroke-primary/20"; // Always match liquid timeline color with opacity

            const size = 100;
            const strokeWidth = 8;
            const radius = (size - strokeWidth) / 2;
            const circumference = radius * 2 * Math.PI;
            const strokeDashoffset = circumference - (progress * circumference);
            
                          return (
              <div 
                className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  // Find a water reminder task for today to trigger the dialog
                  const waterTasks = todayTasks.filter((t: any) => t.source === 'water' && (t as any).waterReminder);
                  if (waterTasks.length > 0) {
                    handleWaterReminderClick(waterTasks[0].time || '12:00');
                  } else {
                    // Open water intake feature if no reminder tasks found
                    window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'water' } }));
                  }
                }}
              >
                <CircularProgress 
                  completed={totalIntake}
                  total={goal}
                  size={size}
                  strokeWidth={strokeWidth}
                />
                <p className="text-sm text-muted-foreground">
                  {totalIntake} / {goal} {unit}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Main Content - Show All Day Tasks and Liquid Timeline */}
        <div className="mt-6 space-y-8">
          
          {todayTasks.filter(t => t.allDay || (!t.time && !t.allDay)).length > 0 && (
            <AllDayTasks 
              tasks={todayTasks.filter(t => t.allDay || (!t.time && !t.allDay))}
              onToggleTask={handleToggleTask}
              onEditTask={handleEditAllDayTask}
              onDeleteTask={handleDeleteTask}
              getSourceBadge={getSourceBadge}
              onOpenWorkDialog={() => setIsOfficeDialogOpen(true)}
            />
          )}

          {/* Quote of the Day - shown between all-day tasks and timeline (only on current day) */}
          {quoteSettings.enabled && isToday(selectedDate) && (
            <div className="max-w-md mx-auto">
              <QuoteOfTheDay />
            </div>
          )}
          
          <LiquidTimeline
            tasks={todayTasks}
            date={selectedDate}
            onToggleTask={handleToggleTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onWaterReminderClick={handleWaterReminderClick}
            onAddTaskClick={handleAddTaskFromTimeline}
            getSourceBadge={getSourceBadge}
            onToggleSubtask={(taskId, subtaskId) => {
              setTasks(prev =>
                prev.map(t =>
                  t.id === taskId
                    ? {
                        ...t,
                        subtasks: t.subtasks?.map(st =>
                          st.id === subtaskId ? { ...st, completed: !st.completed } : st
                        ),
                      }
                    : t
                )
              );
            }}
          />
        </div>
      
      {/* Hidden Add Task Dialog - triggered by BottomNav + button */}
      <div style={{ display: 'none' }}>
        <AddTask 
          onAddTask={handleAddTask} 
          prefill={addTaskPrefill ?? undefined}
          externalOpen={addTaskDialogOpen}
          onOpenChange={(open) => {
            setAddTaskDialogOpen(open);
            if (!open) setAddTaskPrefill(null); // Clear prefill when closing
          }}
          selectedDate={selectedDate}
        />
      </div>
      </main>

      {/* Lazy loaded dialogs with Suspense boundaries */}
      <Suspense fallback={<div />}>
        {showStats && <MonthlyStatsModal open={showStats} onOpenChange={setShowStats} />}
      </Suspense>
      
      {/* Settings Dialog */}
      <Suspense fallback={<div />}>
        {showSettings && <Settings onOpenChange={setShowSettings} />}
      </Suspense>
      
      <WaterAmountDialog
        isOpen={waterDialogOpen}
        onClose={() => {
          setWaterDialogOpen(false);
          setPendingWaterTask(null);
        }}
        onConfirm={handleWaterAmountConfirm}
        unit={getWaterUnit() as "ml" | "oz"}
      />

      {/* Edit All Day Task Dialog */}
      <Dialog open={!!editingAllDayTask} onOpenChange={(open) => !open && setEditingAllDayTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingAllDayTask && (
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="edit-allday-title">Task Title</Label>
                <Input
                  id="edit-allday-title"
                  value={editingAllDayTask.title}
                  onChange={(e) => setEditingAllDayTask({...editingAllDayTask, title: e.target.value})}
                  placeholder="Task title"
                />
              </div>

              <div>
                <Label>Emoji</Label>
                <EmojiPicker 
                  value={editingAllDayTask.emoji || "📝"}
                  onChange={(emoji) => setEditingAllDayTask({...editingAllDayTask, emoji})}
                  category="common"
                />
              </div>

              <div>
                <Label htmlFor="edit-allday-notes">Notes (optional)</Label>
                <Textarea
                  id="edit-allday-notes"
                  value={editingAllDayTask.notes || ""}
                  onChange={(e) => setEditingAllDayTask({...editingAllDayTask, notes: e.target.value})}
                  placeholder="Add notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingAllDayTask(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveAllDayTaskEdit} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfettiEffect 
        trigger={triggerConfetti} 
        onComplete={() => setTriggerConfetti(false)}
      />

      {/* Work Dialog */}
      <Suspense fallback={<div />}>
        {isOfficeDialogOpen && (
          <UniversalDialog
            open={isOfficeDialogOpen}
            onOpenChange={setIsOfficeDialogOpen}
            title="💼 Work"
            hideDefaultFooter
          >
            <Work />
          </UniversalDialog>
        )}
      </Suspense>

      {/* Student Dialog */}
      <Suspense fallback={<div />}>
        {isStudentDialogOpen && (
          <UniversalDialog
            open={isStudentDialogOpen}
            onOpenChange={setIsStudentDialogOpen}
            title="🎓 Student"
            hideDefaultFooter
          >
            <Student />
          </UniversalDialog>
        )}
      </Suspense>

      {/* Journal Dialog */}
      <Suspense fallback={<div />}>
        {isJournalDialogOpen && (
          <UniversalDialog
            open={isJournalDialogOpen}
            onOpenChange={setIsJournalDialogOpen}
            title="📝 Journal & Reflection"
            hideDefaultFooter
          >
            <JournalReflection />
          </UniversalDialog>
        )}
      </Suspense>


      {/* Features Sidebar */}
      <FeaturesSidebar
        isOpen={showFeaturesMenu}
        onClose={() => setShowFeaturesMenu(false)}
        onStatsClick={() => { setShowStats(true); setShowFeaturesMenu(false); }}
        onSettingsClick={() => { setShowSettings(true); setShowFeaturesMenu(false); }}
      />

      {/* Feature Dialogs */}
      <FeatureDialogs />
    </div>
  );
}