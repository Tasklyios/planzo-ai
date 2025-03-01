
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedIdea } from "@/types/idea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface VideoIdeaSelectorProps {
  onSelectIdea: (idea: GeneratedIdea) => void;
}

const VideoIdeaSelector: React.FC<VideoIdeaSelectorProps> = ({ onSelectIdea }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load initial ideas when component mounts
    fetchIdeas();
  }, []);

  useEffect(() => {
    // Search ideas when query changes
    if (searchQuery.trim() === "") {
      fetchIdeas();
    } else {
      searchIdeas();
    }
  }, [searchQuery]);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setIdeas(data || []);
    } catch (error: any) {
      console.error("Error fetching ideas:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load video ideas. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchIdeas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .ilike("title", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setIdeas(data || []);
    } catch (error: any) {
      console.error("Error searching ideas:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIdea = (idea: GeneratedIdea) => {
    setSelectedIdea(idea);
    onSelectIdea(idea);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search video ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : ideas.length > 0 ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                selectedIdea?.id === idea.id ? "border-primary bg-accent" : ""
              }`}
              onClick={() => handleSelectIdea(idea)}
            >
              <CardContent className="p-3">
                <h4 className="font-medium">{idea.title}</h4>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {idea.description}
                </p>
                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {idea.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-muted text-xs px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          {searchQuery ? "No ideas found matching your search" : "No ideas found"}
        </div>
      )}
    </div>
  );
};

export default VideoIdeaSelector;
