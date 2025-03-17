
import * as React from "react";
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DayProps } from "react-day-picker";
import { DateRange } from "react-day-picker";
import { format, isToday } from "date-fns";

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color: string;
  allDay?: boolean;
}

export interface EventCalendarProps {
  className?: string;
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  mode?: "single" | "multiple" | "range" | "default";
  selected?: Date | Date[] | DateRange | undefined;
  onSelect?: (date: Date | Date[] | DateRange | undefined) => void;
  [key: string]: any; // Allow any other props to be passed through
}

export function EventCalendar({
  className,
  events = [],
  onEventClick,
  mode,
  selected,
  onSelect,
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

  // Create a custom Day component to show events
  const CustomDay = React.useCallback(
    (dayProps: DayProps) => {
      const { date, displayMonth, ...rest } = dayProps;
      const dateKey = date.toISOString().split('T')[0];
      const dayEvents = eventsByDate.get(dateKey) || [];
      const isCurrentDay = isToday(date);
      
      // Determine if this day is selected (for single mode)
      const isSingleSelected = mode === "single" && selected instanceof Date && 
        format(date, "yyyy-MM-dd") === format(selected, "yyyy-MM-dd");

      return (
        <div className="relative">
          {/* Display the date with appropriate highlighting */}
          <div 
            {...rest} 
            className={cn(
              "flex items-center justify-center w-full h-full", // Base styles
              isCurrentDay && "bg-accent border border-blue-300 font-bold",
              isSingleSelected && "bg-blue-500 text-white hover:bg-blue-600"
            )}
          >
            {date.getDate()}
          </div>
          
          {/* Event indicators */}
          {dayEvents.length > 0 && (
            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="h-1.5 w-1.5 rounded-full cursor-pointer"
                  style={{ backgroundColor: event.color }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onEventClick) {
                      onEventClick(event);
                    }
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
    [eventsByDate, onEventClick, mode, selected]
  );

  // We need to pass the correct props based on the mode
  // The DayPicker component expects different props depending on the mode
  const getDayPickerProps = () => {
    const baseProps = {
      className,
      components: {
        Day: CustomDay,
      },
      ...props,
    };

    // Return appropriate props based on mode
    switch (mode) {
      case "single":
        return {
          ...baseProps,
          mode: "single" as const,
          selected: selected as Date,
          onSelect: onSelect as (date: Date | undefined) => void,
        };
      case "multiple":
        return {
          ...baseProps,
          mode: "multiple" as const,
          selected: selected as Date[],
          onSelect: onSelect as (dates: Date[] | undefined) => void,
        };
      case "range":
        // Ensure selected is a valid DateRange for the range mode
        const selectedRange = selected as DateRange;
        // Create a valid DateRange with required 'from' property
        const validRange: DateRange = {
          from: selectedRange?.from || new Date(),
          to: selectedRange?.to
        };
        
        return {
          ...baseProps,
          mode: "range" as const,
          selected: validRange,
          onSelect: onSelect as (range: DateRange | undefined) => void,
        };
      default:
        return {
          ...baseProps,
          mode: "default" as const,
        };
    }
  };

  return (
    <div className="relative">
      <DayPickerCalendar {...getDayPickerProps()} />
    </div>
  );
}

EventCalendar.displayName = "EventCalendar";
