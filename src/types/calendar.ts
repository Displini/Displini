export type CalendarEventRepeat = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type CalendarEventAlert = "none" | "0" | "5" | "15" | "60" | "1440"; // minutes before: 0=at time, 5, 15, 60, 1440=1 day

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  startTime?: string;
  endTime?: string;
  time?: string; // Legacy field for backward compatibility
  allDay?: boolean;
  emoji?: string;
  addToTodo?: boolean;
  type?: "event" | "period" | "todo";
  location?: string;
  repeat?: CalendarEventRepeat;
  alertMinutesBefore?: number; // 0 = at time of event, 5, 15, 60, 1440
}
