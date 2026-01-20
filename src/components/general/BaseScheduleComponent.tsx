import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UniversalDialog } from "@/components/general";
import { Plus, Play, Pause, RotateCcw, Timer, Eye, ArrowUpDown, User2, Clock, Settings } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ColorPicker, getThemeColor } from "@/components/general";

// Base interface for schedule items (work shifts, classes, etc.)
export interface BaseScheduleItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  color?: string;
  emoji?: string;
}

// Base interface for settings
export interface BaseSettings {
  isSetupComplete: boolean;
  schedule: BaseScheduleItem;
  pomodoroWork: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  pomodoroLongBreakInterval: number;
}

// Props for the base component
export interface BaseScheduleProps {
  title: string;
  icon: React.ReactNode;
  settingsKey: string;
  defaultSettings: BaseSettings;
  onSyncToTimeline: (settings: BaseSettings) => void;
  quickActions?: React.ReactNode;
}

export function BaseScheduleComponent({
  title,
  icon,
  settingsKey,
  defaultSettings,
  onSyncToTimeline,
  quickActions
}: BaseScheduleProps) {
  const [settings, setSettings] = useState<BaseSettings>(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [setupStartTime, setSetupStartTime] = useState('09:00');
  const [setupEndTime, setSetupEndTime] = useState('17:00');
  const [setupDays, setSetupDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [setupColor, setSetupColor] = useState(getThemeColor());

  // Pomodoro timer state
  const [pomodoroTime, setPomodoroTime] = useState(settings.pomodoroWork * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    if (settings.isSetupComplete) {
      onSyncToTimeline(settings);
    }
  }, [settings, settingsKey, onSyncToTimeline]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      handlePomodoroComplete();
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroTime]);

  const handlePomodoroComplete = () => {
    setPomodoroRunning(false);
    
    if (pomodoroMode === 'work') {
      setPomodoroCount(prev => prev + 1);
      if (pomodoroCount + 1 >= settings.pomodoroLongBreakInterval) {
        setPomodoroMode('longBreak');
        setPomodoroTime(settings.pomodoroLongBreak * 60);
        setPomodoroCount(0);
      } else {
        setPomodoroMode('break');
        setPomodoroTime(settings.pomodoroBreak * 60);
      }
    } else {
      setPomodoroMode('work');
      setPomodoroTime(settings.pomodoroWork * 60);
    }
  };

  const handleSetupComplete = () => {
    const newSettings: BaseSettings = {
      ...settings,
      isSetupComplete: true,
      schedule: {
        id: settings.schedule.id,
        name: settings.schedule.name,
        startTime: setupStartTime,
        endTime: setupEndTime,
        days: setupDays,
        color: setupColor,
        emoji: settings.schedule.emoji,
      },
    };
    
    setSettings(newSettings);
    setIsSetupOpen(false);
  };

  const toggleDay = (day: string) => {
    if (setupDays.includes(day)) {
      setSetupDays(setupDays.filter(d => d !== day));
    } else {
      setSetupDays([...setupDays, day]);
    }
  };

  const calculateWorkingHours = () => {
    const startMinutes = parseInt(setupStartTime.split(':')[0]) * 60 + parseInt(setupStartTime.split(':')[1]);
    const endMinutes = parseInt(setupEndTime.split(':')[0]) * 60 + parseInt(setupEndTime.split(':')[1]);
    const workMinutes = endMinutes - startMinutes;
    
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;
    return { hours, minutes, total: workMinutes };
  };

  const workingHours = calculateWorkingHours();

  if (!settings.isSetupComplete) {
    return (
      <div className="flex items-center justify-center h-32 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <Button
          onClick={() => setIsSetupOpen(true)}
          className="h-16 w-16 rounded-full"
          size="icon"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Display */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {settings.schedule.startTime} - {settings.schedule.endTime}
              </p>
              <p className="text-xs text-muted-foreground">
                Working Hours: {workingHours.hours}h {workingHours.minutes}m
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Quick Actions */}
        {quickActions}
      </div>

      {/* Setup Dialog */}
      <UniversalDialog
        open={isSetupOpen}
        onOpenChange={setIsSetupOpen}
        title={`Setup ${title}`}
        hideDefaultFooter
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Start Time</Label>
              <Input
                type="time"
                value={setupStartTime}
                onChange={(e) => setSetupStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-base font-semibold mb-3 block">End Time</Label>
              <Input
                type="time"
                value={setupEndTime}
                onChange={(e) => setSetupEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Days</Label>
            <div className="grid grid-cols-7 gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={setupDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <Label htmlFor={day} className="text-sm capitalize">
                    {day.slice(0, 3)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <ColorPicker
            value={setupColor}
            onChange={setSetupColor}
            label="Task Color"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSetupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetupComplete}>
              Complete Setup
            </Button>
          </div>
        </div>
      </UniversalDialog>

      {/* Settings Dialog */}
      <UniversalDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title={`${title} Settings`}
        hideDefaultFooter
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Start Time</Label>
              <Input
                type="time"
                value={settings.schedule.startTime}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, startTime: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label className="text-base font-semibold mb-3 block">End Time</Label>
              <Input
                type="time"
                value={settings.schedule.endTime}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, endTime: e.target.value }
                }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </UniversalDialog>
    </div>
  );
}
