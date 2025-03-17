
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash, CalendarIcon, BookmarkIcon, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GeneratedIdea, AddToCalendarIdea } from "@/types/idea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import clsx from "clsx";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface IdeaCardProps {
  idea: GeneratedIdea;
  onDeleteIdea?: (id: string) => void;
  onAddToCalendar: (idea: AddToCalendarIdea) => void;
  onSaveIdea?: (id: string, isSaved: boolean) => void;
  variant?: "compact" | "full";
}

export default function IdeaCard({
  idea,
  onDeleteIdea,
  onAddToCalendar,
  onSaveIdea,
  variant = "full",
}: IdeaCardProps) {
  const isCompact = variant === "compact";
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(idea.is_saved);
  const navigate = useNavigate();

  const handleAddToCalendar = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("IdeaCard - Adding to calendar:", idea);
    onAddToCalendar({
      idea,
      title: idea.title,
      scheduledFor: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const handleSaveToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log("Toggling save for idea:", idea.id, "Current saved status:", saved);
      
      // Get current session to ensure we have the user_id
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Authentication error: " + sessionError.message);
      }
      
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "You must be logged in to save ideas",
        });
        navigate("/auth");
        return;
      }
      
      const userId = sessionData.session.user.id;
      console.log("User ID for save toggle:", userId);
      
      // Update in the database
      const { error } = await supabase
        .from('video_ideas')
        .update({ 
          is_saved: !saved,
          status: !saved ? 'ideas' : idea.status, // When saving, set to ideas column
          user_id: userId // Explicitly set user_id
        })
        .eq('id', idea.id);

      if (error) {
        console.error("Error saving idea:", error);
        throw error;
      }

      // Update local state
      setSaved(!saved);
      
      // Call callback if provided
      if (onSaveIdea) {
        onSaveIdea(idea.id, !saved);
      }
      
      toast({
        title: saved ? "Idea Removed" : "Idea Saved",
        description: saved 
          ? "Idea removed from your saved collection"
          : "Idea saved to your collection in the Ideas column",
      });
    } catch (error: any) {
      console.error('Error toggling save status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update idea status: " + (error.message || "Unknown error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const textToCopy = `${idea.title}\n\n${idea.description}\n\nCategory: ${idea.category}\nTags: ${idea.tags?.join(', ') || ''}`;
      navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Copied to clipboard",
        description: "Idea details copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      });
    }
  };

  return (
    <Card className={clsx("h-full transition-all cursor-pointer hover:shadow-md", {
      "border-2 border-primary": saved
    })}>
      <CardHeader className={clsx(isCompact ? "p-4" : "p-6")}>
        <div className="flex justify-between items-start">
          <CardTitle className={clsx("text-lg line-clamp-2", isCompact ? "text-base" : "text-lg")}>
            {idea.title}
          </CardTitle>
        </div>
        <CardDescription className={clsx("line-clamp-1", isCompact ? "text-xs" : "text-sm")}>
          {idea.category}
        </CardDescription>
      </CardHeader>
      {!isCompact && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{idea.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {idea.tags && idea.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {idea.tags && idea.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{idea.tags.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      )}
      <CardFooter className={isCompact ? "p-3" : "px-6 py-4"}>
        <div className="flex justify-between items-center w-full">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size={isCompact ? "icon" : "sm"}
              onClick={handleSaveToggle}
              disabled={loading}
              className="h-8 w-8"
              title={saved ? "Remove bookmark" : "Bookmark"}
            >
              <BookmarkIcon className={clsx("h-4 w-4", saved ? "fill-primary text-primary" : "")} />
            </Button>
            <Button
              variant="ghost"
              size={isCompact ? "icon" : "sm"}
              onClick={handleCopyToClipboard}
              className="h-8 w-8"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex space-x-1">
            {onDeleteIdea && (
              <Button
                variant="ghost"
                size={isCompact ? "icon" : "sm"}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteIdea(idea.id);
                }}
                className="h-8 w-8"
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size={isCompact ? "icon" : "sm"}
              onClick={handleAddToCalendar}
              className="h-8 w-8"
              title="Add to calendar"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
