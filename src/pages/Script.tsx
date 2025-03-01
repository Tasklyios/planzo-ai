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
import { GeneratedIdea, ScriptHook, ScriptStructure } from "@/types/idea";
import { Save, Search, Upload, Sparkles } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ChatWidget from "@/components/ChatWidget";
import SpreadsheetUploader from "@/components/SpreadsheetUploader";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { ScrollArea } from "@/components/ui/scroll-area";

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

interface HookData {
  id?: string;
  hook: string;
  category: string;
  description?: string;
}

interface StructureData {
  id?: string;
  name: string;
  structure: string;
  description?: string;
}

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
  
  // Add new state for custom hook and structure data
  const [hooks, setHooks] = useState<HookData[]>([]);
  const [structures, setStructures] = useState<StructureData[]>([]);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);

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
    fetchHooksAndStructures();
  }, [selectedStatus]);

  const fetchHooksAndStructures = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      // Use the generic query method instead of the type-safe approach
      // since these tables aren't in the generated TypeScript types yet
      const { data: hooksData, error: hooksError } = await supabase
        .rpc('get_hooks', { user_id_param: sessionData.session.user.id })
        .catch(() => {
          // Fallback to direct SQL query if RPC method isn't available
          return supabase
            .from('script_hooks')
            .select('*')
            .eq('user_id', sessionData.session.user.id) as unknown as { 
              data: HookData[] | null; 
              error: any 
            };
        });

      if (hooksError) throw hooksError;
      setHooks((hooksData || []) as HookData[]);

      // Same approach for structures
      const { data: structuresData, error: structuresError } = await supabase
        .rpc('get_structures', { user_id_param: sessionData.session.user.id })
        .catch(() => {
          // Fallback to direct SQL query if RPC method isn't available
          return supabase
            .from('script_structures')
            .select('*')
            .eq('user_id', sessionData.session.user.id) as unknown as {
              data: StructureData[] | null;
              error: any
            };
        });

      if (structuresError) throw structuresError;
      setStructures((structuresData || []) as StructureData[]);
    } catch (error: any) {
      console.error("Error fetching hooks and structures:", error);
    }
  };

  const handleHookUploadComplete = () => {
    fetchHooksAndStructures();
    toast({
      title: "Success",
      description: "Hook data uploaded successfully",
    });
  };

  const handleStructureUploadComplete = () => {
    fetchHooksAndStructures();
    toast({
      title: "Success",
      description: "Structure data uploaded successfully",
    });
  };

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

      // Find the selected hook and structure objects
      const selectedHookData = hooks.find(h => h.id === selectedHook);
      const selectedStructureData = structures.find(s => s.id === selectedStructure);

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
          // Include hook and structure if selected
          hook: selectedHookData?.hook,
          structure: selectedStructureData?.structure,
        },
      });

      if (error) throw error;
      
      if (!data?.script) {
        throw new Error("Failed to generate script. Please try again.");
      }
      
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
          toast({
            variant: "destructive",
            title: "Error",
            description: "Script was generated but couldn't be saved.",
          });
        } else {
          toast({
            title: "Success",
            description: "Script generated and saved successfully!",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Script generated successfully!",
        });
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
    if (!script) return { parsedLines: [], isVisual: [] };

    const lines = script.split('\n');
    const parsedLines = [];
    const isVisual = [];

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;

      if (line.includes('[VISUAL_GUIDE]')) {
        const visualContent = line.replace('[VISUAL_GUIDE]', '').replace('[/VISUAL_GUIDE]', '').trim();
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

      toast({
        title: "Success",
        description: "Script saved successfully",
      });

      // If this is an existing idea, let's refresh the saved ideas
      if (fetchSavedIdeas) {
        await fetchSavedIdeas();
      }
    } catch (error: any) {
      console.error("Error saving script:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save script",
      });
    }
  };

  const handleScriptUpdate = (updatedScript: string) => {
    setGeneratedScript(updatedScript);
    toast({
      title: "Script Updated",
      description: "The AI coach has suggested improvements to your script.",
    });
  };

  const { parsedLines, isVisual } = parseScript(generatedScript, showVisuals);

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
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="hooks-structures">
              <AccordionTrigger className="text-primary">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Upload Hooks & Structures
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg bg-card">
                    <SpreadsheetUploader 
                      type="hooks" 
                      onUploadComplete={handleHookUploadComplete} 
                    />
                    
                    {hooks.length > 0 && (
                      <div className="mt-4">
                        <Label htmlFor="hook-select" className="mb-2 block">Select Hook</Label>
                        <Select value={selectedHook || ""} onValueChange={setSelectedHook}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a hook" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {hooks.map((hook) => (
                              <SelectItem key={hook.id} value={hook.id || ""}>
                                {hook.hook.substring(0, 30)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-card">
                    <SpreadsheetUploader 
                      type="structures" 
                      onUploadComplete={handleStructureUploadComplete} 
                    />
                    
                    {structures.length > 0 && (
                      <div className="mt-4">
                        <Label htmlFor="structure-select" className="mb-2 block">Select Structure</Label>
                        <Select value={selectedStructure || ""} onValueChange={setSelectedStructure}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a structure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {structures.map((structure) => (
                              <SelectItem key={structure.id} value={structure.id || ""}>
                                {structure.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg text-sm">
                  <p className="font-medium mb-2">Expected Spreadsheet Format:</p>
                  <p className="mb-2">
                    <strong>Hooks:</strong> Columns should include "hook" (required), "category", and "description".
                  </p>
                  <p>
                    <strong>Structures:</strong> Columns should include "name" (required), "structure" (required), and "description".
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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

              <ScrollArea className="h-[200px] rounded-lg border p-4">
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {filteredIdeas.map((idea) => (
                      <CarouselItem 
                        key={idea.id} 
                        className="pl-2 md:pl-4 pt-2 pb-2 md:basis-1/2 lg:basis-1/3"
                      >
                        <div className="p-1">
                          <Card 
                            className={cn(
                              "p-3 cursor-pointer transition-all border-l-4 relative overflow-visible",
                              colorClasses[idea.color || 'blue'] || colorClasses.blue,
                              selectedIdea?.id === idea.id 
                                ? 'ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5' 
                                : 'hover:border-primary hover:shadow-md hover:scale-[1.01]'
                            )}
                            onClick={() => setSelectedIdea(idea)}
                          >
                            {selectedIdea?.id === idea.id && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs z-20">
                                ✓
                              </div>
                            )}
                            <h4 className="font-medium mb-2 pr-8">{idea.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {idea.description}
                            </p>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-12 md:-left-16" />
                  <CarouselNext className="-right-12 md:-right-16" />
                </Carousel>
              </ScrollArea>
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
            <div className="space-y-6">
              <div className="rounded-lg border p-6 bg-card">
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
                  {parsedLines.map((line, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "py-2",
                        isVisual[index] ? 
                          "pl-4 text-blue-500 dark:text-blue-400 italic border-l-2 border-blue-500 dark:border-blue-400 bg-blue-500/5 rounded-r-lg" :
                          "text-foreground"
                      )}
                    >
                      {isVisual[index] ? `→ Visual: ${line}` : line}
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
              
              {/* Script coach chat - embedded below the script */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Script Coach</h2>
                <ChatWidget script={generatedScript} onScriptUpdate={handleScriptUpdate} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
