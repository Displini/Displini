export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  emoji?: string;
  completed: boolean;
  completedAt?: Date | string;
  dueDate?: Date | string;
  time?: string;
  endTime?: string;
  allDay?: boolean;
  notes?: string;
  color?: string; // Custom color for task (hex format)
  repeat?: "daily" | "weekly" | "monthly" | "yearly" | "weekdays" | "custom"; // Repeat pattern
  source:
    | "manual"
    | "food"
    | "calendar"
    | "medication"
    | "workout"
    | "sleep"
    | "water"
    | "breathing"
    | "reminder"
    | "steps"
    | "work"
    | "school"
    | "salary"
    | "winddown"
    | "startup"
    | "menstrual";
  medicationId?: string;
  sleepAction?: string;
  subtasks?: Subtask[];
  attachments?: string[]; // Array of base64 image data URLs
  alertTimes?: string[]; // Reminder times (HH:mm)
  isContainer?: boolean; // For winddown/startup parent tasks
  parentId?: string; // For winddown/startup subtasks
  order?: number; // For ordering subtasks
  journalPrompt?: string; // For winddown journal tasks
  isPrediction?: boolean; // For menstrual cycle predictions
  mealId?: string; // For food tasks
  breakTimes?: { start: string; end: string }[]; // For work tasks
  classId?: string; // For school tasks
  classroom?: string; // For school tasks
  reminderId?: string; // Link to reminder when task was imported from Reminders
  location?: string; // Location/place for the task
}