import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Save, Search } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Available colors with their corresponding Tailwind classes
const colorClasses: { [key: string]: string } = {
  red: "border-red-500",
  orange: "border-orange-500",
  yellow: "border-yellow-500",
  green: "border-green-500",
  blue: "border-blue-500",
  indigo: "border-indigo-500",
  purple: "border-purple-500",
  pink: "border-pink-500"
};

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
  const [showVisuals, setShowVisuals] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const statuses = [
    { id: 'all', label: 'All Ideas' },
    { id: 'ideas', label: 'Ideas' },
    { id: 'planning', label: 'Planning' },
    { id: 'filming', label: 'Ready to Film' },
    { id: 'editing', label: 'To Edit' },
    { id: 'ready', label: 'Ready to Post' },
  ];

  const fetchSavedIdeas = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      let query = supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .eq("is_saved", true);

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

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
  }, [selectedStatus]);

  const filteredIdeas = savedIdeas.filter(idea =>
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const parseScript = (script: string, showVisuals: boolean) => {
    if (!script) return { parsedContent: "" };

    const lines = script.split('\n');
    let parsedContent = '';
    let isInVisualBlock = false;

    for (const line of lines) {
      if (line.includes('[VISUAL_GUIDE]')) {
        const visualContent = line.replace('[VISUAL_GUIDE]', '').replace('[/VISUAL_GUIDE]', '');
        if (showVisuals) {
          parsedContent += `\n→ Visual: ${visualContent}\n`;
        }
        continue;
      }

      // Skip visual end tags
      if (line.includes('[/VISUAL_GUIDE]')) {
        continue;
      }

      // Add regular script lines
      if (!line.includes('[VISUAL_GUIDE]') && !line.includes('[/VISUAL_GUIDE]')) {
        parsedContent += `${line}\n`;
      }
    }

    // Clean up any remaining markers
    parsedContent = parsedContent
      .replace(/\[TIMESTAMPS?\]|\[HOOK\]|\[CTA\]/g, '')
      .replace(/\n{3,}/g, '\n\n') // Remove excess newlines
      .trim();

    return { parsedContent };
  };

  const { parsedContent } = parseScript(generatedScript, showVisuals);

  const handleSaveScript = async () => {
    if (!generatedScript) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user.id) {
        toast({
          title: "Error",
          description: "You must be logged in to save scripts",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('scripts')
        .insert({
          content: generatedScript,
          user_id: session.session.user.id,
          idea_id: selectedIdea?.id || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Script saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving script:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save script",
      });
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
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Button
                    key={status.id}
                    variant={selectedStatus === status.id ? "default" : "outline"}
                    onClick={() => setSelectedStatus(status.id)}
                    className="text-sm"
                  >
                    {status.label}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Carousel className="w-full">
                <CarouselContent>
                  {filteredIdeas.map((idea) => (
                    <CarouselItem key={idea.id} className="md:basis-1/2 lg:basis-1/3">
                      <Card 
                        className={cn(
                          "p-4 cursor-pointer transition-all border-l-4 relative",
                          colorClasses[idea.color || 'blue'] || colorClasses.blue,
                          selectedIdea?.id === idea.id 
                            ? 'ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5' 
                            : 'hover:border-primary hover:shadow-md hover:scale-[1.01]'
                        )}
                        onClick={() => setSelectedIdea(idea)}
                      >
                        {selectedIdea?.id === idea.id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                            ✓
                          </div>
                        )}
                        <h4 className="font-medium mb-2">{idea.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {idea.description}
                        </p>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Generated Script</h2>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="show-visuals" className="text-sm">Show Visual Guides</Label>
                  <Switch
                    id="show-visuals"
                    checked={showVisuals}
                    onCheckedChange={setShowVisuals}
                  />
                </div>
              </div>
              <div className="whitespace-pre-wrap font-mono text-sm space-y-2">
                {parsedContent.split('\n').map((line, index) => (
                  <div 
                    key={index} 
                    className={`${
                      line.startsWith('→ Visual:') 
                        ? 'pl-4 text-blue-500 dark:text-blue-400 italic border-l-2 border-blue-500 dark:border-blue-400'
                        : ''
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSaveScript}
                  variant="outline"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Script
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
