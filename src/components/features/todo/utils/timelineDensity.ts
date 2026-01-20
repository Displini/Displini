import { TimelineItem } from "./timelineCalculations";
import { timeToMinutes } from "./timeHelpers";
import { Task } from "@/types/types";

// Density Analysis Constants
const WINDOW_SIZE_MINUTES = 120;        // 2 hours per window
const WINDOW_OVERLAP_MINUTES = 60;      // 1 hour overlap between windows
const MIN_SPACE_MULTIPLIER = 0.3;       // Compress sparse to 30%
const MAX_SPACE_MULTIPLIER = 2.5;       // Expand dense to 250%
const BASE_SPACE_MULTIPLIER = 1.0;      // Normal = 100%
const SMOOTHING_WEIGHT = 0.3;           // For window transition smoothing

export interface DensityWindow {
  startMinutes: number;      // Window start time in minutes
  endMinutes: number;        // Window end time in minutes
  taskCount: number;         // Number of tasks in this window
  reminderCount: number;     // Number of reminders in this window
  totalActivity: number;     // taskCount + reminderCount
  densityScore: number;      // Normalized 0-1 density score
  spaceMultiplier: number;   // 0.3 to 2.5 multiplier for space allocation
}

export interface DensityMap {
  windows: DensityWindow[];
  timeToPixelMap: Map<number, number>;  // minute → accumulated pixels
  totalPixels: number;                   // Total timeline height in pixels
  startMinutes: number;                  // Timeline start
  endMinutes: number;                    // Timeline end
}

/**
 * Analyze task density by creating sliding windows and counting activity
 */
export function analyzeTaskDensity(
  timelineItems: TimelineItem[],
  startMinutes: number,
  endMinutes: number
): DensityWindow[] {
  const windows: DensityWindow[] = [];
  
  // Create sliding windows
  let currentStart = startMinutes;
  const stepSize = WINDOW_SIZE_MINUTES - WINDOW_OVERLAP_MINUTES; // 60 minutes
  
  while (currentStart < endMinutes) {
    const currentEnd = Math.min(currentStart + WINDOW_SIZE_MINUTES, endMinutes);
    
    // Initialize window
    const window: DensityWindow = {
      startMinutes: currentStart,
      endMinutes: currentEnd,
      taskCount: 0,
      reminderCount: 0,
      totalActivity: 0,
      densityScore: 0,
      spaceMultiplier: BASE_SPACE_MULTIPLIER
    };
    
    // Count tasks and reminders that overlap with this window
    for (const item of timelineItems) {
      const itemMinutes = timeToMinutes(item.time);
      
      // Check if item time is within window
      if (itemMinutes >= currentStart && itemMinutes < currentEnd) {
        if (item.tasks.length > 0) {
          // Count tasks in this item
          for (const task of item.tasks) {
            if (task.time) {
              const taskStart = timeToMinutes(task.time);
              const taskEnd = task.endTime 
                ? timeToMinutes(task.endTime)
                : taskStart + 60; // Default 1 hour if no endTime
              
              // Check if task overlaps with window
              if (taskStart < currentEnd && taskEnd > currentStart) {
                window.taskCount++;
              }
            }
          }
        } else {
          // This is a reminder (water, medication, etc.)
          window.reminderCount++;
        }
      }
    }
    
    window.totalActivity = window.taskCount + window.reminderCount;
    windows.push(window);
    
    currentStart += stepSize;
  }
  
  return windows;
}

/**
 * Calculate density scores and assign space multipliers to each window
 */
