import { format, isSameDay, addDays, subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { CalendarEvent } from "@/types/calendar";

interface DayViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDeleteEvent: (id: string) => void;
}

export default function DayView({ events, selectedDate, onDateChange, onDeleteEvent }: DayViewProps) {
  const [now, setNow] = useState(new Date());
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const prevDateRef = useRef(selectedDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isToday = isSameDay(selectedDate, new Date());
  const dayEvents = events.filter((e) => isSameDay(e.date, selectedDate));
  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);
  const touchStartX = useRef(0);

  // Animate when date changes via carousel/header (not from swipe)
  useEffect(() => {
    if (isSameDay(prevDateRef.current, selectedDate)) return;
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

  // Live update every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const pxPerHour = 64;

  const handlePointerStart = (clientX: number) => {
    touchStartX.current = clientX;
  };

  const handlePointerEnd = (clientX: number) => {
    const deltaX = clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setSlideDir("right");
        onDateChange(subDays(selectedDate, 1));
      } else {
        setSlideDir("left");
        onDateChange(addDays(selectedDate, 1));
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
      {allDayEvents.length > 0 && (
        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">All day</p>
          <div className="space-y-1">
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
                  className="h-6 w-6 p-0"
                  onClick={() => onDeleteEvent(event.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="relative" style={{ minHeight: 24 * (pxPerHour - 4) }}>
        {hours.map((h) => {
          const isCurrentHour = isToday && h === now.getHours();
          const rowHeight = pxPerHour - 4;
          const minutesIntoRow = isCurrentHour ? now.getMinutes() : 0;
          const lineOffsetPx = (minutesIntoRow / 60) * rowHeight;
          return (
          <div
            key={h}
            className="relative flex gap-3 py-1 border-b border-border/50"
            style={{ minHeight: rowHeight }}
          >
            {isCurrentHour ? (
              /* Time + line on same row, positioned at current minutes into hour */
              <div
                className="absolute left-0 right-0 flex items-center gap-2 z-20 pointer-events-none"
                style={{ top: `${lineOffsetPx}px` }}
              >
                <span
                  className="text-xs font-mono font-semibold w-12 shrink-0 text-right"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  {format(now, "HH:mm")}
                </span>
                <div
                  className="flex-1 h-[3px] rounded-full ml-1"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                />
              </div>
            ) : null}
            <span
              className={`text-xs font-mono w-12 shrink-0 ${isCurrentHour ? "invisible" : "text-muted-foreground"}`}
            >
              {format(new Date(2000, 0, 1, h), "HH:mm")}
            </span>
            <div className="flex-1 relative min-h-[48px]">
              {timedEvents
                .filter((e) => {
                  const start = e.startTime || e.time || "00:00";
                  const startH = parseInt(start.split(":")[0], 10);
                  return startH === h;
                })
                .map((event) => (
                  <div
                    key={event.id}
                    className="absolute left-0 right-2 py-2 px-2 rounded-lg bg-primary/15 border border-primary/30 text-sm flex items-center gap-2"
                    style={{
                      top: 4,
                      minHeight: pxPerHour - 12,
                    }}
                  >
                    <span>{event.emoji || "📅"}</span>
                    <span className="flex-1 truncate font-medium">{event.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.startTime || event.time}
                      {event.endTime && ` – ${event.endTime}`}
                    </span>
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
          </div>
          );
        })}
      </div>

    </div>
  );
}
