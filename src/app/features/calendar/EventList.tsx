import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { colors } from "@/lib/designSystem";
import type { CalendarEvent } from "@/types/calendar";

interface EventListProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDeleteEvent: (id: string) => void;
  onToggleTodo: (id: string, addToTodo: boolean) => void;
}

export default function EventList({ events, selectedDate, onDeleteEvent, onToggleTodo }: EventListProps) {
  const dayEvents = events.filter(
    (event) => format(event.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Events for {format(selectedDate, "MMM d, yyyy")}
      </h3>

      {dayEvents.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No events for this day</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {dayEvents.map((event) => (
            <Card key={event.id} className="p-4 hover-elevate" data-testid={`card-event-${event.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {!event.allDay && (event.startTime || event.time) && (
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-mono text-muted-foreground">
                        {event.startTime || event.time}
                        {event.endTime && ` - ${event.endTime}`}
                      </span>
                    </div>
                  )}
                  {event.allDay && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground font-medium">
                        All Day
                      </span>
                    </div>
                  )}
                  <p className="font-medium mb-1" data-testid={`text-event-title-${event.id}`}>{event.title}</p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground mb-2">
                      📍 {event.location}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`todo-${event.id}`}
                      checked={event.addToTodo}
                      onCheckedChange={(checked) => onToggleTodo(event.id, !!checked)}
                      data-testid={`checkbox-add-to-todo-${event.id}`}
                    />
                    <label
                      htmlFor={`todo-${event.id}`}
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Add to To Do list
                    </label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteEvent(event.id)}
                  data-testid={`button-delete-event-${event.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
