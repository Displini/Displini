import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { CalendarEvent } from "@/types/calendar";

interface WeekViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDeleteEvent: (id: string) => void;
}

export default function WeekView({ events, selectedDate, onDateChange, onDeleteEvent }: WeekViewProps) {
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const prevDateRef = useRef(selectedDate);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const touchStartX = useRef(0);

  // Animate when date changes via carousel/header (not from swipe)
  useEffect(() => {
    if (selectedDate.getTime() === prevDateRef.current.getTime()) return;
    const prev = prevDateRef.current;
    prevDateRef.current = selectedDate;
    if (selectedDate > prev) {
      setSlideDir("left");
    } else {
      setSlideDir("right");
    }
    const id = setTimeout(() => setSlideDir(null), 350);
    return () => clearTimeout(id);
  }, [selectedDate]);

  const handlePointerStart = (clientX: number) => {
    touchStartX.current = clientX;
  };

  const handlePointerEnd = (clientX: number) => {
    const deltaX = clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setSlideDir("right");
        onDateChange(subDays(selectedDate, 7));
      } else {
        setSlideDir("left");
        onDateChange(addDays(selectedDate, 7));
      }
      setTimeout(() => setSlideDir(null), 350);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handlePointerStart(e.clientX);
    const onMouseUp = (up: MouseEvent) => {
      handlePointerEnd(up.clientX);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mouseup", onMouseUp);
  };

  const getEventsForDayHour = (day: Date, hour: number) =>
    events.filter((e) => {
      if (!isSameDay(e.date, day) || e.allDay) return false;
      const start = e.startTime || e.time || "00:00";
      const startH = parseInt(start.split(":")[0], 10);
      return startH === hour;
    });

  const allDayForDay = (day: Date) =>
    events.filter((e) => isSameDay(e.date, day) && e.allDay);

  const slideClass =
    slideDir === "left"
      ? "animate-in slide-in-from-left-4 fade-in duration-300"
      : slideDir === "right"
      ? "animate-in slide-in-from-right-4 fade-in duration-300"
      : "animate-in fade-in duration-300";

  return (
    <div
      className={`space-y-4 touch-pan-y ${slideClass}`}
      onTouchStart={(e) => handlePointerStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handlePointerEnd(e.changedTouches[0].clientX)}
      onMouseDown={handleMouseDown}
    >
      {days.some((d) => allDayForDay(d).length > 0) && (
        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">All day</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day) => {
              const evs = allDayForDay(day);
              return (
                <div key={day.toISOString()} className="shrink-0 w-28">
                  <p className={`text-xs font-medium mb-1 ${isSameDay(day, new Date()) ? "text-primary" : ""}`}>
                    {format(day, "EEE d")}
                  </p>
                  <div className="space-y-1">
                    {evs.length > 0 ? evs.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-1 p-1.5 rounded bg-muted/50 text-xs"
                      >
                        <span>{event.emoji || "📅"}</span>
                        <span className="flex-1 truncate">{event.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => onDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    )) : <p className="text-[10px] text-muted-foreground py-1">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border border-border transition-shadow duration-200 hover:shadow-md">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-8 border-b border-border bg-muted/30">
            <div className="p-2" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-2 text-center text-xs font-medium border-l border-border ${
                  isSameDay(day, new Date()) ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <div>{format(day, "EEE")}</div>
                <div className="text-base font-bold">{format(day, "d")}</div>
              </div>
            ))}
          </div>
          {hours.map((h) => (
            <div key={h} className="grid grid-cols-8 border-b border-border/50 min-h-[44px]">
              <div className="flex justify-end pr-2 pt-1 text-[10px] font-mono text-muted-foreground bg-muted/20">
                {format(new Date(2000, 0, 1, h), "HH:mm")}
              </div>
              {days.map((day) => {
                const hourEvents = getEventsForDayHour(day, h);
                return (
                  <div
                    key={`${day.toISOString()}-${h}`}
                    className={`relative min-h-[44px] p-0.5 border-l border-border/50 ${
                      isSameDay(day, new Date()) ? "bg-primary/5" : ""
                    }`}
                  >
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-[10px] p-1 rounded bg-primary/15 border border-primary/20 truncate flex items-center gap-1"
                      >
                        <span>{event.emoji || "📅"}</span>
                        <span className="flex-1 truncate">{event.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 shrink-0"
                          onClick={() => onDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
