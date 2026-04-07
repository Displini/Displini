import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Trash2, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getWeek, startOfWeek, endOfWeek } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onDeleteEvent?: (id: string) => void;
  onToggleTodo?: (id: string, addToTodo: boolean) => void;
  selectedDate: Date;
  onJumpToCurrentChange?: (show: boolean, scrollFn: () => void) => void;
}

const INITIAL_MONTHS_PAST = 3;
const INITIAL_MONTHS_FUTURE = 6;
const MONTHS_TO_LOAD = 3;
const weekStartsOn = 0;

function MonthGrid({ month, events, expandedDate, onDayClick, onDeleteEvent, hasEvent, isCurrentMonth, showTopBorder }: {
  month: Date;
  events: CalendarEvent[];
  expandedDate: string | null;
  onDayClick: (day: Date) => void;
  onDeleteEvent?: (id: string) => void;
  hasEvent: (d: Date) => boolean;
  isCurrentMonth: (d: Date) => boolean;
  showTopBorder: boolean;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthRangeLabel = `${format(monthStart, "d MMM")} – ${format(monthEnd, "d MMM yyyy")}`;
  const calStart = startOfWeek(monthStart, { weekStartsOn });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7));

  return (
    <div className={`animate-in fade-in duration-300 ${showTopBorder ? "pt-6 mt-6 border-t border-muted-foreground/30" : ""}`}>
      <h3 className="text-base font-semibold text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
        {monthRangeLabel}
      </h3>
      <div className="grid grid-cols-8 gap-1 mb-2">
        <div className="text-center text-[10px] font-medium text-muted-foreground py-2">Wk</div>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((weekDays) => {
          const weekNum = getWeek(weekDays[0], { weekStartsOn });
          const weekKey = weekDays[0].toISOString();
          const weekHasExpanded = weekDays.some((d) => format(d, "yyyy-MM-dd") === expandedDate);
          const expandedDay = expandedDate ? weekDays.find((d) => format(d, "yyyy-MM-dd") === expandedDate) : null;
          const dayEvents = expandedDate && onDeleteEvent
            ? events.filter((e) => format(e.date, "yyyy-MM-dd") === expandedDate)
            : [];

          return (
            <div key={weekKey} className="space-y-0">
              <div className="grid grid-cols-8 gap-1 transition-transform duration-200">
                <div className="text-center text-[10px] font-mono text-muted-foreground flex items-center justify-center">
                  {weekNum}
                </div>
                {weekDays.map((day) => {
                  const isSelected = format(day, "yyyy-MM-dd") === expandedDate;
                  const isToday = isSameDay(day, new Date());
                  const hasEvents = hasEvent(day);
                  return (
                    <button
                      key={day.toString()}
                      onClick={() => onDayClick(day)}
                      className={`aspect-square rounded-md text-sm font-medium relative transition-all duration-200 hover:scale-105 active:scale-95 ${
                        !isCurrentMonth(day) ? "text-muted-foreground/50" : ""
                      } ${
                        isSelected
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                          : isToday
                          ? "ring-2 ring-primary ring-inset text-primary"
                          : ""
                      }`}
                      data-testid={`button-date-${format(day, "yyyy-MM-dd")}`}
                    >
                      {format(day, "d")}
                      {hasEvents && (
                        <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                          isSelected ? "bg-primary-foreground" : "bg-chart-1"
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
              {weekHasExpanded && expandedDay && (
                <div className="col-span-full overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="mt-2 mb-4 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{format(expandedDay, "EEEE, MMM d")}</span>
                      <Button variant="ghost" size="sm" onClick={() => onDayClick(expandedDay)} className="h-6 px-2">
                        <ChevronDown className="w-4 h-4 rotate-180" />
                      </Button>
                    </div>
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No events</p>
                    ) : (
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-background text-sm"
                          >
                            <span>{event.emoji || "📅"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{event.title}</p>
                              {!event.allDay && (event.startTime || event.time) && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.startTime || event.time}
                                  {event.endTime && ` – ${event.endTime}`}
                                </p>
                              )}
                            </div>
                            {onDeleteEvent && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => onDeleteEvent(event.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarView({ events, onDateSelect, onDeleteEvent, onToggleTodo, selectedDate, onJumpToCurrentChange }: CalendarViewProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [monthsPast, setMonthsPast] = useState(INITIAL_MONTHS_PAST);
  const [monthsFuture, setMonthsFuture] = useState(INITIAL_MONTHS_FUTURE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const today = new Date();
  const startMonth = startOfMonth(today);
  const rangeStart = subMonths(startMonth, monthsPast);
  const months = Array.from(
    { length: monthsPast + monthsFuture + 1 },
    (_, i) => addMonths(rangeStart, i)
  );
  const currentMonthIndex = months.findIndex(
    (m) => m.getMonth() === today.getMonth() && m.getFullYear() === today.getFullYear()
  );
  const currentMonthRef = useRef<HTMLDivElement>(null);

  const hasEvent = (date: Date) => events.some((e) => isSameDay(e.date, date));

  const handleDayClick = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    setExpandedDate((prev) => (prev === key ? null : key));
    onDateSelect(day);
  };

  const isCurrentMonth = (month: Date) => (d: Date) => d.getMonth() === month.getMonth();

  const jumpToCurrentMonth = useCallback((instant = false) => {
    const container = scrollRef.current;
    const target = currentMonthRef.current;
    if (container && target) {
      target.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
    }
  }, []);

  const loadMorePast = useCallback(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    const container = scrollRef.current;
    if (container) {
      const oldScrollHeight = container.scrollHeight;
      const oldScrollTop = container.scrollTop;
      setMonthsPast((p) => p + MONTHS_TO_LOAD);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
          isLoadingRef.current = false;
        });
      });
    } else {
      setMonthsPast((p) => p + MONTHS_TO_LOAD);
      isLoadingRef.current = false;
    }
  }, []);

  const loadMoreFuture = useCallback(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setMonthsFuture((p) => p + MONTHS_TO_LOAD);
    requestAnimationFrame(() => {
      isLoadingRef.current = false;
    });
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const topObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMorePast();
      },
      { root: container, rootMargin: "100px", threshold: 0 }
    );

    const bottomObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreFuture();
      },
      { root: container, rootMargin: "100px", threshold: 0 }
    );

    if (topSentinelRef.current) topObserver.observe(topSentinelRef.current);
    if (bottomSentinelRef.current) bottomObserver.observe(bottomSentinelRef.current);

    return () => {
      topObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, [loadMorePast, loadMoreFuture, months.length]);

  // Track if user has scrolled past current month
  useEffect(() => {
    const container = scrollRef.current;
    const currentEl = currentMonthRef.current;
    if (!container || !currentEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        onJumpToCurrentChange?.(!entry.isIntersecting, jumpToCurrentMonth);
      },
      { root: container, rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    observer.observe(currentEl);
    return () => observer.disconnect();
  }, [months.length, onJumpToCurrentChange, jumpToCurrentMonth]);

  // Set scroll position so current month is in view from the start - retries until refs/layout ready
  const hasInitializedScrollRef = useRef(false);
  useEffect(() => {
    if (currentMonthIndex < 0) return;
    const initScroll = () => {
      if (currentMonthRef.current && scrollRef.current && !hasInitializedScrollRef.current) {
        hasInitializedScrollRef.current = true;
        jumpToCurrentMonth(true);
      }
    };
    initScroll();
    const t1 = setTimeout(initScroll, 100);
    const t2 = setTimeout(initScroll, 350);
    const t3 = setTimeout(initScroll, 600);
    const t4 = setTimeout(initScroll, 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [currentMonthIndex, jumpToCurrentMonth]);

  return (
    <div className="space-y-4">
      <div ref={scrollRef} className="overflow-y-auto max-h-[65vh] space-y-2 pr-2">
        <div ref={topSentinelRef} className="h-1 shrink-0" aria-hidden />
        {months.map((month, index) => (
          <div
            key={month.toISOString()}
            ref={index === currentMonthIndex ? currentMonthRef : undefined}
          >
            <MonthGrid
              month={month}
              events={events}
              expandedDate={expandedDate}
              onDayClick={handleDayClick}
              onDeleteEvent={onDeleteEvent}
              hasEvent={hasEvent}
              isCurrentMonth={isCurrentMonth(month)}
              showTopBorder={index > 0}
            />
          </div>
        ))}
        <div ref={bottomSentinelRef} className="h-1 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
