/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Snap time to nearest 15-minute increment
 */
export function snapTo15Minutes(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

/**
 * Check if time has passed (for today)
 */
export function hasTimePassed(time: string, currentTime: string): boolean {
  return timeToMinutes(time) < timeToMinutes(currentTime);
}

/**
 * Calculate duration between two times in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

