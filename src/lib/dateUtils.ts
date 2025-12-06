import { 
  format, 
  addDays, 
  subDays, 
  isSameDay, 
  startOfWeek, 
  addWeeks, 
  subWeeks,
  differenceInDays,
  parseISO,
  isValid
} from 'date-fns';

// Date formatting utilities
export const formatDate = (date: Date, formatStr: string = 'yyyy-MM-dd') => {
  return format(date, formatStr);
};

export const formatTime = (date: Date, formatStr: string = 'HH:mm') => {
  return format(date, formatStr);
};

export const formatDateTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm');
};

// Date comparison utilities
export const isToday = (date: Date) => {
  return isSameDay(date, new Date());
};

export const isPastDate = (date: Date) => {
  return date < new Date();
};

export const isFutureDate = (date: Date) => {
  return date > new Date();
};

// Date manipulation utilities
export const getDaysInRange = (startDate: Date, endDate: Date) => {
  const days = [];
  let current = new Date(startDate);
  
  while (current <= endDate) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  
  return days;
};

export const getWeekDays = (startOfWeekDate?: Date) => {
  const today = startOfWeekDate || new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  return Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
};

export const getNextOccurrenceOfDay = (dayName: string, fromDate: Date = new Date()) => {
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
    thursday: 4, friday: 5, saturday: 6
  };
  
  const targetDay = dayMap[dayName.toLowerCase()];
  const currentDay = fromDate.getDay();
  let daysAhead = targetDay - currentDay;
  
  if (daysAhead <= 0) daysAhead += 7;
  
  return addDays(fromDate, daysAhead);
};

// Date parsing utilities
export const parseDate = (dateString: string): Date => {
  if (isValid(parseISO(dateString))) {
    return parseISO(dateString);
  }
  
  const parsed = new Date(dateString);
  if (isValid(parsed)) {
    return parsed;
  }
  
  throw new Error(`Invalid date string: ${dateString}`);
};

export const safeParseDate = (dateString: string): Date | null => {
  try {
    return parseDate(dateString);
  } catch {
    return null;
  }
};

// Time utilities
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMinutes);
};

// Date range utilities
export const getDateRange = (startDate: Date, endDate: Date) => {
  const days = differenceInDays(endDate, startDate);
  return {
    start: startDate,
    end: endDate,
    days: days,
    daysArray: getDaysInRange(startDate, endDate)
  };
};

// Calendar utilities
export const getCalendarWeek = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const getCalendarMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startOfFirstWeek = startOfWeek(firstDay, { weekStartsOn: 1 });
  const endOfLastWeek = startOfWeek(lastDay, { weekStartsOn: 1 });
  endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
  
  return getDaysInRange(startOfFirstWeek, endOfLastWeek);
};