export function calculateSpaceAllocation(windows: DensityWindow[]): DensityWindow[] {
  if (windows.length === 0) {
    return windows;
  }
  
  // Step 1: Calculate raw density scores
  const maxActivity = Math.max(...windows.map(w => w.totalActivity));
  
  if (maxActivity === 0) {
    // No activity, use base multiplier for all
    for (const window of windows) {
      window.spaceMultiplier = BASE_SPACE_MULTIPLIER;
    }
    return windows;
  }
  
  // Normalize density scores (0 to 1)
  for (const window of windows) {
    window.densityScore = window.totalActivity / maxActivity;
  }
  
  // Step 2: Assign space multipliers based on density
  for (const window of windows) {
    const density = window.densityScore;
    
    if (density > 0.7) {
      // Very dense (top 30%): Maximum expansion
      window.spaceMultiplier = MAX_SPACE_MULTIPLIER; // 2.5x
    } else if (density > 0.4) {
      // Dense (30-60%): Gradual expansion
      // Linear interpolation: 1.5x to 2.5x
      window.spaceMultiplier = 1.5 + (density - 0.4) * 3.33;
    } else if (density > 0.2) {
      // Normal (20-40%): Base size
      window.spaceMultiplier = BASE_SPACE_MULTIPLIER; // 1.0x
    } else {
      // Sparse (bottom 20%): Compression
      // Linear interpolation: 0.3x to 1.0x
      window.spaceMultiplier = MIN_SPACE_MULTIPLIER + density * 3.5;
    }
  }
  
  // Step 3: Smooth transitions between adjacent windows
  const smoothed = windows.map(w => ({ ...w })); // Deep copy
  
  for (let i = 1; i < windows.length - 1; i++) {
    const prevMultiplier = windows[i - 1].spaceMultiplier;
    const currMultiplier = windows[i].spaceMultiplier;
    const nextMultiplier = i < windows.length - 1 
      ? windows[i + 1].spaceMultiplier 
      : currMultiplier;
    
    // Weighted average with neighbors
    smoothed[i].spaceMultiplier = 
      prevMultiplier * SMOOTHING_WEIGHT +
      currMultiplier * (1 - 2 * SMOOTHING_WEIGHT) +
      nextMultiplier * SMOOTHING_WEIGHT;
  }
  
  return smoothed;
}

/**
 * Get multiplier for a specific minute by finding which window(s) it belongs to
 */
function getMultiplierForMinute(minute: number, windows: DensityWindow[]): number {
  const multipliers: number[] = [];
  
  for (const window of windows) {
    if (minute >= window.startMinutes && minute < window.endMinutes) {
      multipliers.push(window.spaceMultiplier);
    }
  }
  
  if (multipliers.length > 0) {
    // Average if minute is in multiple windows (overlap)
    return multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length;
  }
  
  return BASE_SPACE_MULTIPLIER;
}

/**
 * Build a non-linear mapping from time (minutes) to vertical position (pixels)
 */
export function createTimeMapping(
  windows: DensityWindow[],
  startMinutes: number,
  endMinutes: number,
  baseHeight: number
): DensityMap {
  const timeToPixelMap = new Map<number, number>();
  const rangeMinutes = endMinutes - startMinutes;
  
  // Step 1: Calculate total weighted minutes
  let totalWeightedMinutes = 0;
  for (const window of windows) {
    const windowDuration = window.endMinutes - window.startMinutes;
    const weightedDuration = windowDuration * window.spaceMultiplier;
    totalWeightedMinutes += weightedDuration;
  }
  
  // If no windows or total weighted is 0, fall back to linear
  if (totalWeightedMinutes === 0 || windows.length === 0) {
    // Linear fallback: 1 pixel per minute
    for (let minute = startMinutes; minute <= endMinutes; minute += 15) {
      const pixels = ((minute - startMinutes) / rangeMinutes) * baseHeight;
      timeToPixelMap.set(minute, pixels);
    }
    return {
      windows: [],
      timeToPixelMap,
      totalPixels: baseHeight,
      startMinutes,
      endMinutes
    };
  }
  
  // Step 2: Calculate scale factor
  const pixelPerWeightedMinute = baseHeight / totalWeightedMinutes;
  
  // Step 3: Build map at key points (window boundaries and every 15 minutes)
  const keyPoints: number[] = [startMinutes];
  
  // Add window boundaries
  for (const window of windows) {
    if (!keyPoints.includes(window.startMinutes)) {
      keyPoints.push(window.startMinutes);
    }
    if (!keyPoints.includes(window.endMinutes)) {
      keyPoints.push(window.endMinutes);
    }
  }
  
  // Add 15-minute intervals
  for (let minute = startMinutes; minute <= endMinutes; minute += 15) {
    if (!keyPoints.includes(minute)) {
      keyPoints.push(minute);
    }
  }
  
  if (!keyPoints.includes(endMinutes)) {
    keyPoints.push(endMinutes);
  }
  
  keyPoints.sort((a, b) => a - b);
  
  // Step 4: Calculate pixel positions at key points
  let accumulatedPixels = 0;
  
  for (let i = 0; i < keyPoints.length - 1; i++) {
    const currentMinute = keyPoints[i];
    const nextMinute = keyPoints[i + 1];
    const duration = nextMinute - currentMinute;
    
    // Find multiplier for this segment
    const multiplier = getMultiplierForMinute(currentMinute, windows);
    
    const pixelIncrement = duration * multiplier * pixelPerWeightedMinute;
    
    timeToPixelMap.set(currentMinute, accumulatedPixels);
    accumulatedPixels += pixelIncrement;
  }
  
  // Set final point
  timeToPixelMap.set(endMinutes, accumulatedPixels);
  
  return {
    windows,
    timeToPixelMap,
    totalPixels: accumulatedPixels,
    startMinutes,
    endMinutes
  };
}

