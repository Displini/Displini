import React from 'react';
import { TimelineItem, TimelineBounds, calculatePosition } from '../utils/timelineCalculations';
import { TimelineDot } from './TimelineDot';
import { checkWaterIntakeMissed, checkMedicationMissed } from '../utils/missedAlerts';
import { formatTimeString, getCurrentTime } from '@/lib/timeUtils';

interface ReminderDotsProps {
  timelineItems: TimelineItem[];
  bounds: TimelineBounds;
  isToday: boolean;
  currentTime: string;
  today: string;
  onWaterReminderClick?: (time: string) => void;
  onMedicationReminderClick?: (time: string) => void;
  onJournalReminderClick?: (time: string) => void;
}

export function ReminderDots({
  timelineItems,
  bounds,
  isToday,
  currentTime,
  today,
  onWaterReminderClick,
  onMedicationReminderClick,
  onJournalReminderClick,
}: ReminderDotsProps) {
  // Get settings
  const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
  const medications = JSON.parse(localStorage.getItem('medications') || '[]');
  const medicationSettings = {
    showMissedAlerts: medications.some((m: any) => m.showMissedAlerts),
    medications: medications.filter((m: any) => m.isActive),
  };
  
  // Get display preferences (default to 'dot' - recommended)
  const waterDisplayMode = waterSettings.displayMode || 'dot';
  // Medication settings don't have displayMode yet - default to 'dot' for now
  const medicationDisplayMode = 'dot';
  
  // Deduplicate by time to prevent multiple dots at the same position
  const renderedTimes = new Set<string>();
  
  return (
    <>
      {timelineItems.map((item) => {
        // Skip wake/sleep items - they are rendered separately in LiquidTimeline
        if (item.isWakeUp || item.isBedTime) {
          return null;
        }
        
        // Skip if we've already rendered a dot at this time
        if (renderedTimes.has(item.time)) {
          return null;
        }
        
        const position = calculatePosition(item.time, bounds);
        const hasPassed = isToday && item.time < currentTime;
        
        // Check if there are water/medication tasks at this time (if so, don't show dot if user prefers container)
        const hasWaterTask = item.tasks.some(t => t.source === 'water');
        const hasMedicationTask = item.tasks.some(t => t.source === 'medication');
        
        // Water reminder dot - only show if no water task exists OR user prefers dots
        if (item.waterReminder && (!hasWaterTask || waterDisplayMode === 'dot')) {
          renderedTimes.add(item.time); // Mark this time as rendered
          const isMissed = checkWaterIntakeMissed(
            item.time,
            currentTime,
            today,
            waterSettings
          );
          
          return (
            <TimelineDot
              key={`water-${item.time}`}
              time={item.time}
              position={position}
              type="water"
              hasPassed={hasPassed}
              isMissed={isMissed}
              onClick={() => onWaterReminderClick?.(item.time)}
              emoji="💧"
            />
          );
        }
        
        // Medication reminder dot - only show if no medication task exists OR user prefers dots
        if (item.medicationReminder && (!hasMedicationTask || medicationDisplayMode === 'dot')) {
          renderedTimes.add(item.time); // Mark this time as rendered
          // Find which medication(s) have this time
          const medicationForTime = medications.find((m: any) => 
            m.isActive && m.times?.includes(item.time)
          );
          
          const isMissed = medicationForTime
            ? checkMedicationMissed(
                medicationForTime.id,
                item.time,
                currentTime,
                today,
                medicationSettings
              )
            : false;
          
          return (
            <TimelineDot
              key={`medication-${item.time}`}
              time={item.time}
              position={position}
              type="medication"
              hasPassed={hasPassed}
              isMissed={isMissed}
              onClick={() => onMedicationReminderClick?.(item.time)}
              emoji="💊"
            />
          );
        }
        
        // Journal reminder dot
        if (item.journalReminder) {
          renderedTimes.add(item.time); // Mark this time as rendered
          return (
            <TimelineDot
              key={`journal-${item.time}`}
              time={item.time}
              position={position}
              type="journal"
              hasPassed={hasPassed}
              onClick={() => onJournalReminderClick?.(item.time)}
              emoji="📔"
            />
          );
        }
        
        return null;
      })}
    </>
  );
}

