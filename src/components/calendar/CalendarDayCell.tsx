
import { format, isSameMonth, isToday } from "date-fns";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ScheduledPost } from "@/types/calendar";
import type { availableSymbols as AvailableSymbolsType } from "@/utils/calendar-utils";

interface CalendarDayCellProps {
  date: Date;
  currentDate: Date;
  posts: ScheduledPost[];
  getColorClasses: (color: string | undefined, variant: 'solid' | 'gradient' | 'accent') => string;
  availableSymbols: typeof AvailableSymbolsType;
}

export function CalendarDayCell({ date, currentDate, posts, getColorClasses, availableSymbols }: CalendarDayCellProps) {
  const dateStr = format(date, "yyyy-MM-dd");

  return (
    <Droppable droppableId={dateStr}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "min-h-[100px] p-3 bg-white rounded-lg border border-gray-200",
            !isSameMonth(date, currentDate) && "bg-gray-50",
            isToday(date) && "ring-2 ring-blue-500 ring-offset-2"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-sm font-medium",
              !isSameMonth(date, currentDate) && "text-gray-400"
            )}>
              {format(date, "d")}
            </span>
            {isToday(date) && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>
          {posts.map((post, index) => (
            <Draggable
              key={post.id}
              draggableId={post.id}
              index={index}
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={cn(
                    "mb-2 p-2 bg-white rounded border text-sm",
                    getColorClasses(post.color, 'gradient')
                  )}
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = availableSymbols.find(s => s.name === post.symbol)?.icon || CalendarIcon;
                      return <IconComponent className="h-4 w-4 text-gray-600" />;
                    })()}
                    <span className="truncate">{post.title}</span>
                  </div>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
