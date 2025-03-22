
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
  onAddToCalendar?: (idea: GeneratedIdea) => void;
  onEdit?: (ideaId: string) => void;
  onBookmarkToggle?: (ideaId: string) => void;
  onSaveIdea?: (idea: GeneratedIdea) => Promise<void>;
  loadingIdeas?: boolean;
  loadingExisting?: boolean;
  error?: string;
  onToggleForm?: () => void;
  showForm?: boolean;
}

const IdeasGrid = ({
  ideas,
  onAddToCalendar,
  onEdit,
  onBookmarkToggle,
  onSaveIdea,
  loadingIdeas,
  loadingExisting,
  error,
  onToggleForm,
  showForm
}: IdeasGridProps) => {
  console.log("IdeasGrid rendering with ideas:", ideas);
  
  if (loadingIdeas || loadingExisting) {
    return <div className="py-4 text-center text-muted-foreground">Loading ideas...</div>;
  }
  
  if (error) {
    return <div className="py-4 text-center text-red-500">{error}</div>;
  }
  
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

  const handleBookmarkToggle = (e: React.MouseEvent, idea: GeneratedIdea) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Toggling bookmark for idea:", idea.id, "Current saved status:", idea.is_saved);
    if (onBookmarkToggle) {
      onBookmarkToggle(idea.id);
    }
  };

  const handleEditClick = (ideaId: string) => {
    if (onEdit) {
      console.log("Editing idea:", ideaId);
      onEdit(ideaId);
    }
  };

  const handleAddToCalendarClick = (idea: GeneratedIdea) => {
    if (onAddToCalendar) {
      console.log("IdeasGrid - Add to calendar clicked for idea:", idea);
      onAddToCalendar(idea);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {validIdeas.map((idea) => {
        // Clean up any quotes from title, category, description
        const cleanTitle = typeof idea.title === 'string' ? idea.title.replace(/^"|"$/g, '') : 'Untitled Idea';
        const cleanCategory = typeof idea.category === 'string' ? idea.category.replace(/^"|"$/g, '') : 'General';
        const cleanDescription = typeof idea.description === 'string' ? idea.description.replace(/^"|"$/g, '') : '';
        
        // Get appropriate emoji for this idea
        const ideaEmoji = idea.emoji || getEmojiForIdea(cleanTitle, cleanCategory);
        
        // Create display title with emoji
        const displayTitle = `${ideaEmoji} ${cleanTitle}`;
        
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
                  {displayTitle}
                </h3>
              </div>
              <div className="flex gap-1 md:gap-2">
                {onAddToCalendar && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAddToCalendarClick(idea)}
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
                )}
                {onEdit && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(idea.id)}
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
                )}
                {onSaveIdea && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onSaveIdea(idea)}
                          className="h-8 w-8 md:h-9 md:w-9"
                        >
                          <Bookmark className={idea.is_saved ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{idea.is_saved ? "Idea Saved" : "Save Idea"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">
              {cleanDescription}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex flex-wrap gap-2">
                {idea.tags && Array.isArray(idea.tags) && idea.tags.slice(0, 3).map((tag, tagIndex) => {
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
                {idea.tags && Array.isArray(idea.tags) && idea.tags.length > 3 && (
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                    +{idea.tags.length - 3} more
                  </span>
                )}
              </div>
              {onBookmarkToggle && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleBookmarkToggle(e, idea)}
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
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IdeasGrid;
