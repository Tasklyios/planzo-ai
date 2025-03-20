
"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfToday,
  startOfWeek,
  endOfWeek,
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

interface FullScreenCalendarProps {
  events: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  selectedDate?: Date;
  showSidePanel?: boolean;
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
  const [currentMonth, setCurrentMonth] = React.useState(format(initialSelectedDate || today, "MMM-yyyy"))
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Calculate days in month with proper padding for first and last week
  const days = React.useMemo(() => {
    const monthStart = startOfMonth(firstDayCurrentMonth)
    const monthEnd = endOfMonth(firstDayCurrentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [firstDayCurrentMonth])

  // When selectedDay changes, notify parent
  React.useEffect(() => {
    if (onDateSelect) {
      onDateSelect(selectedDay)
    }
  }, [selectedDay, onDateSelect])

  // If initialSelectedDate changes from parent, update local state
  React.useEffect(() => {
    if (initialSelectedDate) {
      setSelectedDay(initialSelectedDate)
    }
  }, [initialSelectedDate])

  function previousMonth() {
    const firstDayPrevMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayPrevMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
    setSelectedDay(today)
    if (onDateSelect) {
      onDateSelect(today)
    }
  }

  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
    if (onDateSelect) {
      onDateSelect(day)
    }
  }

  const handleAddEvent = () => {
    if (onAddEvent) {
      onAddEvent(selectedDay)
    }
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEventClick) {
      onEventClick(event)
    }
  }

  // Get events for the selected day
  const selectedDayEvents = events.filter(event => 
    isSameDay(event.date, selectedDay)
  )

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day))
  }

  const getEventIcon = (event: CalendarEvent) => {
    if (event.category === 'hook') return <Bookmark className="h-3 w-3" />
    if (event.category === 'script') return <FileText className="h-3 w-3" />
    return <LightbulbIcon className="h-3 w-3" />
  }

  // Week days header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
                  {format(firstDayCurrentMonth, "MMMM yyyy")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Today: {format(today, "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={goToToday} variant="outline" size="sm">
              Today
            </Button>
            <Button
              onClick={previousMonth}
              variant="outline"
              size="icon"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={nextMonth}
              variant="outline"
              size="icon"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button className="gap-2" onClick={handleAddEvent}>
              <PlusCircle className="h-4 w-4" />
              <span>New Post</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-t bg-muted/20">
            {weekDays.map((day, index) => (
              <div key={index} className="py-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid h-full grid-cols-7 auto-rows-fr">
              {days.map((day) => {
                // Get events for this day
                const dayEvents = getEventsForDay(day)
                const isSelectedDay = isSameDay(day, selectedDay)
                const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth)
                const dayKey = format(day, 'yyyy-MM-dd')
                
                return (
                  <div
                    key={dayKey}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "relative p-2 border-b border-r min-h-[100px] transition-colors",
                      isSelectedDay && "bg-primary/10",
                      !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      "hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    <div className={cn(
                      "flex justify-end mb-2",
                      isToday(day) && "font-bold text-primary"
                    )}>
                      <span className={cn(
                        "flex items-center justify-center w-6 h-6 text-xs",
                        isToday(day) && "bg-primary text-primary-foreground rounded-full"
                      )}>
                        {format(day, "d")}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.length > 0 && (
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="flex flex-col rounded-md border p-1 text-xs"
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
                                <p className="font-medium leading-none truncate max-w-[80px]">
                                  {event.title}
                                </p>
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              + {dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
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
                <CalendarIcon className="h-5 w-5 text-primary" />
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
