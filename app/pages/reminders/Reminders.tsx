import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { SEO } from "@/app/components/shared/SEO";
import { Bell, Plus, Clock, AlertCircle, Settings, X, Droplets, Pill, Moon, Heart, Dumbbell, Briefcase, Filter, Calendar, CheckSquare, CheckCircle2, History, Calendar as CalendarIcon, BarChart3, Menu, Sun, GraduationCap, BookOpen, MapPin, Flag, Image as ImageIcon, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Checkbox } from "@/app/components/ui/checkbox";
import AppHeader from "@/app/shared/AppHeader";
import { PageHeader, FeaturesSidebar, FeatureDialogs, CreateReminderDialog, ImageViewerDialog } from "@/app/components/shared";
import { useOptimizedLocalStorage } from "@/hooks/useLocalStorage";
import { useDarkMode } from "@/hooks/useDarkMode";
import { nanoid } from "nanoid";

// Lazy load heavy dialog
const MonthlyStatsModal = lazy(() => import("@/app/components/shared/MonthlyStatsModal"));

interface Reminder {
  id: string;
  title: string;
  emoji?: string;
  note?: string;
  image?: string; // base64 data URL
  location?: string;
  important: boolean;
  createdAt: string;
  scheduled: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledEndTime?: string;
  calendarId?: string;
  completed: boolean;
  completedAt?: string;
  addedToTodo?: boolean;
  addedToCalendar?: boolean;
  todoId?: string;
  calendarEventId?: string;
}