/**
 * Find the largest key in map that is <= target
 */
function findClosestKey(target: number, map: Map<number, number>): number {
  let closest: number | null = null;
  
  for (const key of map.keys()) {
    if (key <= target && (closest === null || key > closest)) {
      closest = key;
    }
  }
  
  if (closest === null) {
    // No key found, return smallest key
    const keys = Array.from(map.keys());
    return keys.length > 0 ? Math.min(...keys) : target;
  }
  
  return closest;
}

/**
 * Find smallest key in map that is > currentKey
 */
function findNextKey(currentKey: number, map: Map<number, number>): number | null {
  let next: number | null = null;
  
  for (const key of map.keys()) {
    if (key > currentKey && (next === null || key < next)) {
      next = key;
    }
  }
  
  return next;
}

/**
 * Convert a time (in minutes) to a percentage position (0-100%) using the density map
 */
export function getAdaptivePosition(
  timeMinutes: number,
  densityMap: DensityMap,
  bounds: { startMinutes: number; endMinutes: number }
): number {
  // Clamp time to bounds
  if (timeMinutes < bounds.startMinutes) {
    return 0.0; // Above timeline
  }
  
  if (timeMinutes > bounds.endMinutes) {
    return 100.0; // Below timeline
  }
  
  // Find closest key point in map
  const closestKey = findClosestKey(timeMinutes, densityMap.timeToPixelMap);
  
  // Get pixel position at closest key
  const basePixels = densityMap.timeToPixelMap.get(closestKey) ?? 0;
  
  // If exact match, convert to percentage
  if (closestKey === timeMinutes) {
    const percentage = densityMap.totalPixels > 0
      ? (basePixels / densityMap.totalPixels) * 100
      : 0;
    return Math.max(0, Math.min(100, percentage));
  }
  
  // Interpolate between closest key and next key
  const nextKey = findNextKey(closestKey, densityMap.timeToPixelMap);
  
  if (nextKey !== null) {
    const nextPixels = densityMap.timeToPixelMap.get(nextKey) ?? basePixels;
    const keyDuration = nextKey - closestKey;
    const timeOffset = timeMinutes - closestKey;
    
    // Linear interpolation
    const pixelOffset = keyDuration > 0
      ? ((nextPixels - basePixels) / keyDuration) * timeOffset
      : 0;
    const totalPixels = basePixels + pixelOffset;
    
    // Convert to percentage
    const percentage = densityMap.totalPixels > 0
      ? (totalPixels / densityMap.totalPixels) * 100
      : 0;
    
    return Math.max(0, Math.min(100, percentage));
  }
  
  // No next key found, use closest key
  const percentage = densityMap.totalPixels > 0
    ? (basePixels / densityMap.totalPixels) * 100
    : 0;
  
  return Math.max(0, Math.min(100, percentage));
}

