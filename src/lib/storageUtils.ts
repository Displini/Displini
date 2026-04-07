/**
 * Storage Utilities - Centralized localStorage operations
 */

/**
 * Get item from localStorage with fallback
 */
export function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return fallback;
  }
}

/**
 * Set item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

/**
 * Get user profile from localStorage
 */
export function getUserProfile() {
  return getStorageItem('userProfile', {
    gender: 'prefer-not-to-say',
    dateOfBirth: '',
    height: 170,
    heightUnit: 'cm',
    weight: 70,
    weightUnit: 'kg',
    activityLevel: 'moderate',
    wakeTime: '07:00',
    sleepTime: '23:00',
    mainPurpose: [],
    onboardingCompleted: false,
  });
}

/**
 * Get current weight from user profile
 */
export function getCurrentWeight(): number {
  const profile = getUserProfile();
  return profile.weight || 0;
}

/**
 * Get sleep schedule from localStorage
 */
export function getSleepSchedule() {
  return getStorageItem('sleepSchedule', null);
}

/**
 * Common date formatting utilities
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
}

