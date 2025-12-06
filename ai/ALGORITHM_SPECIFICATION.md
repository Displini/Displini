# Adaptive Density Timeline Algorithm Specification

## Table of Contents
1. [Task Sizing Algorithm](#task-sizing-algorithm)
2. [Density Analysis Algorithm](#density-analysis-algorithm)
3. [Time Mapping Algorithm](#time-mapping-algorithm)
4. [Position Calculation Algorithm](#position-calculation-algorithm)
5. [Free Time Calculation Algorithm](#free-time-calculation-algorithm)
6. [Complete Flow Example](#complete-flow-example)

---

## Task Sizing Algorithm

### Overview
Tasks are categorized into 3 size tiers based on duration, with each tier having different display characteristics.

### Constants
```typescript
const SHORT_TASK_MAX = 60;      // 1 hour in minutes
const MEDIUM_TASK_MAX = 120;    // 2 hours in minutes
const LONG_TASK_MAX = 240;      // 4 hours in minutes (cap)

// Visual size multipliers (relative to base)
const SHORT_SIZE_MULTIPLIER = 1.0;   // 100% of base
const MEDIUM_SIZE_MULTIPLIER = 1.5;  // 150% of base
const LONG_SIZE_MULTIPLIER = 2.0;    // 200% of base
```

### Algorithm: `getTaskDisplayDuration(task: Task): number`

**Input**: Task object with optional `time` and `endTime`

**Output**: Display duration in minutes (capped)

**Pseudocode**:
```
FUNCTION getTaskDisplayDuration(task):
  IF task.time is null:
    RETURN SHORT_TASK_MAX  // 60 minutes default
  
  // Calculate actual duration
  IF task.endTime exists:
    actualDuration = calculateDuration(task.time, task.endTime)
  ELSE:
    actualDuration = SHORT_TASK_MAX  // No endTime = short task
  
  // Categorize and cap
  IF actualDuration <= 0:
    RETURN SHORT_TASK_MAX
  
  IF actualDuration <= SHORT_TASK_MAX:        // 0-60 min
    RETURN actualDuration                      // Category 1: Short
  
  IF actualDuration <= MEDIUM_TASK_MAX:       // 60-120 min
    RETURN actualDuration                      // Category 2: Medium
  
  // actualDuration > MEDIUM_TASK_MAX (120+ min)
  RETURN MIN(actualDuration, LONG_TASK_MAX)   // Category 3: Long (capped at 240)
END FUNCTION
```

**Examples**:
- Task with no endTime → 60 min (Category 1)
- Task 30 min → 30 min (Category 1)
- Task 90 min → 90 min (Category 2)
- Task 150 min → 150 min (Category 3, uncapped but will be capped)
- Task 300 min → 240 min (Category 3, capped at max)

### Algorithm: `getTaskSizeCategory(task: Task): TaskSizeCategory`

**Output**: `'short' | 'medium' | 'long'`

**Pseudocode**:
```
FUNCTION getTaskSizeCategory(task):
  IF task.time is null:
    RETURN 'short'
  
  actualDuration = getTaskDisplayDuration(task)
  
  IF actualDuration <= SHORT_TASK_MAX:
    RETURN 'short'
  ELSE IF actualDuration <= MEDIUM_TASK_MAX:
    RETURN 'medium'
  ELSE:
    RETURN 'long'
END FUNCTION
```

---

## Density Analysis Algorithm

### Overview
Analyze task distribution across time windows to determine which periods need more/less vertical space.

### Constants
```typescript
const WINDOW_SIZE_MINUTES = 120;        // 2 hours per window
const WINDOW_OVERLAP_MINUTES = 60;      // 1 hour overlap between windows
const MIN_SPACE_MULTIPLIER = 0.3;       // Compress sparse to 30%
const MAX_SPACE_MULTIPLIER = 2.5;       // Expand dense to 250%
const BASE_SPACE_MULTIPLIER = 1.0;      // Normal = 100%
const SMOOTHING_WEIGHT = 0.3;           // For window transition smoothing
```

### Data Structures

```typescript
interface DensityWindow {
  startMinutes: number;      // Window start time in minutes
  endMinutes: number;        // Window end time in minutes
  taskCount: number;         // Number of tasks in this window
  reminderCount: number;     // Number of reminders in this window
  totalActivity: number;     // taskCount + reminderCount
  densityScore: number;      // Normalized 0-1 density score
  spaceMultiplier: number;   // 0.3 to 2.5 multiplier for space allocation
}

interface DensityMap {
  windows: DensityWindow[];
  timeToPixelMap: Map<number, number>;  // minute → accumulated pixels
  totalPixels: number;                   // Total timeline height in pixels
  startMinutes: number;                  // Timeline start
  endMinutes: number;                    // Timeline end
}
```

### Algorithm: `analyzeTaskDensity(timelineItems, startMinutes, endMinutes): DensityWindow[]`

**Purpose**: Create sliding windows and count activity in each window.

**Input**:
- `timelineItems: TimelineItem[]` - All timeline items (tasks + reminders)
- `startMinutes: number` - Timeline start time in minutes
- `endMinutes: number` - Timeline end time in minutes

**Output**: Array of `DensityWindow` objects

**Pseudocode**:
```
FUNCTION analyzeTaskDensity(timelineItems, startMinutes, endMinutes):
  windows = []
  
  // Create sliding windows
  currentStart = startMinutes
  stepSize = WINDOW_SIZE_MINUTES - WINDOW_OVERLAP_MINUTES  // 60 minutes
  
  WHILE currentStart < endMinutes:
    currentEnd = MIN(currentStart + WINDOW_SIZE_MINUTES, endMinutes)
    
    // Initialize window
    window = {
      startMinutes: currentStart,
      endMinutes: currentEnd,
      taskCount: 0,
      reminderCount: 0,
      totalActivity: 0,
      densityScore: 0,
      spaceMultiplier: BASE_SPACE_MULTIPLIER
    }
    
    // Count tasks that overlap with this window
    FOR EACH item IN timelineItems:
      itemMinutes = timeToMinutes(item.time)
      
      // Check if item time is within window
      IF itemMinutes >= currentStart AND itemMinutes < currentEnd:
        IF item.tasks.length > 0:
          // Count tasks in this item
          FOR EACH task IN item.tasks:
            IF task.time exists:
              taskStart = timeToMinutes(task.time)
              taskEnd = IF task.endTime exists THEN timeToMinutes(task.endTime) ELSE taskStart + 60
              
              // Check if task overlaps with window
              IF taskStart < currentEnd AND taskEnd > currentStart:
                window.taskCount = window.taskCount + 1
              END IF
            END IF
          END FOR
        ELSE:
          // This is a reminder (water, medication, etc.)
          window.reminderCount = window.reminderCount + 1
        END IF
      END IF
    END FOR
    
    window.totalActivity = window.taskCount + window.reminderCount
    windows.APPEND(window)
    
    currentStart = currentStart + stepSize
  END WHILE
  
  RETURN windows
END FUNCTION
```

### Algorithm: `calculateSpaceAllocation(windows: DensityWindow[]): DensityWindow[]`

**Purpose**: Calculate density scores and assign space multipliers to each window.

**Pseudocode**:
```
FUNCTION calculateSpaceAllocation(windows):
  IF windows.length == 0:
    RETURN windows
  
  // Step 1: Calculate raw density scores
  maxActivity = MAX(windows, window => window.totalActivity)
  
  IF maxActivity == 0:
    // No activity, use base multiplier for all
    FOR EACH window IN windows:
      window.spaceMultiplier = BASE_SPACE_MULTIPLIER
    END FOR
    RETURN windows
  END IF
  
  // Normalize density scores (0 to 1)
  FOR EACH window IN windows:
    window.densityScore = window.totalActivity / maxActivity
  END FOR
  
  // Step 2: Assign space multipliers based on density
  FOR EACH window IN windows:
    density = window.densityScore
    
    IF density > 0.7:
      // Very dense (top 30%): Maximum expansion
      window.spaceMultiplier = MAX_SPACE_MULTIPLIER  // 2.5x
    ELSE IF density > 0.4:
      // Dense (30-60%): Gradual expansion
      // Linear interpolation: 1.5x to 2.5x
      window.spaceMultiplier = 1.5 + (density - 0.4) * 3.33  // 1.5 to 2.5
    ELSE IF density > 0.2:
      // Normal (20-40%): Base size
      window.spaceMultiplier = BASE_SPACE_MULTIPLIER  // 1.0x
    ELSE:
      // Sparse (bottom 20%): Compression
      // Linear interpolation: 0.3x to 1.0x
      window.spaceMultiplier = MIN_SPACE_MULTIPLIER + density * 3.5  // 0.3 to 1.0
    END IF
  END FOR
  
  // Step 3: Smooth transitions between adjacent windows
  smoothed = COPY(windows)
  
  FOR i FROM 1 TO windows.length - 1:
    prevMultiplier = windows[i - 1].spaceMultiplier
    currMultiplier = windows[i].spaceMultiplier
    nextMultiplier = IF i < windows.length - 1 THEN windows[i + 1].spaceMultiplier ELSE currMultiplier
    
    // Weighted average with neighbors
    smoothed[i].spaceMultiplier = 
      prevMultiplier * SMOOTHING_WEIGHT +
      currMultiplier * (1 - 2 * SMOOTHING_WEIGHT) +
      nextMultiplier * SMOOTHING_WEIGHT
  END FOR
  
  RETURN smoothed
END FUNCTION
```

**Multiplier Assignment Formula**:
```
IF density > 0.7:      multiplier = 2.5
IF density > 0.4:      multiplier = 1.5 + (density - 0.4) * 3.33
IF density > 0.2:      multiplier = 1.0
ELSE:                  multiplier = 0.3 + density * 3.5
```

---

## Time Mapping Algorithm

### Algorithm: `createTimeMapping(windows: DensityWindow[], startMinutes, endMinutes, baseHeight: number): DensityMap`

**Purpose**: Build a non-linear mapping from time (minutes) to vertical position (pixels).

**Input**:
- `windows: DensityWindow[]` - Windows with assigned multipliers
- `startMinutes: number` - Timeline start
- `endMinutes: number` - Timeline end
- `baseHeight: number` - Base timeline height in pixels (e.g., 600px)

**Output**: `DensityMap` with time-to-pixel mapping

**Pseudocode**:
```
FUNCTION createTimeMapping(windows, startMinutes, endMinutes, baseHeight):
  timeToPixelMap = NEW Map<number, number>()
  rangeMinutes = endMinutes - startMinutes
  
  // Step 1: Calculate total "weighted" minutes
  totalWeightedMinutes = 0
  FOR EACH window IN windows:
    windowDuration = window.endMinutes - window.startMinutes
    weightedDuration = windowDuration * window.spaceMultiplier
    totalWeightedMinutes = totalWeightedMinutes + weightedDuration
  END FOR
  
  // Step 2: Calculate scale factor
  // We want total pixels to equal baseHeight
  pixelPerWeightedMinute = baseHeight / totalWeightedMinutes
  
  // Step 3: Build cumulative pixel map
  accumulatedPixels = 0
  
  // For each minute in the range, calculate its pixel position
  FOR minute FROM startMinutes TO endMinutes:
    // Find which window(s) this minute belongs to
    // (May overlap with multiple windows due to sliding)
    
    pixelIncrement = 0
    windowCount = 0
    
    FOR EACH window IN windows:
      IF minute >= window.startMinutes AND minute < window.endMinutes:
        // This minute is in this window
        // Distribute space based on this window's multiplier
        minuteWeight = window.spaceMultiplier / (window.endMinutes - window.startMinutes)
        pixelIncrement = pixelIncrement + minuteWeight
        windowCount = windowCount + 1
      END IF
    END FOR
    
    // Average if minute is in multiple windows (overlap)
    IF windowCount > 0:
      pixelIncrement = pixelIncrement / windowCount
    ELSE:
      pixelIncrement = BASE_SPACE_MULTIPLIER / rangeMinutes  // Fallback
    
    // Scale to actual pixels
    pixelIncrement = pixelIncrement * pixelPerWeightedMinute
    
    // Store cumulative position
    timeToPixelMap[minute] = accumulatedPixels
    accumulatedPixels = accumulatedPixels + pixelIncrement
  END FOR
  
  totalPixels = accumulatedPixels
  
  RETURN {
    windows: windows,
    timeToPixelMap: timeToPixelMap,
    totalPixels: totalPixels,
    startMinutes: startMinutes,
    endMinutes: endMinutes
  }
END FUNCTION
```

**Optimization Note**: Instead of iterating through every minute, we can:
1. Calculate pixel positions only at window boundaries
2. Interpolate linearly within windows
3. This reduces computation from O(rangeMinutes) to O(windows.length)

**Optimized Version**:
```
FUNCTION createTimeMappingOptimized(windows, startMinutes, endMinutes, baseHeight):
  timeToPixelMap = NEW Map<number, number>()
  
  // Step 1: Calculate scale factor
  totalWeightedMinutes = 0
  FOR EACH window IN windows:
    windowDuration = window.endMinutes - window.startMinutes
    totalWeightedMinutes = totalWeightedMinutes + (windowDuration * window.spaceMultiplier)
  END FOR
  
  pixelPerWeightedMinute = baseHeight / totalWeightedMinutes
  
  // Step 2: Build map at key points (window boundaries and every 15 minutes)
  keyPoints = []
  keyPoints.APPEND(startMinutes)
  
  FOR EACH window IN windows:
    keyPoints.APPEND(window.startMinutes)
    keyPoints.APPEND(window.endMinutes)
  END FOR
  
  // Add 15-minute intervals
  FOR minute FROM startMinutes TO endMinutes STEP 15:
    IF minute NOT IN keyPoints:
      keyPoints.APPEND(minute)
    END IF
  END FOR
  
  keyPoints.APPEND(endMinutes)
  keyPoints.SORT()
  
  // Step 3: Calculate pixel positions at key points
  accumulatedPixels = 0
  
  FOR i FROM 0 TO keyPoints.length - 2:
    currentMinute = keyPoints[i]
    nextMinute = keyPoints[i + 1]
    duration = nextMinute - currentMinute
    
    // Find multiplier for this segment
    multiplier = getMultiplierForMinute(currentMinute, windows)
    
    pixelIncrement = duration * multiplier * pixelPerWeightedMinute
    
    timeToPixelMap[currentMinute] = accumulatedPixels
    accumulatedPixels = accumulatedPixels + pixelIncrement
  END FOR
  
  timeToPixelMap[endMinutes] = accumulatedPixels
  
  RETURN {
    windows: windows,
    timeToPixelMap: timeToPixelMap,
    totalPixels: accumulatedPixels,
    startMinutes: startMinutes,
    endMinutes: endMinutes
  }
END FUNCTION

FUNCTION getMultiplierForMinute(minute, windows):
  // Find window(s) containing this minute and return average multiplier
  multipliers = []
  FOR EACH window IN windows:
    IF minute >= window.startMinutes AND minute < window.endMinutes:
      multipliers.APPEND(window.spaceMultiplier)
    END IF
  END FOR
  
  IF multipliers.length > 0:
    RETURN AVERAGE(multipliers)
  ELSE:
    RETURN BASE_SPACE_MULTIPLIER
  END IF
END FUNCTION
```

---

## Position Calculation Algorithm

### Algorithm: `getAdaptivePosition(timeMinutes, densityMap, bounds): number`

**Purpose**: Convert a time (in minutes) to a percentage position (0-100%) using the density map.

**Input**:
- `timeMinutes: number` - Time in minutes since midnight
- `densityMap: DensityMap` - Pre-calculated density map
- `bounds: TimelineBounds` - Timeline bounds for validation

**Output**: Percentage position (0-100%)

**Pseudocode**:
```
FUNCTION getAdaptivePosition(timeMinutes, densityMap, bounds):
  // Clamp time to bounds
  IF timeMinutes < bounds.startMinutes:
    RETURN 0.0  // Above timeline
  END IF
  
  IF timeMinutes > bounds.endMinutes:
    RETURN 100.0  // Below timeline
  END IF
  
  // Find closest key point in map
  closestKey = findClosestKey(timeMinutes, densityMap.timeToPixelMap)
  
  // Get pixel position at closest key
  basePixels = densityMap.timeToPixelMap[closestKey]
  
  // If exact match, convert to percentage
  IF closestKey == timeMinutes:
    percentage = (basePixels / densityMap.totalPixels) * 100
    RETURN CLAMP(percentage, 0, 100)
  END IF
  
  // Interpolate between closest key and next key
  nextKey = findNextKey(closestKey, densityMap.timeToPixelMap)
  
  IF nextKey exists:
    nextPixels = densityMap.timeToPixelMap[nextKey]
    keyDuration = nextKey - closestKey
    timeOffset = timeMinutes - closestKey
    
    // Linear interpolation
    pixelOffset = ((nextPixels - basePixels) / keyDuration) * timeOffset
    totalPixels = basePixels + pixelOffset
  ELSE:
    totalPixels = basePixels
  END IF
  
  // Convert to percentage
  percentage = (totalPixels / densityMap.totalPixels) * 100
  
  RETURN CLAMP(percentage, 0, 100)
END FUNCTION

FUNCTION findClosestKey(target, map):
  // Find the largest key <= target
  closest = null
  FOR EACH key IN map.keys:
    IF key <= target AND (closest == null OR key > closest):
      closest = key
    END IF
  END FOR
  
  IF closest == null:
    // No key found, return smallest key
    RETURN MIN(map.keys)
  END IF
  
  RETURN closest
END FUNCTION

FUNCTION findNextKey(currentKey, map):
  // Find smallest key > currentKey
  next = null
  FOR EACH key IN map.keys:
    IF key > currentKey AND (next == null OR key < next):
      next = key
    END IF
  END FOR
  RETURN next
END FUNCTION
```

---

## Complete Flow Example

### Example Scenario

**Timeline Items**:
- Task 1: 09:00 - 10:00 (1 hour)
- Task 2: 09:30 - 11:00 (1.5 hours)
- Task 3: 14:00 - 15:00 (1 hour)
- Water reminder: 10:00
- Water reminder: 15:00
- Sleep: 23:00

**Timeline Bounds**: 06:00 - 23:00 (startMinutes=360, endMinutes=1380)

### Step 1: Create Windows

```
Window 1: 06:00-08:00 (360-480 min)
Window 2: 07:00-09:00 (420-540 min)
Window 3: 08:00-10:00 (480-600 min)  ← Tasks here
Window 4: 09:00-11:00 (540-660 min)  ← Dense!
Window 5: 10:00-12:00 (600-720 min)
Window 6: 11:00-13:00 (660-780 min)
Window 7: 13:00-15:00 (780-900 min)  ← Task here
Window 8: 14:00-16:00 (840-960 min)  ← Task here
... (continue until 23:00)
```

### Step 2: Count Activity

```
Window 3: taskCount=0, reminderCount=0 → totalActivity=0
Window 4: taskCount=2 (Task 1, Task 2), reminderCount=1 (water 10:00) → totalActivity=3
Window 5: taskCount=1 (Task 2), reminderCount=0 → totalActivity=1
Window 7: taskCount=1 (Task 3), reminderCount=1 (water 15:00) → totalActivity=2
Window 8: taskCount=0, reminderCount=1 → totalActivity=1
... (others have 0)
```

### Step 3: Calculate Density Scores

```
maxActivity = 3

Window 3: densityScore = 0/3 = 0.0
Window 4: densityScore = 3/3 = 1.0  ← Highest
Window 5: densityScore = 1/3 = 0.33
Window 7: densityScore = 2/3 = 0.67
Window 8: densityScore = 1/3 = 0.33
```

### Step 4: Assign Multipliers

```
Window 3: density=0.0  → multiplier = 0.3 + 0.0*3.5 = 0.3 (sparse, compressed)
Window 4: density=1.0  → multiplier = 2.5 (very dense, expanded)
Window 5: density=0.33 → multiplier = 1.0 (normal)
Window 7: density=0.67 → multiplier = 1.5 + (0.67-0.4)*3.33 = 2.4 (dense, expanded)
Window 8: density=0.33 → multiplier = 1.0 (normal)
```

### Step 5: Build Pixel Map

For simplicity, assume baseHeight = 600px and we're calculating at key points:

```
At 09:00 (540 min): accumulatedPixels = [calculated based on weighted windows]
At 10:00 (600 min): accumulatedPixels = [higher increment due to Window 4's 2.5x multiplier]
At 11:00 (660 min): accumulatedPixels = [slower increment after dense period]
...
```

### Step 6: Calculate Positions

```
Task 1 at 09:00:
  position = getAdaptivePosition(540, densityMap, bounds)
  → Uses timeToPixelMap[540] → converts to percentage → e.g., 15%

Task 1 at 10:00:
  position = getAdaptivePosition(600, densityMap, bounds)
  → Higher percentage due to expanded Window 4 → e.g., 22%

Task 3 at 14:00:
  position = getAdaptivePosition(840, densityMap, bounds)
  → Uses Window 7/8 → e.g., 65%
```

---

## Edge Cases & Validation

### Edge Case 1: No Tasks
- All windows have 0 activity
- All multipliers = 1.0 (base)
- Result: Linear timeline (same as before)

### Edge Case 2: Single Task
- Only one window has activity
- That window gets max multiplier (2.5x)
- Other windows get min multiplier (0.3x)
- Result: Task is expanded, empty space is compressed

### Edge Case 3: All Tasks at Same Time
- Single window has all activity
- That window gets max multiplier
- Result: That time period is heavily expanded

### Edge Case 4: Uniform Distribution
- All windows have similar activity
- All multipliers ≈ 1.0
- Result: Near-linear timeline

### Edge Case 5: Very Long Timeline (e.g., 18 hours)
- Many windows created
- Algorithm scales linearly with window count
- Optimization: Use 15-minute intervals in pixel map instead of 1-minute

### Edge Case 6: Very Short Timeline (e.g., 2 hours)
- May have only 1-2 windows
- Smoothing still applied
- Result: Slight adjustments based on density

---

## Performance Considerations

### Time Complexity
- `analyzeTaskDensity`: O(timelineItems.length × windows.length)
- `calculateSpaceAllocation`: O(windows.length)
- `createTimeMapping`: O(keyPoints.length) where keyPoints ≈ windows.length × 4 + rangeMinutes/15
- `getAdaptivePosition`: O(log n) with binary search, or O(n) with linear search

### Space Complexity
- `DensityMap.timeToPixelMap`: O(keyPoints.length) ≈ O(windows.length × 4)
- For 18-hour timeline: ~72 windows × 4 = 288 key points = minimal memory

### Optimization Strategies
1. **Cache density map** in `useMemo` (only recalculate when tasks change)
2. **Use binary search** for `findClosestKey` if keyPoints is sorted array
3. **Lazy evaluation**: Only calculate positions when needed
4. **15-minute granularity**: Instead of 1-minute precision, use 15-minute intervals

---

## Integration Points

### Updated Functions

1. **`calculateTimelineBounds()`**:
   - Remove DEFAULT_START/DEFAULT_END
   - Use only actual task/reminder times
   - Call `analyzeTaskDensity()` → `calculateSpaceAllocation()` → `createTimeMapping()`
   - Return bounds with `densityMap` attached

2. **`calculatePosition()`**:
   - Check if `bounds.densityMap` exists
   - If yes: Use `getAdaptivePosition()`
   - If no: Fall back to linear calculation

3. **`getTaskDisplayDuration()`**:
   - Use 3-tier system (60/120/240 min categories)
   - Return actual duration for short/medium, capped for long

---

## Testing Matrix

| Scenario | Expected Behavior |
|----------|-------------------|
| 1 task, 1 hour duration | Timeline compresses empty space, task visible |
| 10 tasks in 2-hour window | That window expands, tasks well-spaced |
| Tasks evenly distributed | Near-linear timeline |
| No tasks (only reminders) | Timeline uses reminder times, linear scaling |
| Single 8-hour task | Task capped at 240 min (4 hours) in Category 3 |
| Task with no endTime | Treated as Category 1 (60 min) |
| Empty day | Timeline uses sleep schedule or minimal bounds |

