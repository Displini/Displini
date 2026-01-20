import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UniversalDialog } from "@/components/general";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Play, Pause, RotateCcw, Timer, Eye, ArrowUpDown, User2, Clock, Settings, GraduationCap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/general/EmojiPicker";

interface Class {
  id: string;
  name: string;
  time: string;
  classroom?: string;
  notes?: string;
  color: string;
  emoji: string;
}

interface StudentSettings {
  isSetupComplete: boolean;
  schoolSchedule: {
    schoolDays: string[];
    classes: Class[];
  };
  pomodoroWork: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  pomodoroLongBreakInterval: number;
}

const defaultSettings: StudentSettings = {
  isSetupComplete: false,
  schoolSchedule: {
    schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    classes: [],
  },
  pomodoroWork: 25,
  pomodoroBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroLongBreakInterval: 4,
};

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const classColors = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#f97316', label: 'Orange' },
];

interface StudentProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Student({ isOpen = false, onClose }: StudentProps) {
  const [settings, setSettings] = useState<StudentSettings>(() => {
    const saved = localStorage.getItem('student_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [setupSchoolDays, setSetupSchoolDays] = useState<string[]>(settings.schoolSchedule.schoolDays);
  const [classes, setClasses] = useState<Class[]>(settings.schoolSchedule.classes);
  
  // Pomodoro timer states
  const [pomodoroTime, setPomodoroTime] = useState(settings.pomodoroWork * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // New class form
  const [newClass, setNewClass] = useState<Partial<Class>>({
    name: '',
    time: '',
    classroom: '',
    notes: '',
    color: '#3b82f6',
    emoji: '📚',
  });

  useEffect(() => {
    localStorage.setItem('student_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync school schedule to timeline
  const syncSchoolScheduleToTimeline = () => {
    const todos = JSON.parse(localStorage.getItem("todos") || "[]");
    
    // Remove existing school tasks
    const filteredTodos = todos.filter((todo: any) => todo.source !== 'school');
    
    // Add new school tasks for the next 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (settings.schoolSchedule.schoolDays.includes(dayName)) {
        settings.schoolSchedule.classes.forEach((classItem) => {
          const newTask = {
            id: `school-${classItem.id}-${date.toISOString().split('T')[0]}`,
            title: classItem.name,
            completed: false,
            source: "school" as const,
            dueDate: date.toISOString(),
            time: classItem.time,
            emoji: classItem.emoji,
            classId: classItem.id,
            classroom: classItem.classroom,
            notes: classItem.notes,
            color: classItem.color,
            isAllDay: false,
          };
          filteredTodos.push(newTask);
        });
      }
    }
    
    localStorage.setItem("todos", JSON.stringify(filteredTodos));
    window.dispatchEvent(new Event("todosUpdated"));
  };

  useEffect(() => {
    if (settings.isSetupComplete) {
      syncSchoolScheduleToTimeline();
    }
  }, [settings.isSetupComplete, settings.schoolSchedule]);

  const handleSetupComplete = () => {
    const newSettings = {
      ...settings,
      isSetupComplete: true,
      schoolSchedule: {
        schoolDays: setupSchoolDays,
        classes: classes,
      },
    };
    setSettings(newSettings);
    setIsSetupOpen(false);
  };

  const handleAddClass = () => {
    if (!newClass.name || !newClass.time) return;
    
    const classToAdd: Class = {
      id: Date.now().toString(),
      name: newClass.name!,
      time: newClass.time!,
      classroom: newClass.classroom || '',
      notes: newClass.notes || '',
      color: newClass.color || '#3b82f6',
      emoji: newClass.emoji || '📚',
    };
    
    const updatedClasses = [...classes, classToAdd];
    setClasses(updatedClasses);
    
    // Update settings
    const newSettings = {
      ...settings,
      schoolSchedule: {
        ...settings.schoolSchedule,
        classes: updatedClasses,
      },
    };
    setSettings(newSettings);
    
    // Reset form
    setNewClass({
      name: '',
      time: '',
      classroom: '',
      notes: '',
      color: '#3b82f6',
      emoji: '📚',
    });
  };

  const handleRemoveClass = (classId: string) => {
    const updatedClasses = classes.filter(c => c.id !== classId);
    setClasses(updatedClasses);
    
    const newSettings = {
      ...settings,
      schoolSchedule: {
        ...settings.schoolSchedule,
        classes: updatedClasses,
      },
    };
    setSettings(newSettings);
  };

  // Pomodoro timer logic (reused from Work component)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(time => {
          if (time <= 1) {
            // Timer finished
            if (pomodoroMode === 'work') {
              setPomodoroCount(count => count + 1);
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
            return time;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroMode, pomodoroCount, settings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePomodoroToggle = () => {
    setPomodoroRunning(!pomodoroRunning);
  };

  const handlePomodoroReset = () => {
    setPomodoroRunning(false);
    setPomodoroTime(settings.pomodoroWork * 60);
    setPomodoroMode('work');
    setPomodoroCount(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student & Academic</DialogTitle>
        </DialogHeader>
        <>
      {!settings.isSetupComplete ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <GraduationCap className="w-16 h-16 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Set up your school schedule</h3>
          <p className="text-muted-foreground mb-6">Track your classes and stay organized</p>
          <Button 
            onClick={() => setIsSetupOpen(true)} 
            size="icon"
            className="h-14 w-14 rounded-full"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      ) : (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pomodoro Timer */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Study Timer</h4>
          </div>
          <div className="text-center mb-3">
            <div className="text-2xl font-mono font-bold">
              {formatTime(pomodoroTime)}
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {pomodoroMode.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handlePomodoroToggle}
              className="flex-1"
            >
              {pomodoroRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePomodoroReset}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sit/Stand Reminder */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpDown className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Sit/Stand Reminder</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Take breaks every 30 minutes
          </p>
          <Button size="sm" className="w-full">
            Start Reminder
          </Button>
        </div>

        {/* Eye Break */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Eye Break</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Look away from screen for 20 seconds
          </p>
          <Button size="sm" className="w-full">
            Start Break
          </Button>
        </div>

        {/* Posture Check */}
        <div className="p-4 rounded-lg border bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <User2 className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Posture Check</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Check your sitting posture
          </p>
          <Button size="sm" className="w-full">
            Check Posture
          </Button>
        </div>
      </div>

      {/* Settings Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setIsSettingsOpen(true)}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          School Settings
        </Button>
      </div>
      </div>
      )}

      {/* Setup Dialog - Always rendered regardless of setup state */}
      <UniversalDialog
        open={isSetupOpen}
        onOpenChange={setIsSetupOpen}
        title="Set up School Schedule"
        onSave={handleSetupComplete}
        saveLabel="Complete Setup"
      >
        <div className="space-y-6">
          {/* School Days */}
          <div>
            <Label className="text-base font-semibold mb-3 block">School Days</Label>
            <div className="grid grid-cols-2 gap-2">
              {daysOfWeek.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.value}
                    checked={setupSchoolDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSetupSchoolDays([...setupSchoolDays, day.value]);
                      } else {
                        setSetupSchoolDays(setupSchoolDays.filter(d => d !== day.value));
                      }
                    }}
                  />
                  <Label htmlFor={day.value} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Add Classes */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Classes</Label>
            <div className="space-y-4">
              {/* Class Form */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class-name">Class Name</Label>
                    <Input
                      id="class-name"
                      value={newClass.name || ''}
                      onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="class-time">Time</Label>
                    <Input
                      id="class-time"
                      type="time"
                      value={newClass.time || ''}
                      onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="classroom">Classroom (Optional)</Label>
                    <Input
                      id="classroom"
                      value={newClass.classroom || ''}
                      onChange={(e) => setNewClass({...newClass, classroom: e.target.value})}
                      placeholder="e.g., Room 101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="class-color">Color</Label>
                    <Select
                      value={newClass.color || '#3b82f6'}
                      onValueChange={(value) => setNewClass({...newClass, color: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {classColors.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: color.value }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="class-emoji">Emoji</Label>
                  <EmojiPicker
                    value={newClass.emoji || '📚'}
                    onChange={(emoji) => setNewClass({...newClass, emoji})}
                  />
                </div>

                <div>
                  <Label htmlFor="class-notes">Notes (Optional)</Label>
                  <Textarea
                    id="class-notes"
                    value={newClass.notes || ''}
                    onChange={(e) => setNewClass({...newClass, notes: e.target.value})}
                    placeholder="Additional notes about this class..."
                    rows={2}
                  />
                </div>

                <Button onClick={handleAddClass} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Add Class
                </Button>
              </div>

              {/* Existing Classes */}
              {classes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Added Classes</Label>
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{classItem.emoji}</span>
                        <div>
                          <div className="font-medium">{classItem.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {classItem.time}
                            {classItem.classroom && ` • ${classItem.classroom}`}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveClass(classItem.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </UniversalDialog>

      {/* Settings Dialog */}
      <UniversalDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="School Settings"
        onSave={() => setIsSettingsOpen(false)}
        saveLabel="Save Settings"
      >
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Pomodoro Timer Settings</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="work-time">Work Time (minutes)</Label>
                <Input
                  id="work-time"
                  type="number"
                  value={settings.pomodoroWork}
                  onChange={(e) => {
                    const newSettings = {
                      ...settings,
                      pomodoroWork: parseInt(e.target.value) || 25,
                    };
                    setSettings(newSettings);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="break-time">Break Time (minutes)</Label>
                <Input
                  id="break-time"
                  type="number"
                  value={settings.pomodoroBreak}
                  onChange={(e) => {
                    const newSettings = {
                      ...settings,
                      pomodoroBreak: parseInt(e.target.value) || 5,
                    };
                    setSettings(newSettings);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </UniversalDialog>
        </>
      </DialogContent>
    </Dialog>
  );
}
