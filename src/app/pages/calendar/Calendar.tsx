import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { SEO } from "@/app/components/shared/SEO";
import CalendarView from "@/app/features/calendar/CalendarView";
import EventList from "@/app/features/calendar/EventList";
import { DateCarousel } from "@/app/components/shared/DateCarousel";
import { PageHeader } from "@/app/components/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Card } from "@/app/components/ui/card";
import { addDays, isSameDay, isWithinInterval, format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus, Trash2, BarChart3, Settings2, Menu, Moon, Sun, X, Heart, Pill, Droplets, Briefcase, GraduationCap, BookOpen } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";
import { useOptimizedLocalStorage } from "@/hooks/useLocalStorage";
import { useDarkMode } from "@/hooks/useDarkMode";

// Lazy load heavy dialog
const MonthlyStatsModal = lazy(() => import("@/app/components/shared/MonthlyStatsModal"));

interface CyclePeriod {
  id: string;
  startDate: string;
  cycleLength: number;
  periodDuration?: number;
}

type ViewMode = "month" | "week" | "day" | "list";

export default function Calendar() {
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [showStats, setShowStats] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showTodosInCalendar, setShowTodosInCalendar] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventAllDay, setNewEventAllDay] = useState(false);
  const [newEventEmoji, setNewEventEmoji] = useState("📅");
  const [newEventLocation, setNewEventLocation] = useState("");

  // Use optimized localStorage with memoization
  const [storedEvents, setStoredEvents] = useOptimizedLocalStorage<CalendarEvent[]>("calendarEvents", [], {
    deserialize: (value) => {
      const parsed = JSON.parse(value);
      return parsed.map((e: any) => ({ ...e, date: new Date(e.date) }));
    },
    serialize: (value) => {
      const eventsToSave = value
        .filter(e => e.type !== 'period' && e.type !== 'todo')
        .map(e => ({ ...e, date: e.date.toISOString() }));
      return JSON.stringify(eventsToSave);
    },
  });

  useEffect(() => {
    const handleOpenAddEvent = () => {
      setIsAddDialogOpen(true);
    };

    window.addEventListener('openAddEvent', handleOpenAddEvent);

    // Load setting
    const savedSetting = localStorage.getItem("showTodosInCalendar") === "true";
    setShowTodosInCalendar(savedSetting);

    generateCycleEvents();

    return () => {
      window.removeEventListener('openAddEvent', handleOpenAddEvent);
    };
  }, []);

  // Listen for menstrual data updates
  useEffect(() => {
    const handleMenstrualUpdate = () => {
      generateCycleEvents();
    };

    window.addEventListener('menstrualDataUpdated', handleMenstrualUpdate);
    return () => window.removeEventListener('menstrualDataUpdated', handleMenstrualUpdate);
  }, []);

  // Listen for setting changes
  useEffect(() => {
    const handleSettingChange = () => {
      const savedSetting = localStorage.getItem("showTodosInCalendar") === "true";
      setShowTodosInCalendar(savedSetting);
      loadTodoTasks();
    };

    window.addEventListener('calendarTodosSettingChanged', handleSettingChange);
    window.addEventListener('todosUpdated', handleSettingChange);

    return () => {
      window.removeEventListener('calendarTodosSettingChanged', handleSettingChange);
      window.removeEventListener('todosUpdated', handleSettingChange);
    };
  }, []);

  // Load todo tasks when setting is enabled
  useEffect(() => {
    loadTodoTasks();
  }, [showTodosInCalendar]);

  const loadTodoTasks = () => {
    if (!showTodosInCalendar) {
      // Remove todo-based events
      setEvents(prev => prev.filter(e => e.type !== 'todo'));
      return;
    }

    const todos = JSON.parse(localStorage.getItem("todos") || "[]");
    const todoEvents: CalendarEvent[] = todos
      .filter((t: any) => t.dueDate && !t.completed) // Only show uncompleted todos with a date
      .map((t: any) => ({
        id: `todo-${t.id}`,
        date: new Date(t.dueDate),
        title: t.title,
        time: t.time,
        startTime: t.time,
        endTime: t.endTime,
        allDay: t.isAllDay || !t.time,
        emoji: t.emoji || '✓',
        type: 'todo' as const,
        addToTodo: false,
      }));

    // Merge with existing non-todo events
    setEvents(prev => {
      const nonTodoEvents = prev.filter(e => e.type !== 'todo');
      return [...nonTodoEvents, ...todoEvents];
    });
  };

  // Update stored events when events change (optimized hook handles localStorage)
  useEffect(() => {
    setStoredEvents(events);
  }, [events, setStoredEvents]);

  const generateCycleEvents = useCallback(() => {
    const savedCycles = localStorage.getItem("menstrualCycles");
    const savedSettings = localStorage.getItem("menstrualSettings");
    
    if (!savedCycles && !savedSettings) return;

    const cycles: CyclePeriod[] = savedCycles ? JSON.parse(savedCycles) : [];
    const settings = savedSettings ? JSON.parse(savedSettings) : { averageCycleLength: 28, averagePeriodDuration: 5 };
    
    if (cycles.length === 0 && !settings.isSetup) return;

    const periodEvents: CalendarEvent[] = [];
    
    // Generate events for actual logged periods
    cycles.forEach(cycle => {
      const startDate = new Date(cycle.startDate);
      const duration = cycle.periodDuration || settings.averagePeriodDuration;
      
      for (let i = 0; i < duration; i++) {
        periodEvents.push({
          id: `period-${cycle.id}-${i}`,
          date: addDays(startDate, i),
          title: i === 0 ? "Period Start" : "Period",
          emoji: '🌸',
          time: "",
          type: 'period',
          allDay: true,
        });
      }
    });

    // Generate predicted events
    if (cycles.length > 0) {
      const lastCycle = cycles[0];
      const avgLength = cycles.reduce((sum, c) => sum + (c.cycleLength || settings.averageCycleLength), 0) / cycles.length;
      const nextPeriodStart = addDays(new Date(lastCycle.startDate), Math.round(avgLength));
      
      for (let i = 0; i < settings.averagePeriodDuration; i++) {
        periodEvents.push({
          id: `period-predicted-${i}`,
          date: addDays(nextPeriodStart, i),
          title: i === 0 ? "Period (predicted)" : "Period (predicted)",
          emoji: '🌸',
          time: "",
          type: 'period',
          allDay: true,
        });
      }
    } else if (settings.isSetup) {
      // Generate initial prediction if no cycles logged yet
      const today = new Date();
      const predictedStart = addDays(today, settings.averageCycleLength);
      
      for (let i = 0; i < settings.averagePeriodDuration; i++) {
        periodEvents.push({
          id: `period-initial-prediction-${i}`,
          date: addDays(predictedStart, i),
          title: i === 0 ? "Period (predicted)" : "Period (predicted)",
          emoji: '🌸',
          time: "",
          type: 'period',
          allDay: true,
        });
      }
    }

    setEvents(prev => {
      const nonPeriodEvents = prev.filter(e => e.type !== 'period');
      return [...nonPeriodEvents, ...periodEvents];
    });
  }, []);

  const handleAddEvent = useCallback(() => {
    setIsAddDialogOpen(true);
  }, []);

  const handleSubmitEvent = useCallback(() => {
    if (newEventTitle && (newEventStartTime || newEventAllDay)) {
      const newEvent = {
        id: Date.now().toString(),
        date: selectedDate,
        title: newEventTitle,
        startTime: newEventAllDay ? undefined : newEventStartTime,
        endTime: newEventAllDay ? undefined : newEventEndTime,
        allDay: newEventAllDay,
        emoji: newEventEmoji,
        addToTodo: false,
        type: 'event' as const,
        location: newEventLocation || undefined,
      };
      setEvents([...events, newEvent]);
      setNewEventTitle("");
      setNewEventStartTime("");
      setNewEventEndTime("");
      setNewEventAllDay(false);
      setNewEventEmoji("📅");
      setNewEventLocation("");
      setIsAddDialogOpen(false);
    }
  }, [selectedDate, events, newEventTitle, newEventStartTime, newEventEndTime, newEventAllDay, newEventEmoji, newEventLocation]);

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents(prevEvents => prevEvents.filter((e) => e.id !== id));
  }, []);

  const handleToggleTodo = useCallback((id: string, addToTodo: boolean) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, addToTodo } : e)));
    
    if (addToTodo) {
      const event = events.find(e => e.id === id);
      if (event) {
        const todos = JSON.parse(localStorage.getItem("todos") || "[]");
        const newTodo = {
          id: `cal-${event.id}`,
          title: event.title,
          emoji: event.emoji || '📅',
          completed: false,
          dueDate: event.date.toISOString(),
          time: event.allDay ? undefined : (event.startTime || event.time),
          allDay: event.allDay,
          source: 'calendar',
        };
        todos.push(newTodo);
        localStorage.setItem("todos", JSON.stringify(todos));
      }
    } else {
      const todos = JSON.parse(localStorage.getItem("todos") || "[]");
      const filteredTodos = todos.filter((t: any) => t.id !== `cal-${id}`);
      localStorage.setItem("todos", JSON.stringify(filteredTodos));
    }
  }, [events]);

  // Get reminders from localStorage - memoized
  const reminders = useMemo(() => {
    const saved = localStorage.getItem('reminders');
    return saved ? JSON.parse(saved) : [];
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="Calendar"
        description="View and manage your schedule"
        noindex={true}
      />
      {/* Sticky Header */}
      <PageHeader>
        {/* Top Row - Actions */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h1>
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
        
        {/* Date Carousel */}
        <DateCarousel 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        
        {/* View Mode Selector */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
            className="rounded-full"
          >
            Month
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
            className="rounded-full"
          >
            Week
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
            className="rounded-full"
          >
            Day
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-full"
          >
            List
          </Button>
        </div>
      </PageHeader>

      <main className="px-4 py-6 space-y-6" style={{ paddingTop: '160px' }}>

        {/* Month View */}
        {viewMode === "month" && (
          <>
            <CalendarView
              events={events}
              onDateSelect={setSelectedDate}
              onAddEvent={handleAddEvent}
              selectedDate={selectedDate}
            />
            <EventList
              events={events}
              selectedDate={selectedDate}
              onDeleteEvent={handleDeleteEvent}
              onToggleTodo={handleToggleTodo}
            />
          </>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Week of {format(startOfWeek(selectedDate), "MMM d")}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {eachDayOfInterval({
                start: startOfWeek(selectedDate),
                end: endOfWeek(selectedDate)
              }).map(day => {
                const dayEvents = events.filter(e => isSameDay(e.date, day));
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div key={day.toString()} className={`p-3 rounded-lg border ${isToday ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{format(day, "EEE")}</span>
                        <span className="text-sm text-muted-foreground">{format(day, "MMM d")}</span>
                        {isToday && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Today</span>}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedDate(day);
                          handleAddEvent();
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {dayEvents.length > 0 ? (
                      <div className="space-y-1">
                        {dayEvents.map(event => (
                          <div key={event.id} className="text-sm p-2 rounded bg-muted/50 flex items-center gap-2">
                            <span>{event.emoji || '📅'}</span>
                            <span className="flex-1 truncate">{event.title}</span>
                            {!event.allDay && (event.startTime || event.time) && (
                              <span className="text-xs text-muted-foreground">{event.startTime || event.time}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No events</p>
                    )}
                  </div>
                );
              })}
            </div>
            
            <Button onClick={handleAddEvent} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </Card>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, "EEEE, MMM d, yyyy")}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <EventList
              events={events}
              selectedDate={selectedDate}
              onDeleteEvent={handleDeleteEvent}
              onToggleTodo={handleToggleTodo}
            />

            <Button onClick={handleAddEvent} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </Card>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">All Events</h3>
                <div className="text-sm text-muted-foreground">
                  {events.filter(e => e.type !== 'period' && e.type !== 'todo').length} events
                </div>
              </div>
              
              <div className="space-y-3">
                {events
                  .filter(e => e.type !== 'period' && e.type !== 'todo')
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map(event => (
                    <div key={event.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{event.emoji || '📅'}</span>
                            <span className="font-medium">{event.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{format(event.date, "EEE, MMM d, yyyy")}</span>
                            {!event.allDay && (event.startTime || event.time) && (
                              <>
                                <Clock className="w-3 h-3 ml-2" />
                                <span>{event.startTime || event.time}</span>
                                {event.endTime && <span>- {event.endTime}</span>}
                              </>
                            )}
                          </div>
                          {event.location && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {event.location}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {events.filter(e => e.type !== 'period' && e.type !== 'todo').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No events scheduled</p>
                )}
              </div>
            </Card>

            {/* Reminders Section */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">📋 Reminders</h3>
              <div className="space-y-2">
                {reminders.map((reminder: any) => (
                  <div key={reminder.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{reminder.emoji || '🔔'}</span>
                      <span className="font-medium">{reminder.title}</span>
                    </div>
                    {reminder.subtasks && reminder.subtasks.length > 0 && (
                      <p className="text-xs text-muted-foreground pl-7">
                        {reminder.subtasks.length} subtask{reminder.subtasks.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
                
                {reminders.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    No unscheduled reminders
                  </p>
                )}
              </div>
            </Card>

            <Button onClick={handleAddEvent} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        )}
      </main>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Choose Emoji</Label>
              <div className="flex gap-2 mt-2">
                {['📅', '🎉', '🎯', '💼', '🏋️', '🎓', '✈️', '🎂'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewEventEmoji(emoji)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                      newEventEmoji === emoji
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                        : "bg-muted hover-elevate"
                    }`}
                    data-testid={`button-event-emoji-${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                placeholder="Team meeting"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                data-testid="input-event-title"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="event-all-day">All Day Event</Label>
              <Switch
                id="event-all-day"
                checked={newEventAllDay}
                onCheckedChange={setNewEventAllDay}
                data-testid="switch-event-all-day"
              />
            </div>
            {!newEventAllDay && (
              <>
                <div>
                  <Label htmlFor="event-start-time">Start Time</Label>
                  <Input
                    id="event-start-time"
                    type="time"
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    data-testid="input-event-start-time"
                  />
                </div>
                <div>
                  <Label htmlFor="event-end-time">End Time (optional)</Label>
                  <Input
                    id="event-end-time"
                    type="time"
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    data-testid="input-event-end-time"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="event-location">Location (optional)</Label>
              <Input
                id="event-location"
                placeholder="e.g., Office, Home, Gym"
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
                data-testid="input-event-location"
              />
            </div>
            <Button onClick={handleSubmitEvent} className="w-full" data-testid="button-submit-event">
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Features Sidebar */}
      {(showMenuDialog || isClosing) && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300" style={{ opacity: isClosing ? 0 : 1 }} 
          onClick={() => { setIsClosing(true); setTimeout(() => { setShowMenuDialog(false); setIsClosing(false); }, 200); }}
        >
          <div 
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 rounded-tl-3xl rounded-bl-3xl overflow-hidden" 
            style={{ 
              transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
              transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              animation: !isClosing ? 'slideInFromRight 0.3s ease-out' : undefined
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Features</h2>
                <Button variant="ghost" size="icon" onClick={() => { setIsClosing(true); setTimeout(() => { setShowMenuDialog(false); setIsClosing(false); }, 200); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowMenuDialog(false); }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Sleep Schedule</h3>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowMenuDialog(false); }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Menstrual Cycle</h3>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowMenuDialog(false); }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Medication</h3>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowMenuDialog(false); }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Water Intake</h3>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowMenuDialog(false); }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Work</h3>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowMenuDialog(false); }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">School</h3>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { setShowMenuDialog(false); }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Journal</h3>
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Settings and Stats Icons */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center justify-around">
                  <Button variant="ghost" size="icon" onClick={() => { setShowStats(true); setShowMenuDialog(false); }} title="Statistics">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setShowSettings(true); setShowMenuDialog(false); }} title="Settings">
                    <Settings2 className="w-5 h-5 text-slate-600" />
                  </Button>
                </div>
              </div>
              
              {/* App Version & Social Links */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="text-xs text-muted-foreground text-center mb-3">
                  <p className="font-medium">App Version</p>
                  <p className="mt-1">v1.0.0</p>
                </div>
                
                {/* Social Links */}
                <div className="flex items-center justify-center gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="GitHub">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Twitter">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475 4.911 4.911 0 002.188 4.09 4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="LinkedIn">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lazy loaded stats dialog */}
      <Suspense fallback={<div />}>
        {showStats && <MonthlyStatsModal open={showStats} onOpenChange={setShowStats} />}
      </Suspense>
    </div>
  );
}
