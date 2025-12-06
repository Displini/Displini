import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { UniversalDialog } from "@/app/components/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Plus, Play, Pause, RotateCcw, Timer, Eye, ArrowUpDown, User2, Clock, Settings, X } from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Switch } from "@/app/components/ui/switch";

interface WorkSettings {
  isSetupComplete: boolean;
  workSchedule: {
    startTime: string;
    endTime: string;
    workDays: string[];
    breakTimes?: { start: string; end: string }[];
    color?: string;
  };
  salaryDate: number;
  salaryDateEnabled: boolean;
  pomodoroWork: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  pomodoroLongBreakInterval: number;
}

const defaultSettings: WorkSettings = {
  isSetupComplete: false,
  workSchedule: {
    startTime: '09:00',
    endTime: '17:00',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    breakTimes: [],
  },
  salaryDate: 1,
  salaryDateEnabled: false,
  pomodoroWork: 25,
  pomodoroBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroLongBreakInterval: 4,
};

interface WorkProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Work({ isOpen = false, onClose }: WorkProps) {
  const [settings, setSettings] = useState<WorkSettings>(() => {
    const saved = localStorage.getItem('work_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [setupStartTime, setSetupStartTime] = useState('09:00');
  const [setupEndTime, setSetupEndTime] = useState('17:00');
  const [setupWorkDays, setSetupWorkDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [setupSalaryDate, setSetupSalaryDate] = useState('1');
  const [salaryDateEnabled, setSalaryDateEnabled] = useState(false);
  const [setupBreakTimes, setSetupBreakTimes] = useState<{ start: string; end: string }[]>([]);
  const [newBreakStart, setNewBreakStart] = useState('12:00');
  const [newBreakEnd, setNewBreakEnd] = useState('13:00');
  
  // Get theme color as default
  const getThemeColor = () => {
    const theme = localStorage.getItem('colorTheme') || 'blue';
    const colors: { [key: string]: string } = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f97316',
      pink: '#ec4899',
      red: '#ef4444',
    };
    return colors[theme] || '#3b82f6';
  };
  
  const [setupColor, setSetupColor] = useState(getThemeColor());
  
  const [pomodoroTime, setPomodoroTime] = useState(settings.pomodoroWork * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  
  // Calculate working hours
  const calculateWorkingHours = () => {
    const [startH, startM] = settings.workSchedule.startTime.split(':').map(Number);
    const [endH, endM] = settings.workSchedule.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    let workMinutes = endMinutes - startMinutes;
    
    // Subtract break times
    if (settings.workSchedule.breakTimes) {
      settings.workSchedule.breakTimes.forEach(breakTime => {
        const [breakStartH, breakStartM] = breakTime.start.split(':').map(Number);
        const [breakEndH, breakEndM] = breakTime.end.split(':').map(Number);
        const breakDuration = (breakEndH * 60 + breakEndM) - (breakStartH * 60 + breakStartM);
        workMinutes -= breakDuration;
      });
    }
    
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;
    return { hours, minutes, total: workMinutes };
  };

  const syncSalaryDate = () => {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    const filteredTodos = todos.filter((t: any) => t.source !== 'salary');
    
    // Only add salary dates if enabled
    if (!settings.salaryDateEnabled || !settings.salaryDate) {
      localStorage.setItem('todos', JSON.stringify(filteredTodos));
      window.dispatchEvent(new Event('todosUpdated'));
      return;
    }
    
    // Create salary tasks for past 12 months and next 12 months (24 months total)
    const today = new Date();
    const existingSalaryDates = new Set<string>();
    
    for (let monthOffset = -12; monthOffset <= 12; monthOffset++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() + monthOffset);
      date.setDate(settings.salaryDate);
      
      // Ensure date is valid (handles cases like Feb 31)
      if (date.getDate() !== settings.salaryDate) {
        // If date was adjusted (e.g., Feb 31 -> Mar 3), set to last day of month
        date.setDate(0); // Go to last day of previous month
      }
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Avoid duplicates
      if (!existingSalaryDates.has(dateStr)) {
        existingSalaryDates.add(dateStr);
      
      const salaryTask = {
          id: `salary-${dateStr}`,
        title: '💰 Salary Day',
        emoji: '💰',
        completed: false,
        source: 'salary' as const,
          dueDate: dateStr,
        allDay: true,
        isEditable: false,
      };
      
      filteredTodos.push(salaryTask);
      }
    }
    
    localStorage.setItem('todos', JSON.stringify(filteredTodos));
    window.dispatchEvent(new Event('todosUpdated'));
  };

  const syncWorkScheduleToTimeline = () => {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    
    // Remove old work schedule tasks
    const filteredTodos = todos.filter((t: any) => t.source !== 'work');
    
    // Add work tasks for past 30 days and next 335 days (365 total) on configured work days
    const today = new Date();
    for (let i = -30; i < 335; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (settings.workSchedule.workDays.includes(dayName)) {
        const workTask = {
          id: `work-${date.toISOString().split('T')[0]}`,
          title: 'Work',
          emoji: '💼',
          time: settings.workSchedule.startTime,
          endTime: settings.workSchedule.endTime,
          completed: false,
          source: 'work' as const,
          dueDate: date.toISOString().split('T')[0], // Use date string format for consistency
          color: settings.workSchedule.color || getThemeColor(),
          breakTimes: settings.workSchedule.breakTimes,
        };
        
        filteredTodos.push(workTask);
      }
    }
    
    localStorage.setItem('todos', JSON.stringify(filteredTodos));
    window.dispatchEvent(new Event('todosUpdated'));
  };

  useEffect(() => {
    localStorage.setItem('work_settings', JSON.stringify(settings));
    if (settings.isSetupComplete) {
      syncSalaryDate();
      syncWorkScheduleToTimeline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Sync when dialog opens to ensure tasks are up to date
  useEffect(() => {
    if (isOpen && settings.isSetupComplete) {
      syncSalaryDate();
      syncWorkScheduleToTimeline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0 && pomodoroRunning) {
      handlePomodoroComplete();
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroTime]);

  const handleSetupComplete = () => {
    const newSettings: WorkSettings = {
      isSetupComplete: true,
      workSchedule: {
        startTime: setupStartTime,
        endTime: setupEndTime,
        workDays: setupWorkDays,
        breakTimes: setupBreakTimes,
        color: setupColor,
      },
      salaryDate: parseInt(setupSalaryDate),
      salaryDateEnabled: salaryDateEnabled,
      pomodoroWork: settings.pomodoroWork,
      pomodoroBreak: settings.pomodoroBreak,
      pomodoroLongBreak: settings.pomodoroLongBreak,
      pomodoroLongBreakInterval: settings.pomodoroLongBreakInterval,
    };
    
    setSettings(newSettings);
    setIsSetupOpen(false);
    
    // Immediately sync tasks when setup completes using new settings
    setTimeout(() => {
      // Sync salary
      const todos = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTodos = todos.filter((t: any) => t.source !== 'salary');
      
      if (newSettings.salaryDateEnabled && newSettings.salaryDate) {
        const today = new Date();
        const existingSalaryDates = new Set<string>();
        
        for (let monthOffset = -12; monthOffset <= 12; monthOffset++) {
          const date = new Date(today);
          date.setMonth(date.getMonth() + monthOffset);
          date.setDate(newSettings.salaryDate);
          
          if (date.getDate() !== newSettings.salaryDate) {
            date.setDate(0);
          }
          
          const dateStr = date.toISOString().split('T')[0];
          
          if (!existingSalaryDates.has(dateStr)) {
            existingSalaryDates.add(dateStr);
            
            const salaryTask = {
              id: `salary-${dateStr}`,
              title: '💰 Salary Day',
              emoji: '💰',
              completed: false,
              source: 'salary' as const,
              dueDate: dateStr,
              allDay: true,
              isEditable: false,
            };
            
            filteredTodos.push(salaryTask);
          }
        }
      }
      
      // Sync work schedule
      const workFilteredTodos = filteredTodos.filter((t: any) => t.source !== 'work');
      const today = new Date();
      for (let i = -30; i < 335; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        if (newSettings.workSchedule.workDays.includes(dayName)) {
          const workTask = {
            id: `work-${date.toISOString().split('T')[0]}`,
            title: 'Work',
            emoji: '💼',
            time: newSettings.workSchedule.startTime,
            endTime: newSettings.workSchedule.endTime,
            completed: false,
            source: 'work' as const,
            dueDate: date.toISOString().split('T')[0],
            color: newSettings.workSchedule.color || getThemeColor(),
            breakTimes: newSettings.workSchedule.breakTimes,
          };
          
          workFilteredTodos.push(workTask);
        }
      }
      
      localStorage.setItem('todos', JSON.stringify(workFilteredTodos));
      window.dispatchEvent(new Event('todosUpdated'));
    }, 100);
  };

  const toggleWorkDay = (day: string) => {
    if (setupWorkDays.includes(day)) {
      setSetupWorkDays(setupWorkDays.filter(d => d !== day));
    } else {
      setSetupWorkDays([...setupWorkDays, day]);
    }
  };

  const handlePomodoroComplete = () => {
    setPomodoroRunning(false);
    
    if (pomodoroMode === 'work') {
      setPomodoroCount(prev => prev + 1);
      
      if ((pomodoroCount + 1) % settings.pomodoroLongBreakInterval === 0) {
        setPomodoroMode('break');
        setPomodoroTime(settings.pomodoroLongBreak * 60);
      } else {
        setPomodoroMode('break');
        setPomodoroTime(settings.pomodoroBreak * 60);
      }
    } else {
      setPomodoroMode('work');
      setPomodoroTime(settings.pomodoroWork * 60);
    }
  };

  const startPomodoro = () => {
    setPomodoroRunning(true);
  };

  const pausePomodoro = () => {
    setPomodoroRunning(false);
  };

  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroMode('work');
    setPomodoroTime(settings.pomodoroWork * 60);
    setPomodoroCount(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!settings.isSetupComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
          {!isSetupOpen && (
            <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-600">Set up your Work Schedule</h3>
              <button
          onClick={() => setIsSetupOpen(true)}
                className="mt-4 w-12 h-12 rounded-full backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/30 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                style={{ color: '#3b82f6' }}
        >
          <Plus className="w-6 h-6" />
              </button>
            </div>
          )}

          {isSetupOpen && (
            <div className="px-6 pb-6 animate-in fade-in duration-300">
              <div className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Work Schedule Setup
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsSetupOpen(false)}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-6 pt-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">Work Hours</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={setupStartTime}
                    onChange={(e) => setSetupStartTime(e.target.value)}
                    className="mt-2 rounded-full"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-sm">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={setupEndTime}
                    onChange={(e) => setSetupEndTime(e.target.value)}
                    className="mt-2 rounded-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Work Days</Label>
              <div className="grid grid-cols-2 gap-3">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={setupWorkDays.includes(day)}
                      onCheckedChange={() => toggleWorkDay(day)}
                    />
                    <Label htmlFor={day} className="cursor-pointer capitalize">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Salary Date (Optional)</Label>
                <Switch
                  checked={salaryDateEnabled}
                  onCheckedChange={setSalaryDateEnabled}
                />
              </div>
              {salaryDateEnabled && (
                <>
                  <Select value={setupSalaryDate} onValueChange={setSetupSalaryDate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={String(day)}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    💰 Salary day will appear as an all-day event (this is optional)
                  </p>
                </>
              )}
            </div>
            
            {/* Task Color */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Task Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { value: '#3b82f6', label: 'Blue', theme: 'blue' },
                  { value: '#10b981', label: 'Green', theme: 'green' },
                  { value: '#8b5cf6', label: 'Purple', theme: 'purple' },
                  { value: '#f97316', label: 'Orange', theme: 'orange' },
                  { value: '#ec4899', label: 'Pink', theme: 'pink' },
                  { value: '#ef4444', label: 'Red', theme: 'red' },
                ].map((color) => {
                  const isThemeColor = color.theme === (localStorage.getItem('colorTheme') || 'blue');
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSetupColor(color.value)}
                      className={`h-10 w-full rounded-lg border-2 transition-all relative ${
                        setupColor === color.value
                          ? 'border-foreground scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label + (isThemeColor ? ' (Theme)' : '')}
                    >
                      {isThemeColor && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white shadow-lg" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Theme color is marked with a dot
              </p>
            </div>
            
            {/* Break Times */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Break Times (Optional)</Label>
              <div className="space-y-4">
                {/* Add break form */}
                    <div className="p-3 border rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="break-start" className="text-sm">Start</Label>
                      <Input
                        id="break-start"
                        type="time"
                        value={newBreakStart}
                        onChange={(e) => setNewBreakStart(e.target.value)}
                            className="rounded-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="break-end" className="text-sm">End</Label>
                      <Input
                        id="break-end"
                        type="time"
                        value={newBreakEnd}
                        onChange={(e) => setNewBreakEnd(e.target.value)}
                            className="rounded-full"
                      />
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (newBreakStart && newBreakEnd) {
                        setSetupBreakTimes([...setupBreakTimes, { start: newBreakStart, end: newBreakEnd }]);
                        setNewBreakStart('12:00');
                        setNewBreakEnd('13:00');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Break
                  </Button>
                </div>
                
                {/* Existing breaks */}
                {setupBreakTimes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Added Breaks</Label>
                    {setupBreakTimes.map((breakTime, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-2xl">
                        <span className="text-sm">{breakTime.start} - {breakTime.end}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSetupBreakTimes(setupBreakTimes.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
                
                {/* Complete Setup Button */}
                <div className="pt-4 flex flex-col items-center">
                  <Button 
                    className="rounded-full px-8" 
                    onClick={handleSetupComplete}
                  >
                    Complete Setup
                  </Button>
                </div>
          </div>
      </div>
            )}
          </DialogContent>
        </Dialog>
    );
  }

  const workingHours = calculateWorkingHours();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        <div className="px-6 pt-6 pb-4 border-b">
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Work & Productivity
            </DialogTitle>
        </DialogHeader>
        </div>
        <div className="px-6 py-6 space-y-6">
      {/* Work Schedule Info */}
      <div className="p-4 rounded-2xl border bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Work Schedule</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Work Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Start Time:</span>
            <span className="font-medium">{settings.workSchedule.startTime}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">End Time:</span>
            <span className="font-medium">{settings.workSchedule.endTime}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Working Hours:</span>
            <span className="font-semibold text-primary">
              {workingHours.hours}h {workingHours.minutes > 0 ? `${workingHours.minutes}m` : ''}
            </span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-semibold">Quick Actions</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Productivity tools for your workday
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary"
          onClick={() => {
            if (!pomodoroRunning && pomodoroTime === settings.pomodoroWork * 60) {
              startPomodoro();
            }
          }}
        >
          <Timer className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Pomodoro</span>
          <span className="text-xs text-muted-foreground">{settings.pomodoroWork}min focus</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary"
        >
          <ArrowUpDown className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Sit Reminder</span>
          <span className="text-xs text-muted-foreground">Every 30min</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary"
        >
          <Eye className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Eye Break</span>
          <span className="text-xs text-muted-foreground">20-20-20 rule</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary"
        >
          <User2 className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Posture Check</span>
          <span className="text-xs text-muted-foreground">Stay aligned</span>
        </Button>
      </div>

      <div className="p-4 rounded-2xl border bg-muted/20 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{settings.workSchedule.startTime} - {settings.workSchedule.endTime}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {settings.workSchedule.workDays.length} work days • Next salary: {settings.salaryDate}{settings.salaryDate === 1 ? 'st' : settings.salaryDate === 2 ? 'nd' : settings.salaryDate === 3 ? 'rd' : 'th'}
        </div>
      </div>

      {(pomodoroRunning || pomodoroTime !== settings.pomodoroWork * 60) && (
        <div className="p-6 rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent">
          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground uppercase tracking-wide">
              {pomodoroMode === 'work' ? '🎯 Focus Time' : '☕ Break Time'}
            </div>
            <div className="text-6xl font-bold tabular-nums">
              {formatTime(pomodoroTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              Session {pomodoroCount + 1}
            </div>
            <div className="flex gap-2 justify-center">
              {!pomodoroRunning ? (
                <Button onClick={startPomodoro} size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button onClick={pausePomodoro} size="lg" variant="secondary">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={resetPomodoro} size="lg" variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      <UniversalDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="Work Settings"
        hideDefaultFooter
      >
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Work Schedule</Label>
            <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hours:</span>
                <span className="font-medium">{settings.workSchedule.startTime} - {settings.workSchedule.endTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Days:</span>
                <span className="font-medium capitalize">{settings.workSchedule.workDays.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Salary:</span>
                <span className="font-medium">{settings.salaryDate}{settings.salaryDate === 1 ? 'st' : settings.salaryDate === 2 ? 'nd' : settings.salaryDate === 3 ? 'rd' : 'th'} of month</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => {
                setSetupStartTime(settings.workSchedule.startTime);
                setSetupEndTime(settings.workSchedule.endTime);
                setSetupWorkDays(settings.workSchedule.workDays);
                setSetupSalaryDate(String(settings.salaryDate));
                setSettings({ ...settings, isSetupComplete: false });
                setIsSettingsOpen(false);
                setIsSetupOpen(true);
              }}
            >
              Edit Schedule
            </Button>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Pomodoro Timer</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="pomodoro-work" className="text-sm">Focus Duration (minutes)</Label>
                <Input
                  id="pomodoro-work"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.pomodoroWork}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 25;
                    setSettings({ ...settings, pomodoroWork: value });
                    if (pomodoroMode === 'work' && !pomodoroRunning) {
                      setPomodoroTime(value * 60);
                    }
                  }}
                  className="mt-2 rounded-full"
                />
              </div>
              <div>
                <Label htmlFor="pomodoro-break" className="text-sm">Short Break (minutes)</Label>
                <Input
                  id="pomodoro-break"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.pomodoroBreak}
                  onChange={(e) => setSettings({ ...settings, pomodoroBreak: parseInt(e.target.value) || 5 })}
                  className="mt-2 rounded-full"
                />
              </div>
              <div>
                <Label htmlFor="pomodoro-long-break" className="text-sm">Long Break (minutes)</Label>
                <Input
                  id="pomodoro-long-break"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.pomodoroLongBreak}
                  onChange={(e) => setSettings({ ...settings, pomodoroLongBreak: parseInt(e.target.value) || 15 })}
                  className="mt-2 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </UniversalDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
