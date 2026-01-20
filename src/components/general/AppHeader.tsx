import { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  Moon, 
  Sun,
  Settings,
  BarChart3,
  Calendar, 
  Heart, 
  Pill, 
  Droplets, 
  Dumbbell, 
  Briefcase,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Utensils
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { colors } from "@/lib/designSystem";
import JournalFeature from "@/components/features/reminders/JournalFeature";
import SleepScheduleFeature from "@/components/features/reminders/SleepScheduleFeature";
import WaterIntakeFeature from "@/components/features/reminders/WaterIntakeFeature";
import FoodTrackerFeature from "@/components/features/reminders/FoodTrackerFeature";
import MenstrualCycleTracker from "@/components/features/reminders/MenstrualCycleTracker";
import MedicationTracker from "@/components/features/reminders/MedicationTracker";
import WorkFeature from "@/components/features/reminders/WorkFeature";
import SchoolFeature from "@/components/features/reminders/SchoolFeature";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onSettingsClick?: () => void;
  onStatsClick?: () => void;
}

interface Feature {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

// Features ordered to match landing page carousel (Section 3) and FeaturesSidebar
// Order: Sleep, Water, Medication, Food, Menstrual, Sport, Journal, Office, School
const features: Feature[] = [
  {
    id: 'sleep',
    name: 'Sleep Schedule',
    icon: Moon,
    description: 'Wind Down & Start Up routines',
    color: colors.features.sleep
  },
  {
    id: 'water',
    name: 'Water Intake',
    icon: Droplets,
    description: 'Stay hydrated throughout the day',
    color: colors.features.water
  },
  {
    id: 'medication',
    name: 'Medication',
    icon: Pill,
    description: 'Reminders and tracking',
    color: colors.features.medication
  },
  {
    id: 'food',
    name: 'Food Tracker',
    icon: Utensils,
    description: 'Track calories and macros',
    color: colors.features.food || '#f59e0b'
  },
  {
    id: 'menstrual',
    name: 'Menstrual Cycle',
    icon: Heart,
    description: 'Track your cycle and symptoms',
    color: colors.features.menstrual
  },
  {
    id: 'sport',
    name: 'Sport',
    icon: Dumbbell,
    description: 'Plan and track your exercises',
    color: colors.features.sport
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: BookOpen,
    description: 'Reflect and document your thoughts',
    color: colors.features.journal
  },
  {
    id: 'work',
    name: 'Office',
    icon: Briefcase,
    description: 'Work schedules and productivity',
    color: colors.features.office
  },
  {
    id: 'school',
    name: 'School',
    icon: GraduationCap,
    description: 'Academic schedules and studies',
    color: colors.features.school
  }
];

export default function AppHeader({ title, subtitle, onSettingsClick, onStatsClick }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showSleepSchedule, setShowSleepSchedule] = useState(false);
  const [showWaterIntake, setShowWaterIntake] = useState(false);
  const [showFoodTracker, setShowFoodTracker] = useState(false);
  const [showMenstrualCycle, setShowMenstrualCycle] = useState(false);
  const [showMedication, setShowMedication] = useState(false);
  const [showWork, setShowWork] = useState(false);
  const [showSchool, setShowSchool] = useState(false);

  // Listen for custom events from shortcuts
  useEffect(() => {
    const handleOpenWaterIntake = () => {
      setShowWaterIntake(true);
    };

    const handleOpenMedication = () => {
      setShowMedication(true);
    };

    const handleOpenSleepSchedule = () => {
      setShowSleepSchedule(true);
    };

    const handleOpenMenstrualCycle = () => {
      setShowMenstrualCycle(true);
    };

    const handleOpenWork = () => {
      setShowWork(true);
    };

    const handleOpenSchool = () => {
      setShowSchool(true);
    };

    window.addEventListener('openWaterIntake', handleOpenWaterIntake);
    window.addEventListener('openMedication', handleOpenMedication);
    window.addEventListener('openSleepSchedule', handleOpenSleepSchedule);
    window.addEventListener('openMenstrualCycle', handleOpenMenstrualCycle);
    window.addEventListener('openWork', handleOpenWork);
    window.addEventListener('openSchool', handleOpenSchool);

    return () => {
      window.removeEventListener('openWaterIntake', handleOpenWaterIntake);
      window.removeEventListener('openMedication', handleOpenMedication);
      window.removeEventListener('openSleepSchedule', handleOpenSleepSchedule);
      window.removeEventListener('openMenstrualCycle', handleOpenMenstrualCycle);
      window.removeEventListener('openWork', handleOpenWork);
      window.removeEventListener('openSchool', handleOpenSchool);
    };
  }, []);

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeature(featureId);
    
    // Navigate to appropriate page based on feature
    setTimeout(() => {
      switch (featureId) {
        case 'water':
          // Open water intake feature dialog
          setShowWaterIntake(true);
          break;
        case 'food':
          // Open food tracker feature dialog
          setShowFoodTracker(true);
          break;
        case 'medication':
          // Open medication tracker dialog
          setShowMedication(true);
          break;
        case 'sleep':
          // Open sleep schedule feature dialog
          setShowSleepSchedule(true);
          break;
        case 'menstrual':
          // Open menstrual cycle tracker dialog
          setShowMenstrualCycle(true);
          break;
        case 'workout':
          // Workout feature removed - use manual tasks instead
          alert('Workout tracking can be added through manual tasks in the To Do page.');
          break;
        case 'work':
          // Open work dialog
          setShowWork(true);
          break;
        case 'school':
          // Open school dialog
          setShowSchool(true);
          break;
        case 'journal':
          // Open journal feature dialog
          setShowJournal(true);
          break;
        default:
      }
      setIsMenuOpen(false);
      setSelectedFeature(null);
    }, 300);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Toggle dark mode on the document
    document.documentElement.classList.toggle('dark');
  };

  return (
    <>
      {/* Header - Hidden since pages now have their own headers */}

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Features</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={feature.id}
                      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedFeature === feature.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleFeatureClick(feature.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${feature.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: feature.color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{feature.name}</h3>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Tap any feature to set it up
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Dialogs */}
      <JournalFeature 
        isOpen={showJournal} 
        onClose={() => setShowJournal(false)} 
      />

      <SleepScheduleFeature 
        isOpen={showSleepSchedule} 
        onClose={() => setShowSleepSchedule(false)} 
      />

      <WaterIntakeFeature 
        isOpen={showWaterIntake} 
        onClose={() => setShowWaterIntake(false)} 
      />

      <FoodTrackerFeature 
        isOpen={showFoodTracker} 
        onClose={() => setShowFoodTracker(false)} 
      />

      <MenstrualCycleTracker 
        isOpen={showMenstrualCycle} 
        onClose={() => setShowMenstrualCycle(false)} 
      />

      <MedicationTracker 
        isOpen={showMedication} 
        onClose={() => setShowMedication(false)} 
      />

      <WorkFeature 
        isOpen={showWork} 
        onClose={() => setShowWork(false)} 
      />

      <SchoolFeature 
        isOpen={showSchool} 
        onClose={() => setShowSchool(false)} 
      />
    </>
  );
}
