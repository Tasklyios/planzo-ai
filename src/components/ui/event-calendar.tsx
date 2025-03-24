
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

// Map color names to actual hex values for display
const colorMap: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  indigo: "#6366f1",
  purple: "#a855f7",
  pink: "#ec4899",
};

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

  // Get color value from either hex code or named color
  const getColorValue = (color: string): string => {
    if (color.startsWith('#')) return color;
    return colorMap[color] || colorMap.blue;
  };

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

      // Handle click on the entire day cell
      const handleDayClick = (e: React.MouseEvent) => {
        if (onSelect && mode === "single") {
          onSelect(date);
        }
        // Don't prevent default or stop propagation here to allow DayPicker's built-in handlers to work
      };

      return (
        <div 
          className="relative flex flex-col items-center w-full h-full cursor-pointer" 
          onClick={handleDayClick}
        >
          {/* Fixed height container for event indicators - positioned ABOVE the date */}
          <div className="flex justify-center gap-1 h-2 mb-1 mt-1">
            {dayEvents.length > 0 && dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="h-1.5 w-1.5 rounded-full cursor-pointer"
                style={{ backgroundColor: getColorValue(event.color) }}
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
          
          {/* Display the date with appropriate highlighting */}
          <div 
            {...rest} 
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full transition-colors", // Apple-like rounded circle
              isCurrentDay && !isSingleSelected && "border border-blue-500 font-semibold text-blue-600",
              isSingleSelected && "bg-blue-500 text-white hover:bg-blue-600"
            )}
          >
            {date.getDate()}
          </div>
        </div>
      );
    },
    [eventsByDate, onEventClick, mode, selected, onSelect]
  );

  // We need to pass the correct props based on the mode
  // The DayPicker component expects different props depending on the mode
  const getDayPickerProps = () => {
    const baseProps = {
      className: cn("w-full h-full", className),
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
    <div className="w-full h-full">
      <DayPickerCalendar {...getDayPickerProps()} />
    </div>
  );
}

EventCalendar.displayName = "EventCalendar";
