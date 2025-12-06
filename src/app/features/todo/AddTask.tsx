import { useState, useEffect } from "react";
import { UniversalDialog } from "@/app/components/shared";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Textarea } from "@/app/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Plus, X, Bell, Image as ImageIcon, Zap, Trash2 } from "lucide-react";
import { Task, Subtask } from "@/app/types/types";
import { EmojiPicker } from "@/app/components/shared/EmojiPicker";
import { colors } from "@/lib/designSystem";

interface Props {
  onAddTask: (task: Omit<Task, "id">) => void;
  prefillTime?: string;
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedDate?: Date;
}

export default function AddTask({ onAddTask, prefillTime, externalOpen, onOpenChange, selectedDate }: Props) {
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
  
  // Use external control if provided, otherwise use internal state
  const actualIsOpen = externalOpen !== undefined ? externalOpen : isOpen;
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setIsOpen(open);
    }
    
    // Prefill time when dialog opens with prefillTime
    if (open && prefillTime) {
      setTime(prefillTime);
      setIsAllDayMode(false);
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
  const [color, setColor] = useState(getThemeColor());
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
  const [quickTasks, setQuickTasks] = useState<Array<{id: string; title: string; emoji: string; time?: string; allDay?: boolean; notes?: string; color?: string; endTime?: string}>>(() => {
    const saved = localStorage.getItem('quick_tasks');
    return saved ? JSON.parse(saved) : [];
  });

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
        color: color || undefined,
        repeat: repeatValue,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
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
            color: color || undefined,
            repeat: repeatValue,
            subtasks: subtasks.length > 0 ? subtasks.map(st => ({ ...st, id: `${Date.now()}-${st.id}` })) : undefined,
            attachments: attachments.length > 0 ? attachments : undefined,
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
    setColor(getThemeColor());
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
    const taskToAdd: Omit<Task, "id"> = {
      title: quickTask.title.trim(),
      completed: false,
      source: "manual",
      emoji: quickTask.emoji,
      allDay: quickTask.allDay !== false,
      time: quickTask.allDay === false ? quickTask.time : undefined,
      endTime: quickTask.allDay === false && quickTask.endTime ? quickTask.endTime : undefined,
      dueDate: new Date(quickTaskDate),
      notes: quickTask.notes?.trim() || undefined,
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
      title="Add New Task"
      hideDefaultFooter
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'new' | 'quick')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">Add New Task</TabsTrigger>
          <TabsTrigger value="quick">Quick Add</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new" className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. Title & Emoji */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <Label>Emoji</Label>
              <EmojiPicker 
                value={emoji}
                onChange={setEmoji}
                category="common"
              />
            </div>
          </div>

          {/* 2. Date */}
          <div className="p-3 rounded-lg border bg-muted/20">
            <Label htmlFor="dueDate" className="text-sm font-semibold">📅 Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {/* 3. Time/Duration */}
          <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
            <Label className="text-sm font-semibold">⏰ Time / Duration</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">All Day Task</span>
              <Switch
                checked={isAllDayMode}
                onCheckedChange={(checked) => setIsAllDayMode(checked)}
              />
            </div>

            {!isAllDayMode && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="time" className="text-xs">Start Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required={!isAllDayMode}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-xs">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            )}
          </div>

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

          {/* 4. Repeat */}
          <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
            <Label className="text-sm font-semibold">🔁 Repeat</Label>
            <div className="flex gap-2">
              <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once (no repeat)</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              
              {scheduleType !== "once" && scheduleType !== "weekly" && (
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={scheduleInterval}
                  onChange={(e) => setScheduleInterval(parseInt(e.target.value) || 1)}
                  className="w-20"
                  placeholder="1"
                />
              )}
            </div>
            
            {/* Day selector for weekly tasks */}
            {scheduleType === "weekly" && (
              <div>
                <Label className="text-xs text-muted-foreground">Select days</Label>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {weekDays.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`py-2 px-1 text-xs rounded-lg border-2 transition-all ${
                        selectedDays.includes(day.value)
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-background border-muted hover:border-primary/50'
                      }`}
                      title={day.fullLabel}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedDays.length === 0 && '⚠️ Select at least one day'}
                  {selectedDays.length > 0 && `Repeats: ${selectedDays.map(d => weekDays.find(wd => wd.value === d)?.label).join(', ')}`}
                </p>
              </div>
            )}
            
            {scheduleType !== "once" && scheduleType !== "weekly" && (
              <p className="text-xs text-muted-foreground">
                {scheduleType === "daily" && `Repeats every ${scheduleInterval} day${scheduleInterval > 1 ? 's' : ''}`}
                {scheduleType === "biweekly" && `Repeats every ${scheduleInterval * 2} weeks`}
                {scheduleType === "monthly" && `Repeats every ${scheduleInterval} month${scheduleInterval > 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          {/* 5. Alerts (NEW) */}
          <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alerts
            </Label>
            <div className="space-y-2">
              {alertTimes.map((time, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-background rounded border">
                  <span className="flex-1">🔔 {time}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAlert(time)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newAlertTime}
                  onChange={(e) => setNewAlertTime(e.target.value)}
                  placeholder="Add alert time"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAlert}
                  disabled={!newAlertTime}
                  className="disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {alertTimes.length === 0 && (
                <p className="text-xs text-muted-foreground">No alerts set</p>
              )}
            </div>
          </div>

          {/* 6. Photos/Screenshots */}
          <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos / Screenshots
            </Label>
            <div className="space-y-2">
              {attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {attachments.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {attachments.length === 0 ? 'No images attached' : `${attachments.length} image(s) attached`}
                </p>
              </div>
            </div>
          </div>

          {/* 7. Subtasks - Hide for all-day tasks */}
          {!isAllDayMode && (
          <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
            <Label className="text-sm font-semibold">✓ Subtasks</Label>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 text-sm p-2 bg-background rounded border">
                  <span className="flex-1">{subtask.text}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(subtask.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  placeholder="Add subtask"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubtask}
                  disabled={!newSubtaskText.trim()}
                  className="disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {subtasks.length === 0 && (
                <p className="text-xs text-muted-foreground">No subtasks added</p>
              )}
            </div>
          </div>
          )}

          {/* 8. Notes - Hide for all-day tasks */}
          {!isAllDayMode && (
          <div>
            <Label htmlFor="notes">📝 Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
              rows={3}
              className="mt-2"
            />
          </div>
          )}

          {/* 9. Task Color */}
          <div>
            <Label htmlFor="task-color">🎨 Task Color (optional)</Label>
            <div className="flex items-center gap-3 mt-2">
              <Input
                id="task-color"
                type="color"
                value={color || "#8b5cf6"}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground flex-1">
                {color || "Using theme color"}
              </span>
              {color && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setColor("")}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

            {/* 10. Quick Add Checkbox */}
            {scheduleType === "once" && (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20">
                <input
                  type="checkbox"
                  id="save-quick-add"
                  checked={saveToQuickAdd}
                  onChange={(e) => setSaveToQuickAdd(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="save-quick-add" className="cursor-pointer text-sm flex-1">
                  ⚡ Save to Quick Add (for faster task creation next time)
                </Label>
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
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {quickTasks.map(qt => (
                  <div
                    key={qt.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleUseQuickTask(qt)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{qt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{qt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {qt.allDay ? 'All day' : qt.time ? `${qt.time}${qt.endTime ? ` - ${qt.endTime}` : ''}` : 'Timed task'}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuickTask(qt.id);
                      }}
                      title="Remove from Quick Add"
                    >
                      <Trash2 className="w-4 h-4" />
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
