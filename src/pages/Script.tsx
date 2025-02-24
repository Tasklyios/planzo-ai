
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GeneratedIdea } from "@/types/idea";

export default function Script() {
  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [savedIdeas, setSavedIdeas] = useState<GeneratedIdea[]>([]);
  const [scriptType, setScriptType] = useState<"existing" | "custom">("existing");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("conversational");
  const [duration, setDuration] = useState("60");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const { toast } = useToast();

  const fetchSavedIdeas = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .eq("is_saved", true);

      if (error) throw error;
      setSavedIdeas(data || []);
    } catch (error: any) {
      console.error("Error fetching saved ideas:", error);
      toast({
        title: "Error",
        description: "Failed to load saved ideas",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSavedIdeas();
  }, []);

  const generateScript = async () => {
    setLoading(true);
    try {
      const ideaToUse = scriptType === "existing" ? selectedIdea : {
        title: customTitle,
        description: customDescription,
        category: "custom",
        tags: [],
      };

      if (!ideaToUse?.title || !ideaToUse?.description) {
        throw new Error("Please provide all required information");
      }

      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          type: 'script',
          title: ideaToUse.title,
          description: ideaToUse.description,
          category: ideaToUse.category,
          tags: ideaToUse.tags,
          toneOfVoice,
          duration: parseInt(duration),
          additionalNotes,
        },
      });

      if (error) throw error;
      
      if (data?.script) {
        setGeneratedScript(data.script);
        
        // Save the generated script to the scripts table if using an existing idea
        if (scriptType === "existing" && selectedIdea?.id) {
          const { error: saveError } = await supabase
            .from('scripts')
            .insert({
              content: data.script,
              idea_id: selectedIdea.id,
              user_id: (await supabase.auth.getSession()).data.session?.user.id,
            });

          if (saveError) {
            console.error("Error saving script:", saveError);
          }
        }

        toast({
          title: "Success",
          description: "Script generated successfully!",
        });
      } else {
        throw new Error("No script was generated");
      }
    } catch (error: any) {
      console.error("Error generating script:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate script",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Generate Script</h1>
          <p className="text-muted-foreground">
            Create engaging video scripts from your saved ideas or start fresh with a custom concept.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Choose your starting point</Label>
            <RadioGroup
              value={scriptType}
              onValueChange={(value) => setScriptType(value as "existing" | "custom")}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing">Use an existing idea</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Create a custom idea</Label>
              </div>
            </RadioGroup>
          </div>

          {scriptType === "existing" ? (
            <div className="space-y-4">
              <Label>Select an idea</Label>
              <Select
                value={selectedIdea?.id}
                onValueChange={(value) => {
                  const idea = savedIdeas.find(i => i.id === value);
                  setSelectedIdea(idea || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an idea" />
                </SelectTrigger>
                <SelectContent>
                  {savedIdeas.map((idea) => (
                    <SelectItem key={idea.id} value={idea.id}>
                      {idea.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedIdea && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="font-medium">{selectedIdea.title}</p>
                  <p className="text-sm text-muted-foreground mt-2">{selectedIdea.description}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="customTitle">Title</Label>
                <Input
                  id="customTitle"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter your video title"
                />
              </div>
              <div>
                <Label htmlFor="customDescription">Description</Label>
                <Textarea
                  id="customDescription"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe your video concept"
                />
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="toneOfVoice">Tone of Voice</Label>
              <Select value={toneOfVoice} onValueChange={setToneOfVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Target Duration (seconds)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="90">90 seconds</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="180">3 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any specific requirements or points to include in the script"
              />
            </div>
          </div>

          <Button 
            onClick={generateScript} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate Script"}
          </Button>

          {generatedScript && (
            <div className="rounded-lg border p-6 bg-card mt-8">
              <h2 className="text-xl font-semibold mb-4">Generated Script</h2>
              <div className="whitespace-pre-wrap font-mono text-sm">
                {generatedScript}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
