
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedIdea } from "@/types/idea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, CheckCircle, Star, Tag, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { getEmojiForIdea } from "@/utils/emojiUtils";

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
        .eq("is_saved", true) // Only fetch saved ideas
        .order("created_at", { ascending: false })
        .limit(20);

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
        .eq("is_saved", true) // Only search saved ideas
        .ilike("title", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setIdeas(data || []);
    } catch (error: any) {
      console.error("Error searching ideas:", error.message);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search for ideas. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIdea = (idea: GeneratedIdea) => {
    setSelectedIdea(idea);
    onSelectIdea(idea);
    toast({
      title: "Idea selected",
      description: "You've selected the idea: " + idea.title
    });
  };

  // Helper to determine if an idea is high quality based on the content
  const getIdeaQualityIndicator = (idea: GeneratedIdea) => {
    // Check if the idea has rich details
    const hasRichDetails = idea.description && idea.description.length > 120;
    
    // Check if it has meaningful tags (more than 2)
    const hasMeaningfulTags = idea.tags && idea.tags.length > 2;
    
    // Check for creative title (not generic)
    const hasCreativeTitle = !idea.title.includes("template") && 
                           !idea.title.includes("generic") &&
                           idea.title.length > 20;
    
    // Calculate a quality score
    let qualityScore = 0;
    if (hasRichDetails) qualityScore += 2;
    if (hasMeaningfulTags) qualityScore += 1;
    if (hasCreativeTitle) qualityScore += 2;
    
    // Add additional point for specific keywords indicating quality
    if (idea.description && 
        (idea.description.includes("unique") || 
         idea.description.includes("specific") ||
         idea.description.includes("viral") ||
         idea.description.includes("trending"))) {
      qualityScore += 1;
    }
    
    // Add points for specificity in title
    if (idea.title.includes("exactly") || 
        idea.title.includes("specific") || 
        idea.title.match(/\d+\s+ways/i) ||
        idea.title.match(/in\s+\d+\s+days/i)) {
      qualityScore += 1;
    }
    
    return qualityScore >= 4 ? "high" : qualityScore >= 2 ? "medium" : "standard";
  };

  // Get color for quality indicator
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "high": return "text-yellow-500 dark:text-yellow-400";
      case "medium": return "text-blue-500 dark:text-blue-400";
      default: return "text-slate-500 dark:text-slate-400";
    }
  };

  // Get label for quality indicator
  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case "high": return "High-Performing";
      case "medium": return "Quality";
      default: return "Standard";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search saved video ideas..."
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
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {ideas.map((idea) => {
            const quality = getIdeaQualityIndicator(idea);
            const qualityColor = getQualityColor(quality);
            const qualityLabel = getQualityLabel(quality);
            
            // Use provided emoji or generate one based on title and category
            const ideaEmoji = idea.emoji || getEmojiForIdea(idea.title, idea.category || "");
            
            return (
              <Card
                key={idea.id}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedIdea?.id === idea.id ? "border-primary bg-accent" : ""
                }`}
                onClick={() => handleSelectIdea(idea)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium line-clamp-1">{ideaEmoji} {idea.title}</h4>
                        {quality === "high" && (
                          <Sparkles className={`h-4 w-4 ${qualityColor} fill-current`} />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {idea.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {idea.category && (
                          <Badge variant="outline" className="text-xs bg-primary/5">
                            {idea.category}
                          </Badge>
                        )}
                        
                        <span className={`text-xs flex items-center ${qualityColor}`}>
                          {quality === "high" && <Star className="h-3 w-3 mr-1 fill-current" />}
                          {qualityLabel}
                        </span>
                      </div>
                      
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Tag className="h-3 w-3 text-muted-foreground mr-1" />
                          {idea.tags.slice(0, 4).map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs text-muted-foreground"
                            >
                              #{tag}{index < Math.min(3, idea.tags.length - 1) ? "," : ""}
                            </span>
                          ))}
                          {idea.tags.length > 4 && (
                            <span className="text-xs text-muted-foreground">+{idea.tags.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedIdea?.id === idea.id && (
                      <CheckCircle className="h-5 w-5 text-primary ml-2 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          {searchQuery ? "No ideas found matching your search" : "No ideas found. Generate some ideas first."}
        </div>
      )}
    </div>
  );
};

export default VideoIdeaSelector;
