
import React from "react";
import IdeaCard from "./IdeaCard";
import { Button } from "@/components/ui/button";
import { Filter, ArrowDownWideNarrow } from "lucide-react";
import { IconMap } from "@/types/idea";

interface IdeasGridProps {
  ideas: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    tags: string[];
    symbol?: keyof typeof IconMap;
    color?: string;
    is_saved?: boolean;
  }>;
  onAddToCalendar: (idea: any) => void;
  onEdit: (ideaId: string) => void;
  onBookmarkToggle?: (ideaId: string) => void;
}

const IdeasGrid = ({ ideas, onAddToCalendar, onEdit, onBookmarkToggle }: IdeasGridProps) => {
  if (!ideas.length) return null;

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#222831]">Your Video Ideas</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
            <ArrowDownWideNarrow className="w-4 h-4" />
            Sort
          </Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onAddToCalendar={() => onAddToCalendar(idea)}
            onEdit={() => onEdit(idea.id)}
            onBookmarkToggle={() => onBookmarkToggle?.(idea.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default IdeasGrid;
