import { useState, useEffect } from "react";
import { Briefcase, Clock, Plus, X, Edit, Trash2, Monitor, Eye, Timer, Settings as SettingsIcon } from "lucide-react";
import { colors } from "@/lib/designSystem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { EmojiPicker } from "@/components/general/EmojiPicker";

interface WorkSettings {
  isSetupComplete: boolean;
  workSchedule: {
  startTime: string;
  endTime: string;
    workDays: string[];
    breakTimes?: { start: string; end: string }[];
    color?: string;
    emoji?: string;
    subtasks?: Array<{ id: string; title: string; completed: boolean }>;
    standSitReminder?: boolean;
    eyeBreakReminder?: boolean;
    pomodoroEnabled?: boolean;
  };
  salaryDate: number;
  salaryFrequency?: 'monthly' | 'weekly' | 'biweekly' | 'triweekly';
  salaryDateEnabled: boolean;
  salaryDayOfWeek?: string; // For weekly/biweekly/triweekly
}

const defaultSettings: WorkSettings = {
  isSetupComplete: false,
  workSchedule: {
    startTime: '09:00',
    endTime: '17:00',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    breakTimes: [],
    emoji: '💼',
    subtasks: [],
    standSitReminder: false,
    eyeBreakReminder: false,
    pomodoroEnabled: false,
  },
  salaryDate: 1,
  salaryFrequency: 'monthly',
  salaryDateEnabled: false,
};

