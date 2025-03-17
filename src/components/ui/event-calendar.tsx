
import * as React from "react";
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color: string;
  allDay?: boolean;
}

interface EventCalendarProps extends React.ComponentProps<typeof DayPickerCalendar> {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function EventCalendar({
  className,
  events = [],
  onEventClick,
  ...props
}: EventCalendarProps) {
  // Group events by date for easier rendering
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    events.forEach((event) => {
      const dateKey = event.date.toISOString().split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    
    return map;
  }, [events]);

  return (
    <div className="relative">
      <DayPickerCalendar
        className={className}
        components={{
          Day: ({ date, ...dayProps }) => {
            const dateKey = date.toISOString().split('T')[0];
            const dayEvents = eventsByDate.get(dateKey) || [];
            
            return (
              <div className="relative">
                {/* Original Day component from shadcn Calendar */}
                <div {...dayProps} />
                
                {/* Event indicators */}
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="h-1.5 w-1.5 rounded-full cursor-pointer"
                        style={{ backgroundColor: event.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[0.6rem] text-muted-foreground">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          },
        }}
        {...props}
      />
    </div>
  );
}

EventCalendar.displayName = "EventCalendar";
