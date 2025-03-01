import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GeneratedIdea } from "@/types/idea";

interface GeneratedScriptDisplayProps {
  generatedScript: string;
  selectedIdea: GeneratedIdea | null;
  fetchSavedIdeas?: () => Promise<void>;
}

export function GeneratedScriptDisplay({ 
  generatedScript, 
  selectedIdea,
  fetchSavedIdeas
}: GeneratedScriptDisplayProps) {
  const [showVisuals, setShowVisuals] = useState(false);
  const { toast } = useToast();
  
  const parseScript = (script: string, showVisuals: boolean) => {
    if (!script) return { parsedLines: [], isVisual: [] };

    const lines = script.split('\n');
    const parsedLines = [];
    const isVisual = [];

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;

      if (line.includes('[VISUAL_GUIDE]')) {
        const visualContent = line.replace('[VISUAL_GUIDE]', '').replace('[/VISUAL_GUIDE]', '').trim();
        // Only add visual guides if showVisuals is true
        if (showVisuals) {
          parsedLines.push(visualContent);
          isVisual.push(true);
        }
      } else if (!line.includes('[/VISUAL_GUIDE]')) {
        // Add regular script lines (remove any other markers)
        const cleanLine = line
          .replace(/\[TIMESTAMPS?\]|\[HOOK\]|\[CTA\]/g, '')
          .trim();
        
        if (cleanLine) {
          parsedLines.push(cleanLine);
          isVisual.push(false);
        }
      }
    }

    return { parsedLines, isVisual };
  };

  const { parsedLines, isVisual } = parseScript(generatedScript, showVisuals);

  const handleSaveScript = async () => {
    if (!generatedScript) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user.id) {
        toast.error("You must be logged in to save scripts");
        return;
      }

      // First save the script
      const { error: scriptError } = await supabase
        .from('scripts')
        .insert({
          content: generatedScript,
          user_id: session.session.user.id,
          idea_id: selectedIdea?.id || null,
        });

      if (scriptError) throw scriptError;

      // If we're using an existing idea, update its script field
      if (selectedIdea?.id) {
        const { error: ideaError } = await supabase
          .from('video_ideas')
          .update({ 
            script: generatedScript,
            is_saved: true  // Ensure the idea is marked as saved
          })
          .eq('id', selectedIdea.id)
          .eq('user_id', session.session.user.id);

        if (ideaError) throw ideaError;
      }

      toast.success("Script saved successfully");

      // If this is an existing idea, let's refresh the saved ideas
      if (fetchSavedIdeas) {
        await fetchSavedIdeas();
      }
    } catch (error: any) {
      console.error("Error saving script:", error);
      toast.error("Failed to save script");
    }
  };

  if (!generatedScript) return null;

  return (
    <div className="pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Generated Script</h2>
        <div className="flex items-center space-x-2">
          <Label htmlFor="showVisuals" className="cursor-pointer">
            {showVisuals ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Label>
          <Switch
            id="showVisuals"
            checked={showVisuals}
            onCheckedChange={setShowVisuals}
          />
          <span className="text-sm text-muted-foreground">
            {showVisuals ? "Hide Visual Guides" : "Show Visual Guides"}
          </span>
        </div>
      </div>

      <div className="border rounded-md p-4 bg-card text-card-foreground">
        {parsedLines.length > 0 ? (
          parsedLines.map((line, i) => (
            <p
              key={i}
              className={cn(
                "mb-2 leading-relaxed",
                isVisual[i]
                  ? "bg-primary/10 p-2 rounded-md text-sm italic border-l-2 border-primary"
                  : ""
              )}
            >
              {isVisual[i] && <span className="font-bold mr-2">VISUAL:</span>}
              {line}
            </p>
          ))
        ) : (
          <p className="text-muted-foreground">No script generated yet.</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button 
          onClick={handleSaveScript} 
          variant="default"
          disabled={!generatedScript}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Script
        </Button>
      </div>
    </div>
  );
}
