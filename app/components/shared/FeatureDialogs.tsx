import { useState, useEffect } from 'react';
import SleepScheduleFeature from "@/app/features/reminders/SleepScheduleFeature";
import MenstrualCycleTracker from "@/app/features/reminders/MenstrualCycleTracker";
import MedicationTracker from "@/app/features/reminders/MedicationTracker";
import WaterIntakeFeature from "@/app/features/reminders/WaterIntakeFeature";
import FoodTrackerFeature from "@/app/features/reminders/FoodTrackerFeature";
import WorkFeature from "@/app/features/reminders/WorkFeature";
import SchoolFeature from "@/app/features/reminders/SchoolFeature";
import JournalFeature from "@/app/features/reminders/JournalFeature";

export function FeatureDialogs() {
  const [showSleepFeature, setShowSleepFeature] = useState(false);
  const [showMenstrualFeature, setShowMenstrualFeature] = useState(false);
  const [showMedicationFeature, setShowMedicationFeature] = useState(false);
  const [showWaterFeature, setShowWaterFeature] = useState(false);
  const [showFoodFeature, setShowFoodFeature] = useState(false);
  const [showWorkFeature, setShowWorkFeature] = useState(false);
  const [showSchoolFeature, setShowSchoolFeature] = useState(false);
  const [showJournalFeature, setShowJournalFeature] = useState(false);

  // Listen for feature open events
  useEffect(() => {
    const handleOpenFeature = (e: Event) => {
      const customEvent = e as CustomEvent;
      const featureId = customEvent.detail.featureId;
      
      switch (featureId) {
        case 'sleep':
          setShowSleepFeature(true);
          break;
        case 'menstrual':
          setShowMenstrualFeature(true);
          break;
        case 'medication':
          setShowMedicationFeature(true);
          break;
        case 'water':
          setShowWaterFeature(true);
          break;
        case 'food':
          setShowFoodFeature(true);
          break;
        case 'work':
          setShowWorkFeature(true);
          break;
        case 'school':
          setShowSchoolFeature(true);
          break;
        case 'journal':
          setShowJournalFeature(true);
          break;
      }
    };

    window.addEventListener('openFeature', handleOpenFeature);
    return () => window.removeEventListener('openFeature', handleOpenFeature);
  }, []);

  return (
    <>
      <SleepScheduleFeature isOpen={showSleepFeature} onClose={() => setShowSleepFeature(false)} />
      <MenstrualCycleTracker isOpen={showMenstrualFeature} onClose={() => setShowMenstrualFeature(false)} />
      <MedicationTracker isOpen={showMedicationFeature} onClose={() => setShowMedicationFeature(false)} />
      <WaterIntakeFeature isOpen={showWaterFeature} onClose={() => setShowWaterFeature(false)} />
      <FoodTrackerFeature isOpen={showFoodFeature} onClose={() => setShowFoodFeature(false)} />
      <WorkFeature isOpen={showWorkFeature} onClose={() => setShowWorkFeature(false)} />
      <SchoolFeature isOpen={showSchoolFeature} onClose={() => setShowSchoolFeature(false)} />
      <JournalFeature isOpen={showJournalFeature} onClose={() => setShowJournalFeature(false)} />
    </>
  );
}

// Export open function
export const openFeatureDialog = (featureId: string) => {
  window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId } }));
};
