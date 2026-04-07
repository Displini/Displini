import { format, addMonths, subMonths, startOfMonth, getWeek, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isYesterday, isTomorrow } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export type CalendarViewMode = "list" | "day" | "week" | "month";

interface CalendarHeaderProps {
  viewMode: CalendarViewMode;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

function buildDates(center: Date) {
  return [
    subDays(center, 3),
    subDays(center, 2),
    subDays(center, 1),
    center,
    addDays(center, 1),
    addDays(center, 2),
    addDays(center, 3),
  ];
}

export function CalendarHeader({ viewMode, selectedDate, onDateChange, onMonthChange }: CalendarHeaderProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const displayMonth = startOfMonth(selectedDate);
  const weekNum = getWeek(selectedDate, { weekStartsOn: 1 });
  const dates = buildDates(selectedDate);

  const handlePrev = () => {
    if (viewMode === "list" || viewMode === "month") {
      const next = subMonths(displayMonth, 1);
      onDateChange(next);
      onMonthChange?.(next);
    } else if (viewMode === "week") {
      onDateChange(subDays(selectedDate, 7));
    } else {
      onDateChange(subDays(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "list" || viewMode === "month") {
      const next = addMonths(displayMonth, 1);
      onDateChange(next);
      onMonthChange?.(next);
    } else if (viewMode === "week") {
      onDateChange(addDays(selectedDate, 7));
    } else {
      onDateChange(addDays(selectedDate, 1));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setCalendarOpen(false);
    }
  };

  const getLabel = () => {
    if (viewMode === "list") {
      const formatted = format(selectedDate, "MMMM d, yyyy");
      const today = new Date();
      if (isSameDay(selectedDate, today)) return `Today, ${formatted}`;
      if (isYesterday(selectedDate)) return `Yesterday, ${formatted}`;
      if (isTomorrow(selectedDate)) return `Tomorrow, ${formatted}`;
      return formatted;
    }
    if (viewMode === "month") {
      return format(selectedDate, "MMMM yyyy");
    }
    if (viewMode === "week") {
      return `Week ${weekNum} · ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")}`;
    }
    return format(selectedDate, "EEEE, MMM d");
  };

  const handleDateClick = (date: Date) => {
    if (!isSameDay(date, selectedDate)) onDateChange(date);
  };

  const todayDate = new Date();
  const isTodayDate = (d: Date) => isSameDay(d, todayDate);

  const showDatePills = viewMode === "list" || viewMode === "day" || viewMode === "week";
  const pillDates = viewMode === "week"
    ? eachDayOfInterval({ start: startOfWeek(selectedDate, { weekStartsOn: 1 }), end: endOfWeek(selectedDate, { weekStartsOn: 1 }) })
    : dates;
  const showWeekBelow = viewMode === "day" || viewMode === "week";

  return (
    <div className="w-full flex flex-col items-center">
      {/* Date pills (only for List and Day - not Month/Week) */}
      {showDatePills && (
        <div className="flex gap-2 sm:gap-3 justify-center overflow-x-auto py-1 w-full max-w-full">
          {pillDates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isTodayDate(date);
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleDateClick(date)}
                className="relative flex flex-col items-center justify-center w-12 h-10 rounded-full shrink-0 transition-all active:scale-95"
              >
                <span className={`text-[9px] font-medium leading-tight ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                  {format(date, "EEE")}
                </span>
                <span className={`text-sm font-bold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {format(date, "d")}
                </span>
                {isToday && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-muted-foreground" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Full date row: prev | Wednesday, Feb 4 | next - centered */}
      <div className={`flex flex-col items-center gap-0 w-full ${showDatePills ? "mt-3" : ""}`}>
        <div className="flex items-center justify-center gap-1 sm:gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={handlePrev} className="h-8 w-8 p-0 shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md transition-colors min-w-[140px] sm:min-w-[180px] text-center"
              >
                {getLabel()}
              </button>
            </SheetTrigger>
            <SheetContent side="top" className="h-screen w-full rounded-none border-0 p-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto p-4 pt-16 pb-8">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleCalendarSelect}
                  defaultMonth={selectedDate}
                  className="mx-auto"
                />
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0 shrink-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {/* Week 6 below the date - centered (Day & Week view) */}
        {showWeekBelow && (
          <span className="text-xs font-medium text-muted-foreground mt-1">Week {weekNum}</span>
        )}
      </div>
    </div>
  );
}
