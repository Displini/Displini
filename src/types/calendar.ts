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
  type?: 'event' | 'period' | 'todo';
  location?: string;
}
