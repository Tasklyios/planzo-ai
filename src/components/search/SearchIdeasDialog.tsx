
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Calendar, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { GeneratedIdea } from "@/types/idea";

interface SearchIdeasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onIdeaAdded?: () => void; // Add callback for when an idea is added
}

export function SearchIdeasDialog({ 
  open, 
  onOpenChange, 
  selectedDate,
  onIdeaAdded
}: SearchIdeasDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Search for ideas whenever the search query changes
  useEffect(() => {
    const searchIdeas = async () => {
      if (!searchQuery.trim()) {
        setIdeas([]);
        return;
      }

      setLoading(true);
      try {
        // Get ideas that match the search query but aren't already in the calendar
        const { data, error } = await supabase
          .from('video_ideas')
          .select('*')
          .ilike('title', `%${searchQuery}%`)
          .eq('is_saved', true) // Only search saved ideas
          .not('status', 'eq', 'calendar')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setIdeas(data || []);
      } catch (error: any) {
        console.error('Error searching ideas:', error);
        toast({
          variant: "destructive",
          title: "Search failed",
          description: "Failed to search for ideas. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    // Use a timeout to debounce the search
    const timeoutId = setTimeout(() => {
      if (open && searchQuery.trim()) {
        searchIdeas();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open, toast]);

  // Add idea to calendar
  const addIdeaToCalendar = async (idea: GeneratedIdea) => {
    try {
      const { error } = await supabase
        .from('video_ideas')
        .update({ 
          status: 'calendar',
          is_saved: true, // Always mark as saved
          scheduled_for: selectedDate.toISOString()
        })
        .eq('id', idea.id);

      if (error) throw error;

      toast({
        title: "Added to calendar",
        description: `"${idea.title}" added to your calendar for ${selectedDate.toLocaleDateString()}`,
      });

      // Remove the idea from the search results
      setIdeas(ideas.filter(i => i.id !== idea.id));

      // Notify parent component that an idea was added
      if (onIdeaAdded) {
        onIdeaAdded();
      }

      // Close the dialog if there are no more results
      if (ideas.length <= 1) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error adding idea to calendar:', error);
      toast({
        variant: "destructive",
        title: "Failed to add to calendar",
        description: "There was an error adding the idea to your calendar.",
      });
    }
  };

  const getRandomColorName = () => {
    const colors = ["red", "orange", "yellow", "green", "blue", "indigo", "purple", "pink"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Add post to calendar
          </DialogTitle>
          <DialogDescription>
            Search for saved ideas to add to your calendar for {selectedDate.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
        </div>
        
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        
        {!loading && ideas.length === 0 && searchQuery.trim() !== "" && (
          <div className="text-center py-8 text-muted-foreground">
            No saved ideas found for "{searchQuery}"
          </div>
        )}
        
        {!loading && searchQuery.trim() === "" && (
          <div className="text-center py-8 text-muted-foreground">
            Type to search for your saved ideas
          </div>
        )}
        
        {!loading && ideas.length > 0 && (
          <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-1">
            {ideas.map((idea) => (
              <div 
                key={idea.id} 
                className="flex items-start justify-between p-3 bg-card rounded-md border hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{idea.title}</h4>
                  <p className="text-xs text-muted-foreground truncate mt-1">{idea.description}</p>
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {idea.tags.slice(0, 3).join(", ")}
                        {idea.tags.length > 3 && ` +${idea.tags.length - 3} more`}
                      </p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 ml-2 flex-shrink-0"
                  onClick={() => addIdeaToCalendar(idea)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
