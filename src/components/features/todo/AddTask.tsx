import { useState, useEffect } from "react";
import { UniversalDialog } from "@/components/general";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Bell, Image as ImageIcon, Zap, Trash2, MapPin, FileText, ListChecks, Repeat } from "lucide-react";
import { Task, Subtask } from "@/types/types";
import { EmojiPicker } from "@/components/general/EmojiPicker";

interface PrefillPayload {
  time?: string;
  endTime?: string;
  allDay?: boolean;
}

interface Props {
  onAddTask: (task: Omit<Task, "id">) => void;
  prefill?: PrefillPayload;
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedDate?: Date;
}

export default function AddTask({ onAddTask, prefill, externalOpen, onOpenChange, selectedDate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [isAllDayMode, setIsAllDayMode] = useState(true); // true = All Day, false = Timed
  const [time, setTime] = useState("");
  
  // Get theme color for default
  const getThemeColor = () => {
    const root = document.documentElement;
    const primaryHSL = getComputedStyle(root).getPropertyValue('--primary').trim();
    if (primaryHSL) {
      return `hsl(${primaryHSL})`;
    }
    return '#3b82f6'; // fallback blue
  };
  
  const applyPrefill = (payload: PrefillPayload) => {
    if (payload.time) setTime(payload.time);
    if (payload.endTime) setEndTime(payload.endTime);
    if (payload.time || payload.endTime || payload.allDay === false) {
      setIsAllDayMode(false);
    } else if (payload.allDay === true) {
      setIsAllDayMode(true);
    }
  };

  // Use external control if provided, otherwise use internal state
  const actualIsOpen = externalOpen !== undefined ? externalOpen : isOpen;
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setIsOpen(open);
    }
    
    // Prefill fields when dialog opens with prefill payload
    if (open && prefill) {
      applyPrefill(prefill);
    }
    
    // Auto-use selected date when dialog opens
    if (open && selectedDate) {
      setDueDate(selectedDate.toISOString().split('T')[0]);
    }
    
    // Set default color to theme color when dialog opens
    if (open) {
      setColor(getThemeColor());
    }
  };
  const [endTime, setEndTime] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    return selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [color, setColor] = useState(getThemeColor());
  const [activeIconSection, setActiveIconSection] = useState<'alert' | 'photo' | 'location' | 'note' | 'checklist' | 'repeat' | null>(null);
  const [scheduleType, setScheduleType] = useState<"once" | "daily" | "weekly" | "biweekly" | "monthly">("once");
  const [scheduleInterval, setScheduleInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // 0=Sunday, 1=Monday, etc.
  const [saveToQuickAdd, setSaveToQuickAdd] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [alertTimes, setAlertTimes] = useState<string[]>([]);
  const [newAlertTime, setNewAlertTime] = useState("");
  const [overlappingTasks, setOverlappingTasks] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'quick'>('new');
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [selectedQuickTask, setSelectedQuickTask] = useState<any>(null);
  const [quickTaskDate, setQuickTaskDate] = useState(() => {
    return selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  });
  const [quickTasks, setQuickTasks] = useState<Array<{id: string; title: string; emoji: string; time?: string; allDay?: boolean; notes?: string; location?: string; color?: string; endTime?: string}>>(() => {
    const saved = localStorage.getItem('quick_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Apply prefill when externally opened and payload changes
  useEffect(() => {
    if (actualIsOpen && prefill) {
      applyPrefill(prefill);
    }
  }, [actualIsOpen, prefill]);

  // Normalize existing seeded quick tasks (ensure timed tasks are not all-day)
  useEffect(() => {
    const needsFix = quickTasks.some(
      qt => qt.id?.startsWith('seed-quick-') && qt.time && qt.allDay !== false
    );
    if (needsFix) {
      const fixed = quickTasks.map(qt => {
        if (qt.id?.startsWith('seed-quick-') && qt.time) {
          return { ...qt, allDay: false };
        }
        return qt;
      });
      setQuickTasks(fixed);
      localStorage.setItem('quick_tasks', JSON.stringify(fixed));
    }
  }, [quickTasks]);

  // Seed quick-add tasks once if none exist
  useEffect(() => {
    if (quickTasks.length === 0 && !localStorage.getItem('seeded_quick_tasks')) {
      const seeds = [
        { id: "seed-quick-06-no-end", title: "task with no endtime", emoji: "📝", time: "06:00", allDay: false },
        { id: "seed-quick-0601-0602", title: "task one minute", emoji: "🚗", time: "06:01", endTime: "06:02", allDay: false },
        { id: "seed-quick-0700-0800", title: "task one hour", emoji: "⏰", time: "07:00", endTime: "08:00", allDay: false },
        { id: "seed-quick-0800-1000", title: "task two hours", emoji: "⏳", time: "08:00", endTime: "10:00", allDay: false },
        { id: "seed-quick-1000-1300", title: "task three hours", emoji: "🕒", time: "10:00", endTime: "13:00", allDay: false },
      ];
      setQuickTasks(seeds);
      localStorage.setItem('quick_tasks', JSON.stringify(seeds));
      localStorage.setItem('seeded_quick_tasks', '1');
    }
  }, [quickTasks]);

  const weekDays = [
    { value: 1, label: 'Mon', fullLabel: 'Monday' },
    { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
    { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
    { value: 4, label: 'Thu', fullLabel: 'Thursday' },
    { value: 5, label: 'Fri', fullLabel: 'Friday' },
    { value: 6, label: 'Sat', fullLabel: 'Saturday' },
    { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  ];

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const addSubtask = () => {
    if (newSubtaskText.trim()) {
      const newSubtask: Subtask = {
        id: Date.now().toString(),
        text: newSubtaskText.trim(),
        completed: false,
      };
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskText("");
    }
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const addAlert = () => {
    if (newAlertTime && !alertTimes.includes(newAlertTime)) {
      setAlertTimes([...alertTimes, newAlertTime].sort());
      setNewAlertTime("");
    }
  };

  const removeAlert = (time: string) => {
    setAlertTimes(alertTimes.filter(t => t !== time));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAttachments(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check for task overlaps
  const checkOverlaps = () => {
    if (isAllDayMode || !time) {
      setOverlappingTasks([]);
      return;
    }

    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    const selectedDateStr = new Date(dueDate).toISOString().split('T')[0];
    
    // Filter tasks for the selected date that have times
    const tasksOnDate = todos.filter((t: any) => {
      if (!t.time || t.isAllDay) return false;
      const taskDateStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
      return taskDateStr === selectedDateStr;
    });

    const newStartMinutes = timeToMinutes(time);
    const newEndMinutes = endTime ? timeToMinutes(endTime) : newStartMinutes + 60; // Default 1 hour duration

    const overlaps: string[] = [];

    tasksOnDate.forEach((task: any) => {
      // Exclude water intake tasks from overlap detection
      if (task.source === 'water' || (task as any).waterReminder) {
        return;
      }
      
      const taskStartMinutes = timeToMinutes(task.time);
      const taskEndMinutes = task.endTime ? timeToMinutes(task.endTime) : taskStartMinutes + 60;

      // Check if time ranges overlap
      const hasOverlap = 
        (newStartMinutes >= taskStartMinutes && newStartMinutes < taskEndMinutes) ||
        (newEndMinutes > taskStartMinutes && newEndMinutes <= taskEndMinutes) ||
        (newStartMinutes <= taskStartMinutes && newEndMinutes >= taskEndMinutes);

      if (hasOverlap) {
        const timeRange = task.endTime ? `${task.time}-${task.endTime}` : task.time;
        overlaps.push(`${task.emoji || '📝'} ${task.title} (${timeRange})`);
      }
    });

    setOverlappingTasks(overlaps);
  };

  // Run overlap check when date, time, or endTime changes
  useEffect(() => {
    if (actualIsOpen) {
      checkOverlaps();
    }
  }, [dueDate, time, endTime, isAllDayMode, actualIsOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    // Validate weekly tasks have at least one day selected
    if (scheduleType === "weekly" && selectedDays.length === 0) {
      alert("Please select at least one day for weekly tasks");
      return;
    }

    const tasksToAdd: Omit<Task, "id">[] = [];
    const startDate = new Date(dueDate);
    
    // Map scheduleType to repeat field
    const repeatValue = scheduleType === "once" ? undefined : 
                       scheduleType === "daily" ? "daily" as const :
                       scheduleType === "weekly" ? "weekly" as const :
                       scheduleType === "biweekly" ? "weekly" as const :
                       scheduleType === "monthly" ? "monthly" as const :
                       undefined;
    
    if (scheduleType === "once") {
      // Single task
      tasksToAdd.push({
        title: title.trim(),
        completed: false,
        source: "manual",
        emoji,
        allDay: isAllDayMode,
        time: !isAllDayMode ? time : undefined,
        endTime: !isAllDayMode && endTime ? endTime : undefined,
        dueDate: startDate,
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
        color: color || undefined,
        repeat: repeatValue,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        alertTimes: alertTimes.length > 0 ? alertTimes : undefined,
      });
    } else {
      // Recurring tasks - create multiple instances
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Create tasks for next 3 months
      
      let currentDate = new Date(startDate);
      let taskCount = 0;
      const maxTasks = 100; // Limit to prevent too many tasks
      
      while (currentDate <= endDate && taskCount < maxTasks) {
        // For weekly tasks with selected days, only create tasks on those days
        const shouldCreateTask = scheduleType !== "weekly" || selectedDays.includes(currentDate.getDay());
        
        if (shouldCreateTask) {
          tasksToAdd.push({
            title: title.trim(),
            completed: false,
            source: "manual" as const,
            emoji,
            allDay: isAllDayMode,
            time: !isAllDayMode ? time : undefined,
            endTime: !isAllDayMode && endTime ? endTime : undefined,
            dueDate: new Date(currentDate),
            notes: notes.trim() || undefined,
            location: location.trim() || undefined,
            color: color || undefined,
            repeat: repeatValue,
            subtasks: subtasks.length > 0 ? subtasks.map(st => ({ ...st, id: `${Date.now()}-${st.id}` })) : undefined,
            attachments: attachments.length > 0 ? attachments : undefined,
            alertTimes: alertTimes.length > 0 ? alertTimes : undefined,
          });
          taskCount++;
        }
        
        // Calculate next occurrence
        switch (scheduleType) {
          case "daily":
            currentDate.setDate(currentDate.getDate() + scheduleInterval);
            break;
          case "weekly":
            // For weekly, advance by 1 day to check next day
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case "biweekly":
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case "monthly":
            currentDate.setMonth(currentDate.getMonth() + scheduleInterval);
            break;
        }
      }
    }

    // Save to Quick Tasks if checkbox is checked
    if (saveToQuickAdd && scheduleType === "once") {
      const quickTask = {
        id: Date.now().toString(),
        title: title.trim(),
        emoji,
        allDay: isAllDayMode,
        time: !isAllDayMode ? time : undefined,
        endTime: !isAllDayMode && endTime ? endTime : undefined,
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
        color: color || undefined,
      };
      const updated = [...quickTasks, quickTask];
      setQuickTasks(updated);
      localStorage.setItem('quick_tasks', JSON.stringify(updated));
    }
    
    // Reset tab to new after creating task
    setActiveTab('new');
    
    // Add all tasks
    tasksToAdd.forEach(task => onAddTask(task));
    
    // Reset form
    setTitle("");
    setEmoji("📝");
    setIsAllDayMode(true);
    setTime("");
    setEndTime("");
    setDueDate(selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setNotes("");
    setLocation("");
    setColor(getThemeColor());
    setActiveIconSection(null);
    setScheduleType("once");
    setScheduleInterval(1);
    setSelectedDays([1]);
    setSaveToQuickAdd(false);
    setSubtasks([]);
    setNewSubtaskText("");
    setAlertTimes([]);
    setNewAlertTime("");
    setOverlappingTasks([]);
    setAttachments([]);
    handleOpenChange(false);
  };

  const handleUseQuickTask = (quickTask: any) => {
    setSelectedQuickTask(quickTask);
    setQuickTaskDate(selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setShowDateDialog(true);
  };

  const handleConfirmQuickTask = () => {
    if (!selectedQuickTask) return;
    
    const quickTask = selectedQuickTask;
    const isTimed = !!quickTask.time;
    const isAllDay = quickTask.allDay === true ? true : isTimed ? false : true;
    const taskToAdd: Omit<Task, "id"> = {
      title: quickTask.title.trim(),
      completed: false,
      source: "manual",
      emoji: quickTask.emoji,
      allDay: isAllDay,
      time: isAllDay ? undefined : quickTask.time,
      endTime: isAllDay ? undefined : quickTask.endTime,
      dueDate: new Date(quickTaskDate),
      notes: quickTask.notes?.trim() || undefined,
      location: quickTask.location?.trim() || undefined,
      color: quickTask.color || undefined,
    };
    
    onAddTask(taskToAdd);
    setShowDateDialog(false);
    setSelectedQuickTask(null);
    handleOpenChange(false);
  };

  const removeQuickTask = (id: string) => {
    const updated = quickTasks.filter(qt => qt.id !== id);
    setQuickTasks(updated);
    localStorage.setItem('quick_tasks', JSON.stringify(updated));
  };

  return (
    <UniversalDialog
      open={actualIsOpen}
      onOpenChange={handleOpenChange}
      title=""
      hideDefaultFooter
      hideHeader
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'new' | 'quick')} className="w-full">
        <div className="flex items-center justify-between w-full gap-2 mb-3 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-2 flex-1 max-w-[280px]">
            <TabsTrigger value="new">Add New Task</TabsTrigger>
            <TabsTrigger value="quick">Quick Add</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleOpenChange(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <TabsContent value="new" className="mt-2">
          <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. Emoji + Color - click emoji to open popover with categories */}
          <div className="flex flex-col items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 border-border shadow-sm hover:scale-105 transition-transform" style={{ backgroundColor: color || getThemeColor() }}>
                  {emoji}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-sm p-3" align="center">
                <p className="text-sm font-medium mb-2 text-center">Choose Emoji</p>
                <EmojiPicker value={emoji} onChange={setEmoji} category="common" />
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2 w-full max-w-[240px]">
              <Label htmlFor="task-color" className="text-sm font-medium shrink-0">Color</Label>
              <Input
                id="task-color"
                type="color"
                value={color?.startsWith('#') ? color : '#3b82f6'}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 cursor-pointer p-1 rounded border shrink-0"
              />
              <Input
                type="text"
                value={color?.startsWith('#') ? color : ''}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#hex or theme"
                className="flex-1 text-xs font-mono h-9 min-w-0"
              />
            </div>
          </div>

          {/* 2. Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              required
              className="mt-1"
            />
          </div>

          {/* 3. Date */}
          <div>
            <Label htmlFor="dueDate" className="text-sm font-medium">Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {/* 4. All Day switch */}
          <div className="flex items-center justify-between py-2 rounded-lg border bg-muted/30 px-3">
            <span className="text-sm font-medium">All day task</span>
            <Switch
              checked={isAllDayMode}
              onCheckedChange={(checked) => setIsAllDayMode(checked)}
            />
          </div>

          {/* Start / End - only shown when not all-day */}
          {!isAllDayMode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="time" className="text-xs">Start</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-xs">End</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* 5. Icon row: Alert, Photo, Location, Note, Checklist (hidden for all-day), Repeat */}
          <div className="flex items-center justify-center gap-1.5 py-2 flex-wrap">
            <button type="button" onClick={() => setActiveIconSection(activeIconSection === 'alert' ? null : 'alert')} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-colors min-w-[48px] ${activeIconSection === 'alert' ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`} title="Alerts"><Bell className="w-4 h-4" /><span className="text-[9px]">Alert</span></button>
            {!isAllDayMode && (
              <>
                <button type="button" onClick={() => setActiveIconSection(activeIconSection === 'photo' ? null : 'photo')} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-colors min-w-[48px] ${activeIconSection === 'photo' ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`} title="Photos"><ImageIcon className="w-4 h-4" /><span className="text-[9px]">Photo</span></button>
                <button type="button" onClick={() => setActiveIconSection(activeIconSection === 'location' ? null : 'location')} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-colors min-w-[48px] ${activeIconSection === 'location' ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`} title="Location"><MapPin className="w-4 h-4" /><span className="text-[9px]">Location</span></button>
                <button type="button" onClick={() => setActiveIconSection(activeIconSection === 'note' ? null : 'note')} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-colors min-w-[48px] ${activeIconSection === 'note' ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`} title="Notes"><FileText className="w-4 h-4" /><span className="text-[9px]">Note</span></button>
                <button type="button" onClick={() => setActiveIconSection(activeIconSection === 'checklist' ? null : 'checklist')} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-colors min-w-[48px] ${activeIconSection === 'checklist' ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`} title="Checklist"><ListChecks className="w-4 h-4" /><span className="text-[9px]">Checklist</span></button>
              </>
            )}
            <button type="button" onClick={() => setActiveIconSection(activeIconSection === 'repeat' ? null : 'repeat')} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-colors min-w-[48px] ${activeIconSection === 'repeat' ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`} title="Repeat"><Repeat className="w-4 h-4" /><span className="text-[9px]">Repeat</span></button>
          </div>

          {/* Expanded sections for icon row - hide photo/location/note/checklist for all-day */}
          {activeIconSection === 'alert' && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><Bell className="w-4 h-4" /> Alerts</Label>
              {alertTimes.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-2 bg-background rounded border">
                  <span className="flex-1">🔔 {t}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeAlert(t)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input type="time" value={newAlertTime} onChange={(e) => setNewAlertTime(e.target.value)} placeholder="Add time" className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addAlert} disabled={!newAlertTime}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
          {!isAllDayMode && activeIconSection === 'photo' && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Photos</Label>
              {attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {attachments.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-full h-16 object-cover rounded border" />
                      <Button type="button" variant="destructive" size="sm" className="absolute top-0.5 right-0.5 h-5 w-5 p-0 opacity-0 group-hover:opacity-100" onClick={() => removeAttachment(i)}><X className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
              <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="cursor-pointer text-sm" />
            </div>
          )}
          {!isAllDayMode && activeIconSection === 'location' && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <Label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where?" className="mt-2" />
            </div>
          )}
          {!isAllDayMode && activeIconSection === 'note' && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <Label className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={3} className="mt-2" />
            </div>
          )}
          {!isAllDayMode && activeIconSection === 'checklist' && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><ListChecks className="w-4 h-4" /> Subtasks</Label>
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 text-sm p-2 bg-background rounded border">
                  <span className="flex-1">{st.text}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSubtask(st.id)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} placeholder="Add subtask" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addSubtask} disabled={!newSubtaskText.trim()}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
          {activeIconSection === 'repeat' && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2"><Repeat className="w-4 h-4" /> Repeat</Label>
              <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once (no repeat)</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {scheduleType !== "once" && scheduleType !== "weekly" && (
                <Input type="number" min={1} max={12} value={scheduleInterval} onChange={(e) => setScheduleInterval(parseInt(e.target.value) || 1)} className="w-20" placeholder="1" />
              )}
              {scheduleType === "weekly" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Select days</Label>
                  <div className="grid grid-cols-7 gap-1 mt-2">
                    {weekDays.map((day) => (
                      <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={`py-2 px-1 text-xs rounded-lg border-2 transition-all ${selectedDays.includes(day.value) ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'bg-background border-muted hover:border-primary/50'}`} title={day.fullLabel}>{day.label}</button>
                    ))}
                  </div>
                  {selectedDays.length === 0 && <p className="text-xs text-amber-600 mt-1">Select at least one day</p>}
                </div>
              )}
            </div>
          )}

          {/* 6. Quick Add slider - like all day task style */}
          {scheduleType === "once" && (
            <div className="flex items-center justify-between py-3 px-4 rounded-full border bg-muted/30">
              <span className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Save to Quick Add
              </span>
              <Switch checked={saveToQuickAdd} onCheckedChange={setSaveToQuickAdd} />
            </div>
          )}

          {/* Overlap Warning */}
          {overlappingTasks.length > 0 && (
            <div className="p-3 rounded-lg border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
                  ⚠️ Time Conflict Detected
                </span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                This task overlaps with:
              </p>
              <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1 pl-4">
                {overlappingTasks.map((task, index) => (
                  <li key={index} className="list-disc">{task}</li>
                ))}
              </ul>
              <p className="text-xs text-orange-600 dark:text-orange-400 italic">
                You can still add this task, but consider rescheduling to avoid conflicts.
              </p>
            </div>
          )}

            <div className="flex gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              {(() => {
                const isValid = title.trim() && (isAllDayMode || time);
                return (
                  <Button 
                    type="submit" 
                    className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    disabled={!isValid}
                  >
                Add Task
              </Button>
                );
              })()}
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="quick" className="mt-4">
          <div className="space-y-3">
            {quickTasks.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                {quickTasks.map(qt => (
                  <div key={qt.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <button
                      type="button"
                      onClick={() => handleUseQuickTask(qt)}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 transition-all hover:scale-105 active:scale-95 border-2"
                      style={{
                        backgroundColor: qt.color ? `${qt.color}1a` : 'hsl(var(--primary) / 0.1)',
                        borderColor: qt.color || 'hsl(var(--primary) / 0.3)',
                      }}
                    >
                      {qt.emoji || "📝"}
                    </button>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{qt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {qt.allDay ? "All day" : qt.time ? `${qt.time}${qt.endTime ? `–${qt.endTime}` : ""}` : "Timed"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full flex-shrink-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuickTask(qt.id);
                      }}
                      title="Remove from Quick Add"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-1">No quick tasks yet</p>
                <p className="text-xs">Save tasks with ⚡ to add them here</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Date Selection Dialog for Quick Tasks */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="quick-task-date">Date</Label>
              <Input
                id="quick-task-date"
                type="date"
                value={quickTaskDate}
                onChange={(e) => setQuickTaskDate(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDateDialog(false);
                  setSelectedQuickTask(null);
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmQuickTask}
                className="flex-1"
              >
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UniversalDialog>
  );
}
