import { useRef, useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays, addMonths, subMonths } from "date-fns";
import { getWeek } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";

const INITIAL_MONTHS_PAST = 3;
const INITIAL_MONTHS_FUTURE = 6;
const MONTHS_TO_LOAD = 2;

interface ListViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onDeleteEvent: (id: string) => void;
  onJumpToCurrentChange?: (show: boolean, scrollFn: () => void) => void;
}

export default function ListView({ events, selectedDate, onDateSelect, onDeleteEvent, onJumpToCurrentChange }: ListViewProps) {
  const today = new Date();
  const startMonth = startOfMonth(today);
  const [monthsPast, setMonthsPast] = useState(INITIAL_MONTHS_PAST);
  const [monthsFuture, setMonthsFuture] = useState(INITIAL_MONTHS_FUTURE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const monthRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const todayCardRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  const rangeStart = subMonths(startMonth, monthsPast);
  const rangeEnd = addMonths(startMonth, monthsFuture);
  const days = eachDayOfInterval({ start: rangeStart, end: endOfMonth(rangeEnd) });

  const daysWithMonthChange = days.map((day) => {
    const isNewMonth = day.getDate() === 1;
    const monthKey = format(day, "yyyy-MM");
    const monthStart = startOfMonth(day);
    const monthEnd = endOfMonth(day);
    const monthLabel = isNewMonth ? `${format(monthStart, "d MMM")} – ${format(monthEnd, "d MMM yyyy")}` : "";
    return { day, isNewMonth, monthKey, monthLabel };
  });

  // Scroll to current day on initial load, or selected month when arrow pressed
  const hasScrolledToTodayRef = useRef(false);
  const isViewingCurrentMonth = format(selectedDate, "yyyy-MM") === format(today, "yyyy-MM");

  const scrollToTodayOrMonth = useCallback((instant: boolean) => {
    const container = scrollRef.current;
    if (!container) return false;
    if (isViewingCurrentMonth && !hasScrolledToTodayRef.current) {
      const todayEl = todayCardRef.current;
      const monthEl = currentMonthRef.current;
      const target = todayEl || monthEl;
      if (target) {
        hasScrolledToTodayRef.current = true;
        target.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
        return true;
      }
    } else if (!isViewingCurrentMonth) {
      hasScrolledToTodayRef.current = true;
      const targetKey = format(selectedDate, "yyyy-MM");
      const targetEl = monthRefsMap.current.get(targetKey);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
    }
    return false;
  }, [selectedDate, isViewingCurrentMonth]);

  // Initial scroll + retries - refs may not be ready until after layout
  useEffect(() => {
    const run = () => scrollToTodayOrMonth(true);
    run();
    const t1 = setTimeout(run, 100);
    const t2 = setTimeout(run, 350);
    const t3 = setTimeout(run, 600);
    const t4 = setTimeout(run, 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [selectedDate.getFullYear(), selectedDate.getMonth(), isViewingCurrentMonth, scrollToTodayOrMonth]);

  // Track if user has scrolled past current month
  const currentMonthKey = format(today, "yyyy-MM");
  const currentMonthRef = useRef<HTMLDivElement>(null);

  const jumpToCurrentMonth = useCallback(() => {
    const container = scrollRef.current;
    const target = currentMonthRef.current;
    if (container && target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    const currentEl = currentMonthRef.current;
    if (!container || !currentEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const show = !entry.isIntersecting;
        onJumpToCurrentChange?.(show, jumpToCurrentMonth);
      },
      { root: container, rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    observer.observe(currentEl);
    return () => observer.disconnect();
  }, [days.length, onJumpToCurrentChange, jumpToCurrentMonth]);

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
  }, [loadMorePast, loadMoreFuture, days.length]);


  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2 animate-in fade-in duration-300"
      >
        <div ref={topSentinelRef} className="h-1 shrink-0" aria-hidden />
        <div className="space-y-2">
          {daysWithMonthChange.map(({ day, isNewMonth, monthKey, monthLabel }) => {
            const dayEvents = events.filter((e) => isSameDay(e.date, day));
            const allDayEvents = dayEvents.filter((e) => e.allDay);
            const timedEvents = dayEvents.filter((e) => !e.allDay);
            const isToday = isSameDay(day, today);
            const daysFromToday = differenceInDays(day, today);
            const weekNum = getWeek(day, { weekStartsOn: 1 });
            const inDaysText =
              daysFromToday === 0
                ? "Today"
                : daysFromToday === 1
                ? "Tomorrow"
                : daysFromToday === -1
                ? "Yesterday"
                : daysFromToday > 0
                ? `in ${daysFromToday}d`
                : `${Math.abs(daysFromToday)}d ago`;

            return (
              <div
                key={day.toISOString()}
                ref={isToday ? (el) => { todayCardRef.current = el; } : undefined}
                className="space-y-2"
              >
                {isNewMonth && (
                  <div
                    ref={(el) => {
                      if (el) monthRefsMap.current.set(monthKey, el);
                      if (monthKey === currentMonthKey) {
                        (currentMonthRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                      }
                    }}
                    className="flex items-center gap-2 py-2"
                  >
                    <div className="flex-1 h-px bg-muted-foreground/30" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                      {monthLabel}
                    </span>
                    <div className="flex-1 h-px bg-muted-foreground/30" />
                  </div>
                )}
                <Card
                  className={`rounded-2xl p-3 transition-all duration-200 hover:shadow-sm overflow-hidden ${
                    isToday ? "border-primary/50 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => onDateSelect(day)}
                      className={`flex shrink-0 flex-col items-center justify-center w-16 min-w-0 ${
                        isToday ? "text-primary font-semibold" : "text-foreground"
                      }`}
                    >
                      <span className="text-2xl font-bold leading-none tabular-nums">
                        {format(day, "d")}
                      </span>
                      <span className="text-xs font-medium mt-1 truncate w-full text-center">
                        {format(day, "EEE")}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 truncate w-full text-center">
                        W{weekNum} · {inDaysText}
                      </span>
                    </button>
                    <div className="flex-1 min-w-0 overflow-hidden space-y-2">
                      {allDayEvents.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">
                            All day
                          </p>
                          {allDayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                            >
                              <span>{event.emoji || "📅"}</span>
                              <span className="flex-1 truncate">{event.title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => onDeleteEvent(event.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {timedEvents.length > 0 && (
                        <div className="space-y-1">
                          {allDayEvents.length > 0 && (
                            <p className="text-[10px] text-muted-foreground font-medium uppercase">
                              Timed
                            </p>
                          )}
                          {timedEvents
                            .sort((a, b) => {
                              const ta = a.startTime || a.time || "00:00";
                              const tb = b.startTime || b.time || "00:00";
                              return ta.localeCompare(tb);
                            })
                            .map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                              >
                                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                                  {event.startTime || event.time}
                                </span>
                                <span>{event.emoji || "📅"}</span>
                                <span className="flex-1 truncate">{event.title}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 shrink-0"
                                  onClick={() => onDeleteEvent(event.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      )}
                      {dayEvents.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2">No events</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
        <div ref={bottomSentinelRef} className="h-1 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
