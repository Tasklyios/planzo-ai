
import { CalendarPlus, PenSquare, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconMap } from "@/types/idea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";
import type { GeneratedIdea } from "@/types/idea";

interface IdeasGridProps {
  ideas: GeneratedIdea[];
  onAddToCalendar: (idea: GeneratedIdea) => void;
  onEdit: (ideaId: string) => void;
  onBookmarkToggle: (ideaId: string) => void;
}

const IdeasGrid = ({
  ideas,
  onAddToCalendar,
  onEdit,
  onBookmarkToggle,
}: IdeasGridProps) => {
  const getIconComponent = (symbolName?: keyof typeof IconMap): LucideIcon => {
    if (!symbolName || !(symbolName in IconMap)) {
      return IconMap.Lightbulb;
    }
    return IconMap[symbolName];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ideas.map((idea) => {
        const IconComponent = getIconComponent(idea.symbol);

        return (
          <div
            key={idea.id}
            className="group bg-[#F9FAFC] rounded-xl p-4 md:p-6 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-[#4F92FF]/20"
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center",
                    `bg-${idea.color || "blue"}-500/10`,
                    `text-${idea.color || "blue"}-500`
                  )}
                >
                  <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <span className="text-xs md:text-sm text-[#4F92FF] font-medium">
                    {idea.category}
                  </span>
                  <h3 className="text-sm md:text-lg font-medium text-[#222831]">
                    {idea.title}
                  </h3>
                </div>
              </div>
              <div className="flex gap-1 md:gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onAddToCalendar(idea)}
                        className="h-8 w-8 md:h-9 md:w-9"
                      >
                        <CalendarPlus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to Calendar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(idea.id)}
                  className="h-8 w-8 md:h-9 md:w-9"
                >
                  <PenSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-600 line-clamp-2 md:line-clamp-none">
              {idea.description}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex flex-wrap gap-2">
                {idea.tags?.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 bg-[#4F92FF]/10 text-[#4F92FF] text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBookmarkToggle(idea.id)}
                className={cn(
                  "ml-2 cursor-pointer transition-all duration-300 ease-in-out hover:scale-110",
                  idea.is_saved
                    ? "text-[#4F92FF] hover:text-[#4F92FF]/90"
                    : "text-gray-400 hover:text-[#4F92FF]/70"
                )}
              >
                <Bookmark
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    idea.is_saved && "transform scale-110 animate-scale-in"
                  )}
                  fill={idea.is_saved ? "currentColor" : "none"}
                />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IdeasGrid;
