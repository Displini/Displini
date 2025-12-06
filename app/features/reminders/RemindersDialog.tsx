import { useState, useEffect } from "react";
import { UniversalDialog } from "@/app/components/shared";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Bell, Plus, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import { EmojiPicker } from "@/app/components/shared/EmojiPicker";
import { colors } from "@/lib/designSystem";

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface Reminder {
  id: string;
  title: string;
  emoji: string;
  color?: string;
  subtasks?: Subtask[];
}

interface ScheduleDialogState {
  open: boolean;
  reminder: Reminder | null;
}

export default function RemindersDialog() {
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('customReminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderEmoji, setNewReminderEmoji] = useState('⏰');
  const [newReminderColor, setNewReminderColor] = useState('');
  const [newSubtasks, setNewSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  // Schedule dialog state
  const [scheduleDialog, setScheduleDialog] = useState<ScheduleDialogState>({ open: false, reminder: null });
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [addToTodo, setAddToTodo] = useState(true);
  const [addToCalendar, setAddToCalendar] = useState(false);

  useEffect(() => {
    localStorage.setItem('customReminders', JSON.stringify(reminders));
    // Trigger event to update To Do timeline
    window.dispatchEvent(new Event('remindersUpdated'));
  }, [reminders]);

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    
    const subtask: Subtask = {
      id: nanoid(),
      text: newSubtaskText.trim(),
      completed: false
    };
    
    setNewSubtasks([...newSubtasks, subtask]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setNewSubtasks(newSubtasks.filter(st => st.id !== subtaskId));
  };

  const handleAddReminder = () => {
    if (!newReminderTitle.trim()) return;

    const reminder: Reminder = {
      id: nanoid(),
      title: newReminderTitle.trim(),
      emoji: newReminderEmoji,
      color: newReminderColor || undefined,
      subtasks: newSubtasks.length > 0 ? newSubtasks : undefined
    };

    setReminders([...reminders, reminder]);
    setNewReminderTitle('');
    setNewReminderEmoji('⏰');
    setNewReminderColor('');
    setNewSubtasks([]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const handleOpenSchedule = (reminder: Reminder) => {
    setScheduleDialog({ open: true, reminder });
    setScheduleDate(new Date().toISOString().split('T')[0]);
    setScheduleTime('09:00');
    setAddToTodo(true);
    setAddToCalendar(false);
  };

  const handleScheduleReminder = () => {
    if (!scheduleDialog.reminder) return;
    
    const reminder = scheduleDialog.reminder;

    // Add to To Do
    if (addToTodo) {
      const todos = JSON.parse(localStorage.getItem('todos') || '[]');
      const newTask = {
        id: nanoid(),
        title: reminder.title,
        emoji: reminder.emoji,
        time: scheduleTime,
        completed: false,
        source: 'reminder',
        reminderId: reminder.id,
        dueDate: new Date(scheduleDate).toISOString(),
        color: reminder.color,
        subtasks: reminder.subtasks || undefined
      };
      todos.push(newTask);
      localStorage.setItem('todos', JSON.stringify(todos));
      window.dispatchEvent(new Event('todosUpdated'));
    }

    // Add to Calendar
    if (addToCalendar) {
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      const newEvent = {
        id: nanoid(),
        title: reminder.title,
        emoji: reminder.emoji,
        date: scheduleDate,
        time: scheduleTime,
        source: 'reminder',
        reminderId: reminder.id,
        color: reminder.color,
        subtasks: reminder.subtasks || undefined
      };
      events.push(newEvent);
      localStorage.setItem('events', JSON.stringify(events));
      window.dispatchEvent(new Event('eventsUpdated'));
    }

    // Remove the scheduled reminder from the list
    setReminders(reminders.filter(r => r.id !== reminder.id));

    // Close dialogs
    setScheduleDialog({ open: false, reminder: null });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          data-testid="button-reminders"
        >
          <Bell className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⏰ Reminders</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded p-3">
            💡 Create reminders that you can schedule into your To Do list or Calendar when needed.
          </p>

          {/* Add New Reminder */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium text-sm">Add New Reminder</h3>
            
            <div>
              <Label>Emoji</Label>
              <EmojiPicker
                value={newReminderEmoji}
                onChange={setNewReminderEmoji}
                category="common"
              />
            </div>

            <div>
              <Label htmlFor="reminder-title">Title *</Label>
              <Input
                id="reminder-title"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                placeholder="e.g., Review weekly goals"
              />
            </div>

            <div>
              <Label htmlFor="reminder-color">Color (Optional)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="reminder-color"
                  type="color"
                  value={newReminderColor || '#3b82f6'}
                  onChange={(e) => setNewReminderColor(e.target.value)}
                  className="w-20 h-10"
                />
                {newReminderColor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewReminderColor('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <Label>Subtasks (Optional)</Label>
              <div className="space-y-2">
                {newSubtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="flex-1 text-sm">{subtask.text}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveSubtask(subtask.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskText.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleAddReminder} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </div>

          {/* Existing Reminders */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Your Reminders</h3>
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reminders yet. Create one above!
              </p>
            ) : (
              reminders.map(reminder => (
                <div 
                  key={reminder.id}
                  className="p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                  style={reminder.color ? { borderLeft: `4px solid ${reminder.color}` } : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                        style={reminder.color ? { backgroundColor: `${reminder.color}20`, border: `2px solid ${reminder.color}` } : { backgroundColor: 'hsl(var(--muted))' }}
                      >
                        {reminder.emoji}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{reminder.title}</p>
                        {reminder.subtasks && reminder.subtasks.length > 0 && (
                          <div className="space-y-1 mt-1">
                            {reminder.subtasks.slice(0, 3).map((subtask) => (
                              <div key={subtask.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div className="w-3 h-3 rounded-sm border border-muted-foreground/30" />
                                <span>{subtask.text}</span>
                              </div>
                            ))}
                            {reminder.subtasks.length > 3 && (
                              <p className="text-xs text-muted-foreground">+{reminder.subtasks.length - 3} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSchedule(reminder)}
                        className="text-xs"
                      >
                        📅 Schedule
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Schedule Reminder Dialog */}
    <Dialog open={scheduleDialog.open} onOpenChange={(open) => setScheduleDialog({ open, reminder: scheduleDialog.reminder })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Reminder</DialogTitle>
        </DialogHeader>
        {scheduleDialog.reminder && (
          <div className="space-y-4 pt-4">
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={scheduleDialog.reminder.color ? { backgroundColor: `${scheduleDialog.reminder.color}20`, border: `2px solid ${scheduleDialog.reminder.color}` } : { backgroundColor: 'hsl(var(--muted))' }}
                >
                  {scheduleDialog.reminder.emoji}
                </div>
                <p className="font-medium">{scheduleDialog.reminder.title}</p>
              </div>
              {scheduleDialog.reminder.subtasks && scheduleDialog.reminder.subtasks.length > 0 && (
                <div className="space-y-1 pl-4">
                  {scheduleDialog.reminder.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-3 h-3 rounded-sm border border-muted-foreground/30" />
                      <span>{subtask.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="schedule-date">Date *</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="schedule-time">Time *</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <Label>Add to:</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="add-todo"
                  checked={addToTodo}
                  onCheckedChange={(checked) => setAddToTodo(checked as boolean)}
                />
                <Label htmlFor="add-todo" className="cursor-pointer">To Do List</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="add-calendar"
                  checked={addToCalendar}
                  onCheckedChange={(checked) => setAddToCalendar(checked as boolean)}
                />
                <Label htmlFor="add-calendar" className="cursor-pointer">Calendar</Label>
              </div>
            </div>

            {!addToTodo && !addToCalendar && (
              <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                ⚠️ Please select at least one destination
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setScheduleDialog({ open: false, reminder: null })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleReminder}
                disabled={!addToTodo && !addToCalendar}
                className="flex-1"
              >
                Schedule
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </>
  );
}

