
"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Calendar as CalendarIcon,
  FileText,
  Bookmark,
  LightbulbIcon
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  color?: string;
  platform?: string;
  category?: string;
  allDay?: boolean;
}

interface CalendarData {
  day: Date;
  events: CalendarEvent[];
}

interface FullScreenCalendarProps {
  events: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  selectedDate?: Date;
  showSidePanel?: boolean;
}

// Updated column start classes to correctly align with days of the week (Sunday = 1, Monday = 2, etc.)
const colStartClasses = [
  "",
  "col-start-1", // Sunday
  "col-start-2", // Monday
  "col-start-3", // Tuesday
  "col-start-4", // Wednesday
  "col-start-5", // Thursday
  "col-start-6", // Friday
  "col-start-7", // Saturday
]

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

export function FullScreenCalendar({ 
  events, 
  onDateSelect,
  onEventClick,
  onAddEvent,
  selectedDate: initialSelectedDate,
  showSidePanel = true
}: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(initialSelectedDate || today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(initialSelectedDate || today, "MMM-yyyy"),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Convert events to the CalendarData format
  const calendarData: CalendarData[] = React.useMemo(() => {
    const daysWithEvents = events.reduce((acc: Record<string, CalendarData>, event) => {
      const dateKey = format(event.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = {
          day: new Date(event.date),
          events: [],
        };
      }
      acc[dateKey].events.push(event);
      return acc;
    }, {});

    return Object.values(daysWithEvents);
  }, [events]);

  // When selectedDay changes, notify parent
  React.useEffect(() => {
    if (onDateSelect) {
      onDateSelect(selectedDay);
    }
  }, [selectedDay, onDateSelect]);

  // If initialSelectedDate changes from parent, update local state
  React.useEffect(() => {
    if (initialSelectedDate) {
      setSelectedDay(initialSelectedDate);
    }
  }, [initialSelectedDate]);

  // Ensure days are properly calculated from the start of the week to the end of the month
  const days = React.useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(firstDayCurrentMonth, { weekStartsOn: 0 }),  // Start on Sunday (0)
      end: endOfWeek(endOfMonth(firstDayCurrentMonth), { weekStartsOn: 0 }),  // End on Saturday
    });
  }, [firstDayCurrentMonth]);

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
    setSelectedDay(today)
    if (onDateSelect) {
      onDateSelect(today);
    }
  }

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    if (onDateSelect) {
      onDateSelect(day);
    }
  };

  const handleAddEvent = () => {
    if (onAddEvent) {
      onAddEvent(selectedDay);
    }
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Get events for the selected day
  const selectedDayEvents = events.filter(event => 
    isSameDay(event.date, selectedDay)
  );

  const getEventIcon = (event: CalendarEvent) => {
    if (event.category === 'hook') return <Bookmark className="h-3 w-3" />;
    if (event.category === 'script') return <FileText className="h-3 w-3" />;
    return <LightbulbIcon className="h-3 w-3" />;
  };

  return (
    <div className={cn(
      "flex flex-1 h-full",
      showSidePanel ? "flex-col md:flex-row" : "flex-col"
    )}>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
          <div className="flex flex-auto">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-foreground">
                  {format(firstDayCurrentMonth, "MMMM, yyyy")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                  {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
              <Button
                onClick={previousMonth}
                className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                variant="outline"
                size="icon"
                aria-label="Navigate to previous month"
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
              <Button
                onClick={nextMonth}
                className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                variant="outline"
                size="icon"
                aria-label="Navigate to next month"
              >
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </div>

            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <Separator
              orientation="horizontal"
              className="block w-full md:hidden"
            />

            <Button className="w-full gap-2 md:w-auto" onClick={handleAddEvent}>
              <PlusCircle size={16} strokeWidth={2} aria-hidden="true" />
              <span>New Post</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border text-center text-xs font-semibold leading-6">
            <div className="border-r py-2.5">Sun</div>
            <div className="border-r py-2.5">Mon</div>
            <div className="border-r py-2.5">Tue</div>
            <div className="border-r py-2.5">Wed</div>
            <div className="border-r py-2.5">Thu</div>
            <div className="border-r py-2.5">Fri</div>
            <div className="py-2.5">Sat</div>
          </div>

          {/* Calendar Days */}
          <div className="flex-1 overflow-y-auto">
            {/* Desktop View */}
            <div className="hidden h-full w-full grid-rows-6 lg:grid lg:grid-cols-7">
              {days.map((day, dayIdx) => {
                // Get events for this day
                const dayEvents = calendarData.filter(data => 
                  isSameDay(data.day, day)
                );
                
                return (
                  <div
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      // Only apply colStartClasses to the first week
                      dayIdx < 7 && colStartClasses[getDay(day)],
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "bg-accent/50 text-muted-foreground",
                      "relative flex h-auto min-h-[100px] flex-col border-b border-r hover:bg-muted focus:z-10 cursor-pointer",
                      !isEqual(day, selectedDay) && "hover:bg-accent/75",
                    )}
                  >
                    <header className="flex items-center justify-between p-2.5">
                      <button
                        type="button"
                        className={cn(
                          isEqual(day, selectedDay) && "text-primary-foreground",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            isSameMonth(day, firstDayCurrentMonth) &&
                            "text-foreground",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            !isSameMonth(day, firstDayCurrentMonth) &&
                            "text-muted-foreground",
                          isEqual(day, selectedDay) &&
                            isToday(day) &&
                            "border-none bg-primary",
                          isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            "bg-foreground",
                          (isEqual(day, selectedDay) || isToday(day)) &&
                            "font-semibold",
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border",
                        )}
                      >
                        <time dateTime={format(day, "yyyy-MM-dd")}>
                          {format(day, "d")}
                        </time>
                      </button>
                    </header>
                    <div className="flex-1 p-2.5">
                      {dayEvents.map((dayData) => (
                        <div key={dayData.day.toString()} className="space-y-1.5">
                          {dayData.events.slice(0, 1).map((event) => (
                            <div
                              key={event.id}
                              className="flex flex-col items-start gap-1 rounded-lg border p-2 text-xs leading-tight"
                              style={{ 
                                backgroundColor: event.color ? 
                                  `${event.color.startsWith('#') ? event.color : colorMap[event.color] || '#3b82f6'}15` : 
                                  '#3b82f615',
                                borderColor: event.color ? 
                                  (event.color.startsWith('#') ? event.color : colorMap[event.color] || '#3b82f6') : 
                                  '#3b82f6'
                              }}
                              onClick={(e) => handleEventClick(event, e)}
                            >
                              <div className="flex items-center gap-1 w-full">
                                {getEventIcon(event)}
                                <p className="font-medium leading-none truncate max-w-[120px]">
                                  {event.title}
                                </p>
                              </div>
                              {event.platform && (
                                <p className="leading-none text-muted-foreground truncate max-w-[120px]">
                                  {event.platform}
                                </p>
                              )}
                            </div>
                          ))}
                          {dayData.events.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              + {dayData.events.length - 1} more
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile View */}
            <div className="isolate grid w-full grid-cols-7 grid-rows-6 border-x lg:hidden">
              {days.map((day, dayIdx) => {
                // Find events for this day to add indicators
                const dayEvents = calendarData.filter(data => 
                  isSameDay(data.day, day)
                );
                
                return (
                  <button
                    onClick={() => handleDayClick(day)}
                    key={day.toString()}
                    type="button"
                    className={cn(
                      isEqual(day, selectedDay) && "text-primary-foreground",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        "text-foreground",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-muted-foreground",
                      (isEqual(day, selectedDay) || isToday(day)) &&
                        "font-semibold",
                      "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10",
                    )}
                  >
                    <time
                      dateTime={format(day, "yyyy-MM-dd")}
                      className={cn(
                        "ml-auto flex size-6 items-center justify-center rounded-full",
                        isEqual(day, selectedDay) &&
                          isToday(day) &&
                          "bg-primary text-primary-foreground",
                        isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          "bg-primary text-primary-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </time>
                    {dayEvents.length > 0 && (
                      <div>
                        {dayEvents.map((data) => (
                          <div
                            key={data.day.toString()}
                            className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                          >
                            {data.events.map((event) => (
                              <span
                                key={event.id}
                                className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor: event.color ? 
                                    (event.color.startsWith('#') ? event.color : colorMap[event.color] || '#3b82f6') : 
                                    '#3b82f6'
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel for Selected Day Events */}
      {showSidePanel && (
        <div className="border-t md:border-t-0 md:border-l md:w-80 lg:w-96">
          <Card className="border-0 rounded-none h-full">
            <CardHeader className="bg-slate-50 dark:bg-slate-800">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <span>{format(selectedDay, "EEEE, MMMM d, yyyy")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-auto">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No content scheduled for this day
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDayEvents.map(event => (
                    <Card 
                      key={event.id} 
                      className="hover:shadow-md transition-shadow border-l-4 cursor-pointer" 
                      style={{ 
                        borderLeftColor: event.color ? 
                          (event.color.startsWith('#') ? event.color : colorMap[event.color] || '#3b82f6') : 
                          '#3b82f6' 
                      }}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {event.category && (
                              <Badge variant="outline" className="text-xs">
                                {event.category}
                              </Badge>
                            )}
                            {event.platform && (
                              <Badge variant="outline" className="text-xs">
                                {event.platform}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
