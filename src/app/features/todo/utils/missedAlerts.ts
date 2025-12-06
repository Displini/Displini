import { hasTimePassed } from './timeHelpers';

interface WaterSettings {
  showMissedAlerts?: boolean;
  reminderTimes?: string[];
}

interface MedicationSettings {
  showMissedAlerts?: boolean;
  medications?: Array<{
    id: string;
    times: string[];
  }>;
}

interface WaterEntry {
  date: string;
  time: string;
  amount: number;
}

interface MedicationEntry {
  medicationId: string;
  date: string;
  time: string;
  taken: boolean;
}

/**
 * Check if water intake reminder was missed
 */
export function checkWaterIntakeMissed(
  time: string,
  currentTime: string,
  today: string,
  settings: WaterSettings
): boolean {
  // Check if alerts are enabled
  if (!settings.showMissedAlerts) return false;
  
  // Check if time has passed
  if (!hasTimePassed(time, currentTime)) return false;
  
  // Check if water was logged
  const waterEntries: WaterEntry[] = JSON.parse(
    localStorage.getItem('water_entries') || '[]'
  );
  
  const wasLogged = waterEntries.some(entry => {
    const entryDate = typeof entry.date === 'string' 
      ? entry.date.split('T')[0] 
      : new Date(entry.date).toISOString().split('T')[0];
    
    return entryDate === today && entry.time === time;
  });
  
  return !wasLogged;
}

/**
 * Check if medication reminder was missed
 */
export function checkMedicationMissed(
  medicationId: string,
  time: string,
  currentTime: string,
  today: string,
  settings: MedicationSettings
): boolean {
  // Check if alerts are enabled
  if (!settings.showMissedAlerts) return false;
  
  // Check if time has passed
  if (!hasTimePassed(time, currentTime)) return false;
  
  // Check if medication was taken
  const medicationEntries: MedicationEntry[] = JSON.parse(
    localStorage.getItem('medication_entries') || '[]'
  );
  
  const wasTaken = medicationEntries.some(entry => {
    const entryDate = typeof entry.date === 'string'
      ? entry.date.split('T')[0]
      : new Date(entry.date).toISOString().split('T')[0];
    
    return (
      entry.medicationId === medicationId &&
      entryDate === today &&
      entry.time === time &&
      entry.taken === true
    );
  });
  
  return !wasTaken;
}

/**
 * Get missed alert count for a day
 */
export function getMissedAlertsCount(
  today: string,
  currentTime: string,
  waterSettings: WaterSettings,
  medicationSettings: MedicationSettings
): { water: number; medication: number; total: number } {
  let waterMissed = 0;
  let medicationMissed = 0;
  
  // Count missed water reminders
  if (waterSettings.showMissedAlerts && waterSettings.reminderTimes) {
    waterMissed = waterSettings.reminderTimes.filter(time =>
      checkWaterIntakeMissed(time, currentTime, today, waterSettings)
    ).length;
  }
  
  // Count missed medication reminders
  if (medicationSettings.showMissedAlerts && medicationSettings.medications) {
    medicationSettings.medications.forEach(med => {
      med.times.forEach(time => {
        if (checkMedicationMissed(med.id, time, currentTime, today, medicationSettings)) {
          medicationMissed++;
        }
      });
    });
  }
  
  return {
    water: waterMissed,
    medication: medicationMissed,
    total: waterMissed + medicationMissed,
  };
}

