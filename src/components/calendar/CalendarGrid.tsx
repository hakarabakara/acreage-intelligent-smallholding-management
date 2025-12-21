import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  format,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
export interface CalendarEvent {
  id: string;
  title: string;
  date: number;
  type: 'task' | 'crop-plant' | 'crop-harvest' | 'compliance' | 'livestock' | 'health' | 'resource' | 'weather';
  color: string;
  status?: string;
  details?: string;
  originalData?: any;
}
interface CalendarGridProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}
export function CalendarGrid({ events, currentDate, onDateChange, onEventClick }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const nextMonth = () => onDateChange(addMonths(currentDate, 1));
  const prevMonth = () => onDateChange(subMonths(currentDate, 1));
  const goToToday = () => onDateChange(new Date());
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), day));
  };
  return (
    <div className="flex flex-col h-full bg-card border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center rounded-md border bg-background shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-r-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-l-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </div>
      {/* Days Header */}
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
        {calendarDays.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);
          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[100px] border-b border-r p-2 transition-colors hover:bg-muted/20 flex flex-col gap-1 relative group",
                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                dayIdx % 7 === 6 && "border-r-0" // Remove right border for last column
              )}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                    isDayToday
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium md:hidden">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 4).map((event) => (
                  <TooltipProvider key={event.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          className={cn(
                            "w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium transition-all hover:opacity-80",
                            event.color
                          )}
                        >
                          {event.title}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs max-w-[200px]">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-muted-foreground capitalize">{event.type.replace('-', ' ')}</p>
                        {event.details && <p className="mt-1 border-t pt-1">{event.details}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {dayEvents.length > 4 && (
                  <div className="text-[10px] text-muted-foreground pl-1 flex items-center gap-1">
                    <MoreHorizontal className="h-3 w-3" /> {dayEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}