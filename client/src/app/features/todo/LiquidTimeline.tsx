import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { Task } from "@/app/types/types";
import { getCurrentTime, formatTimeString } from "@/lib/timeUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Edit2, X, Plus, ChevronDown, ChevronUp, Clock, Repeat, Repeat1, Repeat2, Calendar, GripVertical, Image as ImageIcon, Sparkles, ExternalLink, Monitor, Eye, Timer } from "lucide-react";
import { Textarea } from "@/app/components/ui/textarea";
import { EmojiPicker } from "@/app/components/shared/EmojiPicker";
import { ImageViewerDialog } from "@/app/components/shared";
import { getAffirmationSettings, getDailyAffirmationText } from "@/app/features/todo/DailyAffirmations";
import { useLocation } from "wouter";
const Work = lazy(() => import("@/app/features/todo/Work"));
// New utilities and components
import { timeToMinutes, minutesToTime, hasTimePassed } from "./utils/timeHelpers";
import { calculateTimelineBounds, calculatePosition, TimelineBounds, TimelineItem as TimelineItemType } from "./utils/timelineCalculations";
import { groupOverlappingTasks, TaskGroup } from "./utils/taskGrouping";
import { buildTimelineItems } from "./utils/buildTimelineItems";
import { calculateTaskMetrics } from "./utils/taskSizing";
import { calculateFreeTimeSegments, FreeTimeSegment } from "./utils/freeTime";
import { TimelineBar } from "./timeline/TimelineBar";
import { TimelineDot } from "./timeline/TimelineDot";
import { CurrentTimeIndicator } from "./timeline/CurrentTimeIndicator";
import { CandyConePattern } from "./timeline/CandyConePattern";
import { ReminderDots } from "./timeline/ReminderDots";
import { TaskGroupContainer } from "./tasks/TaskGroupContainer";
import { TaskCard } from "./tasks/TaskCard";

interface Props {
  tasks: Task[];
  date?: Date; // The date being viewed
  onToggleTask: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string, deleteFuture?: boolean) => void;
  onWaterReminderClick?: (time: string) => void;
  onAddTaskClick?: (prefillTime: string) => void;
  getSourceBadge?: (source: Task["source"]) => { label: string; className: string } | null;
}

// TimelineItem interface is now imported from timelineCalculations

