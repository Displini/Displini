import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Bell, 
  CheckSquare, 
  Calendar, 
  Sparkles, 
  Droplets, 
  Pill, 
  Moon, 
  Heart, 
  Dumbbell, 
  Briefcase,
  GraduationCap,
  Plus,
  X
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

interface Shortcut {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  path?: string;
  action?: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  {
    id: 'reminders',
    name: 'Reminders',
    icon: Bell,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    path: '/reminders',
    description: 'Manage your reminders and notifications'
  },
  {
    id: 'todo',
    name: 'To Do',
    icon: CheckSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    path: '/todo',
    description: 'Track your tasks and productivity'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    path: '/calendar',
    description: 'Plan and organize your schedule'
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    icon: Sparkles,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    path: '/ai',
    description: 'Get help from your AI assistant'
  },
  {
    id: 'water',
    name: 'Water Intake',
    icon: Droplets,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    action: 'openWaterIntake',
    description: 'Track your daily water consumption'
  },
  {
    id: 'medication',
    name: 'Medication',
    icon: Pill,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    action: 'openMedication',
    description: 'Manage medication reminders'
  },
  {
    id: 'sleep',
    name: 'Sleep Schedule',
    icon: Moon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    action: 'openSleepSchedule',
    description: 'Track your sleep and wind down routine'
  },
  {
    id: 'menstrual',
    name: 'Menstrual Cycle',
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    action: 'openMenstrualCycle',
    description: 'Track your menstrual cycle'
  },
  {
    id: 'workout',
    name: 'Workout Routine',
    icon: Dumbbell,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    action: 'openWorkout',
    description: 'Plan and track your workouts'
  },
  {
    id: 'work',
    name: 'Work',
    icon: Briefcase,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    action: 'openWork',
    description: 'Manage work schedules'
  },
  {
    id: 'school',
    name: 'School',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    action: 'openSchool',
    description: 'Manage academic schedules'
  }
];

interface ShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Shortcuts({ isOpen, onClose }: ShortcutsProps) {
  const [, setLocation] = useLocation();

  const handleShortcutClick = (shortcut: Shortcut) => {
    if (shortcut.action) {
      // Dispatch custom events for special actions
      window.dispatchEvent(new CustomEvent(shortcut.action));
      onClose();
    } else if (shortcut.path) {
      setLocation(shortcut.path);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Quick Shortcuts</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Card
                key={shortcut.id}
                className="p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                onClick={() => handleShortcutClick(shortcut)}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-12 h-12 rounded-xl ${shortcut.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${shortcut.color}`} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-sm text-foreground">{shortcut.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{shortcut.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Tap any shortcut to navigate quickly
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
