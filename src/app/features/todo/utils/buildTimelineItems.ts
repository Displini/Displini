import { Task } from "@/app/types/types";
import { TimelineItem } from "./timelineCalculations";

/**
 * Get water reminder times from settings
 */
function getWaterReminderTimes(): string[] {
  const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
  if (!waterSettings.remindersEnabled) return [];
  
  if (waterSettings.reminderMode === 'interval') {
    // Generate interval-based times
    const interval = waterSettings.reminderInterval || 2;
    const startHour = 6; // Default start
    const endHour = 22; // Default end
    
    const times: string[] = [];
    for (let hour = startHour; hour <= endHour; hour += interval) {
      times.push(`${String(hour).padStart(2, '0')}:00`);
    }
    return times;
  }
  
  return waterSettings.reminderTimes || [];
}

/**
 * Get medication reminder times from settings
 */
function getMedicationReminderTimes(): Array<{ medicationId: string; time: string }> {
  const medications = JSON.parse(localStorage.getItem('medications') || '[]');
  const reminders: Array<{ medicationId: string; time: string }> = [];
  
  medications.forEach((med: any) => {
    if (med.isActive && med.times && med.times.length > 0) {
      med.times.forEach((time: string) => {
        reminders.push({ medicationId: med.id, time });
      });
    }
  });
  
  return reminders;
}

/**
 * Get journal reminder times from settings
 */
function getJournalReminderTimes(): string[] {
  const journalSettings = JSON.parse(localStorage.getItem('journal_settings') || '{}');
  if (!journalSettings.remindersEnabled) return [];
  
  return journalSettings.reminderTimes || [];
}

/**
 * Get step reminder times from settings
 */
function getStepReminderTimes(date?: Date): string[] {
  const stepSettings = JSON.parse(localStorage.getItem('step_settings') || '{}');
  if (!stepSettings.remindersEnabled || !stepSettings.addToTodo) return [];
  
  // Check if the current viewing date's day is in the selected reminderDays
  const viewingDate = date || new Date();
  const dayName = viewingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const reminderDays = stepSettings.reminderDays || [];
  
  // Only return times if today's day is in the selected days
  if (reminderDays.includes(dayName)) {
    return stepSettings.reminderTimes || [];
  }
  
  return [];
}

/**
 * Get meditation reminder times from settings
 */
function getMeditationReminderTimes(): string[] {
  const reminders = JSON.parse(localStorage.getItem('breathingReminders') || '[]');
  const times: string[] = [];
  reminders.forEach((reminder: any) => {
    if (reminder.enabled && reminder.time) {
      times.push(reminder.time);
    }
  });
  return times;
}

/**
 * Get glucose reminder times from settings
 */
function getGlucoseReminderTimes(): string[] {
  const glucoseSettings = JSON.parse(localStorage.getItem('glucose_settings') || '{}');
  if (!glucoseSettings.remindersEnabled || !glucoseSettings.addToTodo) return [];
  return glucoseSettings.reminderTimes || [];
}

/**
 * Build timeline items from tasks and reminders
 */
export function buildTimelineItems(tasks: Task[], date?: Date): TimelineItem[] {
  const itemsMap: Record<string, TimelineItem> = {};
  
  // Filter to time-based tasks
  const timeBasedTasks = tasks.filter(t => t.time && !t.allDay);
  
  // Add tasks
  timeBasedTasks.forEach(task => {
    const time = task.time!;
    
    // For startup, winddown, and work break tasks, use a unique key
    const key = (task.source === 'startup' || task.source === 'winddown' || task.source?.startsWith('work-')) 
      ? `${time}_${task.source}_${task.id}` 
      : time;
    
    if (!itemsMap[key]) {
      itemsMap[key] = { time, tasks: [], isWakeUp: false, isBedTime: false };
    }
    itemsMap[key].tasks.push(task);
    
    // Mark wake up and bed time
    if (task.source === 'sleep' && task.sleepAction === 'wake') {
      itemsMap[key].isWakeUp = true;
    }
    if (task.source === 'sleep' && task.sleepAction === 'sleep') {
      itemsMap[key].isBedTime = true;
    }
  });
  
  // Add water reminders
  const waterReminderTimes = getWaterReminderTimes();
  waterReminderTimes.forEach((time: string) => {
    if (!itemsMap[time]) {
      itemsMap[time] = { time, tasks: [] };
    }
    itemsMap[time].waterReminder = true;
  });
  
  // Add medication reminders
  const medicationReminders = getMedicationReminderTimes();
  medicationReminders.forEach(({ medicationId, time }) => {
    if (!itemsMap[time]) {
      itemsMap[time] = { time, tasks: [] };
    }
    itemsMap[time].medicationReminder = true;
  });
  
  // Add journal reminders
  const journalReminderTimes = getJournalReminderTimes();
  journalReminderTimes.forEach((time: string) => {
    if (!itemsMap[time]) {
      itemsMap[time] = { time, tasks: [] };
    }
    itemsMap[time].journalReminder = true;
  });
  
  // Add step reminders
  const stepReminderTimes = getStepReminderTimes(date);
  stepReminderTimes.forEach((time: string) => {
    if (!itemsMap[time]) {
      itemsMap[time] = { time, tasks: [] };
    }
    itemsMap[time].stepReminder = true;
  });
  
  // Add meditation reminders
  const meditationReminderTimes = getMeditationReminderTimes();
  meditationReminderTimes.forEach((time: string) => {
    if (!itemsMap[time]) {
      itemsMap[time] = { time, tasks: [] };
    }
    itemsMap[time].meditationReminder = true;
  });
  
  // Add glucose reminders
  const glucoseReminderTimes = getGlucoseReminderTimes();
  glucoseReminderTimes.forEach((time: string) => {
    if (!itemsMap[time]) {
      itemsMap[time] = { time, tasks: [] };
    }
    itemsMap[time].glucoseReminder = true;
  });
  
  // Sort by time
  const sortedItems = Object.values(itemsMap).sort((a, b) => {
    const [aH, aM] = a.time.split(':').map(Number);
    const [bH, bM] = b.time.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });
  
  return sortedItems;
}