interface WorkFeatureProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkFeature({ isOpen, onClose }: WorkFeatureProps) {
  const [settings, setSettings] = useState<WorkSettings>(() => {
    const saved = localStorage.getItem('work_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [setupStartTime, setSetupStartTime] = useState('09:00');
  const [setupEndTime, setSetupEndTime] = useState('17:00');
  const [setupWorkDays, setSetupWorkDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [setupSalaryDate, setSetupSalaryDate] = useState('1');
  const [setupSalaryFrequency, setSetupSalaryFrequency] = useState<'monthly' | 'weekly' | 'biweekly' | 'triweekly'>('monthly');
  const [setupSalaryDayOfWeek, setSetupSalaryDayOfWeek] = useState('monday');
  const [salaryDateEnabled, setSalaryDateEnabled] = useState(false);
  const [setupBreakTimes, setSetupBreakTimes] = useState<{ start: string; end: string }[]>([]);
  const [newBreakStart, setNewBreakStart] = useState('12:00');
  const [newBreakEnd, setNewBreakEnd] = useState('13:00');
  const [setupEmoji, setSetupEmoji] = useState('💼');
  const [setupSubtasks, setSetupSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [customColorEnabled, setCustomColorEnabled] = useState(false);
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [setupStandSitReminder, setSetupStandSitReminder] = useState(false);
  const [setupEyeBreakReminder, setSetupEyeBreakReminder] = useState(false);
  const [setupPomodoroEnabled, setSetupPomodoroEnabled] = useState(false);
  
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

  // Calculate estimated work hours
  const calculateWorkHours = () => {
    const [startH, startM] = setupStartTime.split(':').map(Number);
    const [endH, endM] = setupEndTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    let workMinutes = endMinutes - startMinutes;
    
    // Subtract break times
    setupBreakTimes.forEach(breakTime => {
      const [breakStartH, breakStartM] = breakTime.start.split(':').map(Number);
      const [breakEndH, breakEndM] = breakTime.end.split(':').map(Number);
      const breakDuration = (breakEndH * 60 + breakEndM) - (breakStartH * 60 + breakStartM);
      workMinutes -= breakDuration;
    });
    
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;
    return { hours, minutes, total: workMinutes };
  };

  const workHours = calculateWorkHours();

  // Load settings when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    
    const saved = localStorage.getItem('work_settings');
    if (saved) {
      const loaded = JSON.parse(saved);
      setSettings(loaded);
      if (loaded.isSetupComplete) {
        setSetupStartTime(loaded.workSchedule?.startTime || '09:00');
        setSetupEndTime(loaded.workSchedule?.endTime || '17:00');
        setSetupWorkDays(loaded.workSchedule?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        setSetupSalaryDate(String(loaded.salaryDate || 1));
        setSetupSalaryFrequency(loaded.salaryFrequency || 'monthly');
        setSetupSalaryDayOfWeek(loaded.salaryDayOfWeek || 'monday');
        setSalaryDateEnabled(loaded.salaryDateEnabled || false);
        setSetupStandSitReminder(loaded.workSchedule?.standSitReminder || false);
        setSetupEyeBreakReminder(loaded.workSchedule?.eyeBreakReminder || false);
        setSetupPomodoroEnabled(loaded.workSchedule?.pomodoroEnabled || false);
        setSetupBreakTimes(loaded.workSchedule?.breakTimes || []);
        setSetupColor(loaded.workSchedule?.color || getThemeColor());
        setSetupEmoji(loaded.workSchedule?.emoji || '💼');
        setSetupSubtasks(loaded.workSchedule?.subtasks || []);
        setCustomColorEnabled(!!loaded.workSchedule?.color && !['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#ef4444'].includes(loaded.workSchedule.color));
        if (customColorEnabled) {
          setCustomColor(loaded.workSchedule.color);
    }
      }
    }
    setIsSetupOpen(false);
    setIsEditMode(false);
  }, [isOpen]);

  const syncSalaryDate = () => {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    const filteredTodos = todos.filter((t: any) => t.source !== 'salary');
    
    if (!settings.salaryDateEnabled) {
      localStorage.setItem('todos', JSON.stringify(filteredTodos));
      window.dispatchEvent(new Event('todosUpdated'));
      return;
    }
    
    const today = new Date();
    const existingSalaryDates = new Set<string>();
    
    if (settings.salaryFrequency === 'monthly') {
      // Monthly salary
      for (let monthOffset = -12; monthOffset <= 12; monthOffset++) {
        const date = new Date(today);
        date.setMonth(date.getMonth() + monthOffset);
        date.setDate(settings.salaryDate);
        
        if (date.getDate() !== settings.salaryDate) {
          date.setDate(0);
        }
        
        const dateStr = date.toISOString().split('T')[0];
        
        if (!existingSalaryDates.has(dateStr)) {
          existingSalaryDates.add(dateStr);
          
          const salaryTask = {
            id: `salary-${dateStr}`,
            title: `${settings.workSchedule.emoji || '💰'} Salary Day`,
            emoji: settings.workSchedule.emoji || '💰',
            completed: false,
            source: 'salary' as const,
            dueDate: dateStr,
            allDay: true,
            isEditable: false,
          };
          
          filteredTodos.push(salaryTask);
        }
      }
    } else if (settings.salaryFrequency === 'weekly') {
      // Weekly salary
      const dayOfWeekMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      const targetDay = dayOfWeekMap[settings.salaryDayOfWeek || 'monday'];
      
      for (let weekOffset = -52; weekOffset <= 52; weekOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + (weekOffset * 7));
        const currentDay = date.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        date.setDate(date.getDate() + daysUntilTarget);
        
        const dateStr = date.toISOString().split('T')[0];
        
        if (!existingSalaryDates.has(dateStr)) {
          existingSalaryDates.add(dateStr);
          
          const salaryTask = {
            id: `salary-${dateStr}`,
            title: `${settings.workSchedule.emoji || '💰'} Salary Day`,
            emoji: settings.workSchedule.emoji || '💰',
            completed: false,
            source: 'salary' as const,
            dueDate: dateStr,
            allDay: true,
            isEditable: false,
          };
          
          filteredTodos.push(salaryTask);
        }
      }
    } else if (settings.salaryFrequency === 'biweekly') {
      // Every 2 weeks
      const dayOfWeekMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      const targetDay = dayOfWeekMap[settings.salaryDayOfWeek || 'monday'];
      
      // Find the first occurrence
      const firstDate = new Date(today);
      const currentDay = firstDate.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      firstDate.setDate(firstDate.getDate() + daysUntilTarget);
      
      // Generate biweekly dates
      for (let biweekOffset = -26; biweekOffset <= 26; biweekOffset++) {
        const date = new Date(firstDate);
        date.setDate(date.getDate() + (biweekOffset * 14));
        
        const dateStr = date.toISOString().split('T')[0];
        
        if (!existingSalaryDates.has(dateStr)) {
          existingSalaryDates.add(dateStr);
          
          const salaryTask = {
            id: `salary-${dateStr}`,
            title: `${settings.workSchedule.emoji || '💰'} Salary Day`,
            emoji: settings.workSchedule.emoji || '💰',
            completed: false,
            source: 'salary' as const,
            dueDate: dateStr,
            allDay: true,
            isEditable: false,
          };
          
          filteredTodos.push(salaryTask);
        }
      }
    } else if (settings.salaryFrequency === 'triweekly') {
      // Every 3 weeks
      const dayOfWeekMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      const targetDay = dayOfWeekMap[settings.salaryDayOfWeek || 'monday'];
      
      // Find the first occurrence
      const firstDate = new Date(today);
      const currentDay = firstDate.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      firstDate.setDate(firstDate.getDate() + daysUntilTarget);
      
      // Generate triweekly dates
      for (let triweekOffset = -17; triweekOffset <= 17; triweekOffset++) {
        const date = new Date(firstDate);
        date.setDate(date.getDate() + (triweekOffset * 21));
      
        const dateStr = date.toISOString().split('T')[0];
        
        if (!existingSalaryDates.has(dateStr)) {
          existingSalaryDates.add(dateStr);
          
          const salaryTask = {
            id: `salary-${dateStr}`,
            title: `${settings.workSchedule.emoji || '💰'} Salary Day`,
            emoji: settings.workSchedule.emoji || '💰',
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
    
    localStorage.setItem('todos', JSON.stringify(filteredTodos));
    window.dispatchEvent(new Event('todosUpdated'));
  };

  const syncWorkScheduleToTimeline = () => {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    const filteredTodos = todos.filter((t: any) => t.source !== 'work' && !t.source?.startsWith('work-'));
    
    const today = new Date();
    for (let i = -30; i < 335; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (settings.workSchedule.workDays.includes(dayName)) {
        const dateStr = date.toISOString().split('T')[0];
        const workColor = settings.workSchedule.color || getThemeColor();
        const workEmoji = settings.workSchedule.emoji || '💼';
        
        // If there are break times, create 3 tasks: start work, break, end work
        if (settings.workSchedule.breakTimes && settings.workSchedule.breakTimes.length > 0) {
          // Start work task
          const startWorkTask = {
            id: `work-start-${dateStr}`,
            title: 'Work',
            emoji: workEmoji,
            time: settings.workSchedule.startTime,
            endTime: settings.workSchedule.breakTimes[0].start,
            completed: false,
            source: 'work' as const,
            dueDate: dateStr,
            color: workColor,
            subtasks: settings.workSchedule.subtasks || [],
            standSitReminder: settings.workSchedule.standSitReminder,
            eyeBreakReminder: settings.workSchedule.eyeBreakReminder,
            pomodoroEnabled: settings.workSchedule.pomodoroEnabled,
          };
          filteredTodos.push(startWorkTask);
          
          // Break task
          const breakTask = {
            id: `work-break-${dateStr}`,
            title: 'Break',
            emoji: '☕',
            time: settings.workSchedule.breakTimes[0].start,
            endTime: settings.workSchedule.breakTimes[0].end,
            completed: false,
            source: 'work' as const,
            dueDate: dateStr,
            color: workColor,
          };
          filteredTodos.push(breakTask);
          
          // End work task
          const endWorkTask = {
            id: `work-end-${dateStr}`,
            title: 'Work',
            emoji: workEmoji,
            time: settings.workSchedule.breakTimes[0].end,
            endTime: settings.workSchedule.endTime,
            completed: false,
            source: 'work' as const,
            dueDate: dateStr,
            color: workColor,
            standSitReminder: settings.workSchedule.standSitReminder,
            eyeBreakReminder: settings.workSchedule.eyeBreakReminder,
            pomodoroEnabled: settings.workSchedule.pomodoroEnabled,
          };
          filteredTodos.push(endWorkTask);
        } else {
          // Single work task
          const workTask = {
            id: `work-${dateStr}`,
            title: 'Work',
            emoji: workEmoji,
            time: settings.workSchedule.startTime,
            endTime: settings.workSchedule.endTime,
            completed: false,
            source: 'work' as const,
            dueDate: dateStr,
            color: workColor,
            subtasks: settings.workSchedule.subtasks || [],
            standSitReminder: settings.workSchedule.standSitReminder,
            eyeBreakReminder: settings.workSchedule.eyeBreakReminder,
            pomodoroEnabled: settings.workSchedule.pomodoroEnabled,
            breakTimes: settings.workSchedule.breakTimes,
          };
          filteredTodos.push(workTask);
        }
      }
    }
    
    localStorage.setItem('todos', JSON.stringify(filteredTodos));
    window.dispatchEvent(new Event('todosUpdated'));
  };

  useEffect(() => {
    if (isOpen && settings.isSetupComplete) {
      syncSalaryDate();
      syncWorkScheduleToTimeline();
    }
  }, [isOpen, settings.isSetupComplete]);

  const handleSetupComplete = () => {
    const finalColor = customColorEnabled ? customColor : setupColor;
    
    const newSettings: WorkSettings = {
      isSetupComplete: true,
      workSchedule: {
        startTime: setupStartTime,
        endTime: setupEndTime,
        workDays: setupWorkDays,
        breakTimes: setupBreakTimes,
        color: finalColor,
        emoji: setupEmoji,
        subtasks: setupSubtasks,
        standSitReminder: setupStandSitReminder,
        eyeBreakReminder: setupEyeBreakReminder,
        pomodoroEnabled: setupPomodoroEnabled,
      },
      salaryDate: parseInt(setupSalaryDate),
      salaryFrequency: setupSalaryFrequency,
      salaryDayOfWeek: setupSalaryFrequency !== 'monthly' ? setupSalaryDayOfWeek : undefined,
      salaryDateEnabled: salaryDateEnabled,
    };
    
    setSettings(newSettings);
    setIsSetupOpen(false);
    setIsEditMode(false);
    
    localStorage.setItem('work_settings', JSON.stringify(newSettings));
    
    // Immediately sync tasks when setup completes
    setTimeout(() => {
      const todos = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTodos = todos.filter((t: any) => t.source !== 'salary' && t.source !== 'work' && !t.source?.startsWith('work-'));
      
      // Sync salary
      if (newSettings.salaryDateEnabled) {
        const today = new Date();
        const existingSalaryDates = new Set<string>();
        
        if (newSettings.salaryFrequency === 'monthly') {
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
                title: `${setupEmoji} Salary Day`,
                emoji: setupEmoji,
                completed: false,
                source: 'salary' as const,
                dueDate: dateStr,
                allDay: true,
                isEditable: false,
              };
              
              filteredTodos.push(salaryTask);
    }
          }
        } else if (newSettings.salaryFrequency === 'weekly') {
          const dayOfWeekMap: { [key: string]: number } = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          const targetDay = dayOfWeekMap[newSettings.salaryDayOfWeek || 'monday'];
          
          for (let weekOffset = -52; weekOffset <= 52; weekOffset++) {
            const date = new Date(today);
            date.setDate(date.getDate() + (weekOffset * 7));
            const currentDay = date.getDay();
            const daysUntilTarget = (targetDay - currentDay + 7) % 7;
            date.setDate(date.getDate() + daysUntilTarget);
            
            const dateStr = date.toISOString().split('T')[0];
            
            if (!existingSalaryDates.has(dateStr)) {
              existingSalaryDates.add(dateStr);
              
              const salaryTask = {
                id: `salary-${dateStr}`,
                title: `${setupEmoji} Salary Day`,
                emoji: setupEmoji,
                completed: false,
                source: 'salary' as const,
                dueDate: dateStr,
                allDay: true,
                isEditable: false,
              };
              
              filteredTodos.push(salaryTask);
            }
          }
        } else if (newSettings.salaryFrequency === 'biweekly') {
          const dayOfWeekMap: { [key: string]: number } = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          const targetDay = dayOfWeekMap[newSettings.salaryDayOfWeek || 'monday'];
          
          const firstDate = new Date(today);
          const currentDay = firstDate.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;
          firstDate.setDate(firstDate.getDate() + daysUntilTarget);
          
          for (let biweekOffset = -26; biweekOffset <= 26; biweekOffset++) {
            const date = new Date(firstDate);
            date.setDate(date.getDate() + (biweekOffset * 14));
            
            const dateStr = date.toISOString().split('T')[0];
            
            if (!existingSalaryDates.has(dateStr)) {
              existingSalaryDates.add(dateStr);
              
              const salaryTask = {
                id: `salary-${dateStr}`,
                title: `${setupEmoji} Salary Day`,
                emoji: setupEmoji,
                completed: false,
                source: 'salary' as const,
                dueDate: dateStr,
                allDay: true,
                isEditable: false,
              };
              
              filteredTodos.push(salaryTask);
            }
          }
        } else if (newSettings.salaryFrequency === 'triweekly') {
          const dayOfWeekMap: { [key: string]: number } = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          const targetDay = dayOfWeekMap[newSettings.salaryDayOfWeek || 'monday'];
          
          const firstDate = new Date(today);
          const currentDay = firstDate.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;
          firstDate.setDate(firstDate.getDate() + daysUntilTarget);
          
          for (let triweekOffset = -17; triweekOffset <= 17; triweekOffset++) {
            const date = new Date(firstDate);
            date.setDate(date.getDate() + (triweekOffset * 21));

            const dateStr = date.toISOString().split('T')[0];
            
            if (!existingSalaryDates.has(dateStr)) {
              existingSalaryDates.add(dateStr);
              
              const salaryTask = {
                id: `salary-${dateStr}`,
                title: `${setupEmoji} Salary Day`,
                emoji: setupEmoji,
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
      }
      
      // Sync work schedule with break logic
      for (let i = -30; i < 335; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        if (newSettings.workSchedule.workDays.includes(dayName)) {
          const dateStr = date.toISOString().split('T')[0];
          const workColor = finalColor;
          
          if (newSettings.workSchedule.breakTimes && newSettings.workSchedule.breakTimes.length > 0) {
            // Start work task
            filteredTodos.push({
              id: `work-start-${dateStr}`,
              title: 'Work',
              emoji: setupEmoji,
              time: newSettings.workSchedule.startTime,
              endTime: newSettings.workSchedule.breakTimes[0].start,
              completed: false,
              source: 'work' as const,
              dueDate: dateStr,
              color: workColor,
              subtasks: newSettings.workSchedule.subtasks || [],
              standSitReminder: newSettings.workSchedule.standSitReminder,
              eyeBreakReminder: newSettings.workSchedule.eyeBreakReminder,
              pomodoroEnabled: newSettings.workSchedule.pomodoroEnabled,
            });
            
            // Break task
            filteredTodos.push({
              id: `work-break-${dateStr}`,
              title: 'Break',
              emoji: '☕',
              time: newSettings.workSchedule.breakTimes[0].start,
              endTime: newSettings.workSchedule.breakTimes[0].end,
              completed: false,
              source: 'work' as const,
              dueDate: dateStr,
              color: workColor,
            });
            
            // End work task
            filteredTodos.push({
              id: `work-end-${dateStr}`,
              title: 'Work',
              emoji: setupEmoji,
              time: newSettings.workSchedule.breakTimes[0].end,
              endTime: newSettings.workSchedule.endTime,
              completed: false,
              source: 'work' as const,
              dueDate: dateStr,
              color: workColor,
              standSitReminder: newSettings.workSchedule.standSitReminder,
              eyeBreakReminder: newSettings.workSchedule.eyeBreakReminder,
              pomodoroEnabled: newSettings.workSchedule.pomodoroEnabled,
            });
          } else {
            // Single work task
            filteredTodos.push({
              id: `work-${dateStr}`,
              title: 'Work',
              emoji: setupEmoji,
              time: newSettings.workSchedule.startTime,
              endTime: newSettings.workSchedule.endTime,
              completed: false,
              source: 'work' as const,
              dueDate: dateStr,
              color: workColor,
              subtasks: newSettings.workSchedule.subtasks || [],
              standSitReminder: newSettings.workSchedule.standSitReminder,
              eyeBreakReminder: newSettings.workSchedule.eyeBreakReminder,
              pomodoroEnabled: newSettings.workSchedule.pomodoroEnabled,
            });
          }
        }
      }
      
      localStorage.setItem('todos', JSON.stringify(filteredTodos));
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
                {/* Emoji */}
                <Card className="p-4 rounded-2xl">
                  <Label className="text-base font-semibold mb-3 block">Work Emoji</Label>
                  <EmojiPicker 
                    value={setupEmoji} 
                    onChange={(emoji) => setSetupEmoji(emoji)}
                    category="work"
                  />
                </Card>

                <Card className="p-4 rounded-2xl">
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
                  {/* Estimated Work Hours */}
                  {setupStartTime && setupEndTime && (
                    <div className="mt-3 p-3 bg-muted rounded-full">
                      <p className="text-sm text-muted-foreground">
                        Estimated: <span className="font-medium text-foreground">{workHours.hours}h {workHours.minutes > 0 ? `${workHours.minutes}m` : ''}</span>
                      </p>
              </div>
                  )}
                </Card>

                <Card className="p-4 rounded-2xl">
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
                </Card>

                <Card className="p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Salary (Optional)</Label>
                    <Switch
                      checked={salaryDateEnabled}
                      onCheckedChange={setSalaryDateEnabled}
                    />
              </div>
                  {salaryDateEnabled && (
                    <>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm mb-2 block">Frequency</Label>
                          <Select value={setupSalaryFrequency} onValueChange={(value: any) => setSetupSalaryFrequency(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                              <SelectItem value="triweekly">Every 3 Weeks</SelectItem>
                            </SelectContent>
                          </Select>
                          </div>
                        
                        {setupSalaryFrequency === 'monthly' && (
                          <div>
                            <Label className="text-sm mb-2 block">Day of Month</Label>
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
                        </div>
                        )}
                        
                        {(setupSalaryFrequency === 'weekly' || setupSalaryFrequency === 'biweekly' || setupSalaryFrequency === 'triweekly') && (
                          <div>
                            <Label className="text-sm mb-2 block">Day of Week</Label>
                            <Select value={setupSalaryDayOfWeek} onValueChange={setSetupSalaryDayOfWeek}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                  <SelectItem key={day} value={day}>
                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                          </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        💰 Salary day will appear as an all-day event
                      </p>
                    </>
                  )}
                </Card>
                
                <Card className="p-4 rounded-2xl">
                  <Label className="text-base font-semibold mb-3 block">Task Color</Label>
                  <div className="grid grid-cols-6 gap-2 mb-3">
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
                          onClick={() => {
                            setSetupColor(color.value);
                            setCustomColorEnabled(false);
                          }}
                          className={`h-10 w-full rounded-lg border-2 transition-all relative ${
                            setupColor === color.value && !customColorEnabled
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
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCustomColorEnabled(true)}
                      className={`h-10 w-20 rounded-lg border-2 transition-all ${
                        customColorEnabled
                          ? 'border-foreground scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: customColor }}
                      title="Custom Color"
                    />
                    <Input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setCustomColorEnabled(true);
                        setSetupColor(e.target.value);
                      }}
                      className="h-10 w-20 cursor-pointer"
                      disabled={!customColorEnabled}
                    />
                    <Input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setCustomColorEnabled(true);
                        setSetupColor(e.target.value);
                      }}
                      placeholder="#3b82f6"
                      className="flex-1 rounded-full"
                      disabled={!customColorEnabled}
                    />
                    <Switch
                      checked={customColorEnabled}
                      onCheckedChange={setCustomColorEnabled}
                    />
                    <Label className="text-sm">Custom</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Theme color is marked with a dot
                  </p>
                </Card>
                
                <Card className="p-4 rounded-2xl">
                  <Label className="text-base font-semibold mb-3 block">Break Times (Optional)</Label>
                  <div className="space-y-4">
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
                              <X className="w-4 h-4" />
                        </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
                
                <div className="pt-4 flex flex-col items-center">
                  {(() => {
                    const isValid = setupStartTime && setupEndTime && setupWorkDays.length > 0;
                    
                    return (
                      <>
                        <Button
                          className="rounded-full px-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground" 
                          onClick={handleSetupComplete}
                          disabled={!isValid}
                        >
                          Complete Setup
                        </Button>
                        {!isValid && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            {!setupStartTime || !setupEndTime 
                              ? 'Please set work start and end times'
                              : setupWorkDays.length === 0
                              ? 'Please select at least one work day'
                              : 'Please fill in all required fields'}
                          </p>
                        )}
                      </>
                    );
                  })()}
                      </div>
                    </div>
          </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Main view after setup is complete
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        <div className="px-6 pt-6 pb-4 border-b">
              <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{settings.workSchedule.emoji || '💼'}</span>
                Work & Productivity
                </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditMode(true);
                    setIsSetupOpen(true);
                  }}
                  className="rounded-full"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
              </DialogHeader>
                  </div>
                  
        {/* Edit Mode */}
        {isEditMode && isSetupOpen && (
          <div className="px-6 pb-6 animate-in fade-in duration-300">
            <div className="space-y-6 pt-6">
              {/* Same setup form as initial setup */}
              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">Work Emoji</Label>
                <EmojiPicker 
                  value={setupEmoji} 
                  onChange={(emoji) => setSetupEmoji(emoji)}
                  category="work"
                />
              </Card>

              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">Work Hours</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                    <Label htmlFor="edit-start-time" className="text-sm">Start Time</Label>
                      <Input
                      id="edit-start-time"
                        type="time"
                      value={setupStartTime}
                      onChange={(e) => setSetupStartTime(e.target.value)}
                      className="mt-2 rounded-full"
                      />
                    </div>
                    <div>
                    <Label htmlFor="edit-end-time" className="text-sm">End Time</Label>
                      <Input
                      id="edit-end-time"
                        type="time"
                      value={setupEndTime}
                      onChange={(e) => setSetupEndTime(e.target.value)}
                      className="mt-2 rounded-full"
                      />
                    </div>
                  </div>
                {setupStartTime && setupEndTime && (
                  <div className="mt-3 p-3 bg-muted rounded-full">
                    <p className="text-sm text-muted-foreground">
                      Estimated: <span className="font-medium text-foreground">{workHours.hours}h {workHours.minutes > 0 ? `${workHours.minutes}m` : ''}</span>
                    </p>
                  </div>
                )}
              </Card>

              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">Work Days</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${day}`}
                        checked={setupWorkDays.includes(day)}
                        onCheckedChange={() => toggleWorkDay(day)}
                      />
                      <Label htmlFor={`edit-${day}`} className="cursor-pointer capitalize">
                        {day}
                      </Label>
                    </div>
                      ))}
                    </div>
              </Card>

              <Card className="p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Salary (Optional)</Label>
                  <Switch
                    checked={salaryDateEnabled}
                    onCheckedChange={setSalaryDateEnabled}
                  />
                </div>
                {salaryDateEnabled && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm mb-2 block">Frequency</Label>
                        <Select value={setupSalaryFrequency} onValueChange={(value: any) => setSetupSalaryFrequency(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                            <SelectItem value="triweekly">Every 3 Weeks</SelectItem>
                          </SelectContent>
                        </Select>
                  </div>
                  
                      {setupSalaryFrequency === 'monthly' && (
                  <div>
                          <Label className="text-sm mb-2 block">Day of Month</Label>
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
                        </div>
                      )}
                      
                      {(setupSalaryFrequency === 'weekly' || setupSalaryFrequency === 'biweekly' || setupSalaryFrequency === 'triweekly') && (
                        <div>
                          <Label className="text-sm mb-2 block">Day of Week</Label>
                          <Select value={setupSalaryDayOfWeek} onValueChange={setSetupSalaryDayOfWeek}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                <SelectItem key={day} value={day}>
                                  {day.charAt(0).toUpperCase() + day.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💰 Salary day will appear as an all-day event
                    </p>
                  </>
                )}
              </Card>
              
              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">Task Color</Label>
                <div className="grid grid-cols-6 gap-2 mb-3">
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
                        onClick={() => {
                          setSetupColor(color.value);
                          setCustomColorEnabled(false);
                        }}
                        className={`h-10 w-full rounded-lg border-2 transition-all relative ${
                          setupColor === color.value && !customColorEnabled
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomColorEnabled(true)}
                    className={`h-10 w-20 rounded-lg border-2 transition-all ${
                      customColorEnabled
                        ? 'border-foreground scale-110 shadow-lg'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: customColor }}
                    title="Custom Color"
                  />
                  <Input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setCustomColorEnabled(true);
                      setSetupColor(e.target.value);
                    }}
                    className="h-10 w-20 cursor-pointer"
                    disabled={!customColorEnabled}
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setCustomColorEnabled(true);
                      setSetupColor(e.target.value);
                    }}
                    placeholder="#3b82f6"
                    className="flex-1 rounded-full"
                    disabled={!customColorEnabled}
                  />
                  <Switch
                    checked={customColorEnabled}
                    onCheckedChange={setCustomColorEnabled}
                  />
                  <Label className="text-sm">Custom</Label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Theme color is marked with a dot
                </p>
              </Card>
              
              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">Break Times (Optional)</Label>
                <div className="space-y-4">
                  <div className="p-3 border rounded-2xl space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="edit-break-start" className="text-sm">Start</Label>
                        <Input
                          id="edit-break-start"
                          type="time"
                          value={newBreakStart}
                          onChange={(e) => setNewBreakStart(e.target.value)}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-break-end" className="text-sm">End</Label>
                        <Input
                          id="edit-break-end"
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
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Subtasks */}
              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">Subtasks</Label>
                <div className="space-y-2 mb-3">
                  {setupSubtasks.map((subtask, idx) => (
                    <div key={subtask.id} className="flex gap-2">
                      <Input
                        value={subtask.title}
                        onChange={(e) => {
                          const updated = [...setupSubtasks];
                          updated[idx] = { ...subtask, title: e.target.value };
                          setSetupSubtasks(updated);
                        }}
                        placeholder="Subtask title"
                        className="flex-1 rounded-full"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSetupSubtasks(setupSubtasks.filter((_, i) => i !== idx));
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                  <div className="flex gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="New subtask"
                    className="flex-1 rounded-full"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                        setSetupSubtasks([...setupSubtasks, { 
                          id: Date.now().toString(), 
                          title: newSubtaskTitle, 
                          completed: false 
                        }]);
                        setNewSubtaskTitle('');
                      }
                    }}
                  />
                    <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newSubtaskTitle.trim()) {
                        setSetupSubtasks([...setupSubtasks, { 
                          id: Date.now().toString(), 
                          title: newSubtaskTitle, 
                          completed: false 
                        }]);
                        setNewSubtaskTitle('');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    </Button>
                </div>
              </Card>

              {/* Widget Icons */}
              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">Work Reminders</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-full">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      <Label>Stand/Sit Reminder</Label>
                    </div>
                    <Switch
                      checked={isEditMode ? setupStandSitReminder : (settings.workSchedule.standSitReminder || false)}
                      onCheckedChange={(checked) => {
                        if (isEditMode) {
                          setSetupStandSitReminder(checked);
                        } else {
                          const updated = {
                            ...settings,
                            workSchedule: {
                              ...settings.workSchedule,
                              standSitReminder: checked,
                            }
                          };
                          setSettings(updated);
                          localStorage.setItem('work_settings', JSON.stringify(updated));
                          setTimeout(() => {
                            syncWorkScheduleToTimeline();
                          }, 100);
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-full">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" />
                      <Label>Eye Break Reminder</Label>
                    </div>
                    <Switch
                      checked={isEditMode ? setupEyeBreakReminder : (settings.workSchedule.eyeBreakReminder || false)}
                      onCheckedChange={(checked) => {
                        if (isEditMode) {
                          setSetupEyeBreakReminder(checked);
                        } else {
                          const updated = {
                            ...settings,
                            workSchedule: {
                              ...settings.workSchedule,
                              eyeBreakReminder: checked,
                            }
                          };
                          setSettings(updated);
                          localStorage.setItem('work_settings', JSON.stringify(updated));
                          setTimeout(() => {
                            syncWorkScheduleToTimeline();
                          }, 100);
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-full">
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-primary" />
                      <Label>Pomodoro Method</Label>
                    </div>
                    <Switch
                      checked={isEditMode ? setupPomodoroEnabled : (settings.workSchedule.pomodoroEnabled || false)}
                      onCheckedChange={(checked) => {
                        if (isEditMode) {
                          setSetupPomodoroEnabled(checked);
                        } else {
                          const updated = {
                            ...settings,
                            workSchedule: {
                              ...settings.workSchedule,
                              pomodoroEnabled: checked,
                            }
                          };
                          setSettings(updated);
                          localStorage.setItem('work_settings', JSON.stringify(updated));
                          setTimeout(() => {
                            syncWorkScheduleToTimeline();
                          }, 100);
                        }
                      }}
                    />
                  </div>
                </div>
              </Card>

              <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                  className="flex-1 rounded-full"
                      onClick={() => {
                    setIsEditMode(false);
                    setIsSetupOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                {(() => {
                  const isValid = setupStartTime && setupEndTime && setupWorkDays.length > 0;
                  
                  return (
                    <Button
                      className="flex-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                      onClick={handleSetupComplete}
                      disabled={!isValid}
                    >
                      Save Changes
                    </Button>
                  );
                })()}
                  </div>
                </div>
        </div>
        )}

        {/* Overview when not editing */}
        {!isEditMode && (
          <div className="px-6 py-6 space-y-6">
            <Card className="p-4 rounded-2xl">
              <h3 className="font-semibold mb-2">Work Schedule</h3>
              <p className="text-sm text-muted-foreground">
                {settings.workSchedule.startTime} - {settings.workSchedule.endTime} on {settings.workSchedule.workDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
              </p>
              {workHours.hours > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated: {workHours.hours}h {workHours.minutes > 0 ? `${workHours.minutes}m` : ''} per day
                </p>
              )}
            </Card>
            
            {settings.salaryDateEnabled && (
              <Card className="p-4 rounded-2xl">
                <h3 className="font-semibold mb-2">Salary</h3>
                <p className="text-sm text-muted-foreground">
                  {settings.salaryFrequency === 'monthly' && `${settings.salaryDate}${settings.salaryDate === 1 ? 'st' : settings.salaryDate === 2 ? 'nd' : settings.salaryDate === 3 ? 'rd' : 'th'} of each month`}
                  {settings.salaryFrequency === 'weekly' && `Every ${settings.salaryDayOfWeek?.charAt(0).toUpperCase() + settings.salaryDayOfWeek?.slice(1)}`}
                  {settings.salaryFrequency === 'biweekly' && `Every 2 weeks on ${settings.salaryDayOfWeek?.charAt(0).toUpperCase() + settings.salaryDayOfWeek?.slice(1)}`}
                  {settings.salaryFrequency === 'triweekly' && `Every 3 weeks on ${settings.salaryDayOfWeek?.charAt(0).toUpperCase() + settings.salaryDayOfWeek?.slice(1)}`}
                </p>
              </Card>
            )}
            
            {settings.workSchedule.subtasks && settings.workSchedule.subtasks.length > 0 && (
              <Card className="p-4 rounded-2xl">
                <h3 className="font-semibold mb-2">Subtasks</h3>
                <div className="space-y-2">
                  {settings.workSchedule.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 p-2 border rounded-full">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={(checked) => {
                          const updated = settings.workSchedule.subtasks?.map(s =>
                            s.id === subtask.id ? { ...s, completed: checked as boolean } : s
                          );
                          setSettings({
                            ...settings,
                            workSchedule: {
                              ...settings.workSchedule,
                              subtasks: updated,
                            }
                          });
                          localStorage.setItem('work_settings', JSON.stringify({
                            ...settings,
                            workSchedule: {
                              ...settings.workSchedule,
                              subtasks: updated,
                            }
                          }));
                        }}
                      />
                      <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* Widget Icons Overview */}
            {(settings.workSchedule.standSitReminder || settings.workSchedule.eyeBreakReminder || settings.workSchedule.pomodoroEnabled) && (
              <Card className="p-4 rounded-2xl">
                <h3 className="font-semibold mb-2">Work Reminders</h3>
                <div className="flex flex-wrap gap-3">
                  {settings.workSchedule.standSitReminder && (
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-full">
                      <Monitor className="w-4 h-4 text-primary" />
                      <span className="text-sm">Stand/Sit</span>
                    </div>
                  )}
                  {settings.workSchedule.eyeBreakReminder && (
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-full">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-sm">Eye Break</span>
                    </div>
                  )}
                  {settings.workSchedule.pomodoroEnabled && (
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-full">
                      <Timer className="w-4 h-4 text-primary" />
                      <span className="text-sm">Pomodoro</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => {
                  setSettings(defaultSettings);
                  localStorage.setItem('work_settings', JSON.stringify(defaultSettings));
                }}
              >
                Reset Setup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
