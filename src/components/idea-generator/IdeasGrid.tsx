
import { CalendarPlus, PenSquare, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GeneratedIdea } from "@/types/idea";
import { getEmojiForIdea } from "@/utils/emojiUtils";

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
  console.log("IdeasGrid rendering with ideas:", ideas);
  
  if (!ideas || !Array.isArray(ideas)) {
    console.log("Ideas array is undefined or not an array");
    return <div className="py-4 text-center text-muted-foreground">No ideas available. Please try generating again.</div>;
  }

  if (ideas.length === 0) {
    console.log("Ideas array is empty");
    return <div className="py-4 text-center text-muted-foreground">No ideas generated yet.</div>;
  }

  // Clean up any malformed ideas before displaying
  const validIdeas = ideas.filter(idea => 
    idea && 
    typeof idea.title === 'string' && 
    idea.title.trim() !== '' &&
    idea.title.toLowerCase() !== '"title"' &&
    idea.title.toLowerCase() !== 'title' &&
    idea.category !== '"category"' &&
    idea.description !== '"description"'
  );

  if (validIdeas.length === 0) {
    console.log("No valid ideas after filtering");
    return <div className="py-4 text-center text-muted-foreground">No valid ideas found. Please try generating again.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {validIdeas.map((idea) => {
        // Clean up any quotes from title, category, description
        const cleanTitle = typeof idea.title === 'string' ? idea.title.replace(/^"|"$/g, '') : 'Untitled Idea';
        const cleanCategory = typeof idea.category === 'string' ? idea.category.replace(/^"|"$/g, '') : 'General';
        const cleanDescription = typeof idea.description === 'string' ? idea.description.replace(/^"|"$/g, '') : '';
        
        // Get appropriate emoji for this idea
        const ideaEmoji = getEmojiForIdea(cleanTitle, cleanCategory);
        
        return (
          <div
            key={idea.id}
            className="group bg-card rounded-xl p-4 md:p-6 hover:bg-accent transition-all border border-border"
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div>
                <span className="text-xs md:text-sm text-primary font-medium">
                  {cleanCategory}
                </span>
                <h3 className="text-sm md:text-lg font-medium text-foreground">
                  {ideaEmoji} {cleanTitle}
                </h3>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(idea.id)}
                        className="h-8 w-8 md:h-9 md:w-9"
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Idea</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">
              {cleanDescription}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex flex-wrap gap-2">
                {idea.tags && Array.isArray(idea.tags) && idea.tags.map((tag, tagIndex) => {
                  // Clean up tag data
                  const cleanTag = typeof tag === 'string' ? tag.replace(/^"|"$/g, '') : String(tag);
                  return (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      #{cleanTag}
                    </span>
                  );
                })}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBookmarkToggle(idea.id)}
                      className={cn(
                        "ml-2 cursor-pointer transition-all duration-300 ease-in-out hover:scale-110",
                        idea.is_saved
                          ? "text-primary hover:text-primary/90"
                          : "text-muted-foreground hover:text-primary/70"
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{idea.is_saved ? "Remove from saved ideas" : "Save idea"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IdeasGrid;
