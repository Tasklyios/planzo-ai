
import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus, PenSquare, Bookmark, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconMap } from "@/types/idea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    category: string;
    description: string;
    tags: string[];
    symbol?: keyof typeof IconMap;
    color?: string;
    is_saved?: boolean;
  };
  onAddToCalendar: () => void;
  onEdit: () => void;
  showBookmark?: boolean;
  onBookmarkToggle?: () => void;
}

const IdeaCard = ({ 
  idea, 
  onAddToCalendar, 
  onEdit, 
  showBookmark = true,
  onBookmarkToggle 
}: IdeaCardProps) => {
  const { toast } = useToast();
  const getIconComponent = (symbolName?: keyof typeof IconMap): LucideIcon => {
    if (!symbolName || !(symbolName in IconMap)) {
      return IconMap.Lightbulb;
    }
    return IconMap[symbolName];
  };

  const IconComponent = getIconComponent(idea.symbol);

  const handleBookmarkToggle = async () => {
    try {
      const { error } = await supabase
        .from('video_ideas')
        .update({ is_saved: !idea.is_saved })
        .eq('id', idea.id);

      if (error) throw error;

      if (onBookmarkToggle) {
        onBookmarkToggle();
      }

      toast({
        title: idea.is_saved ? "Idea removed from bookmarks" : "Idea bookmarked",
        description: idea.is_saved 
          ? "You can always bookmark it again later" 
          : "You can find this idea in your saved ideas",
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="group bg-[#F9FAFC] rounded-xl p-4 md:p-6 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-[#4F92FF]/20">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={cn(
            "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center",
            `bg-${idea.color || 'blue'}-500/10`,
            `text-${idea.color || 'blue'}-500`
          )}>
            <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <span className="text-xs md:text-sm text-[#4F92FF] font-medium">{idea.category}</span>
            <h3 className="text-sm md:text-lg font-medium text-[#222831]">{idea.title}</h3>
          </div>
        </div>
        <div className="flex gap-1 md:gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onAddToCalendar}
            className="hidden md:flex items-center"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={onEdit}
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
          {idea.tags.map((tag, tagIndex) => (
            <span 
              key={tagIndex} 
              className="px-2 py-1 bg-[#4F92FF]/10 text-[#4F92FF] text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
        {showBookmark && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmarkToggle}
            className={cn(
              "ml-2 cursor-pointer transition-all duration-300 ease-in-out hover:scale-110",
              idea.is_saved 
                ? "text-[#8B5CF6] hover:text-[#7E69AB]" 
                : "text-gray-400 hover:text-[#9b87f5]"
            )}
          >
            <Bookmark 
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                idea.is_saved && "transform scale-110"
              )} 
              fill={idea.is_saved ? "currentColor" : "none"}
            />
          </Button>
        )}
      </div>
    </div>
  );
};

export default IdeaCard;
