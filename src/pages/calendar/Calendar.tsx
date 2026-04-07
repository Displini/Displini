import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { SEO } from "@/components/general/SEO";
import CalendarView from "@/components/features/calendar/CalendarView";
import ListView from "@/components/features/calendar/ListView";
import DayView from "@/components/features/calendar/DayView";
import WeekView from "@/components/features/calendar/WeekView";
import { CalendarHeader, type CalendarViewMode } from "@/components/features/calendar/CalendarHeader";
import { PageHeader, FeaturesSidebar } from "@/components/general";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { addDays, isSameDay, format, addMonths, subMonths, startOfMonth, startOfWeek, addYears } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus, Trash2, Menu, Search, CalendarDays, Repeat, Bell } from "lucide-react";
import type { CalendarEvent, CalendarEventRepeat, CalendarEventAlert } from "@/types/calendar";
import { useOptimizedLocalStorage } from "@/hooks/useLocalStorage";

// Lazy load heavy dialog
const MonthlyStatsModal = lazy(() => import("@/components/general/MonthlyStatsModal"));

interface CyclePeriod {
  id: string;
  startDate: string;
  cycleLength: number;
  periodDuration?: number;
}

type ViewMode = CalendarViewMode;

export default function Calendar() {
  const location = useLocation();
  const [showStats, setShowStats] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showTodosInCalendar, setShowTodosInCalendar] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventAllDay, setNewEventAllDay] = useState(false);
  const [newEventEmoji, setNewEventEmoji] = useState("📅");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDate, setNewEventDate] = useState<Date>(() => new Date());
  const [newEventRepeat, setNewEventRepeat] = useState<CalendarEventRepeat>("none");
  const [newEventAlert, setNewEventAlert] = useState<CalendarEventAlert>("none");
  const [listShowJumpToCurrent, setListShowJumpToCurrent] = useState(false);
  const listJumpToCurrentRef = useRef<(() => void) | null>(null);
  const [monthShowJumpToCurrent, setMonthShowJumpToCurrent] = useState(false);
  const monthJumpToCurrentRef = useRef<(() => void) | null>(null);

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

  // Always reset to current date when visiting or refreshing the calendar
  useEffect(() => {
    if (location.pathname === "/app/calendar") {
      setSelectedDate(new Date());
    }
  }, [location.pathname]);

  // Reset jump buttons when switching views
  useEffect(() => {
    if (viewMode !== "list") setListShowJumpToCurrent(false);
    if (viewMode !== "month") setMonthShowJumpToCurrent(false);
  }, [viewMode]);

  // Reset add-event form when dialog opens and prefill with selectedDate
  useEffect(() => {
    if (isAddDialogOpen) {
      setNewEventDate(selectedDate);
      setNewEventRepeat("none");
      setNewEventAlert("none");
    }
  }, [isAddDialogOpen, selectedDate]);

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
      const alertMins = newEventAlert === "none" ? undefined : parseInt(newEventAlert, 10);

      const createEvent = (date: Date, idSuffix = ""): CalendarEvent => ({
        id: `${Date.now()}${idSuffix}`,
        date,
        title: newEventTitle,
        startTime: newEventAllDay ? undefined : newEventStartTime,
        endTime: newEventAllDay ? undefined : newEventEndTime,
        allDay: newEventAllDay,
        emoji: newEventEmoji,
        addToTodo: false,
        type: "event",
        location: newEventLocation || undefined,
        repeat: newEventRepeat !== "none" ? newEventRepeat : undefined,
        alertMinutesBefore: alertMins,
      });

      const eventsToAdd: CalendarEvent[] = [];

      if (newEventRepeat === "none") {
        eventsToAdd.push(createEvent(newEventDate));
      } else {
        const endDate = addMonths(newEventDate, 3);
        let current = new Date(newEventDate);
        let i = 0;
        while (current <= endDate && i < 100) {
          eventsToAdd.push(createEvent(new Date(current), `-${i}`));
          if (newEventRepeat === "daily") current = addDays(current, 1);
          else if (newEventRepeat === "weekly") current = addDays(current, 7);
          else if (newEventRepeat === "monthly") current = addMonths(current, 1);
          else if (newEventRepeat === "yearly") current = addYears(current, 1);
          i++;
        }
      }

      setEvents((prev) => [...prev, ...eventsToAdd]);
      setNewEventTitle("");
      setNewEventStartTime("");
      setNewEventEndTime("");
      setNewEventAllDay(false);
      setNewEventEmoji("📅");
      setNewEventLocation("");
      setNewEventDate(new Date());
      setNewEventRepeat("none");
      setNewEventAlert("none");
      setIsAddDialogOpen(false);
    }
  }, [
    newEventTitle, newEventStartTime, newEventEndTime, newEventAllDay, newEventEmoji, newEventLocation,
    newEventDate, newEventRepeat, newEventAlert,
  ]);

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
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <SEO
        title="Calendar"
        description="View and manage your schedule"
        noindex={true}
      />
      {/* Fixed Header - never scrolls away */}
      <PageHeader fixed>
        {/* Top Row - Menu | List Day Week Month | Search */}
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => setShowMenuDialog(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex flex-1 justify-center gap-1.5">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-full"
          >
            List
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
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
            className="rounded-full"
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
            className="rounded-full"
          >
            Month
          </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Date pills - hidden for List (month nav in header) and Month (scrollable in content) */}
        {viewMode !== "month" && viewMode !== "list" && (
          <div className="flex justify-center w-full">
            <CalendarHeader
              viewMode={viewMode}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        )}
        {/* List view: month/year with arrows, Jump to current month centered below */}
        {viewMode === "list" && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(subMonths(startOfMonth(selectedDate), 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground min-w-[140px] text-center">
                {format(selectedDate, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(addMonths(startOfMonth(selectedDate), 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {listShowJumpToCurrent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => listJumpToCurrentRef.current?.()}
                className="gap-1.5 text-xs"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Jump to current month
              </Button>
            )}
          </div>
        )}

        {/* Month view: Jump to current month in header (when scrolled past) */}
        {viewMode === "month" && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <span className="text-sm font-medium text-muted-foreground">
              {format(selectedDate, "MMMM yyyy")}
            </span>
            {monthShowJumpToCurrent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => monthJumpToCurrentRef.current?.()}
                className="gap-1.5 text-xs"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Jump to current month
              </Button>
            )}
          </div>
        )}

        {/* Day view: Jump to today in header (when not on today) */}
        {viewMode === "day" && !isSameDay(selectedDate, new Date()) && (
          <div className="flex justify-center mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className="gap-1.5 text-xs"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Jump to today
            </Button>
          </div>
        )}

        {/* Week view: Jump to current week in header (when not on current week) */}
        {viewMode === "week" && (() => {
          const today = new Date();
          const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
          const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
          const isCurrentWeek = selectedWeekStart.getTime() === todayWeekStart.getTime();
          return !isCurrentWeek ? (
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="gap-1.5 text-xs"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Jump to current week
              </Button>
            </div>
          ) : null;
        })()}
      </PageHeader>

      <main
        className={`flex-1 min-h-0 px-4 py-6 pb-20 ${viewMode === "list" ? "flex flex-col overflow-hidden" : "overflow-auto space-y-6"}`}
        style={{ paddingTop: viewMode === "month" ? "120px" : viewMode === "list" ? "144px" : "200px" }}
      >

        <AnimatePresence mode="wait">
          {viewMode === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex-1 min-h-0 flex flex-col"
            >
              <ListView
                events={events.filter((e) => e.type !== "period" && e.type !== "todo")}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onDeleteEvent={handleDeleteEvent}
                onJumpToCurrentChange={(show, scrollFn) => {
                  setListShowJumpToCurrent(show);
                  listJumpToCurrentRef.current = scrollFn;
                }}
              />
            </motion.div>
          )}

          {viewMode === "day" && (
            <motion.div
              key="day"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <DayView
                events={events.filter((e) => e.type !== "period" && e.type !== "todo")}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onDeleteEvent={handleDeleteEvent}
              />
            </motion.div>
          )}

          {viewMode === "week" && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <WeekView
                events={events.filter((e) => e.type !== "period" && e.type !== "todo")}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onDeleteEvent={handleDeleteEvent}
              />
            </motion.div>
          )}

          {viewMode === "month" && (
            <motion.div
              key="month"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <CalendarView
                events={events}
                onDateSelect={setSelectedDate}
                onDeleteEvent={handleDeleteEvent}
                onToggleTodo={handleToggleTodo}
                selectedDate={selectedDate}
                onJumpToCurrentChange={(show, scrollFn) => {
                  setMonthShowJumpToCurrent(show);
                  monthJumpToCurrentRef.current = scrollFn;
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input placeholder="Search events..." className="w-full" />
            <p className="text-xs text-muted-foreground mt-2">Quick search for events and reminders</p>
          </div>
        </DialogContent>
      </Dialog>

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
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(newEventDate, "EEE, MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    mode="single"
                    selected={newEventDate}
                    onSelect={(d) => d && setNewEventDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
            <div>
              <Label className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Repeat
              </Label>
              <Select value={newEventRepeat} onValueChange={(v) => setNewEventRepeat(v as CalendarEventRepeat)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alert
              </Label>
              <Select value={newEventAlert} onValueChange={(v) => setNewEventAlert(v as CalendarEventAlert)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="0">At time of event</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmitEvent} className="w-full" data-testid="button-submit-event">
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Features Sidebar - slides from left */}
      <FeaturesSidebar
        isOpen={showMenuDialog}
        onClose={() => { setIsClosing(true); setTimeout(() => { setShowMenuDialog(false); setIsClosing(false); }, 200); }}
        isClosing={isClosing}
        onStatsClick={() => { setShowStats(true); setShowMenuDialog(false); }}
        onSettingsClick={() => { setShowSettings(true); setShowMenuDialog(false); }}
      />

      {/* Lazy loaded stats dialog */}
      <Suspense fallback={<div />}>
        {showStats && <MonthlyStatsModal open={showStats} onOpenChange={setShowStats} />}
      </Suspense>
    </div>
  );
}
