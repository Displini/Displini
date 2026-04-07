import { format, addDays, subDays, addMonths, subMonths, startOfMonth, isSameDay, differenceInDays, isYesterday, isTomorrow } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useHeaderCollapsed } from "@/contexts/HeaderCollapseContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect, useRef } from "react";

interface DateCarouselProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDateChangeStart?: () => void;
  onDateChangeEnd?: () => void;
  completedCount?: number;
  totalCount?: number;
  getProgressForDate?: (date: Date) => { completed: number; total: number };
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  /** When true, date text is not clickable (no calendar sheet) */
  disableDateClick?: boolean;
}

export function DateCarousel({ selectedDate, onDateChange, onDateChangeStart, onDateChangeEnd, completedCount = 0, totalCount = 0, getProgressForDate, leftSlot, rightSlot, disableDateClick = false }: DateCarouselProps) {
  const [isSticky, setIsSticky] = useState(false);
  const headerCollapsed = useHeaderCollapsed();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const prevDateRef = useRef(selectedDate);
  const touchStartX = useRef(0);

  // Load sticky setting from localStorage
  useEffect(() => {
    const savedSticky = localStorage.getItem("stickyDateCarousel") === "true";
    setIsSticky(savedSticky);

    const handleSettingChange = () => {
      const newSticky = localStorage.getItem("stickyDateCarousel") === "true";
      setIsSticky(newSticky);
    };

    window.addEventListener('stickyCarouselSettingChanged', handleSettingChange);
    return () => window.removeEventListener('stickyCarouselSettingChanged', handleSettingChange);
  }, []);

  // Always generate dates with selected date in the middle (3 before, current, 3 after)
  const dates = [
    subDays(selectedDate, 3),
    subDays(selectedDate, 2),
    subDays(selectedDate, 1),
    selectedDate,
    addDays(selectedDate, 1),
    addDays(selectedDate, 2),
    addDays(selectedDate, 3),
  ];

  const handlePrevious = () => {
    onDateChangeStart?.();
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNext = () => {
    onDateChangeStart?.();
    onDateChange(addDays(selectedDate, 1));
  };

  const handleDateClick = (date: Date) => {
    if (!isSameDay(date, selectedDate)) {
      onDateChangeStart?.();
      onDateChange(date);
    }
  };

  const handleCalendarDaySelect = (date: Date | undefined) => {
    if (date) {
      onDateChangeStart?.();
      onDateChange(date);
      setCalendarOpen(false);
    }
  };

  const isTodayDate = (date: Date) => isSameDay(date, new Date());
  const today = new Date();
  const daysFromToday = differenceInDays(selectedDate, today);
  const showJumpToToday = Math.abs(daysFromToday) >= 3;

  const getDateLabel = (date: Date) => format(date, "EEE");

  const getFullDateLabel = (date: Date) => {
    const formatted = format(date, "MMMM d, yyyy");
    if (isTodayDate(date)) return `Today, ${formatted}`;
    if (isYesterday(date)) return `Yesterday, ${formatted}`;
    if (isTomorrow(date)) return `Tomorrow, ${formatted}`;
    return formatted;
  };


  const handleJumpToToday = () => {
    if (!isSameDay(selectedDate, today)) {
      onDateChangeStart?.();
      onDateChange(today);
    }
  };

  // Notify parent when date has changed (for content animation)
  useEffect(() => {
    if (!isSameDay(prevDateRef.current, selectedDate)) {
      prevDateRef.current = selectedDate;
      onDateChangeEnd?.();
    }
  }, [selectedDate, onDateChangeEnd]);

  const handlePointerStart = (clientX: number) => {
    touchStartX.current = clientX;
  };

  const handlePointerEnd = (clientX: number) => {
    const deltaX = clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        onDateChangeStart?.();
        onDateChange(subDays(selectedDate, 1));
      } else {
        onDateChangeStart?.();
        onDateChange(addDays(selectedDate, 1));
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handlePointerStart(e.clientX);
    const onMouseUp = (up: MouseEvent) => {
      handlePointerEnd(up.clientX);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      className={`w-full mb-2 transition-shadow duration-200 overflow-visible ${isSticky ? 'sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border shadow-sm' : ''}`}
      onTouchStart={(e) => handlePointerStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handlePointerEnd(e.changedTouches[0].clientX)}
      onMouseDown={handleMouseDown}
    >
      {/* Date pills carousel - menu + pills on same row */}
      <div className="flex items-center gap-2 sm:gap-3 justify-center overflow-visible">
        {leftSlot}
        <div className="flex gap-2 sm:gap-3 flex-1 justify-center items-center min-w-0 overflow-visible py-1">
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isTodayDate(date);
            const dateLabel = getDateLabel(date);
            const progressData = getProgressForDate ? getProgressForDate(date) : { completed: completedCount, total: totalCount };
            const progress = progressData.total > 0 ? progressData.completed / progressData.total : 0;
            const showProgress = true;

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className="flex flex-col items-center cursor-pointer flex-shrink-0 active:scale-95 transition-transform duration-150"
              >
                <div
                  className={`
                    relative w-14 h-12 rounded-full flex flex-col items-center justify-center overflow-visible
                    transition-all duration-300 ease-in-out
                    ${isSelected ? 'scale-110' : ''}
                  `}
                >
                  {showProgress && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 56 48" preserveAspectRatio="none">
                      <rect x="4" y="4" width="48" height="40" rx="20" ry="20" stroke="currentColor" strokeWidth="2.5" fill="none" className="stroke-primary/20" />
                      <rect
                        x="4" y="4" width="48" height="40"
                        rx="20" ry="20"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        strokeDasharray={142}
                        strokeDashoffset={142 - progress * 142}
                        strokeLinecap="round"
                        className="stroke-primary transition-all duration-300"
                      />
                    </svg>
                  )}
                  <div className="relative z-10 flex flex-col items-center justify-center gap-0 px-0.5">
                    <span className={`text-[9px] font-medium leading-tight truncate max-w-full ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {dateLabel}
                    </span>
                    <span className={`text-base font-bold leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {format(date, 'd')}
                    </span>
                  </div>
                  {isToday && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-muted-foreground" aria-hidden />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {rightSlot}
      </div>

      {/* Full date with arrows - January 31, 2026 [Prev] [Next] - collapses on scroll */}
      <div
        className={`flex items-center justify-center gap-1 sm:gap-2 overflow-hidden transition-[max-height,margin,opacity] duration-300 ease-in-out ${
          headerCollapsed ? 'max-h-0 mt-0 pb-0 opacity-0' : 'max-h-16 mt-8 pb-1 opacity-100'
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
          {disableDateClick ? (
            <span className="text-sm font-medium text-muted-foreground px-2 py-1 min-w-[140px] sm:min-w-[200px] text-center inline-block">
              {getFullDateLabel(selectedDate)}
            </span>
          ) : (
            <SheetTrigger asChild>
              <button
                type="button"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md transition-colors min-w-[140px] sm:min-w-[200px]"
              >
                {getFullDateLabel(selectedDate)}
              </button>
            </SheetTrigger>
          )}
          <SheetContent side="top" className="h-screen w-full rounded-none border-0 p-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-4 pt-16 pb-8">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarDaySelect}
                defaultMonth={selectedDate}
                getProgressForDate={getProgressForDate}
                numberOfMonths={12}
                hideNavigation
                startMonth={subMonths(startOfMonth(selectedDate), 6)}
                endMonth={addMonths(startOfMonth(selectedDate), 6)}
                classNames={{
                  months: "flex flex-col [&>*:not(:first-child)]:-mt-8",
                  month: "space-y-4 bg-card rounded-xl shadow-md border border-border p-4 pb-6 relative",
                  month_caption: "text-sm font-semibold text-center py-3 px-2",
                  nav: "hidden",
                  day: "h-auto p-0 font-normal aria-selected:opacity-100",
                  day_selected: "text-primary font-semibold",
                  day_today: "text-primary font-semibold",
                  day_outside: "text-muted-foreground opacity-50",
                }}
                components={{
                  DayButton: getProgressForDate ? (props) => {
                    const { day, modifiers, ...buttonProps } = props;
                    const date = day.date;
                    const progressData = getProgressForDate(date);
                    const progress = progressData.total > 0 ? progressData.completed / progressData.total : 0;
                    const dateLabel = format(date, "EEE");
                    return (
                      <button
                        {...buttonProps}
                        className={`relative w-full aspect-square max-w-[3rem] flex flex-col items-center justify-center gap-0 p-0 font-normal ${modifiers.selected ? 'text-primary font-semibold' : ''} ${modifiers.today ? 'text-primary font-semibold' : ''} ${modifiers.outside ? 'text-muted-foreground opacity-50' : ''}`}
                      >
                        <div className="relative w-12 h-10 rounded-full flex flex-col items-center justify-center overflow-hidden flex-shrink-0">
                          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 56 48" preserveAspectRatio="none">
                            <rect x="4" y="4" width="48" height="40" rx="20" ry="20" stroke="currentColor" strokeWidth="2.5" fill="none" className="stroke-primary/20" />
                            <rect x="4" y="4" width="48" height="40" rx="20" ry="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray={142} strokeDashoffset={142 - progress * 142} strokeLinecap="round" className="stroke-primary transition-all duration-300" />
                          </svg>
                          <div className="relative z-10 flex flex-col items-center justify-center gap-0 px-0.5">
                            <span className={`text-[8px] font-medium leading-tight truncate max-w-full ${modifiers.selected ? 'text-primary' : 'text-muted-foreground'}`}>
                              {dateLabel}
                            </span>
                            <span className="text-sm font-bold leading-tight">
                              {format(date, 'd')}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  } : undefined,
                  MonthCaption: ({ calendarMonth }) => (
                    <div className="text-base font-semibold text-foreground text-center py-4 border-b border-border">
                      {format(calendarMonth.date, "MMMM yyyy")}
                    </div>
                  ),
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Jump to today - show when 3+ days from today */}
      {showJumpToToday && (
        <div className="flex justify-center mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleJumpToToday}
            className="gap-1.5 text-xs"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Jump to today
          </Button>
        </div>
      )}
    </div>
  );
}
