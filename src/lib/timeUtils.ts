/**
 * Get the current time based on user's timezone setting
 */
export function getCurrentTime(): Date {
  const timezone = localStorage.getItem("timezone") || "auto";
  
  if (timezone === "auto") {
    return new Date();
  }
  
  try {
    // Get current time in the specified timezone
    const now = new Date();
    const localTime = now.toLocaleString("en-US", { timeZone: timezone });
    return new Date(localTime);
  } catch (error) {
    console.error("Invalid timezone, falling back to auto:", error);
    return new Date();
  }
}

/**
 * Format time as HH:MM string
 */
export function formatTimeString(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