export default function LiquidTimeline({ tasks, date, onToggleTask, onUpdateTask, onDeleteTask, onWaterReminderClick, onAddTaskClick, getSourceBadge }: Props) {
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [combinedReminderOpen, setCombinedReminderOpen] = useState(false);
  const [selectedReminderTime, setSelectedReminderTime] = useState<string>("");
  const [waterAmount, setWaterAmount] = useState("250");
  const [medicationTaken, setMedicationTaken] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Helper to get source page for navigation
  const getSourcePage = (source: Task["source"]) => {
    switch (source) {
      case 'water':
      case 'medication':
        return '/health';
      case 'sleep':
      case 'startup':
      case 'winddown':
        return 'sleep-dialog'; // Special case: opens sleep schedule dialog
      case 'food':
        return '/food';
      case 'workout':
      case 'steps':
        return '/sport';
      case 'work':
        return 'work-dialog'; // Special case: opens dialog
      case 'school':
        return 'student-dialog'; // Special case: opens dialog
      default:
        return null;
    }
  };
  
  // Handle shortcut click for external source
  const handleSourceShortcut = (source: Task["source"]) => {
    const destination = getSourcePage(source);
    if (!destination) return;
    
    if (destination === 'work-dialog') {
      setWorkDialogOpen(true);
    } else if (destination === 'student-dialog') {
      // We need to dispatch an event to open the student dialog from the parent component
      window.dispatchEvent(new CustomEvent('openStudentDialog'));
    } else if (destination === 'sleep-dialog') {
      // Dispatch event to open sleep schedule dialog
      window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'sleep' } }));
    } else {
      setLocation(destination);
    }
  };
  
  // Edit task state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editDate, setEditDate] = useState("");
  
  // Drag state
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragCurrentY, setDragCurrentY] = useState<number>(0);
  const [dragPreviewTime, setDragPreviewTime] = useState<string>("");
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTimeMarkerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoScrolledRef = useRef(false);
  
  // Track if this is a true page load vs tab switch
  const isInitialPageLoad = useRef(true);
  
  // Detect if this is a true page load (refresh/app open) vs tab switch
  useEffect(() => {
    // Check if we're in a fresh page load by looking at performance API
    const isPageLoad = performance.navigation?.type === 1 || // TYPE_RELOAD
                      performance.navigation?.type === 0 || // TYPE_NAVIGATE (fresh load)
                      !sessionStorage.getItem('hasVisitedToDo');
    
    if (isPageLoad) {
      // This is a fresh page load or refresh
      isInitialPageLoad.current = true;
      sessionStorage.setItem('hasVisitedToDo', 'true');
    } else {
      // This is a tab switch
      isInitialPageLoad.current = false;
    }
  }, []);
  const [editNotes, setEditNotes] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editRepeat, setEditRepeat] = useState<"none" | "daily" | "weekly" | "monthly" | "yearly" | "weekdays" | "custom">("none");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  
  // Track which task containers are expanded
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  // Medication dialog state
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [selectedMedicationTime, setSelectedMedicationTime] = useState("");
  
  // Step counter dialog state
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [selectedStepTime, setSelectedStepTime] = useState("");
  const [stepCount, setStepCount] = useState("");
  
  // Meditation dialog state
  const [meditationDialogOpen, setMeditationDialogOpen] = useState(false);
  const [selectedMeditationTime, setSelectedMeditationTime] = useState("");
  
  // Glucose check dialog state
  const [glucoseDialogOpen, setGlucoseDialogOpen] = useState(false);
  const [selectedGlucoseTime, setSelectedGlucoseTime] = useState("");
  const [glucoseValue, setGlucoseValue] = useState("");
  
  // Work dialog state
  const [workDialogOpen, setWorkDialogOpen] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  // Image viewer state
  const [imageViewerTask, setImageViewerTask] = useState<Task | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  
  // Show task tags setting
  const [showTaskTags, setShowTaskTags] = useState(() => {
    return localStorage.getItem("showTaskTags") !== "false";
  });
  
  // Track if liquid fill animation has played
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Track recently completed tasks for fill animation
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  
  // Affirmation settings
  const [affirmationSettings, setAffirmationSettings] = useState(getAffirmationSettings());

  // Trigger animation on mount, but only for current day and only on initial page load
  useEffect(() => {
    // Only animate if viewing current day AND it's an initial page load (not tab switch)
    const viewingDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const isViewingToday = viewingDate === today;
    
    // Only animate on initial page load, not on tab switches
    if (isViewingToday && isInitialPageLoad.current) {
      // Reset animation state
      setHasAnimated(false);
      
      // Small delay to ensure proper rendering
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // For tab switches or non-today dates, set animation state immediately without animation
      setHasAnimated(true);
    }
  }, [date]);

  // Auto-scroll to current time on initial load
  useEffect(() => {
    // Check if auto-scroll is enabled in settings
    const autoScrollEnabled = localStorage.getItem("autoScrollEnabled") !== "false";
    if (!autoScrollEnabled) return;
    
    // Only scroll on initial page load (refresh/app open), not on tab switches
    if (!isInitialPageLoad.current || hasAutoScrolledRef.current) return;
    
    // Only scroll if viewing today
    const viewingDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const isViewingToday = viewingDate === today;
    
    if (!isViewingToday) return;
    
    // Scroll to current time immediately on mount/refresh
    const scrollTimer = setTimeout(() => {
      if (timelineRef.current) {
        const timelineElement = timelineRef.current;
        
        // Calculate current time position on timeline
        const currentMinutes = timeToMinutes(currentTimeStr);
        const startMinutes = timeToMinutes('07:00'); // Default start time
        const endMinutes = timeToMinutes('23:00'); // Default end time
        
        // Get sleep schedule for more accurate positioning
        const sleepSchedule = JSON.parse(localStorage.getItem('sleepSchedule') || '{}');
        let wakeTime = '07:00';
        let sleepTime = '23:00';
        
        if (sleepSchedule.daily) {
          wakeTime = sleepSchedule.daily.wakeTime || '07:00';
          sleepTime = sleepSchedule.daily.sleepTime || '23:00';
        } else if (sleepSchedule.wakeTime) {
          wakeTime = sleepSchedule.wakeTime;
          sleepTime = sleepSchedule.bedtime || sleepSchedule.sleepTime || '23:00';
        }
        
        const actualStartMinutes = timeToMinutes(wakeTime);
        const actualEndMinutes = timeToMinutes(sleepTime);
        
        // Calculate position percentage
        let positionPercentage = 0;
        if (currentMinutes < actualStartMinutes) {
          positionPercentage = 0; // Before wake up
        } else if (currentMinutes > actualEndMinutes) {
          positionPercentage = 100; // After sleep
        } else {
          // During active hours
          positionPercentage = ((currentMinutes - actualStartMinutes) / (actualEndMinutes - actualStartMinutes)) * 100;
        }
        
        // Calculate scroll position
        const timelineHeight = timelineElement.offsetHeight;
        const currentTimePosition = (positionPercentage / 100) * timelineHeight;
        const viewportHeight = window.innerHeight;
        
        // Scroll to position the current time in the center of the viewport
        const scrollPosition = currentTimePosition - (viewportHeight / 2) + timelineElement.offsetTop;
        
        // Smooth scroll to current time
        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
        
        hasAutoScrolledRef.current = true;
      }
    }, 100); // Short delay to ensure DOM is ready
    
    return () => clearTimeout(scrollTimer);
  }, [date]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleTimezoneChange = () => setCurrentTime(getCurrentTime());
    window.addEventListener('timezoneChanged', handleTimezoneChange);
    return () => window.removeEventListener('timezoneChanged', handleTimezoneChange);
  }, []);

  useEffect(() => {
    const handleTagSettingChange = () => {
      setShowTaskTags(localStorage.getItem("showTaskTags") !== "false");
    };
    window.addEventListener('taskTagsSettingChanged', handleTagSettingChange);
    return () => window.removeEventListener('taskTagsSettingChanged', handleTagSettingChange);
  }, []);

  useEffect(() => {
    const handleAffirmationSettingChange = () => {
      setAffirmationSettings(getAffirmationSettings());
    };
    window.addEventListener('affirmationSettingsChanged', handleAffirmationSettingChange);
    return () => window.removeEventListener('affirmationSettingsChanged', handleAffirmationSettingChange);
  }, []);

  // Listen for updates to water/medication entries
  useEffect(() => {
    const handleUpdate = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('todosUpdated', handleUpdate);
    window.addEventListener('waterEntryAdded', handleUpdate);
    window.addEventListener('medicationCompleted', handleUpdate);
    window.addEventListener('stepLogged', handleUpdate);
    return () => {
      window.removeEventListener('todosUpdated', handleUpdate);
      window.removeEventListener('waterEntryAdded', handleUpdate);
      window.removeEventListener('medicationCompleted', handleUpdate);
      window.removeEventListener('stepLogged', handleUpdate);
    };
  }, []);

  const timeBasedTasks = tasks.filter(task => task.time && !task.allDay);

  // Build timeline items using new utility
  const timelineItems: TimelineItemType[] = useMemo(() => {
    return buildTimelineItems(timeBasedTasks, date);
  }, [timeBasedTasks, refreshKey, date]);

  // Sleep schedule for timeline bounds calculation
  const sleepSchedule = useMemo(() => {
    const schedule = JSON.parse(localStorage.getItem('sleepSchedule') || '{}');
    return {
      wakeTime: schedule.daily?.wakeTime || schedule.wakeTime,
      bedtime: schedule.daily?.sleepTime || schedule.bedtime || schedule.sleepTime,
    };
  }, []);
  
  // Helper function to calculate timeline height (memoized for performance)
  const calculateTimelineHeight = useCallback((rangeMinutes: number, taskCount: number): number => {
    const baseHeight = Math.max(rangeMinutes * 1.5, 400); // Minimum 400px, 1.5px per minute
    const taskBasedHeight = taskCount * 80; // 80px per task
    return Math.min(Math.max(baseHeight, taskBasedHeight), rangeMinutes * 3);
  }, []);

  // Step 1: Calculate preliminary bounds (without density map) to get range
  // This is fast because it skips density analysis
  const preliminaryBounds: TimelineBounds = useMemo(() => {
    return calculateTimelineBounds(timelineItems, sleepSchedule, false); // Disable scaling for preliminary
  }, [timelineItems, sleepSchedule]);

  // Calculate task count once (used in multiple places)
  const taskCount = useMemo(() => {
    return timelineItems.reduce((sum, item) => sum + item.tasks.length, 0);
  }, [timelineItems]);

  // Step 2: Calculate timeline height based on preliminary bounds
  // This gives us the actual height that will be used for rendering
  const timelineHeight = useMemo(() => {
    return calculateTimelineHeight(preliminaryBounds.rangeMinutes, taskCount);
  }, [preliminaryBounds.rangeMinutes, taskCount, calculateTimelineHeight]);

  // Step 3: Calculate final bounds with density map using actual timeline height
  // This is memoized and only recalculates when inputs change (timelineItems, sleepSchedule, or timelineHeight)
  const bounds: TimelineBounds = useMemo(() => {
    return calculateTimelineBounds(timelineItems, sleepSchedule, true, timelineHeight);
  }, [timelineItems, sleepSchedule, timelineHeight]);
      
  // Group overlapping tasks (includes tasks with and without endTime)
  const taskGroups: TaskGroup[] = useMemo(() => {
    return groupOverlappingTasks(timeBasedTasks, bounds);
  }, [timeBasedTasks, bounds]);

  // Calculate free time segments using algorithm
  const freeTimeSegments: FreeTimeSegment[] = useMemo(() => {
    return calculateFreeTimeSegments(taskGroups, bounds, timelineItems);
  }, [taskGroups, bounds, timelineItems]);

  // Check if we only have system tasks (wake up, go to bed, startup, winddown) or reminders
  const hasOnlySystemTasks = timelineItems.every(item => 
    item.isWakeUp || 
    item.isBedTime || 
    item.tasks.every(t => t.source === 'startup' || t.source === 'winddown' || t.source === 'sleep') ||
    (item.waterReminder && !item.tasks.length) ||
    (item.medicationReminder && !item.tasks.length) ||
    (item.stepReminder && !item.tasks.length) ||
    (item.meditationReminder && !item.tasks.length) ||
    (item.glucoseReminder && !item.tasks.length)
  );

  // Check if we only have one task with no end time (can't create a timeline)
  const hasOnlyOneTaskNoEndTime = timelineItems.length === 1 && timelineItems[0].tasks.length === 1 && !timelineItems[0].tasks[0].endTime && 
    !timelineItems[0].waterReminder && !timelineItems[0].medicationReminder && !timelineItems[0].stepReminder && 
    !timelineItems[0].meditationReminder && !timelineItems[0].glucoseReminder &&
    !timelineItems[0].isWakeUp && !timelineItems[0].isBedTime;

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No scheduled tasks for today</p>
        <p className="text-sm mt-2">Add tasks with specific times to see your timeline</p>
        {onAddTaskClick && (
          <Button 
            onClick={() => onAddTaskClick("")} 
            className="mt-4 rounded-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>
    );
  }

  // If we only have system tasks (wake up/go to bed/startup/winddown), show add tasks message above timeline
  // But still show the timeline so users can see their schedule
  const showAddTasksPrompt = hasOnlySystemTasks;

  // If we only have one task with no end time, show it with a simple timeline
  if (hasOnlyOneTaskNoEndTime) {
    const task = timelineItems[0].tasks[0];
    return (
      <div className="space-y-4">
        {/* Show the task */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleTask(task.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  task.completed ? "bg-success border-success" : "border-muted-foreground hover:border-primary"
                }`}
              >
                {task.completed && <span className="text-white text-sm">✓</span>}
              </button>
              <div className="text-2xl">{task.emoji || "📝"}</div>
              <div className="flex-1">
                <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                {task.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{task.notes}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{timelineItems[0].time}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Show add more tasks message */}
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm mb-4">Add more tasks to see your full timeline</p>
          {onAddTaskClick && (
            <Button 
              onClick={() => onAddTaskClick("")} 
              className="rounded-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentTimeStr = formatTimeString(currentTime);
  
  const adjustedStartTime = bounds.startTime;
  const adjustedEndTime = bounds.endTime;
  const startMinutes = bounds.startMinutes;
  const endMinutes = bounds.endMinutes;

  // Check if viewing today, past, or future date
  const today = new Date().toISOString().split('T')[0];
  
  // Use the passed date prop, or try to find it from tasks
  let viewingDate = today;
  if (date) {
    viewingDate = date.toISOString().split('T')[0];
  } else {
    // Fallback: Find viewing date from any task with a dueDate
    for (const item of timelineItems) {
      for (const task of item.tasks) {
        if (task.dueDate) {
          viewingDate = typeof task.dueDate === 'string' 
            ? task.dueDate.split('T')[0]
            : new Date(task.dueDate).toISOString().split('T')[0];
          break;
        }
      }
      if (viewingDate !== today) break;
    }
  }
  
  const isPastDate = viewingDate < today;
  const isToday = viewingDate === today;
  const isFutureDate = viewingDate > today;

  // Calculate fill percentage
  const currentMinutes = timeToMinutes(currentTimeStr);
  
  // Find the last task's end time for capping purposes (calculate BEFORE fill percentage)
  const allTaskEndTimes = taskGroups.length > 0
    ? taskGroups.map(group => timeToMinutes(group.endTime))
    : [];
  const lastTaskEndTime = allTaskEndTimes.length > 0 
    ? Math.max(...allTaskEndTimes)
    : undefined;
  
  // Calculate fill percentage using adaptive position calculation (algorithm)
  let fillPercentage = 0;
  
  if (bounds.rangeMinutes === 0 || bounds.rangeMinutes <= 0) {
    fillPercentage = 0;
  } else if (isPastDate) {
    // Past dates: Fill to last task end time, or 100% if no tasks
    if (lastTaskEndTime !== undefined) {
      const lastTaskEndTimeStr = minutesToTime(lastTaskEndTime);
      fillPercentage = calculatePosition(lastTaskEndTimeStr, bounds);
    } else {
      fillPercentage = 100;
    }
  } else if (isFutureDate) {
    // Future dates: Never filled
    fillPercentage = 0;
  } else {
    // Today: Use adaptive position calculation (handles density scaling automatically)
    if (currentMinutes < bounds.startMinutes) {
      fillPercentage = 0;
    } else {
      // Cap at last task end if current time has passed all tasks
      let effectiveTime = currentTimeStr;
      if (lastTaskEndTime !== undefined && currentMinutes > lastTaskEndTime) {
        effectiveTime = minutesToTime(lastTaskEndTime);
      }
      
      // Use adaptive position calculation
      fillPercentage = calculatePosition(effectiveTime, bounds);
    }
  }
  
  // Ensure fillPercentage is a valid number between 0 and 100
  fillPercentage = isNaN(fillPercentage) ? 0 : Math.max(0, Math.min(100, fillPercentage));

  // Check if task is missed (time has passed but not completed)
  const isTaskMissed = (time: string, tasks: Task[]) => {
    // On past dates, any incomplete task is missed
    if (isPastDate) {
      return tasks.some(task => !task.completed);
    }
    // On future dates, nothing is missed
    if (isFutureDate) {
      return false;
    }
    // On today, check if time has passed
    if (time >= currentTimeStr) return false;
    return tasks.some(task => !task.completed);
  };

  const handleCombinedReminderClick = (time: string) => {
    setSelectedReminderTime(time);
    setWaterAmount("250");
    setMedicationTaken(false);
    setCombinedReminderOpen(true);
  };

  const handleMedicationReminderClick = (time: string) => {
    // Toggle medication status (mark as taken or untaken)
    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    const viewingDateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // First check if medication is already taken
    let isAlreadyTaken = false;
    medications.forEach((med: any) => {
      if (med.times?.includes(time)) {
        if (!med.takenDates) med.takenDates = [];
        const takenEntry = `${viewingDateStr}_${time}`;
        if (med.takenDates.includes(takenEntry)) {
          isAlreadyTaken = true;
        }
      }
    });
    
    // Toggle medication status
    medications.forEach((med: any) => {
      if (med.times?.includes(time)) {
        if (!med.takenDates) med.takenDates = [];
        const takenEntry = `${viewingDateStr}_${time}`;
        if (isAlreadyTaken) {
          // Unmark as taken
          med.takenDates = med.takenDates.filter((entry: string) => entry !== takenEntry);
        } else {
          // Mark as taken
          if (!med.takenDates.includes(takenEntry)) {
            med.takenDates.push(takenEntry);
          }
        }
      }
    });
    
    localStorage.setItem('medications', JSON.stringify(medications));
    window.dispatchEvent(new Event('medicationCompleted'));
    window.dispatchEvent(new Event('todosUpdated'));
    
    // Also update the task completion status
    const tasks = JSON.parse(localStorage.getItem('todos') || '[]');
    tasks.forEach((task: any) => {
      if (task.source === 'medication' && task.time === time && task.dueDate === viewingDateStr) {
        task.completed = !isAlreadyTaken;
      }
    });
    localStorage.setItem('todos', JSON.stringify(tasks));
    setRefreshKey(prev => prev + 1);
  };

  const handleStepReminderClick = (time: string) => {
    setSelectedStepTime(time);
    setStepCount("");
    setStepDialogOpen(true);
  };

  const handleMeditationReminderClick = (time: string) => {
    setSelectedMeditationTime(time);
    setMeditationDialogOpen(true);
  };

  const handleGlucoseReminderClick = (time: string) => {
    setSelectedGlucoseTime(time);
    setGlucoseValue("");
    setGlucoseDialogOpen(true);
  };

  const handleStepSubmit = () => {
    if (!stepCount || parseInt(stepCount) <= 0) return;
    
    const viewingDateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Add step log entry
    const stepLogs = JSON.parse(localStorage.getItem('step_logs') || '[]');
    const newLog = {
      id: Date.now().toString(),
      steps: parseInt(stepCount),
      date: viewingDateStr,
      timestamp: new Date().toISOString(),
    };
    
    stepLogs.unshift(newLog);
    localStorage.setItem('step_logs', JSON.stringify(stepLogs));
    
    // Dispatch event to update components
    window.dispatchEvent(new Event('stepLogged'));
    window.dispatchEvent(new Event('todosUpdated'));
    
    setStepDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleMedicationSubmit = () => {
    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    const viewingDateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    medications.forEach((med: any) => {
      if (med.times?.includes(selectedMedicationTime)) {
        if (!med.takenDates) med.takenDates = [];
        const takenEntry = `${viewingDateStr}_${selectedMedicationTime}`;
        if (!med.takenDates.includes(takenEntry)) {
          med.takenDates.push(takenEntry);
        }
      }
    });
    
    localStorage.setItem('medications', JSON.stringify(medications));
    window.dispatchEvent(new Event('medicationCompleted'));
    window.dispatchEvent(new Event('todosUpdated'));
    setMedicationDialogOpen(false);
  };

  const handleMeditationSubmit = () => {
    const viewingDateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Add meditation session entry
    const sessions = JSON.parse(localStorage.getItem('breathingSessions') || '[]');
    const newSession = {
      id: Date.now().toString(),
      date: viewingDateStr,
      exerciseId: 'reminder', // Mark as reminder-based
      duration: 5, // Default 5 minutes
      completed: true,
      timestamp: new Date().toISOString(),
      reminderTime: selectedMeditationTime,
    };
    
    sessions.unshift(newSession);
    localStorage.setItem('breathingSessions', JSON.stringify(sessions));
    
    window.dispatchEvent(new Event('meditationCompleted'));
    window.dispatchEvent(new Event('todosUpdated'));
    setMeditationDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleGlucoseSubmit = () => {
    if (!glucoseValue || parseFloat(glucoseValue) <= 0) return;
    
    const viewingDateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const settings = JSON.parse(localStorage.getItem('glucose_settings') || '{}');
    
    // Add glucose reading
    const readings = JSON.parse(localStorage.getItem('glucose_readings') || '[]');
    const newReading = {
      id: Date.now().toString(),
      value: parseFloat(glucoseValue),
      unit: settings.unit || 'mg/dL',
      timestamp: new Date().toISOString(),
      mealContext: 'other',
      reminderTime: selectedGlucoseTime,
      date: viewingDateStr,
    };
    
    readings.unshift(newReading);
    localStorage.setItem('glucose_readings', JSON.stringify(readings));
    
    window.dispatchEvent(new Event('glucoseLogged'));
    window.dispatchEvent(new Event('todosUpdated'));
    setGlucoseDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const getMedicationsForTime = (time: string) => {
    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    return medications.filter((med: any) => med.times?.includes(time));
  };

  const getMedicationEmojiForTime = (time: string): string => {
    const meds = getMedicationsForTime(time);
    // If multiple medications at same time, return first one's emoji, else default
    return meds.length > 0 && meds[0].emoji ? meds[0].emoji : '💊';
  };

  const handleCombinedReminderSubmit = () => {
    // Add water entry
    const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
    const unit = waterSettings.unit || 'ml';
    
    const viewingDateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const waterEntries = JSON.parse(localStorage.getItem('water_entries') || '[]');
    const newEntry = {
      id: Date.now().toString(),
      amount: parseInt(waterAmount),
      unit,
      time: selectedReminderTime,
      date: viewingDateStr, // Use viewing date
    };
    
    waterEntries.unshift(newEntry);
    localStorage.setItem('water_entries', JSON.stringify(waterEntries));
    window.dispatchEvent(new Event('waterEntryAdded'));

    // Mark medication as taken if checkbox is checked
    if (medicationTaken) {
      const medications = JSON.parse(localStorage.getItem('medications') || '[]');
      
      medications.forEach((med: any) => {
        if (med.times && med.times.includes(selectedReminderTime)) {
          if (!med.takenDates) med.takenDates = [];
          const takenEntry = `${viewingDateStr}_${selectedReminderTime}`;
          if (!med.takenDates.includes(takenEntry)) {
            med.takenDates.push(takenEntry);
          }
        }
      });
      
      localStorage.setItem('medications', JSON.stringify(medications));
      window.dispatchEvent(new Event('medicationCompleted'));
    }

    window.dispatchEvent(new Event('todosUpdated'));
    setCombinedReminderOpen(false);
  };

  const getWaterUnit = () => {
    const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
    return waterSettings.unit || 'ml';
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditEmoji(task.emoji || "");
    setEditTime(task.time || "");
    setEditEndTime(task.endTime || "");
    setEditNotes(task.notes || "");
    setEditColor(task.color || "");
    setEditRepeat(task.repeat || "none");
    
    // Set date from dueDate
    if (task.dueDate) {
      const dateObj = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      setEditDate(dateObj.toISOString().split('T')[0]);
    } else if (date) {
      // If no dueDate, use the viewing date
      setEditDate(date.toISOString().split('T')[0]);
    } else {
      setEditDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingTask) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const currentAttachments = editingTask.attachments || [];
          if (onUpdateTask) {
            onUpdateTask(editingTask.id, {
              attachments: [...currentAttachments, dataUrl]
            });
          }
          // Update local editing state
          setEditingTask({
            ...editingTask,
            attachments: [...currentAttachments, dataUrl]
          });
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = (index: number) => {
    if (!editingTask || !onUpdateTask) return;
    const currentAttachments = editingTask.attachments || [];
    const newAttachments = currentAttachments.filter((_: string, i: number) => i !== index);
    onUpdateTask(editingTask.id, {
      attachments: newAttachments
    });
    // Update local editing state
    setEditingTask({
      ...editingTask,
      attachments: newAttachments
    });
  };

  const handleSaveEdit = () => {
    if (!editingTask || !onUpdateTask) return;
    
    onUpdateTask(editingTask.id, {
      title: editTitle,
      emoji: editEmoji,
      time: editTime,
      endTime: editEndTime || undefined,
      dueDate: editDate ? new Date(editDate) : undefined,
      notes: editNotes,
      color: editColor || undefined,
      repeat: editRepeat !== "none" ? editRepeat : undefined,
    });
    
    setEditingTask(null);
  };

  const handleAddSubtask = () => {
    if (!editingTask || !newSubtaskTitle.trim() || !onUpdateTask) return;
    
    const newSubtask = {
      id: Date.now().toString(),
      text: newSubtaskTitle.trim(),
      completed: false,
    };
    
    const updatedSubtasks = [...(editingTask.subtasks || []), newSubtask];
    onUpdateTask(editingTask.id, { subtasks: updatedSubtasks });
    
    setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!editingTask || !onUpdateTask) return;
    
    const updatedSubtasks = (editingTask.subtasks || []).map((st: any) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    onUpdateTask(editingTask.id, { subtasks: updatedSubtasks });
    setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
    setEditingTask(null); // Close edit dialog
  };

  const handleDeleteConfirm = (deleteFuture: boolean) => {
    if (!taskToDelete || !onDeleteTask) return;
    onDeleteTask(taskToDelete.id, deleteFuture);
    setDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  const hasFutureInstances = (task: Task): boolean => {
    // If task has a repeat field, it's a recurring task
    if (task.repeat) return true;
    
    // Otherwise check if there are future instances with same title and time
    if (!task.time || !task.title) return false;
    const taskDate = task.dueDate ? (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)) : new Date();
    const taskDateStr = taskDate.toISOString().split('T')[0];
    
    return tasks.some(t => 
      t.id !== task.id && 
      t.title === task.title && 
      t.time === task.time &&
      t.dueDate && 
      new Date(t.dueDate).toISOString().split('T')[0] > taskDateStr
    );
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!editingTask || !onUpdateTask) return;
    
    const updatedSubtasks = (editingTask.subtasks || []).filter((st: any) => st.id !== subtaskId);
    onUpdateTask(editingTask.id, { subtasks: updatedSubtasks });
    setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
  };

  const handleToggleSubtaskInContainer = (taskId: string, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateTask) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedSubtasks = (task.subtasks || []).map((st: any) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    onUpdateTask(taskId, { subtasks: updatedSubtasks });
  };

  const toggleTaskExpanded = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };
  
  // Wrapper to track task completions for fill animation
  const handleTaskToggle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    
    // Special handling for journal tasks - open write dialog instead of toggling
    if (task && (task.source as any) === 'journal') {
      window.dispatchEvent(new CustomEvent('openJournalWrite', {
        detail: {
          taskId: task.id,
          date: task.dueDate,
          time: task.time,
        }
      }));
      return;
    }
    
    if (task && !task.completed) {
      // Task is being completed, add to recently completed
      setRecentlyCompleted(prev => new Set(prev).add(taskId));
      // Remove from recently completed after animation
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 1000); // Match animation duration
    }
    onToggleTask(taskId);
  };

  // Drag-to-reschedule handlers
  const handleDragStart = (task: Task, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    
    // Only allow dragging tasks with time (not all-day tasks)
    if (!task.time || task.allDay) return;
    
    // Don't allow dragging auto-generated tasks
    if (task.source === 'water' || 
        task.source === 'medication' || 
        task.source === 'steps' || 
        task.source === 'sleep' ||
        task.source === 'work' ||
        task.source === 'school' ||
        task.source === 'workout' ||
        task.source === 'food' ||
        (task.source as any) === 'journal' ||
        task.source === 'winddown' ||
        task.source === 'startup' ||
        task.isContainer) return;
    
    setDraggingTask(task);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragCurrentY(clientY);
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingTask || !timelineRef.current) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragCurrentY(clientY);
    
    // Use actual timeline boundaries (adjustedStartTime, adjustedEndTime)
    // These are calculated above and account for task extensions
    const startMinutesWake = timeToMinutes(adjustedStartTime);
    const endMinutesSleep = timeToMinutes(adjustedEndTime);
    const timeRangeMinutes = endMinutesSleep - startMinutesWake;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const dragDeltaY = clientY - dragStartY;
    const timelineHeight = timelineRect.height;
    
    const minutesDelta = (dragDeltaY / timelineHeight) * timeRangeMinutes;
    const currentTaskMinutes = timeToMinutes(draggingTask.time!);
    let newTimeMinutes = currentTaskMinutes + minutesDelta;
    
    // Snap to nearest 15 minutes for preview
    newTimeMinutes = Math.round(newTimeMinutes / 15) * 15;
    
    // Allow dragging beyond current end time - we'll extend timeline dynamically
    // But still constrain to reasonable bounds (not before start, and max 2 hours after end)
    const maxEndMinutes = endMinutesSleep + 120; // Allow up to 2 hours extension
    newTimeMinutes = Math.max(startMinutesWake, Math.min(maxEndMinutes, newTimeMinutes));
    
    const newHours = Math.floor(newTimeMinutes / 60);
    const newMinutes = newTimeMinutes % 60;
    const previewTimeStr = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    
    setDragPreviewTime(previewTimeStr);
  };

  const handleDragEnd = () => {
    if (!draggingTask || !timelineRef.current) return;
    
    // Use actual timeline boundaries (adjustedStartTime, adjustedEndTime)
    const startMinutesWake = timeToMinutes(adjustedStartTime);
    const endMinutesSleep = timeToMinutes(adjustedEndTime);
    const timeRangeMinutes = endMinutesSleep - startMinutesWake;
    
    // Calculate the new time based on Y position
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const dragDeltaY = dragCurrentY - dragStartY;
    const timelineHeight = timelineRect.height;
    
    // Calculate how many minutes the drag represents
    const minutesDelta = (dragDeltaY / timelineHeight) * timeRangeMinutes;
    
    // Get current task time in minutes
    const currentTaskMinutes = timeToMinutes(draggingTask.time!);
    
    // Calculate new time in minutes
    let newTimeMinutes = currentTaskMinutes + minutesDelta;
    
    // Snap to the nearest 15 minutes
    newTimeMinutes = Math.round(newTimeMinutes / 15) * 15;
    
    // Allow dragging beyond current end time - we'll extend timeline dynamically
    // But still constrain to reasonable bounds (not before start, and max 2 hours after end)
    const maxEndMinutes = endMinutesSleep + 120; // Allow up to 2 hours extension
    newTimeMinutes = Math.max(startMinutesWake, Math.min(maxEndMinutes, newTimeMinutes));
    
    // Convert back to time string
    const newHours = Math.floor(newTimeMinutes / 60);
    const newMinutes = newTimeMinutes % 60;
    const newTimeStr = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    
    // Check for spacing conflicts with other tasks
    const allTimelineTasks = tasks.filter(t => t.time && !t.allDay && t.id !== draggingTask.id &&
      t.source !== 'medication' && t.source !== 'sleep' && t.source !== 'water' && t.source !== 'steps' &&
      t.source !== 'startup' && t.source !== 'winddown' && !t.parentId);
    
    // Find tasks that end before or at the new position
    const tasksBefore = allTimelineTasks.filter(t => {
      if (!t.endTime) return false;
      const tEnd = timeToMinutes(t.endTime);
      return tEnd <= newTimeMinutes;
    });
    
    // Find the task that ends closest to the new position
    let closestTask: Task | null = null;
    let closestEnd = -Infinity;
    if (tasksBefore.length > 0) {
      closestTask = tasksBefore.reduce((closest, t) => {
        if (!t.endTime) return closest;
        const tEnd = timeToMinutes(t.endTime);
        return tEnd > closestEnd ? t : closest;
      }, null as Task | null);
      if (closestTask?.endTime) {
        closestEnd = timeToMinutes(closestTask.endTime);
      }
    }
    
    // Find tasks that start after the new position
    const tasksAfter = allTimelineTasks.filter(t => {
      if (!t.time) return false;
      const tStart = timeToMinutes(t.time);
      return tStart >= newTimeMinutes;
    });
    
    // Find the task that starts closest to the new position
    let nextTask: Task | null = null;
    let nextStart = Infinity;
    if (tasksAfter.length > 0) {
      nextTask = tasksAfter.reduce((closest, t) => {
        if (!t.time) return closest;
        const tStart = timeToMinutes(t.time);
        return tStart < nextStart ? t : closest;
      }, null as Task | null);
      if (nextTask?.time) {
        nextStart = timeToMinutes(nextTask.time);
      }
    }
    
    // Calculate minimum spacing needed
    const MIN_SPACING_MINUTES = 15;
    let adjustedNewTimeMinutes = newTimeMinutes;
    let needsSpacingAdjustment = false;
    
    // Check spacing with previous task
    if (closestTask?.endTime && closestEnd > -Infinity) {
      const gapMinutes = newTimeMinutes - closestEnd;
      if (gapMinutes < MIN_SPACING_MINUTES && gapMinutes >= 0) {
        adjustedNewTimeMinutes = closestEnd + MIN_SPACING_MINUTES;
        needsSpacingAdjustment = true;
      }
    }
    
    // Check spacing with next task (if task has end time)
    if (draggingTask.endTime && nextTask?.time && nextStart < Infinity) {
      const taskEndMinutes = adjustedNewTimeMinutes + (timeToMinutes(draggingTask.endTime) - currentTaskMinutes);
      const gapMinutes = nextStart - taskEndMinutes;
      if (gapMinutes < MIN_SPACING_MINUTES && gapMinutes >= 0) {
        // Adjust backwards to maintain spacing
        adjustedNewTimeMinutes = nextStart - MIN_SPACING_MINUTES - (timeToMinutes(draggingTask.endTime) - currentTaskMinutes);
        needsSpacingAdjustment = true;
      }
    }
    
    // Ensure adjusted time is still within bounds
    adjustedNewTimeMinutes = Math.max(startMinutesWake, Math.min(maxEndMinutes, adjustedNewTimeMinutes));
    
    // Convert adjusted time back to string
    const adjustedHours = Math.floor(adjustedNewTimeMinutes / 60);
    const adjustedMins = adjustedNewTimeMinutes % 60;
    const finalTimeStr = `${String(adjustedHours).padStart(2, '0')}:${String(adjustedMins).padStart(2, '0')}`;
    
    // Only update if time actually changed
    if (finalTimeStr !== draggingTask.time && onUpdateTask) {
      // If task has an end time, calculate the new end time by maintaining the duration
      if (draggingTask.endTime) {
        const originalStartMinutes = timeToMinutes(draggingTask.time!);
        const originalEndMinutes = timeToMinutes(draggingTask.endTime);
        const durationMinutes = originalEndMinutes - originalStartMinutes;
        
        // Calculate new end time
        const newEndTimeMinutes = adjustedNewTimeMinutes + durationMinutes;
        const newEndHours = Math.floor(newEndTimeMinutes / 60);
        const newEndMins = newEndTimeMinutes % 60;
        const newEndTimeStr = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}`;
        
        // Update both time and endTime
        onUpdateTask(draggingTask.id, { time: finalTimeStr, endTime: newEndTimeStr });
      } else {
        // Update only the time
        onUpdateTask(draggingTask.id, { time: finalTimeStr });
      }
    }
    
    // Reset drag state
    setDraggingTask(null);
    setDragStartY(0);
    setDragCurrentY(0);
    setDragPreviewTime("");
    // Re-enable text selection
    document.body.style.userSelect = '';
  };

  const checkTasksOverlap = (tasks: Task[]): Task[] => {
    // Check all tasks in the current timeline view, not just at this specific time
    const allTimelineTasks = tasks.filter(t => t.time && !t.allDay && t.endTime);
    const overlapping: Task[] = [];
    
    // Check each task against all other tasks
    for (let i = 0; i < allTimelineTasks.length; i++) {
      const task1 = allTimelineTasks[i];
      const start1 = timeToMinutes(task1.time!);
      const end1 = timeToMinutes(task1.endTime!);
      
      for (let j = 0; j < allTimelineTasks.length; j++) {
        if (i === j) continue; // Skip self
        
        const task2 = allTimelineTasks[j];
        const start2 = timeToMinutes(task2.time!);
        const end2 = timeToMinutes(task2.endTime!);
        
        // Check if they overlap: task1 starts before task2 ends AND task1 ends after task2 starts
        if (start1 < end2 && end1 > start2) {
          if (!overlapping.includes(task1)) overlapping.push(task1);
          if (!overlapping.includes(task2)) overlapping.push(task2);
        }
      }
    }
    return overlapping;
  };

  const calculateFreeTime = (currentItem: TimelineItemType, nextItem: TimelineItemType | null): { hours: number; minutes: number; text: string } | null => {
    // Only calculate between actual tasks (not water/medication/step reminders or sleep)
    if (currentItem.tasks.length === 0) return null; // Skip if current is only a reminder
    if (!nextItem || nextItem.tasks.length === 0) return null; // Skip if next is only a reminder
    
    // Skip if current item is medication, water, steps, sleep, or work
    if (currentItem.tasks.every((t: Task) => t.source === 'medication' || t.source === 'water' || t.source === 'steps' || t.source === 'sleep' || t.source === 'work' || t.source?.startsWith('work-'))) return null;
    // Skip if next item is medication, water, steps, sleep, or work (using every)
    if (nextItem.tasks.every((t: Task) => t.source === 'medication' || t.source === 'water' || t.source === 'steps' || t.source === 'sleep' || t.source === 'work' || t.source?.startsWith('work-'))) return null;
    
    // Skip if current item has winddown or work tasks (don't show free time after winddown or work)
    if (currentItem.tasks.some((t: Task) => t.source === 'winddown' || t.source === 'work' || t.source?.startsWith('work-'))) return null;
    
    // Skip if next item has startup or work (don't show free time before these routines)
    // Never take winddown into account for free time calculation
    if (nextItem.tasks.some((t: Task) => t.source === 'startup' || t.source === 'work' || t.source?.startsWith('work-'))) return null;
    
    // Allow free time after startup tasks - they will be positioned below the task container
    
    // Use end time of current task if available, otherwise use start time
    const currentTask = currentItem.tasks.find(t => t.endTime);
    const currentEndTime = currentTask?.endTime || currentItem.time;
    const currentMinutes = timeToMinutes(currentEndTime);
    const nextMinutes = timeToMinutes(nextItem.time);
    const diffMinutes = nextMinutes - currentMinutes;
    
    // Don't show if less than 30 minutes
    if (diffMinutes < 30) return null;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours === 0 && minutes === 0) return null;
    
    let text = '';
    if (hours === 0) text = `${minutes}m`;
    else if (minutes === 0) text = `${hours}h`;
    else text = `${hours}h ${minutes}m`;
    
    return { hours, minutes, text };
  };

  // Timeline height is now calculated in useMemo above (before bounds calculation)
  // This ensures density map uses the correct height

  return (
    <div className="w-full mx-auto pl-2 pr-0 sm:px-2 md:px-4 mb-12">
      {/* Show add tasks prompt if only system tasks */}
      {showAddTasksPrompt && (
        <div className="text-center py-6 mb-4 text-muted-foreground">
          <p className="text-lg mb-2">Add tasks for your day</p>
          <p className="text-sm mb-4">Start planning your day by adding tasks</p>
          {onAddTaskClick && (
            <Button 
              onClick={() => onAddTaskClick("")} 
              className="rounded-full"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      )}
      <div className="py-8 pb-12 pr-1 sm:pr-2 overflow-visible">
        {/* Timeline Container with proper spacing */}
        <div 
          ref={timelineRef}
          className="relative overflow-visible" 
          style={{ 
            height: `${timelineHeight}px`,
            marginLeft: '7rem', // Space for time labels on the left
            marginRight: '1rem', // Space on the right
          }}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* New Modular Components */}
          <TimelineBar bounds={bounds} timelineHeight={timelineHeight} lastTaskEndTime={lastTaskEndTime} />
          
          <CurrentTimeIndicator 
            bounds={bounds} 
            isToday={isToday} 
            fillPercentage={fillPercentage}
            lastTaskEndTime={lastTaskEndTime}
            taskGroups={taskGroups}
            currentTime={currentTimeStr}
            isPastDate={isPastDate}
          />
          
          <ReminderDots
            timelineItems={timelineItems}
            bounds={bounds}
            isToday={isToday}
            currentTime={currentTimeStr}
            today={viewingDate}
            onWaterReminderClick={onWaterReminderClick}
            onMedicationReminderClick={handleMedicationReminderClick}
            onJournalReminderClick={() => {
              window.dispatchEvent(new CustomEvent('openJournalWrite'));
            }}
          />
          
          {/* Wake/Sleep Dots - Only show if actual sleep tasks exist */}
          {(() => {
            // Find wake/sleep items that actually have sleep tasks
            const wakeItem = timelineItems.find(item => 
              item.isWakeUp && item.tasks.some(t => t.source === 'sleep' && t.sleepAction === 'wake')
            );
            const sleepItem = timelineItems.find(item => 
              item.isBedTime && item.tasks.some(t => t.source === 'sleep' && t.sleepAction === 'sleep')
            );
            
            const dots = [];
            
            // Render wake dot only if actual wake task exists
            if (wakeItem) {
              const wakeTask = wakeItem.tasks.find(t => t.source === 'sleep' && t.sleepAction === 'wake');
              if (wakeTask) {
                const isCompleted = wakeTask.completed || false;
                const hasPassed = isToday && timeToMinutes(wakeItem.time) <= timeToMinutes(currentTimeStr);
                
                dots.push(
                  <TimelineDot
                    key="wake-dot"
                    time={wakeItem.time}
                    position={0}
                    type="wake"
                    isCompleted={isCompleted}
                    hasPassed={hasPassed}
                    onClick={() => {
                      onToggleTask(wakeTask.id);
                    }}
                    emoji="☀️"
                  />
                );
              }
            }
            
            // Render sleep dot only if actual sleep task exists
            if (sleepItem) {
              const sleepTask = sleepItem.tasks.find(t => t.source === 'sleep' && t.sleepAction === 'sleep');
              if (sleepTask) {
                const isCompleted = sleepTask.completed || false;
                const hasPassed = isToday && timeToMinutes(sleepItem.time) <= timeToMinutes(currentTimeStr);
                
                dots.push(
                  <TimelineDot
                    key="sleep-dot"
                    time={sleepItem.time}
                    position={100}
                    type="sleep"
                    isCompleted={isCompleted}
                    hasPassed={hasPassed}
                    onClick={() => {
                      onToggleTask(sleepTask.id);
                    }}
                    emoji="🌙"
                  />
                );
              }
            }
            
            return dots;
          })()}
          
          {/* Start/End Dots - Only show if no actual wake/sleep tasks exist */}
          {!timelineItems.some(item => 
            item.isWakeUp && item.tasks.some(t => t.source === 'sleep' && t.sleepAction === 'wake')
          ) && (
            <TimelineDot
              time={bounds.startTime}
              position={0}
              type="start"
              hasPassed={isToday && timeToMinutes(bounds.startTime) <= timeToMinutes(currentTimeStr)}
              emoji="☀️"
            />
          )}
          
          {!timelineItems.some(item => 
            item.isBedTime && item.tasks.some(t => t.source === 'sleep' && t.sleepAction === 'sleep')
          ) && (
            <TimelineDot
              time={bounds.endTime}
              position={100}
              type="end"
              hasPassed={isToday && timeToMinutes(bounds.endTime) <= timeToMinutes(currentTimeStr)}
              emoji="🌙"
            />
          )}
          
          {/* Candy Cone Patterns are now integrated into CurrentTimeIndicator fill - removed separate rendering */}
          
          {/* Task Time Labels on Timeline - REMOVED: Times are shown inside TaskGroupContainer */}
          
          {/* Task Groups */}
          {taskGroups.map((group) => (
            <TaskGroupContainer
              key={group.id}
              group={group}
              timelineHeight={timelineHeight}
              onToggleTask={onToggleTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onToggleSubtask={(taskId, subtaskId) => {
                const task = tasks.find(t => t.id === taskId);
                if (task && task.subtasks) {
                  const updatedSubtasks = task.subtasks.map(st =>
                    st.id === subtaskId ? { ...st, completed: !st.completed } : st
                  );
                  onUpdateTask?.(taskId, { subtasks: updatedSubtasks });
                }
              }}
              getSourceBadge={getSourceBadge}
              onSourceShortcut={handleSourceShortcut}
              onDragStart={handleDragStart}
              isDragging={(task) => draggingTask?.id === task.id}
              onEditTask={handleEditTask}
            />
          ))}

          {/* Free Time Segments - Rendered using algorithm */}
          {freeTimeSegments.map((segment) => {
            // Calculate position based on start percent (where the free time segment begins)
            const topPx = (segment.startPercent / 100) * timelineHeight;
            
            // Find the corresponding task group to position free time below it
            const correspondingGroup = taskGroups.find(group => {
              if (segment.id.includes('wakeup')) {
                // For wake up free time, find first group
                return group.id === segment.id.split('-')[2];
              } else if (segment.id.includes('sleep')) {
                // For sleep free time, find last group
                return group.id === segment.id.split('-')[1];
              } else {
                // For between tasks, find current group
                const groupId = segment.id.split('-')[1];
                return group.id === groupId;
              }
            });
            
            // Use group's end percent if available, otherwise use start percent
            const positionPercent = correspondingGroup 
              ? (correspondingGroup.endPercent || correspondingGroup.startPercent)
              : segment.startPercent;
            const finalTopPx = (positionPercent / 100) * timelineHeight;
            
            return (
              <div
                key={segment.id}
                className="absolute"
                style={{
                  top: `${finalTopPx + 16}px`,
                  left: '5rem',
                  right: '0.5rem',
                  zIndex: 10,
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                      {segment.displayText} Free time
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 sm:h-7 text-[10px] sm:text-xs flex-shrink-0"
                    onClick={() => {
                      if (onAddTaskClick) {
                        onAddTaskClick(segment.startTime);
                      }
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Task
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Drag Preview Time Indicator */}
          {draggingTask && dragPreviewTime && (() => {
            const previewMinutes = timeToMinutes(dragPreviewTime);
            // Use adjusted timeline boundaries for positioning
            const adjustedStartMins = timeToMinutes(adjustedStartTime);
            const adjustedEndMins = timeToMinutes(adjustedEndTime);
            // Extend preview area if dragging beyond current end
            const previewEndMins = Math.max(adjustedEndMins, previewMinutes + 30);
            const previewPosition = ((previewMinutes - adjustedStartMins) / (previewEndMins - adjustedStartMins)) * 100;
            
            // Clamp position to visible area
            const clampedPosition = Math.max(0, Math.min(100, previewPosition));
            
            return (
              <div 
                className="absolute z-50"
                style={{
                  left: '-7.5rem',
                  top: `${clampedPosition}%`,
                  transform: 'translateY(-50%)',
                }}
              >
                <div 
                  className="text-sm sm:text-base font-sans font-bold text-foreground whitespace-nowrap text-right w-20 sm:w-24"
                >
                  → {dragPreviewTime}
                </div>
              </div>
            );
          })()}

          {/* Start dot if no wake-up time */}
          {!timelineItems.some(item => item.isWakeUp) && timelineItems.length > 0 && (() => {
            const firstItem = timelineItems[0];
            const firstTimeMinutes = timeToMinutes(firstItem.time);
            
            // Check if time has passed (only for today)
            let hasPassed = false;
            if (isToday) {
              hasPassed = currentMinutes >= firstTimeMinutes;
            } else if (isPastDate) {
              hasPassed = true; // Always filled for past dates
            }
            
            // Use exact same grey as timeline bar - 'hsl(var(--muted))'
            const dotColor = hasPassed ? 'hsl(var(--primary))' : 'hsl(var(--muted))';
            const timelineGrey = 'hsl(var(--muted))'; // Explicit timeline bar grey
            
            // Calculate first item position for extension line
            const firstPosition = ((firstTimeMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
            
            return (
              <>
                {/* Extension line from start dot to first item - matches timeline bar grey */}
                  <div
                  className="absolute left-0 w-2"
                    style={{
                    top: '0%',
                    height: `${Math.max(0, firstPosition + 1)}%`, // Extend to first item
                    backgroundColor: hasPassed ? 'hsl(var(--primary))' : timelineGrey, // Same grey as timeline bar
                    zIndex: 45,
                  }}
                />
                      <div
                  className="absolute flex items-center z-40"
                          style={{ 
                    top: '0%',
                    left: '4px',
                            transform: 'translateY(-50%)',
                          }}
                        >
                  {/* Background blocker to prevent liquid fill overlap */}
                        <div 
                    className="absolute"
                          style={{ 
                      left: '-4px',
                      width: '16px',
                      height: '16px',
                      backgroundColor: hasPassed ? dotColor : timelineGrey, // Match timeline bar grey exactly
                      borderRadius: '50%',
                      zIndex: -1,
                    }}
                  />
                  <button className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 -translate-x-1/2`} style={{
                    backgroundColor: hasPassed ? dotColor : timelineGrey, // Match timeline bar grey exactly
                    borderColor: hasPassed ? dotColor : timelineGrey, // Match timeline bar grey exactly
                    boxShadow: 'none', // No shadow
                  }} />
                        </div>
                      <div 
                        className="absolute z-40"
                        style={{ 
                    top: '0%',
                    left: '-7.5rem',
                          transform: 'translateY(-50%)',
                        }}
                      >
                  <div className="text-sm sm:text-base font-sans text-muted-foreground whitespace-nowrap text-right w-20 sm:w-24">
                    {timelineItems[0].time}
                        </div>
                      </div>
              </>
                  );
                })()}

          {/* Timeline Items (Dots) - REMOVED: All rendering now handled by new modular components */}

        </div>
      </div>

      {/* Combined Reminder Dialog */}
      <Dialog open={combinedReminderOpen} onOpenChange={setCombinedReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <span>Water & Medication Reminder</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCombinedReminderOpen(false);
                  setLocation('/health');
                }}
                className="text-xs gap-1"
              >
                Go to Health
                <ExternalLink className="w-3 h-3" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <Label htmlFor="water-amount">Water Amount ({getWaterUnit()})</Label>
              <div className="flex gap-2 mb-3">
                {[250, 350, 500, 750, 1000].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={waterAmount === String(amount) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWaterAmount(String(amount))}
                    className="flex-1"
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              <Input
                id="water-amount"
                type="number"
                value={waterAmount}
                onChange={(e) => setWaterAmount(e.target.value)}
                placeholder="Custom amount"
              />
            </div>
            
            <div>
              <Label className="mb-3 block">Medications</Label>
              {getMedicationsForTime(selectedReminderTime).map((med: any) => (
                <div key={med.id} className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/50 mb-2">
                  <Checkbox
                    id={`med-${med.id}`}
                    checked={medicationTaken}
                    onCheckedChange={(checked) => setMedicationTaken(checked as boolean)}
                  />
                  <Label htmlFor={`med-${med.id}`} className="cursor-pointer flex-1">
                    <div className="font-medium">{med.name}</div>
                    <div className="text-xs text-muted-foreground">{med.dosage}</div>
                  </Label>
                </div>
              ))}
            </div>

            <Button onClick={handleCombinedReminderSubmit} className="w-full">
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medication Only Dialog */}
      <Dialog open={medicationDialogOpen} onOpenChange={setMedicationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💊</span>
                Medication Reminder
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMedicationDialogOpen(false);
                  setLocation('/health');
                }}
                className="text-xs gap-1"
              >
                Go to Health
                <ExternalLink className="w-3 h-3" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{selectedMedicationTime}</span>
            </div>
            
            {getMedicationsForTime(selectedMedicationTime).map((med: any) => {
              const today = new Date().toISOString().split('T')[0];
              const takenEntry = `${today}_${selectedMedicationTime}`;
              const isTaken = med.takenDates?.includes(takenEntry);
              
              return (
                <div key={med.id} className="p-4 rounded-lg border-2 bg-card space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="font-semibold text-lg">{med.name}</div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isTaken ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {isTaken ? '✓ Taken' : '⏱ Pending'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">Dosage:</span>
                      <span className="text-foreground font-semibold">{med.dosage}</span>
                    </div>
                    {med.notes && (
                      <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                        <span className="font-medium">Note:</span> {med.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <Button onClick={handleMedicationSubmit} className="w-full">
              Mark as Taken
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step Counter Dialog */}
      <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👟</span>
                Log Steps
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStepDialogOpen(false);
                  setLocation('/sport');
                }}
                className="text-xs gap-1"
              >
                Go to Sport
                <ExternalLink className="w-3 h-3" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{selectedStepTime}</span>
            </div>
            
            <div>
              <Label htmlFor="step-count">Number of Steps</Label>
              <Input
                id="step-count"
                type="number"
                min="0"
                value={stepCount}
                onChange={(e) => setStepCount(e.target.value)}
                placeholder="e.g., 5000"
                className="mt-2"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter the total steps you've taken so far today
              </p>
            </div>

            <Button 
              onClick={handleStepSubmit} 
              className="w-full"
              disabled={!stepCount || parseInt(stepCount) <= 0}
            >
              Save Steps
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meditation Dialog */}
      <Dialog open={meditationDialogOpen} onOpenChange={setMeditationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧘</span>
                Complete Meditation
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMeditationDialogOpen(false);
                  setLocation('/health');
                }}
                className="text-xs gap-1"
              >
                Go to Health
                <ExternalLink className="w-3 h-3" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{selectedMeditationTime}</span>
            </div>
            
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                Take a moment to breathe and center yourself.
              </p>
              <div className="text-6xl mb-4">🧘‍♀️</div>
              <p className="text-xs text-muted-foreground">
                Mark this meditation session as complete
              </p>
            </div>

            <Button 
              onClick={handleMeditationSubmit} 
              className="w-full"
            >
              Complete Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Glucose Check Dialog */}
      <Dialog open={glucoseDialogOpen} onOpenChange={setGlucoseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🩸</span>
                Log Blood Glucose
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGlucoseDialogOpen(false);
                  setLocation('/health');
                }}
                className="text-xs gap-1"
              >
                Go to Health
                <ExternalLink className="w-3 h-3" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{selectedGlucoseTime}</span>
            </div>
            
            <div>
              <Label htmlFor="glucose-value">Blood Glucose Reading</Label>
              <Input
                id="glucose-value"
                type="number"
                min="0"
                step="0.1"
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
                placeholder="e.g., 120"
                className="mt-2"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter your blood glucose reading (mg/dL or mmol/L)
              </p>
            </div>

            <Button 
              onClick={handleGlucoseSubmit} 
              className="w-full"
              disabled={!glucoseValue || parseFloat(glucoseValue) <= 0}
            >
              Save Reading
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-title">Task Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>

            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Emoji</Label>
              <EmojiPicker 
                value={editEmoji}
                onChange={setEditEmoji}
                category="common"
              />
            </div>

            <div>
              <Label htmlFor="edit-time">Start Time</Label>
              <Input
                id="edit-time"
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-end-time">End Time (optional)</Label>
              <Input
                id="edit-end-time"
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                placeholder="Leave empty for no end time"
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-color">Task Color (optional)</Label>
              <div className="flex items-center gap-3 mt-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={editColor || "#8b5cf6"}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground flex-1">
                  {editColor || "Using theme color"}
                </span>
                {editColor && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditColor("")}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-repeat">Repeat</Label>
              <Select value={editRepeat} onValueChange={(value: any) => setEditRepeat(value)}>
                <SelectTrigger id="edit-repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekdays">Every weekday (Mon-Fri)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subtasks</Label>
              <div className="mt-2 space-y-2">
                {editingTask?.subtasks?.map((subtask: any) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(subtask.id)}
                    />
                    <span className={`flex-1 text-sm ${subtask.completed ? 'line-through opacity-60' : ''}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add subtask..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleAddSubtask}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Photos / Screenshots */}
            <div>
              <Label>Photos / Screenshots</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              
              {editingTask?.attachments && editingTask.attachments.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {editingTask.attachments.map((attachment: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={attachment}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteAttachment(index)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingTask(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
            
            {/* Delete button at bottom */}
            {onDeleteTask && editingTask && (
              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  onClick={() => editingTask && handleDeleteClick(editingTask)}
                  className="w-full"
                >
                  Delete Task
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{taskToDelete?.title}"?
            </p>
            
            {taskToDelete && hasFutureInstances(taskToDelete) && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                  {taskToDelete.repeat ? (
                    <>🔁 Recurring {taskToDelete.repeat} task</>
                  ) : (
                    <>This task has future instances</>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {taskToDelete.repeat 
                    ? `This ${taskToDelete.repeat} task will repeat in the future. Delete just today's instance or all future occurrences?`
                    : 'Choose whether to delete only today\'s task or all future occurrences.'
                  }
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                onClick={() => handleDeleteConfirm(false)}
                className="w-full"
              >
                Delete Today Only
              </Button>
              
              {taskToDelete && hasFutureInstances(taskToDelete) && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteConfirm(true)}
                  className="w-full"
                >
                  Delete Today & All Future
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      {imageViewerTask && imageViewerTask.attachments && imageViewerTask.attachments.length > 0 && (
        <ImageViewerDialog
          images={imageViewerTask.attachments}
          open={imageViewerOpen}
          onOpenChange={(open) => {
            setImageViewerOpen(open);
            if (!open) setImageViewerTask(null);
          }}
          initialIndex={0}
        />
      )}

      {/* Work Dialog */}
      <Dialog open={workDialogOpen} onOpenChange={setWorkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>💼 Work</DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div>Loading...</div>}>
          <Work />
          </Suspense>
        </DialogContent>
      </Dialog>
    </div>
  );
}

