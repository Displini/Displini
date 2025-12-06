import { useState, useEffect } from "react";
import { Moon, Sun, Clock, Settings, Plus, Edit, Trash2, Bell, X, AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { colors } from "@/lib/designSystem";

interface SleepSchedule {
  id: string;
  name: string;
  bedtime: string;
  wakeTime: string;
  windDownDuration: number;
  startUpDuration: number;
  isActive: boolean;
  days: string[];
  windDownActivities: WindDownActivity[];
  startUpActivities: StartUpActivity[];
  windDownSubtasks?: SleepScheduleSubtask[];
  startUpSubtasks?: SleepScheduleSubtask[];
  windDownColor?: string;
  startUpColor?: string;
}

interface WindDownActivity {
  id: string;
  name: string;
  duration: number;
  description: string;
  isActive: boolean;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  color?: string;
}

interface StartUpActivity {
  id: string;
  name: string;
  duration: number;
  description: string;
  isActive: boolean;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  color?: string;
}

interface SleepScheduleSubtask {
  id: string;
  title: string;
  completed: boolean;
}

interface SleepScheduleFeatureProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SleepScheduleFeature({ isOpen, onClose }: SleepScheduleFeatureProps) {
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<SleepSchedule | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'winddown' | 'startup'>('overview');
  const [showWindDownDialog, setShowWindDownDialog] = useState(false);
  const [showStartUpDialog, setShowStartUpDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<WindDownActivity | StartUpActivity | null>(null);
  const [activityType, setActivityType] = useState<'winddown' | 'startup'>('winddown');
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [scheduleNeedingSetup, setScheduleNeedingSetup] = useState<SleepSchedule | null>(null);

  const [schedules, setSchedules] = useState<SleepSchedule[]>([]);

  // Load schedules from localStorage on component mount
  useEffect(() => {
    const savedSchedules = localStorage.getItem('sleepSchedules');
    if (savedSchedules) {
      const parsedSchedules = JSON.parse(savedSchedules);
      setSchedules(parsedSchedules);
      
      // Clean up tasks from inactive schedules
      const activeScheduleIds = parsedSchedules
        .filter((s: SleepSchedule) => s.isActive)
        .map((s: SleepSchedule) => s.id);
      
      const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTasks = existingTasks.filter((t: any) => {
        // Check sleep tasks
        if (t.source === 'sleep' && (t.sleepAction === 'wake' || t.sleepAction === 'sleep')) {
          const taskScheduleId = t.id.split('_')[2];
          return activeScheduleIds.includes(taskScheduleId);
        }
        // Check winddown/startup tasks
        if (t.source === 'winddown' || t.source === 'startup') {
          const taskScheduleId = t.id.split('_')[1];
          return activeScheduleIds.includes(taskScheduleId);
        }
        return true;
      });
      
      if (filteredTasks.length !== existingTasks.length) {
        localStorage.setItem('todos', JSON.stringify(filteredTasks));
        window.dispatchEvent(new Event('todosUpdated'));
      }
    }
  }, []);

  // Save schedules to localStorage whenever schedules change
  useEffect(() => {
    if (schedules.length > 0) {
      localStorage.setItem('sleepSchedules', JSON.stringify(schedules));
    }
  }, [schedules]);

  // Automatically create timeline tasks when component opens if it's a scheduled day
  useEffect(() => {
    if (!isOpen || schedules.length === 0) return;
    
    const today = new Date();
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todayStr = today.toISOString().split('T')[0];
    
    schedules.forEach(schedule => {
      if (schedule.isActive && schedule.days.includes(todayDayName)) {
        // Check if sleep markers already exist for today with this schedule
        const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
        const hasSleepMarkers = existingTasks.some((t: any) => 
          t.dueDate === todayStr && 
          t.source === 'sleep' &&
          (t.sleepAction === 'wake' || t.sleepAction === 'sleep')
        );
        
        if (!hasSleepMarkers) {
          createTasksFromSchedule(schedule, false); // Don't show alert on auto-create
        }
      }
    });
  }, [isOpen]); // Run when dialog opens

  const [newSchedule, setNewSchedule] = useState({
    name: '',
    bedtime: '',
    wakeTime: '',
    days: [] as string[],
    enableStartUp: false,
    enableWindDown: false,
    startUpDuration: 0,
    windDownDuration: 0,
    startUpSubtasks: [] as SleepScheduleSubtask[],
    windDownSubtasks: [] as SleepScheduleSubtask[],
    startUpColor: '#F59E0B', // Default orange
    windDownColor: '#8B5CF6' // Default purple
  });

  // Calculate durations from activities
  const calculateDurations = (schedule: SleepSchedule) => {
    const windDownDuration = schedule.windDownActivities
      .filter(a => a.isActive)
      .reduce((total, activity) => total + activity.duration, 0);
    const startUpDuration = schedule.startUpActivities
      .filter(a => a.isActive)
      .reduce((total, activity) => total + activity.duration, 0);
    return { windDownDuration, startUpDuration };
  };

  // Calculate estimated sleep time (from bedtime to wake time)
  const calculateEstimatedSleepTime = (wakeTime: string, bedtime: string) => {
    if (!wakeTime || !bedtime) return null;
    
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    
    const wakeMinutes = wakeHour * 60 + wakeMin;
    const bedMinutes = bedHour * 60 + bedMin;
    
    // Sleep crosses midnight (bedtime is before wake time in clock hours)
    // Example: bed at 22:00, wake at 07:00 = 9 hours
    let totalMinutes;
    if (bedMinutes >= wakeMinutes) {
      // Bedtime is later in the day than wake time, so it crosses midnight
      totalMinutes = (24 * 60 - bedMinutes) + wakeMinutes;
    } else {
      // This shouldn't happen in normal use (wake before bed same day)
      // But handle it anyway
      totalMinutes = wakeMinutes - bedMinutes;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const abbreviateDay = (day: string) => {
    switch (day) {
      case 'Monday':
        return 'Mon';
      case 'Tuesday':
        return 'Tue';
      case 'Wednesday':
        return 'Wed';
      case 'Thursday':
        return 'Thu';
      case 'Friday':
        return 'Fri';
      case 'Saturday':
        return 'Sat';
      case 'Sunday':
        return 'Sun';
      default:
        return day;
    }
  };

  const handleAddSchedule = () => {
    if (newSchedule.name.trim() && newSchedule.bedtime && newSchedule.wakeTime) {
      // Create single activity for startup/winddown with subtasks
      const startUpActivity: StartUpActivity | null = newSchedule.enableStartUp ? {
        id: 'startup-main',
        name: 'Start Up',
        duration: newSchedule.startUpDuration,
        description: '',
        isActive: true,
        subtasks: newSchedule.startUpSubtasks
      } : null;
      
      const windDownActivity: WindDownActivity | null = newSchedule.enableWindDown ? {
        id: 'winddown-main',
        name: 'Wind Down',
        duration: newSchedule.windDownDuration,
        description: '',
        isActive: true,
        subtasks: newSchedule.windDownSubtasks
      } : null;
      
      const schedule: SleepSchedule = {
        id: Date.now().toString(),
        name: newSchedule.name,
        bedtime: newSchedule.bedtime,
        wakeTime: newSchedule.wakeTime,
        windDownDuration: newSchedule.enableWindDown ? newSchedule.windDownDuration : 0,
        startUpDuration: newSchedule.enableStartUp ? newSchedule.startUpDuration : 0,
        isActive: true,
        days: newSchedule.days,
        windDownActivities: windDownActivity ? [windDownActivity] : [],
        startUpActivities: startUpActivity ? [startUpActivity] : [],
        windDownSubtasks: newSchedule.windDownSubtasks,
        startUpSubtasks: newSchedule.startUpSubtasks,
        windDownColor: newSchedule.windDownColor,
        startUpColor: newSchedule.startUpColor
      };
      
      setSchedules([...schedules, schedule]);
      setNewSchedule({
        name: '',
        bedtime: '',
        wakeTime: '',
        days: [],
        enableStartUp: false,
        enableWindDown: false,
        startUpDuration: 0,
        windDownDuration: 0,
        startUpSubtasks: [],
        windDownSubtasks: [],
        startUpColor: '#F59E0B',
        windDownColor: '#8B5CF6'
      });
      setShowAddSchedule(false);
      
      // Create ken markers immediately if it's a scheduled day
      const today = new Date();
      const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
      if (schedule.days.includes(todayDayName)) {
        setTimeout(() => createTasksFromSchedule(schedule, true), 200);
      }
    }
  };

  const handleEditSchedule = (schedule: SleepSchedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      name: schedule.name,
      bedtime: schedule.bedtime,
      wakeTime: schedule.wakeTime,
      days: schedule.days
    });
    setShowEditSchedule(true);
  };

  const handleUpdateSchedule = () => {
    if (editingSchedule && newSchedule.name.trim() && newSchedule.bedtime && newSchedule.wakeTime) {
      const { windDownDuration, startUpDuration } = calculateDurations(editingSchedule);
      const updatedSchedule: SleepSchedule = {
        ...editingSchedule,
        name: newSchedule.name,
        bedtime: newSchedule.bedtime,
        wakeTime: newSchedule.wakeTime,
        windDownDuration,
        startUpDuration,
        days: newSchedule.days
      };
      
      setSchedules(schedules.map(schedule => 
        schedule.id === editingSchedule.id ? updatedSchedule : schedule
      ));
      setEditingSchedule(null);
      setNewSchedule({
        name: '',
        bedtime: '',
        wakeTime: '',
        days: []
      });
      setShowEditSchedule(false);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    // Check if the schedule being deleted is the one being edited
    if (editingSchedule?.id === id) {
      setEditingSchedule(null);
      setShowWindDownDialog(false);
      setShowStartUpDialog(false);
    }
    
    // Remove sleep markers and all associated tasks from timeline if this schedule was active
    const deletedSchedule = schedules.find(s => s.id === id);
    if (deletedSchedule?.isActive) {
      // Remove tasks for past 30 days and next 335 days (same range as creation)
      const today = new Date();
      const taskIdsToRemove = new Set<string>();
      
      for (let i = -30; i < 335; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + i);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        // Add sleep task IDs
        taskIdsToRemove.add(`sleep_wake_${deletedSchedule.id}_${targetDateStr}`);
        taskIdsToRemove.add(`sleep_bed_${deletedSchedule.id}_${targetDateStr}`);
        
        // Add winddown task IDs
        deletedSchedule.windDownActivities.forEach((activity, activityIndex) => {
          taskIdsToRemove.add(`winddown_${deletedSchedule.id}_${activity.id}_${targetDateStr}_${activityIndex}`);
        });
        
        // Add startup task IDs
        deletedSchedule.startUpActivities.forEach((activity, activityIndex) => {
          taskIdsToRemove.add(`startup_${deletedSchedule.id}_${activity.id}_${targetDateStr}_${activityIndex}`);
        });
      }
      
      const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTasks = existingTasks.filter((t: any) => !taskIdsToRemove.has(t.id));
      localStorage.setItem('todos', JSON.stringify(filteredTasks));
      
      localStorage.removeItem('sleepSchedule');
      window.dispatchEvent(new Event('todosUpdated'));
    }
    
    setSchedules(schedules.filter(schedule => schedule.id !== id));
  };

  const toggleSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    const updatedSchedules = schedules.map(s => 
      s.id === id 
        ? { ...s, isActive: !s.isActive }
        : s
    );
    setSchedules(updatedSchedules);

    if (!schedule.isActive) {
      // Schedule is being enabled - create tasks if it's a scheduled day
      const today = new Date();
      const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
      if (schedule.days.includes(todayDayName)) {
        createTasksFromSchedule(schedule, true); // Show message when enabling
      }
    } else {
      // Schedule is being disabled - remove ALL tasks (sleep, winddown, startup) for this schedule across ALL dates
      const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTasks = existingTasks.filter((t: any) => {
        // Remove sleep tasks for this schedule
        if (t.source === 'sleep' && (t.sleepAction === 'wake' || t.sleepAction === 'sleep')) {
          // Task IDs are formatted as: sleep_wake_${schedule.id}_${date} or sleep_bed_${schedule.id}_${date}
          const taskScheduleId = t.id.split('_')[2];
          return taskScheduleId !== id;
        }
        // Remove winddown/startup tasks for this schedule
        if (t.source === 'winddown' || t.source === 'startup') {
          // Task IDs are formatted as: winddown_${schedule.id}_${activity.id}_${date}_${index}
          // or: startup_${schedule.id}_${activity.id}_${date}_${index}
          const taskScheduleId = t.id.split('_')[1];
          return taskScheduleId !== id;
        }
        return true;
      });
      localStorage.setItem('todos', JSON.stringify(filteredTasks));
      
      // Only remove sleepSchedule from localStorage if no other active schedules exist
      const activeSchedules = updatedSchedules.filter(s => s.isActive);
      if (activeSchedules.length === 0) {
        localStorage.removeItem('sleepSchedule');
      } else {
        // Update sleepSchedule with the first active schedule's times
        const firstActiveSchedule = activeSchedules[0];
        const sleepScheduleForTimeline = {
          wakeTime: firstActiveSchedule.wakeTime,
          bedtime: firstActiveSchedule.bedtime,
          sleepTime: firstActiveSchedule.bedtime,
          daily: {
            wakeTime: firstActiveSchedule.wakeTime,
            sleepTime: firstActiveSchedule.bedtime
          }
        };
        localStorage.setItem('sleepSchedule', JSON.stringify(sleepScheduleForTimeline));
      }
      
      window.dispatchEvent(new Event('todosUpdated'));
    }
  };

  const addWindDownActivity = (scheduleId: string, activity: Omit<WindDownActivity, 'id'>) => {
    const newActivity: WindDownActivity = {
      ...activity,
      id: Date.now().toString()
    };
    
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const updatedActivities = [...schedule.windDownActivities, newActivity];
        const windDownDuration = updatedActivities
          .filter(a => a.isActive)
          .reduce((total, activity) => total + activity.duration, 0);
        
        const updated = { 
          ...schedule, 
          windDownActivities: updatedActivities,
          windDownDuration
        };
        
        // Remove all winddown/startup tasks for this schedule across all dates and recreate them
        if (schedule.isActive) {
          const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
          const filteredTasks = existingTasks.filter((t: any) => {
            // Remove all winddown/startup tasks for this schedule
            if (t.source === 'winddown' || t.source === 'startup') {
              // Check if task belongs to this schedule by checking the schedule ID in the task ID
              const taskScheduleId = t.id.split('_')[1];
              return taskScheduleId !== scheduleId;
            }
            return true;
          });
          localStorage.setItem('todos', JSON.stringify(filteredTasks));
          
          // Recreate tasks for all scheduled days
          setTimeout(() => createTasksFromSchedule(updated, false), 100);
        }
        return updated;
      }
      return schedule;
    }));
  };

  const addStartUpActivity = (scheduleId: string, activity: Omit<StartUpActivity, 'id'>) => {
    const newActivity: StartUpActivity = {
      ...activity,
      id: Date.now().toString()
    };
    
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const updatedActivities = [...schedule.startUpActivities, newActivity];
        const startUpDuration = updatedActivities
          .filter(a => a.isActive)
          .reduce((total, activity) => total + activity.duration, 0);
        
        const updated = { 
          ...schedule, 
          startUpActivities: updatedActivities,
          startUpDuration
        };
        
        // Remove all winddown/startup tasks for this schedule across all dates and recreate them
        if (schedule.isActive) {
          const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
          const filteredTasks = existingTasks.filter((t: any) => {
            // Remove all winddown/startup tasks for this schedule
            if (t.source === 'winddown' || t.source === 'startup') {
              // Check if task belongs to this schedule by checking the schedule ID in the task ID
              const taskScheduleId = t.id.split('_')[1];
              return taskScheduleId !== scheduleId;
            }
            return true;
          });
          localStorage.setItem('todos', JSON.stringify(filteredTasks));
          
          // Recreate tasks for all scheduled days
          setTimeout(() => createTasksFromSchedule(updated, false), 100);
        }
        return updated;
      }
      return schedule;
    }));
  };

  const updateWindDownActivity = (scheduleId: string, activityId: string, updates: Partial<WindDownActivity>) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const updatedActivities = schedule.windDownActivities.map(activity => 
          activity.id === activityId ? { ...activity, ...updates } : activity
        );
        const windDownDuration = updatedActivities
          .filter(a => a.isActive)
          .reduce((total, activity) => total + activity.duration, 0);
        
        const updated = {
          ...schedule,
          windDownActivities: updatedActivities,
          windDownDuration
        };
        
        // Remove all winddown/startup tasks for this schedule across all dates and recreate them
        if (schedule.isActive) {
          const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
          const filteredTasks = existingTasks.filter((t: any) => {
            // Remove all winddown/startup tasks for this schedule
            if (t.source === 'winddown' || t.source === 'startup') {
              // Check if task belongs to this schedule by checking the schedule ID in the task ID
              // Task IDs are formatted as: winddown_${schedule.id}_${activity.id}_${date}_${index}
              // or: startup_${schedule.id}_${activity.id}_${date}_${index}
              const taskScheduleId = t.id.split('_')[1];
              return taskScheduleId !== scheduleId;
            }
            return true;
          });
          localStorage.setItem('todos', JSON.stringify(filteredTasks));
          
          // Recreate tasks for all scheduled days
          setTimeout(() => createTasksFromSchedule(updated, false), 100);
        }
        
        return updated;
      }
      return schedule;
    }));
  };

  const updateStartUpActivity = (scheduleId: string, activityId: string, updates: Partial<StartUpActivity>) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const updatedActivities = schedule.startUpActivities.map(activity => 
          activity.id === activityId ? { ...activity, ...updates } : activity
        );
        const startUpDuration = updatedActivities
          .filter(a => a.isActive)
          .reduce((total, activity) => total + activity.duration, 0);
        
        const updated = {
          ...schedule,
          startUpActivities: updatedActivities,
          startUpDuration
        };
        
        // Remove all winddown/startup tasks for this schedule across all dates and recreate them
        if (schedule.isActive) {
          const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
          const filteredTasks = existingTasks.filter((t: any) => {
            // Remove all winddown/startup tasks for this schedule
            if (t.source === 'winddown' || t.source === 'startup') {
              // Check if task belongs to this schedule by checking the schedule ID in the task ID
              // Task IDs are formatted as: winddown_${schedule.id}_${activity.id}_${date}_${index}
              // or: startup_${schedule.id}_${activity.id}_${date}_${index}
              const taskScheduleId = t.id.split('_')[1];
              return taskScheduleId !== scheduleId;
            }
            return true;
          });
          localStorage.setItem('todos', JSON.stringify(filteredTasks));
          
          // Recreate tasks for all scheduled days
          setTimeout(() => createTasksFromSchedule(updated, false), 100);
        }
        
        return updated;
      }
      return schedule;
    }));
  };

  const deleteWindDownActivity = (scheduleId: string, activityId: string) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const updatedActivities = schedule.windDownActivities.filter(activity => activity.id !== activityId);
        const windDownDuration = updatedActivities
          .filter(a => a.isActive)
          .reduce((total, activity) => total + activity.duration, 0);
        
        const updated = {
          ...schedule,
          windDownActivities: updatedActivities,
          windDownDuration
        };
        
        // Remove all winddown/startup tasks for this schedule across all dates and recreate them
        if (schedule.isActive) {
          const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
          const filteredTasks = existingTasks.filter((t: any) => {
            // Remove all winddown/startup tasks for this schedule
            if (t.source === 'winddown' || t.source === 'startup') {
              // Check if task belongs to this schedule by checking the schedule ID in the task ID
              // Task IDs are formatted as: winddown_${schedule.id}_${activity.id}_${date}_${index}
              // or: startup_${schedule.id}_${activity.id}_${date}_${index}
              const taskScheduleId = t.id.split('_')[1];
              return taskScheduleId !== scheduleId;
            }
            return true;
          });
          localStorage.setItem('todos', JSON.stringify(filteredTasks));
          
          // Recreate tasks for all scheduled days
          setTimeout(() => createTasksFromSchedule(updated, false), 100);
        }
        
        return updated;
      }
      return schedule;
    }));
  };

  const deleteStartUpActivity = (scheduleId: string, activityId: string) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const updatedActivities = schedule.startUpActivities.filter(activity => activity.id !== activityId);
        const startUpDuration = updatedActivities
          .filter(a => a.isActive)
          .reduce((total, activity) => total + activity.duration, 0);
        
        const updated = {
          ...schedule,
          startUpActivities: updatedActivities,
          startUpDuration
        };
        
        // Remove all winddown/startup tasks for this schedule across all dates and recreate them
        if (schedule.isActive) {
          const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
          const filteredTasks = existingTasks.filter((t: any) => {
            // Remove all winddown/startup tasks for this schedule
            if (t.source === 'winddown' || t.source === 'startup') {
              // Check if task belongs to this schedule by checking the schedule ID in the task ID
              // Task IDs are formatted as: winddown_${schedule.id}_${activity.id}_${date}_${index}
              // or: startup_${schedule.id}_${activity.id}_${date}_${index}
              const taskScheduleId = t.id.split('_')[1];
              return taskScheduleId !== scheduleId;
            }
            return true;
          });
          localStorage.setItem('todos', JSON.stringify(filteredTasks));
          
          // Recreate tasks for all scheduled days
          setTimeout(() => createTasksFromSchedule(updated, false), 100);
        }
        
        return updated;
      }
      return schedule;
    }));
  };

  const createTasksFromSchedule = (schedule: SleepSchedule, showMessage = false) => {
    const tasks: any[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Get current time to avoid creating tasks for past times
    const now = new Date();
    
    // Create sleep tasks for the past 30 days and next 335 days (365 total)
    for (let i = -30; i < 335; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDateStr = targetDate.toISOString().split('T')[0];
        // Create wake up marker (for timeline visualization)
        tasks.push({
          id: `sleep_wake_${schedule.id}_${targetDateStr}`,
          title: 'Wake Up',
          notes: 'Wake up time',
          time: schedule.wakeTime,
          dueDate: targetDateStr,
          completed: false,
          allDay: false,
          source: 'sleep',
          sleepAction: 'wake',
          emoji: '☀️',
          color: '#F59E0B'
        });
        
        // Create bedtime marker (for timeline visualization)
        tasks.push({
          id: `sleep_bed_${schedule.id}_${targetDateStr}`,
          title: 'Bedtime',
          notes: 'Time to sleep',
          time: schedule.bedtime,
          dueDate: targetDateStr,
          completed: false,
          allDay: false,
          source: 'sleep',
          sleepAction: 'sleep',
          emoji: '🌙',
          color: '#8B5CF6'
        });
    }
    
    // Create wind down tasks for the past 30 days and next 335 days (365 total)
    schedule.windDownActivities.forEach((activity, index) => {
      if (activity.isActive) {
        for (let i = -30; i < 335; i++) {
                    const targetDate = new Date(today);
          targetDate.setDate(targetDate.getDate() + i);
          const targetDateStr = targetDate.toISOString().split('T')[0];
          const windDownTime = new Date(targetDate);
          const [hours, minutes] = schedule.bedtime.split(':').map(Number);
          windDownTime.setHours(hours, minutes, 0, 0);
          
          // Calculate start time by subtracting total wind down duration and adding accumulated duration of previous activities
          let accumulatedDuration = 0;
          for (let j = 0; j < index; j++) {
            if (schedule.windDownActivities[j].isActive) {
              accumulatedDuration += schedule.windDownActivities[j].duration;
            }
          }
          
          const activityTime = new Date(windDownTime.getTime() - (schedule.windDownDuration * 60000) + accumulatedDuration * 60000);
          const activityEndTime = new Date(activityTime.getTime() + activity.duration * 60000);
            
            tasks.push({
              id: `winddown_${schedule.id}_${activity.id}_${targetDateStr}_${index}`,
              title: `Wind Down: ${activity.name}`,
              notes: activity.description,
              time: activityTime.toTimeString().slice(0, 5),
              endTime: activityEndTime.toTimeString().slice(0, 5),
              dueDate: targetDateStr,
              completed: false,
              allDay: false,
              source: 'winddown',
              emoji: '🌙',
              // No color property - winddown tasks should not show filled color on timeline
              subtasks: activity.subtasks?.map(st => ({
                id: `${st.id}_${targetDateStr}`,
                text: st.title,
                completed: st.completed
              }))
            });
        }
      }
    });

    // Create start up tasks for the past 30 days and next 335 days (365 total)
    schedule.startUpActivities.forEach((activity, index) => {
      if (activity.isActive) {
        for (let i = -30; i < 335; i++) {
          const targetDate = new Date(today);
          targetDate.setDate(targetDate.getDate() + i);
          const targetDateStr = targetDate.toISOString().split('T')[0];
          
          const startUpTime = new Date(targetDate);
          const [hours, minutes] = schedule.wakeTime.split(':').map(Number);
          startUpTime.setHours(hours, minutes, 0, 0);
          
          // Calculate start time by adding accumulated duration of previous activities (same logic as winddown)
          let accumulatedDuration = 0;
          for (let j = 0; j < index; j++) {
            if (schedule.startUpActivities[j].isActive) {
              accumulatedDuration += schedule.startUpActivities[j].duration;
            }
          }
          
          // Start time is wake time + accumulated duration of previous activities
          const activityTime = new Date(startUpTime.getTime() + accumulatedDuration * 60000);
          // End time is start time + current activity duration
          const activityEndTime = new Date(activityTime.getTime() + activity.duration * 60000);
          
          tasks.push({
            id: `startup_${schedule.id}_${activity.id}_${targetDateStr}_${index}`,
            title: `Start Up: ${activity.name}`,
            notes: activity.description,
            time: activityTime.toTimeString().slice(0, 5),
            endTime: activityEndTime.toTimeString().slice(0, 5),
            dueDate: targetDateStr,
            completed: false,
            allDay: false,
            source: 'startup',
            emoji: '☀️',
            // No color property - startup tasks should not show filled color on timeline
            subtasks: activity.subtasks?.map(st => ({
              id: `${st.id}_${targetDateStr}`,
              text: st.title,
              completed: st.completed
            }))
          });
        }
      }
    });

    // Save schedule to sleepSchedule (singular) for timeline to read
    const sleepScheduleForTimeline = {
      wakeTime: schedule.wakeTime,
      bedtime: schedule.bedtime,
      sleepTime: schedule.bedtime,
      daily: {
        wakeTime: schedule.wakeTime,
        sleepTime: schedule.bedtime
      }
    };
    localStorage.setItem('sleepSchedule', JSON.stringify(sleepScheduleForTimeline));
    
    // Save tasks to localStorage - remove old winddown/startup tasks for this schedule first
    const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
    const filteredTasks = existingTasks.filter((t: any) => {
      // Remove all winddown/startup tasks for this schedule to prevent duplicates
      if (t.source === 'winddown' || t.source === 'startup') {
        // Check if task belongs to this schedule by checking the schedule ID in the task ID
        const taskScheduleId = t.id.split('_')[1];
        return taskScheduleId !== schedule.id;
      }
      // Remove old sleep tasks for this schedule too
      if (t.source === 'sleep') {
        const taskScheduleId = t.id.split('_')[2];
        return taskScheduleId !== schedule.id;
      }
      return true;
    });
    const updatedTasks = [...filteredTasks, ...tasks];
    localStorage.setItem('todos', JSON.stringify(updatedTasks));
    
    // Dispatch event to update timeline
    window.dispatchEvent(new Event('todosUpdated'));
    
    return tasks;
  };

  const toggleDay = (day: string) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  // Check if sleep times overlap (considering midnight crossing)
  const doSleepTimesOverlap = (bedtime1: string, wakeTime1: string, bedtime2: string, wakeTime2: string): boolean => {
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const bed1 = timeToMinutes(bedtime1);
    const wake1 = timeToMinutes(wakeTime1);
    const bed2 = timeToMinutes(bedtime2);
    const wake2 = timeToMinutes(wakeTime2);

    // Normalize sleep periods to handle midnight crossing
    // If bedtime > wakeTime, sleep crosses midnight
    const getSleepStart = (bed: number, wake: number): number => {
      return bed > wake ? bed : bed; // Start is always bedtime
    };
    
    const getSleepEnd = (bed: number, wake: number): number => {
      return bed > wake ? wake + (24 * 60) : wake; // If crosses midnight, add 24 hours to wake time
    };

    const start1 = getSleepStart(bed1, wake1);
    const end1 = getSleepEnd(bed1, wake1);
    const start2 = getSleepStart(bed2, wake2);
    const end2 = getSleepEnd(bed2, wake2);

    // Check if periods overlap
    // Two periods overlap if: start1 < end2 && start2 < end1
    const overlaps = start1 < end2 && start2 < end1;
    
    if (!overlaps) return false;
    
    // If they overlap, check if it's a significant overlap (more than 1 hour)
    // This allows for mid-day naps that might briefly touch but don't conflict
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    const overlapMinutes = overlapEnd - overlapStart;
    const overlapHours = overlapMinutes / 60;
    
    // If overlap is less than 1 hour, it's probably a mid-day nap and not a conflict
    return overlapHours >= 1;
  };

  // Check for overlapping schedules
  const checkOverlappingSchedules = (currentSchedule?: SleepSchedule): { hasConflict: boolean; conflictingSchedules: SleepSchedule[] } => {
    const activeSchedules = schedules.filter(s => s.isActive);
    const conflictingSchedules: SleepSchedule[] = [];
    
    const scheduleToCheck = currentSchedule || newSchedule as any;
    
    if (!scheduleToCheck.bedtime || !scheduleToCheck.wakeTime || !scheduleToCheck.days || scheduleToCheck.days.length === 0) {
      return { hasConflict: false, conflictingSchedules: [] };
    }

    for (const schedule of activeSchedules) {
      // Skip checking against itself
      if (currentSchedule && schedule.id === currentSchedule.id) continue;
      
      // Check if they share any days
      const sharedDays = schedule.days.filter(day => scheduleToCheck.days.includes(day));
      if (sharedDays.length === 0) continue;
      
      // Check if sleep times overlap
      if (doSleepTimesOverlap(
        schedule.bedtime,
        schedule.wakeTime,
        scheduleToCheck.bedtime,
        scheduleToCheck.wakeTime
      )) {
        conflictingSchedules.push(schedule);
      }
    }
    
    return {
      hasConflict: conflictingSchedules.length > 0,
      conflictingSchedules
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Sleep Schedule
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Header - Sticky */}
          <div className="flex-shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 mb-4 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{schedules.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {schedules.filter(s => s.isActive).length}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowAddSchedule(true)} 
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                {schedules.length > 0 ? 'Add New Sleep Schedule' : 'Add Sleep Schedule'}
              </Button>
            </div>
          </div>

          {/* Sleep Schedules - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-2" style={{ minHeight: 0 }}>
            {schedules.length > 0 ? (
              schedules.map((schedule) => {
                const overlapCheck = checkOverlappingSchedules(schedule);
                return (
                <Card key={schedule.id} className={`hover:shadow-md transition-shadow ${overlapCheck.hasConflict ? 'border-orange-500 border-2' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{schedule.name}</CardTitle>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            schedule.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.isActive ? 'Active' : 'Inactive'}
                          </div>
                          {overlapCheck.hasConflict && schedule.isActive && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Conflict</span>
                            </div>
                          )}
                        </div>
                        {overlapCheck.hasConflict && schedule.isActive && (
                          <Alert className="mt-2 mb-2 border-orange-500 bg-orange-50 dark:bg-orange-950/30">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
                              This schedule overlaps with: {overlapCheck.conflictingSchedules.map(s => s.name).join(', ')} on shared days. 
                              Multiple sleep schedules on the same days may cause conflicts.
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            <span>Wake: {schedule.wakeTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            <span>Bedtime: {schedule.bedtime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            {schedule.startUpActivities.length > 0 ? (
                              <span>Start Up: {schedule.startUpActivities.length} activities</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingSchedule(schedule);
                                  setActivityType('startup');
                                  setShowStartUpDialog(true);
                                }}
                                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <span>Start Up: Not set</span>
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            {schedule.windDownActivities.length > 0 ? (
                              <span>Wind Down: {schedule.windDownActivities.length} activities</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingSchedule(schedule);
                                  setActivityType('winddown');
                                  setShowWindDownDialog(true);
                                }}
                                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <span>Wind Down: Not set</span>
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Days: {schedule.days.map(day => abbreviateDay(day)).join(', ')}
                          </p>
                          {calculateEstimatedSleepTime(schedule.wakeTime, schedule.bedtime) && (
                            <p className="text-sm text-muted-foreground">
                              Estimated Sleep: {calculateEstimatedSleepTime(schedule.wakeTime, schedule.bedtime)}
                            </p>
                          )}
                        </div>
                        
                        {/* Activities Tabs - Only show if activities exist */}
                        {(schedule.windDownActivities.length > 0 || schedule.startUpActivities.length > 0) && (
                          <div className="mt-4">
                            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'winddown' | 'startup')}>
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="startup">Start Up</TabsTrigger>
                                <TabsTrigger value="winddown">Wind Down</TabsTrigger>
                              </TabsList>
                            
                            <TabsContent value="overview" className="mt-4">
                              {schedule.windDownActivities.length === 0 && schedule.startUpActivities.length === 0 ? (
                                <div className="text-center py-8 space-y-4">
                                  <div className="text-muted-foreground">
                                    <Sun className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium mb-2">No Activities Set Up Yet</p>
                                    <p className="text-sm mb-4">Add start up and wind down activities to create your timeline</p>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      setEditingSchedule(schedule);
                                      setActivityType('startup');
                                      setShowStartUpDialog(true);
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Start Up Activities
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setEditingSchedule(schedule);
                                      setActivityType('winddown');
                                      setShowWindDownDialog(true);
                                    }}
                                    variant="outline"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Wind Down Activities
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <Card className="hover:shadow-md transition-shadow rounded-2xl">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                                            <Sun className="w-6 h-6 text-amber-600" />
                                  </div>
                                          <div>
                                            <h3 className="font-medium">Start Up Activities</h3>
                                            <p className="text-sm text-muted-foreground">
                                              {schedule.startUpActivities.length} {schedule.startUpActivities.length === 1 ? 'activity' : 'activities'}
                                            </p>
                                  </div>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingSchedule(schedule);
                                            setActivityType('startup');
                                            setEditingActivity(null);
                                            setShowStartUpDialog(true);
                                          }}
                                          className="rounded-full"
                                        >
                                          {schedule.startUpActivities.length > 0 ? (
                                            <>
                                              <Edit className="w-4 h-4 mr-1" />
                                              Edit
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-4 h-4 mr-1" />
                                              Add
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card className="hover:shadow-md transition-shadow rounded-2xl">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                                            <Moon className="w-6 h-6 text-indigo-600" />
                                          </div>
                                          <div>
                                            <h3 className="font-medium">Wind Down Activities</h3>
                                            <p className="text-sm text-muted-foreground">
                                              {schedule.windDownActivities.length} {schedule.windDownActivities.length === 1 ? 'activity' : 'activities'}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingSchedule(schedule);
                                            setActivityType('winddown');
                                            setEditingActivity(null);
                                            setShowWindDownDialog(true);
                                          }}
                                          className="rounded-full"
                                        >
                                          {schedule.windDownActivities.length > 0 ? (
                                            <>
                                              <Edit className="w-4 h-4 mr-1" />
                                              Edit
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-4 h-4 mr-1" />
                                              Add
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </TabsContent>
                            
                            <TabsContent value="startup" className="mt-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Sun className="w-4 h-4" />
                                    Start Up Activities
                                  </h4>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditingSchedule(schedule);
                                      setActivityType('startup');
                                      setEditingActivity(null);
                                      setShowStartUpDialog(true);
                                    }}
                                    className="rounded-full h-8 w-8 p-0"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="space-y-3">
                                  {schedule.startUpActivities.map((activity) => (
                                    <Card key={activity.id} className="hover:shadow-md transition-shadow rounded-2xl">
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                                              <Sun className="w-5 h-5 text-amber-600" />
                                            </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{activity.name}</span>
                                          {!activity.isActive && (
                                            <span className="text-xs text-muted-foreground">(Inactive)</span>
                                          )}
                                        </div>
                                              <p className="text-sm text-muted-foreground">
                                                {activity.duration}min
                                        {activity.subtasks && activity.subtasks.length > 0 && (
                                                  <> • {activity.subtasks.length} subtask{activity.subtasks.length !== 1 ? 's' : ''}</>
                                        )}
                                              </p>
                                            </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingSchedule(schedule);
                                            setActivityType('startup');
                                            setEditingActivity(activity);
                                            setShowStartUpDialog(true);
                                          }}
                                        >
                                              <Edit className="w-4 h-4 text-amber-600" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteStartUpActivity(schedule.id, activity.id)}
                                        >
                                              <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                      </div>
                                    </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  {schedule.startUpActivities.length === 0 && (
                                    <div className="text-center py-4 text-muted-foreground">
                                      <p className="text-sm">No start up activities yet</p>
                                      <p className="text-xs">Click the + button to add one</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="winddown" className="mt-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Moon className="w-4 h-4" />
                                    Wind Down Activities
                                  </h4>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditingSchedule(schedule);
                                      setActivityType('winddown');
                                      setEditingActivity(null);
                                      setShowWindDownDialog(true);
                                    }}
                                    className="rounded-full h-8 w-8 p-0"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="space-y-3">
                                  {schedule.windDownActivities.map((activity) => (
                                    <Card key={activity.id} className="hover:shadow-md transition-shadow rounded-2xl">
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                                              <Moon className="w-5 h-5 text-indigo-600" />
                                            </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{activity.name}</span>
                                          {!activity.isActive && (
                                            <span className="text-xs text-muted-foreground">(Inactive)</span>
                                          )}
                                        </div>
                                              <p className="text-sm text-muted-foreground">
                                                {activity.duration}min
                                        {activity.subtasks && activity.subtasks.length > 0 && (
                                                  <> • {activity.subtasks.length} subtask{activity.subtasks.length !== 1 ? 's' : ''}</>
                                        )}
                                              </p>
                                            </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingSchedule(schedule);
                                            setActivityType('winddown');
                                            setEditingActivity(activity);
                                            setShowWindDownDialog(true);
                                          }}
                                        >
                                              <Edit className="w-4 h-4 text-indigo-600" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteWindDownActivity(schedule.id, activity.id)}
                                        >
                                              <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                      </div>
                                    </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  {schedule.windDownActivities.length === 0 && (
                                    <div className="text-center py-4 text-muted-foreground">
                                      <p className="text-sm">No wind down activities yet</p>
                                      <p className="text-xs">Click the + button to add one</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`toggle-${schedule.id}`} className="text-sm">Active</Label>
                          <Switch
                            id={`toggle-${schedule.id}`}
                            checked={schedule.isActive}
                            onCheckedChange={() => toggleSchedule(schedule.id)}
                          />
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSchedule(schedule)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Set alarm"
                            onClick={() => {
                              // Open alarm settings or show next button for setup
                              alert('Alarm functionality coming soon!');
                            }}
                          >
                            <Bell className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Set up activities"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setShowInitialSetup(true);
                              setScheduleNeedingSetup(schedule);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Moon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No sleep schedules</h3>
                <p className="text-muted-foreground mb-4">Create your first sleep schedule to get started</p>
                <Button 
                  onClick={() => setShowAddSchedule(true)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Sleep Schedule
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Add Schedule Dialog */}
        <Dialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Sleep Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Overlap Warning */}
              {(() => {
                const overlapCheck = checkOverlappingSchedules();
                if (overlapCheck.hasConflict && newSchedule.bedtime && newSchedule.wakeTime && newSchedule.days.length > 0) {
                  return (
                    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
                        Warning: This schedule will overlap with active schedules ({overlapCheck.conflictingSchedules.map(s => s.name).join(', ')}) on shared days. 
                        Multiple sleep schedules on the same days may cause conflicts.
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}
              <div>
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="e.g., Weekday Schedule"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wake-time">Wake Time</Label>
                  <Input
                    id="wake-time"
                    type="time"
                    value={newSchedule.wakeTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, wakeTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bedtime">Bedtime</Label>
                  <Input
                    id="bedtime"
                    type="time"
                    value={newSchedule.bedtime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, bedtime: e.target.value })}
                  />
                </div>
              </div>
              {newSchedule.wakeTime && newSchedule.bedtime && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Estimated Sleep: <span className="font-medium text-foreground">
                      {calculateEstimatedSleepTime(newSchedule.wakeTime, newSchedule.bedtime)}
                    </span>
                  </p>
                </div>
              )}
              <div>
                <Label>Days of Week</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day}
                      variant={newSchedule.days.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day)}
                      className="text-xs"
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Start Up Setup */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5" />
                    <Label className="text-base font-semibold">Start Up Routine</Label>
                  </div>
                  <Switch
                    checked={newSchedule.enableStartUp}
                    onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, enableStartUp: checked })}
                  />
                </div>
                {newSchedule.enableStartUp && (
                  <div className="space-y-3 pl-7">
                    <div>
                      <Label htmlFor="startup-duration">Duration (minutes)</Label>
                      <Input
                        id="startup-duration"
                        type="number"
                        min="1"
                        value={newSchedule.startUpDuration || ''}
                        onChange={(e) => setNewSchedule({ ...newSchedule, startUpDuration: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="startup-color">Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="startup-color"
                          type="color"
                          value={newSchedule.startUpColor || '#F59E0B'}
                          onChange={(e) => setNewSchedule({ ...newSchedule, startUpColor: e.target.value })}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={newSchedule.startUpColor || '#F59E0B'}
                          onChange={(e) => setNewSchedule({ ...newSchedule, startUpColor: e.target.value })}
                          className="flex-1"
                          placeholder="#F59E0B"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Subtasks</Label>
                      {newSchedule.startUpSubtasks.map((subtask, idx) => (
                        <div key={subtask.id} className="flex gap-2">
                          <Input
                            value={subtask.title}
                            onChange={(e) => {
                              const updated = [...newSchedule.startUpSubtasks];
                              updated[idx] = { ...subtask, title: e.target.value };
                              setNewSchedule({ ...newSchedule, startUpSubtasks: updated });
                            }}
                            placeholder="Subtask title"
                            className="flex-1 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewSchedule({
                                ...newSchedule,
                                startUpSubtasks: newSchedule.startUpSubtasks.filter((_, i) => i !== idx)
                              });
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setNewSchedule({
                            ...newSchedule,
                            startUpSubtasks: [...newSchedule.startUpSubtasks, { id: Date.now().toString(), title: '', completed: false }]
                          });
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Subtask
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Wind Down Setup */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5" />
                    <Label className="text-base font-semibold">Wind Down Routine</Label>
                  </div>
                  <Switch
                    checked={newSchedule.enableWindDown}
                    onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, enableWindDown: checked })}
                  />
                </div>
                {newSchedule.enableWindDown && (
                  <div className="space-y-3 pl-7">
                    <div>
                      <Label htmlFor="winddown-duration">Duration (minutes)</Label>
                      <Input
                        id="winddown-duration"
                        type="number"
                        min="1"
                        value={newSchedule.windDownDuration || ''}
                        onChange={(e) => setNewSchedule({ ...newSchedule, windDownDuration: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="winddown-color">Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="winddown-color"
                          type="color"
                          value={newSchedule.windDownColor || '#8B5CF6'}
                          onChange={(e) => setNewSchedule({ ...newSchedule, windDownColor: e.target.value })}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={newSchedule.windDownColor || '#8B5CF6'}
                          onChange={(e) => setNewSchedule({ ...newSchedule, windDownColor: e.target.value })}
                          className="flex-1"
                          placeholder="#8B5CF6"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Subtasks</Label>
                      {newSchedule.windDownSubtasks.map((subtask, idx) => (
                        <div key={subtask.id} className="flex gap-2">
                          <Input
                            value={subtask.title}
                            onChange={(e) => {
                              const updated = [...newSchedule.windDownSubtasks];
                              updated[idx] = { ...subtask, title: e.target.value };
                              setNewSchedule({ ...newSchedule, windDownSubtasks: updated });
                            }}
                            placeholder="Subtask title"
                            className="flex-1 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewSchedule({
                                ...newSchedule,
                                windDownSubtasks: newSchedule.windDownSubtasks.filter((_, i) => i !== idx)
                              });
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setNewSchedule({
                            ...newSchedule,
                            windDownSubtasks: [...newSchedule.windDownSubtasks, { id: Date.now().toString(), title: '', completed: false }]
                          });
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Subtask
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddSchedule(false)}>
                  Cancel
                </Button>
                {(() => {
                  const isValid = newSchedule.name.trim() && newSchedule.bedtime && newSchedule.wakeTime && newSchedule.days.length > 0;
                  
                  return (
                    <Button 
                      onClick={handleAddSchedule}
                      disabled={!isValid}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                  Create Schedule
                </Button>
                  );
                })()}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Schedule Dialog */}
        <Dialog open={showEditSchedule} onOpenChange={setShowEditSchedule}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Sleep Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-schedule-name">Schedule Name</Label>
                <Input
                  id="edit-schedule-name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="e.g., Weekday Schedule"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-wake-time">Wake Time</Label>
                  <Input
                    id="edit-wake-time"
                    type="time"
                    value={newSchedule.wakeTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, wakeTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-bedtime">Bedtime</Label>
                  <Input
                    id="edit-bedtime"
                    type="time"
                    value={newSchedule.bedtime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, bedtime: e.target.value })}
                  />
                </div>
              </div>
              {newSchedule.wakeTime && newSchedule.bedtime && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Estimated Sleep: <span className="font-medium text-foreground">
                      {calculateEstimatedSleepTime(newSchedule.wakeTime, newSchedule.bedtime)}
                    </span>
                  </p>
                </div>
              )}
              <div>
                <Label>Days of Week</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day}
                      variant={newSchedule.days.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day)}
                      className="text-xs"
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditSchedule(false)}>
                  Cancel
                </Button>
                {(() => {
                  const isValid = newSchedule.name.trim() && newSchedule.bedtime && newSchedule.wakeTime && newSchedule.days.length > 0;
                  
                  return (
                    <Button 
                      onClick={handleUpdateSchedule}
                      disabled={!isValid}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                  Update Schedule
                </Button>
                  );
                })()}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Wind Down Activity Dialog */}
        <Dialog open={showWindDownDialog} onOpenChange={setShowWindDownDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Moon className="w-5 h-5" />
                {editingActivity ? 'Edit Wind Down Activity' : 'Add Wind Down Activity'}
              </DialogTitle>
            </DialogHeader>
            <WindDownActivityForm 
              activity={editingActivity as WindDownActivity}
              onSave={(activity) => {
                if (editingActivity) {
                  updateWindDownActivity(editingSchedule?.id || '', editingActivity.id, activity);
                } else {
                  addWindDownActivity(editingSchedule?.id || '', activity);
                }
                setShowWindDownDialog(false);
                setEditingActivity(null);
              }}
              onCancel={() => {
                setShowWindDownDialog(false);
                setEditingActivity(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Start Up Activity Dialog */}
        <Dialog open={showStartUpDialog} onOpenChange={setShowStartUpDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                {editingActivity ? 'Edit Start Up Activity' : 'Add Start Up Activity'}
              </DialogTitle>
            </DialogHeader>
            <StartUpActivityForm 
              activity={editingActivity as StartUpActivity}
              onSave={(activity) => {
                if (editingActivity) {
                  updateStartUpActivity(editingSchedule?.id || '', editingActivity.id, activity);
                } else {
                  addStartUpActivity(editingSchedule?.id || '', activity);
                }
                setShowStartUpDialog(false);
                setEditingActivity(null);
              }}
              onCancel={() => {
                setShowStartUpDialog(false);
                setEditingActivity(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Initial Setup Dialog */}
        <Dialog open={showInitialSetup} onOpenChange={setShowInitialSetup}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Moon className="w-5 h-5" />
                Set Up Activities
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This schedule doesn't have any start up or wind down activities yet. 
                Add activities to automatically create tasks on your timeline for each day this schedule is active.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setEditingSchedule(scheduleNeedingSetup);
                    setActivityType('startup');
                    setShowStartUpDialog(true);
                    setShowInitialSetup(false);
                  }}
                >
                  <Sun className="w-4 h-4 mr-2" />
                  Add Start Up Activities
                </Button>
                <Button
                  onClick={() => {
                    setEditingSchedule(scheduleNeedingSetup);
                    setActivityType('winddown');
                    setShowWindDownDialog(true);
                    setShowInitialSetup(false);
                  }}
                  variant="outline"
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Add Wind Down Activities
                </Button>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => {
                  setShowInitialSetup(false);
                  setScheduleNeedingSetup(null);
                }}>
                  Skip for Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </Dialog>
  );
}

// Wind Down Activity Form Component
function WindDownActivityForm({ 
  activity, 
  onSave, 
  onCancel 
}: { 
  activity?: WindDownActivity; 
  onSave: (activity: Omit<WindDownActivity, 'id'>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: activity?.name || '',
    duration: activity?.duration || 5,
    description: activity?.description || '',
    isActive: activity?.isActive ?? true,
    subtasks: activity?.subtasks || [] as Array<{ id: string; title: string; completed: boolean }>,
    color: activity?.color || '#8B5CF6'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave({
        name: formData.name,
        duration: formData.duration,
        description: '', // Always empty since we removed description field
        isActive: formData.isActive,
        subtasks: formData.subtasks,
        color: formData.color
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="activity-name">Activity Name</Label>
        <Input
          id="activity-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Deep Breathing"
          required
          className="rounded-full"
        />
      </div>
      <div>
        <Label htmlFor="activity-duration">Duration (minutes)</Label>
        <Input
          id="activity-duration"
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
          min="1"
          required
          className="rounded-full"
        />
      </div>
      <div>
        <Label htmlFor="activity-color">Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            id="activity-color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="h-10 w-20 cursor-pointer rounded-lg"
          />
          <Input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="flex-1 rounded-full"
            placeholder="#8B5CF6"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Subtasks</Label>
        {formData.subtasks.map((subtask, idx) => (
          <div key={subtask.id} className="flex gap-2">
            <Input
              value={subtask.title}
              onChange={(e) => {
                const updated = [...formData.subtasks];
                updated[idx] = { ...subtask, title: e.target.value };
                setFormData(prev => ({ ...prev, subtasks: updated }));
              }}
              placeholder="Subtask title"
              className="flex-1 text-sm rounded-full"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  subtasks: prev.subtasks.filter((_, i) => i !== idx)
                }));
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs rounded-full"
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              subtasks: [...prev.subtasks, { id: Date.now().toString(), title: '', completed: false }]
            }));
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Subtask
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="activity-active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="activity-active">Active</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
        {(() => {
          const isValid = formData.name.trim();
          return (
            <Button 
              type="submit" 
              className="rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              disabled={!isValid}
            >
          {activity ? 'Update' : 'Add'} Activity
        </Button>
          );
        })()}
      </div>
    </form>
  );
}

// Start Up Activity Form Component
function StartUpActivityForm({ 
  activity, 
  onSave, 
  onCancel 
}: { 
  activity?: StartUpActivity; 
  onSave: (activity: Omit<StartUpActivity, 'id'>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: activity?.name || '',
    duration: activity?.duration || 5,
    description: activity?.description || '',
    isActive: activity?.isActive ?? true,
    subtasks: activity?.subtasks || [] as Array<{ id: string; title: string; completed: boolean }>,
    color: activity?.color || '#F59E0B'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave({
        name: formData.name,
        duration: formData.duration,
        description: '', // Always empty since we removed description field
        isActive: formData.isActive,
        subtasks: formData.subtasks,
        color: formData.color
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="activity-name">Activity Name</Label>
        <Input
          id="activity-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Morning Stretches"
          required
          className="rounded-full"
        />
      </div>
      <div>
        <Label htmlFor="activity-duration">Duration (minutes)</Label>
        <Input
          id="activity-duration"
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
          min="1"
          required
          className="rounded-full"
        />
      </div>
      <div>
        <Label htmlFor="activity-color">Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            id="activity-color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="h-10 w-20 cursor-pointer rounded-lg"
          />
          <Input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="flex-1 rounded-full"
            placeholder="#F59E0B"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Subtasks</Label>
        {formData.subtasks.map((subtask, idx) => (
          <div key={subtask.id} className="flex gap-2">
            <Input
              value={subtask.title}
              onChange={(e) => {
                const updated = [...formData.subtasks];
                updated[idx] = { ...subtask, title: e.target.value };
                setFormData(prev => ({ ...prev, subtasks: updated }));
              }}
              placeholder="Subtask title"
              className="flex-1 text-sm rounded-full"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  subtasks: prev.subtasks.filter((_, i) => i !== idx)
                }));
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs rounded-full"
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              subtasks: [...prev.subtasks, { id: Date.now().toString(), title: '', completed: false }]
            }));
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Subtask
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="activity-active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="activity-active">Active</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
        {(() => {
          const isValid = formData.name.trim();
          return (
            <Button 
              type="submit" 
              className="rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              disabled={!isValid}
            >
          {activity ? 'Update' : 'Add'} Activity
        </Button>
          );
        })()}
      </div>
    </form>
  );
}
