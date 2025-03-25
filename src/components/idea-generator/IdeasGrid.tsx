
import React from "react";
import { GeneratedIdea } from "@/types/idea";
import IdeaCard from "./IdeaCard";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, Calendar, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IdeasGridProps {
  ideas: GeneratedIdea[];
  onAddToCalendar: (idea: GeneratedIdea) => void;
  onEdit: (ideaId: string) => void;
  onBookmarkToggle: (ideaId: string) => void;
  isError?: boolean;
}

const IdeasGrid = ({ 
  ideas, 
  onAddToCalendar, 
  onEdit, 
  onBookmarkToggle,
  isError = false 
}: IdeasGridProps) => {
  // Fallback content for when ideas can't be generated
  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6">
        <CardContent className="flex flex-col items-center gap-4 p-0">
          <AlertTriangle className="h-12 w-12 text-destructive/70" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Generation service unavailable</h3>
            <p className="text-muted-foreground mb-4">
              We're unable to generate new ideas right now. You can still work with your saved ideas.
            </p>
            <Button variant="outline" className="mx-auto">
              <Folder className="mr-2 h-4 w-4" />
              View Saved Ideas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No ideas yet state
  if (!ideas || ideas.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>No ideas generated yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onAddToCalendar={() => onAddToCalendar(idea)}
          onEdit={() => onEdit(idea.id)}
          onBookmarkToggle={() => onBookmarkToggle(idea.id)}
        />
      ))}
    </div>
  );
};

export default IdeasGrid;