export default function Reminders() {
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [activeRemindersTab, setActiveRemindersTab] = useState<'unscheduled' | 'scheduled'>('unscheduled');
  const [importanceFilter, setImportanceFilter] = useState<'all' | 'important' | 'not-important'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'none'>('newest');
  const [reminderSettings, setReminderSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    morningReminders: true,
    eveningReminders: false,
    weekendReminders: true
  });
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    endTime: '',
    addToTodo: true,
    addToCalendar: false
  });
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [showIntegrationsBanner, setShowIntegrationsBanner] = useState(() => {
    const dismissed = localStorage.getItem('remindersIntegrationsDismissed');
    return dismissed !== 'true';
  });
  const [showDismissPopover, setShowDismissPopover] = useState(false);

  // Use optimized localStorage for reminders
  const [reminders, setReminders] = useOptimizedLocalStorage<Reminder[]>('reminders', [], {
    deserialize: (value) => {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    },
    serialize: (value) => JSON.stringify(value),
  });

  // Load reminders and setup event listener
  useEffect(() => {
    const handleOpenAddReminder = () => {
      setShowCreateDialog(true);
    };
    
    const handleRemindersUpdated = () => {
      // Refresh reminders when updated from todo page
      const stored = localStorage.getItem('reminders');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setReminders(parsed);
        } catch (e) {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('openAddReminder', handleOpenAddReminder);
    window.addEventListener('remindersUpdated', handleRemindersUpdated);
    
    return () => {
      window.removeEventListener('openAddReminder', handleOpenAddReminder);
      window.removeEventListener('remindersUpdated', handleRemindersUpdated);
    };
  }, [setReminders]);

  // Handler for opening create dialog (used by both Add Reminder button and bottom + button)
  const handleOpenCreateDialog = useCallback(() => {
    setShowCreateDialog(true);
  }, []);

  const handleCreateReminder = useCallback((reminderData: Omit<Reminder, 'id' | 'createdAt' | 'scheduled' | 'completed'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      scheduled: false,
      completed: false,
    };
    setReminders(prev => [...prev, newReminder]);
  }, [setReminders]);

  const handleEditReminder = useCallback((reminderData: Omit<Reminder, 'id' | 'createdAt' | 'scheduled' | 'completed'>) => {
    if (!editingReminder) return;
    
    setReminders(prev => prev.map(r => 
      r.id === editingReminder.id 
        ? { ...r, ...reminderData }
        : r
    ));
    setEditingReminder(null);
    setShowEditDialog(false);
  }, [editingReminder, setReminders]);

  const openEditDialog = useCallback((reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowEditDialog(true);
  }, []);

  const openScheduleDialog = useCallback((reminder: Reminder) => {
    setSelectedReminder(reminder);
    setScheduleData({
      date: reminder.scheduledDate || new Date().toISOString().split('T')[0],
      time: reminder.scheduledTime || '',
      endTime: reminder.scheduledEndTime || '',
      addToTodo: reminder.addedToTodo !== false,
      addToCalendar: reminder.addedToCalendar === true
    });
    setShowScheduleDialog(true);
  }, []);

  const scheduleReminder = useCallback(() => {
    if (!selectedReminder || !scheduleData.date || !scheduleData.time) return;
    if (!scheduleData.addToTodo && !scheduleData.addToCalendar) return;

    // Add to To Do
    let todoId: string | undefined;
    if (scheduleData.addToTodo) {
      const todos = JSON.parse(localStorage.getItem('todos') || '[]');
      todoId = nanoid();
      const newTask = {
        id: todoId,
        title: selectedReminder.title,
        emoji: selectedReminder.emoji,
        time: scheduleData.time,
        completed: false,
        source: 'reminder' as const,
        reminderId: selectedReminder.id,
        dueDate: new Date(scheduleData.date).toISOString(),
        notes: selectedReminder.note,
        attachments: selectedReminder.image ? [selectedReminder.image] : undefined,
      };
      todos.push(newTask);
      localStorage.setItem('todos', JSON.stringify(todos));
      window.dispatchEvent(new Event('todosUpdated'));
    }

    // Add to Calendar
    let calendarEventId: string | undefined;
    if (scheduleData.addToCalendar) {
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      calendarEventId = nanoid();
      const newEvent = {
        id: calendarEventId,
        title: selectedReminder.title,
        emoji: selectedReminder.emoji,
        date: scheduleData.date,
        time: scheduleData.time,
        source: 'reminder' as const,
        reminderId: selectedReminder.id,
        location: selectedReminder.location,
      };
      events.push(newEvent);
      localStorage.setItem('events', JSON.stringify(events));
      window.dispatchEvent(new Event('eventsUpdated'));
    }

    // Update reminder to mark as scheduled
    setReminders(reminders.map(r => 
      r.id === selectedReminder.id 
        ? { 
            ...r, 
            scheduled: true, 
            scheduledDate: scheduleData.date,
            scheduledTime: scheduleData.time,
            scheduledEndTime: scheduleData.endTime || undefined,
            addedToTodo: scheduleData.addToTodo,
            addedToCalendar: scheduleData.addToCalendar,
            todoId,
            calendarEventId
          } 
        : r
    ));
    setShowScheduleDialog(false);
    setSelectedReminder(null);
  }, [selectedReminder, scheduleData, reminders, setReminders]);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, [setReminders]);

  // Memoize filtered and sorted reminders
  const unscheduledReminders = useMemo(() => {
    let filtered = reminders.filter(reminder => !reminder.scheduled && !reminder.completed);
    
    // Apply importance filter
    if (importanceFilter === 'important') {
      filtered = filtered.filter(reminder => reminder.important);
    } else if (importanceFilter === 'not-important') {
      filtered = filtered.filter(reminder => !reminder.important);
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'oldest') {
      filtered = [...filtered].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    
    return filtered;
  }, [reminders, importanceFilter, sortBy]);
  
  const scheduledReminders = useMemo(() => {
    let filtered = reminders.filter(reminder => reminder.scheduled && !reminder.completed);
    
    // Apply sorting
    if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
        const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'oldest') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
        const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
        return dateA - dateB;
      });
    }
    
    return filtered;
  }, [reminders, sortBy]);

  // Handle feature clicks from sidebar - memoized
  const handleCloseMenu = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowMenuDialog(false);
      setIsClosing(false);
    }, 200);
  }, []);


  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="Reminders"
        description="Manage your reminders and notifications"
        noindex={true}
      />
      {/* Sticky Header */}
      <PageHeader>
        {/* Header Row - Tabs and Menu */}
        <div className="flex items-center gap-2">
            <Button
              variant={activeRemindersTab === 'unscheduled' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full flex-1"
              onClick={() => setActiveRemindersTab('unscheduled')}
            >
              To Schedule ({unscheduledReminders.length})
            </Button>
            <Button
              variant={activeRemindersTab === 'scheduled' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full flex-1"
              onClick={() => setActiveRemindersTab('scheduled')}
            >
              Scheduled ({scheduledReminders.length})
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleDarkMode}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowMenuDialog(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
      </PageHeader>
      
      {/* Integrations Banner */}
      {showIntegrationsBanner && (
        <div className="mx-4 mt-4 mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg backdrop-blur-sm relative">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Connect Your Reminders</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Sync tasks from Google Tasks and Microsoft To Do into your reminders
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    // TODO: Implement Google Tasks OAuth
                    console.log('Connect Google Tasks');
                  }}
                >
                  Connect Google Tasks
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    // TODO: Implement Microsoft To Do OAuth
                    console.log('Connect Microsoft To Do');
                  }}
                >
                  Connect Microsoft To Do
                </Button>
              </div>
            </div>
            <Popover open={showDismissPopover} onOpenChange={setShowDismissPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setShowDismissPopover(true)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setShowIntegrationsBanner(false);
                      setShowDismissPopover(false);
                      localStorage.setItem('remindersIntegrationsDismissed', 'not-now');
                    }}
                  >
                    Hide for now
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setShowIntegrationsBanner(false);
                      setShowDismissPopover(false);
                      localStorage.setItem('remindersIntegrationsDismissed', 'true');
                    }}
                  >
                    Don't ask again
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
      
      <div className="px-4 py-4" style={{ paddingTop: showIntegrationsBanner ? '120px' : '160px' }}>
        {/* Tab Content */}
        <div className="w-full">
          {activeRemindersTab === 'unscheduled' && (
            <div className="space-y-3 mt-6">
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {/* Importance Filter */}
              <div className="flex gap-2">
                <Button
                  variant={importanceFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportanceFilter('all')}
                  className="rounded-full"
                >
                  All
                </Button>
                <Button
                  variant={importanceFilter === 'important' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportanceFilter('important')}
                  className="rounded-full flex items-center gap-1"
                >
                  <Flag className="w-3 h-3" />
                  Important
                </Button>
                <Button
                  variant={importanceFilter === 'not-important' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportanceFilter('not-important')}
                  className="rounded-full"
                >
                  Not Important
                </Button>
              </div>
              
              {/* Sort Filter */}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant={sortBy === 'newest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('newest')}
                  className="rounded-full flex items-center gap-1"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  Newest
                </Button>
                <Button
                  variant={sortBy === 'oldest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('oldest')}
                  className="rounded-full flex items-center gap-1"
                >
                  <ArrowUpDown className="w-3 h-3 rotate-180" />
                  Oldest
                </Button>
              </div>
            </div>
            {unscheduledReminders.length > 0 ? (
              unscheduledReminders.map((reminder) => (
                <Card key={reminder.id} className="p-4 hover:shadow-md transition-all duration-200">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Left column: Emoji and View Image button */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          {/* Emoji circle with flag - vertically centered */}
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10 text-3xl">
                              {reminder.emoji || '⏰'}
                            </div>
                            {reminder.important && (
                              <Flag className="absolute -top-1 -left-1 w-5 h-5 text-red-500 fill-red-500 bg-background rounded-full p-0.5" />
                            )}
                          </div>
                          {/* View Image below emoji */}
                          {reminder.image && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setViewingImage(reminder.image || null);
                                setImageViewerOpen(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <ImageIcon className="w-4 h-4" />
                              View Image
                            </Button>
                          )}
                        </div>
                        
                        {/* Title, notes, date to the right of emoji */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{reminder.title}</h3>
                          </div>
                          {reminder.note && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reminder.note}</p>
                          )}
                          <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            {reminder.location && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{reminder.location}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(reminder.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(reminder)}
                          title="Edit reminder"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => deleteReminder(reminder.id)}
                          title="Delete reminder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openScheduleDialog(reminder)}
                        className="flex-1"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No reminders to schedule</h3>
                <p className="text-muted-foreground mb-4">Create a reminder using the + button</p>
                <Button onClick={handleOpenCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
            )}
            </div>
          )}

          {activeRemindersTab === 'scheduled' && (
            <div className="space-y-3 mt-6">
            {/* Sort Filter */}
            <div className="flex items-center gap-2 mb-4 justify-end">
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'newest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('newest')}
                  className="rounded-full flex items-center gap-1"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  Newest
                </Button>
                <Button
                  variant={sortBy === 'oldest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('oldest')}
                  className="rounded-full flex items-center gap-1"
                >
                  <ArrowUpDown className="w-3 h-3 rotate-180" />
                  Oldest
                </Button>
              </div>
            </div>
            {scheduledReminders.length > 0 ? (
              scheduledReminders.map((reminder) => (
                <Card key={reminder.id} className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Check icon */}
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <CheckSquare className="w-4 h-4 text-white" />
                        </div>
                        
                        {/* Left column: Emoji and View Image button */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          {/* Emoji circle with flag - vertically centered */}
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10 text-3xl">
                              {reminder.emoji || '⏰'}
                            </div>
                            {reminder.important && (
                              <Flag className="absolute -top-1 -left-1 w-5 h-5 text-red-500 fill-red-500 bg-background rounded-full p-0.5" />
                            )}
                          </div>
                          {/* View Image below emoji */}
                          {reminder.image && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setViewingImage(reminder.image || null);
                                setImageViewerOpen(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <ImageIcon className="w-4 h-4" />
                              View Image
                            </Button>
                          )}
                        </div>
                        
                        {/* Title, notes, date to the right of emoji */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{reminder.title}</h3>
                          </div>
                          {reminder.note && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reminder.note}</p>
                          )}
                          <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            {reminder.scheduledDate && reminder.scheduledTime && (
                              <span className="flex items-center space-x-1 font-medium text-primary">
                                <CalendarIcon className="w-3 h-3" />
                                <span>
                                  {new Date(reminder.scheduledDate).toLocaleDateString(undefined, { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} at {new Date(`2000-01-01T${reminder.scheduledTime}`).toLocaleTimeString(undefined, { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </span>
                              </span>
                            )}
                            {reminder.location && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{reminder.location}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {reminder.addedToTodo && (
                              <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                                <CheckSquare className="w-3 h-3 mr-1" />
                                Scheduled in To Do
                              </Badge>
                            )}
                            {reminder.addedToCalendar && (
                              <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                Scheduled in Calendar
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(reminder)}
                          title="Edit reminder"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => deleteReminder(reminder.id)}
                          title="Delete reminder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openScheduleDialog(reminder)}
                        className="flex-1"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No scheduled reminders</h3>
                <p className="text-muted-foreground mb-4">Schedule reminders to see them here</p>
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Features Sidebar */}
      <FeaturesSidebar
        isOpen={showMenuDialog}
        onClose={handleCloseMenu}
        isClosing={isClosing}
        onStatsClick={() => { setShowStats(true); handleCloseMenu(); }}
        onSettingsClick={() => { setShowSettings(true); handleCloseMenu(); }}
      />

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Reminder Settings</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-sm font-medium">
                  Push Notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={reminderSettings.notifications}
                  onCheckedChange={(checked) => 
                    setReminderSettings(prev => ({ ...prev, notifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="text-sm font-medium">
                  Sound Alerts
                </Label>
                <Switch
                  id="sound"
                  checked={reminderSettings.sound}
                  onCheckedChange={(checked) => 
                    setReminderSettings(prev => ({ ...prev, sound: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="vibration" className="text-sm font-medium">
                  Vibration
                </Label>
                <Switch
                  id="vibration"
                  checked={reminderSettings.vibration}
                  onCheckedChange={(checked) => 
                    setReminderSettings(prev => ({ ...prev, vibration: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="morning" className="text-sm font-medium">
                  Morning Reminders
                </Label>
                <Switch
                  id="morning"
                  checked={reminderSettings.morningReminders}
                  onCheckedChange={(checked) => 
                    setReminderSettings(prev => ({ ...prev, morningReminders: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="evening" className="text-sm font-medium">
                  Evening Reminders
                </Label>
                <Switch
                  id="evening"
                  checked={reminderSettings.eveningReminders}
                  onCheckedChange={(checked) => 
                    setReminderSettings(prev => ({ ...prev, eveningReminders: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="weekend" className="text-sm font-medium">
                  Weekend Reminders
                </Label>
                <Switch
                  id="weekend"
                  checked={reminderSettings.weekendReminders}
                  onCheckedChange={(checked) => 
                    setReminderSettings(prev => ({ ...prev, weekendReminders: checked }))
                  }
                />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                onClick={() => setShowSettings(false)}
                className="w-full"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Schedule Reminder</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReminder && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedReminder.emoji || '⏰'}</span>
                  <h4 className="font-medium">{selectedReminder.title}</h4>
                </div>
                {selectedReminder.note && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedReminder.note}</p>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="schedule-date">Date *</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="schedule-time">Start Time *</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="schedule-end-time">End Time (Optional)</Label>
                <Input
                  id="schedule-end-time"
                  type="time"
                  value={scheduleData.endTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="mt-2"
                  min={scheduleData.time}
                />
              </div>
              
              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <Label>Add to:</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="add-todo"
                    checked={scheduleData.addToTodo}
                    onCheckedChange={(checked) => setScheduleData(prev => ({ ...prev, addToTodo: checked as boolean }))}
                  />
                  <Label htmlFor="add-todo" className="cursor-pointer flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    To Do List
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="add-calendar"
                    checked={scheduleData.addToCalendar}
                    onCheckedChange={(checked) => setScheduleData(prev => ({ ...prev, addToCalendar: checked as boolean }))}
                  />
                  <Label htmlFor="add-calendar" className="cursor-pointer flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Calendar
                  </Label>
                </div>
              </div>
              
              {!scheduleData.addToTodo && !scheduleData.addToCalendar && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                  ⚠️ Please select at least one destination (To Do or Calendar)
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowScheduleDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={scheduleReminder}
                disabled={!scheduleData.date || !scheduleData.time || (!scheduleData.addToTodo && !scheduleData.addToCalendar)}
                className="flex-1"
              >
                Schedule Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create Reminder Dialog */}
      <CreateReminderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={handleCreateReminder}
      />

      {/* Edit Reminder Dialog */}
      {editingReminder && (
        <CreateReminderDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setEditingReminder(null);
          }}
          onSave={handleEditReminder}
          initialData={{
            title: editingReminder.title,
            emoji: editingReminder.emoji,
            note: editingReminder.note,
            image: editingReminder.image,
            location: editingReminder.location,
            important: editingReminder.important,
          }}
        />
      )}

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        images={viewingImage ? [viewingImage] : []}
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
      />
      
      {/* Lazy loaded stats dialog */}
      <Suspense fallback={<div />}>
        {showStats && <MonthlyStatsModal open={showStats} onOpenChange={setShowStats} />}
      </Suspense>
      <FeatureDialogs />
    </div>
  );
}
