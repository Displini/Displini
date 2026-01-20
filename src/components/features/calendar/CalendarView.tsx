import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onAddEvent: () => void;
  selectedDate: Date;
}

export default function CalendarView({ events, onDateSelect, onAddEvent, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const hasEvent = (date: Date) => {
    return events.some(event => isSameDay(event.date, date));
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasEvents = hasEvent(day);

            return (
              <button
                key={day.toString()}
                onClick={() => onDateSelect(day)}
                className={`aspect-square rounded-md text-sm font-medium relative hover-elevate ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "ring-2 ring-primary ring-inset"
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
      </Card>

      <Button onClick={onAddEvent} className="w-full" data-testid="button-add-event">
        <Plus className="w-4 h-4 mr-2" />
        Add Event
      </Button>
    </div>
  );
}
