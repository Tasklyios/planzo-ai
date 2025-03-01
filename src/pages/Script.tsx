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
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GeneratedIdea, ScriptHook, ScriptStructure, StyleProfile } from "@/types/idea";
import { Save, Search, Upload, Sparkles, Plus, Check, Trash2, Paintbrush, AlertTriangle } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import SpreadsheetUploader from "@/components/SpreadsheetUploader";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Add new state for custom hook and structure data
  const [hooks, setHooks] = useState<HookData[]>([]);
  const [structures, setStructures] = useState<StructureData[]>([]);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  
  // Add style profile state
  const [styleProfiles, setStyleProfiles] = useState<StyleProfile[]>([]);
  const [activeStyleProfile, setActiveStyleProfile] = useState<StyleProfile | null>(null);
  const [newStyleProfileName, setNewStyleProfileName] = useState("");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

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

  // Add fetch style profiles function
  const fetchStyleProfiles = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      // Fetch all style profiles for the user
      const { data: profiles, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('is_active', { ascending: false });

      if (error) throw error;
      
      setStyleProfiles(profiles || []);
      
      // Find and set the active style profile
      const active = profiles?.find(profile => profile.is_active);
      if (active) {
        setActiveStyleProfile(active);
      }
      
      // Also check the user's profile for an active style profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('active_style_profile_id, content_niche, target_audience, posting_platforms, account_type, business_niche, product_niche')
        .eq('id', sessionData.session.user.id)
        .single();
        
      if (!profileError && userProfile) {
        setUserProfile(userProfile);
        if (userProfile?.active_style_profile_id) {
          const activeProfileById = profiles?.find(
            profile => profile.id === userProfile.active_style_profile_id
          );
          if (activeProfileById) {
            setActiveStyleProfile(activeProfileById);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching style profiles:', error);
    }
  };

  // Create a new style profile
  const createStyleProfile = async () => {
    if (!newStyleProfileName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your style profile",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create a style profile",
          variant: "destructive",
        });
        return;
      }

      // Create a new style profile
      const { data: profile, error } = await supabase
        .from('style_profiles')
        .insert({
          user_id: sessionData.session.user.id,
          name: newStyleProfileName,
          content_style: "",
          content_personality: "",
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;

      setStyleProfiles(prev => [...prev, profile]);
      setNewStyleProfileName("");
      setIsCreatingProfile(false);
      
      toast({
        title: "Success",
        description: "Style profile created successfully",
      });
    } catch (error: any) {
      console.error("Error creating style profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create style profile",
      });
    }
  };

  // Set a style profile as active
  const setActiveProfile = async (profileId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      // Update the user's active style profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ active_style_profile_id: profileId })
        .eq('id', sessionData.session.user.id);

      if (updateError) throw updateError;
      
      // Update the style profile itself
      await supabase
        .from('style_profiles')
        .update({ is_active: false })
        .eq('user_id', sessionData.session.user.id);
        
      await supabase
        .from('style_profiles')
        .update({ is_active: true })
        .eq('id', profileId);

      // Update local state
      const selected = styleProfiles.find(profile => profile.id === profileId) || null;
      setActiveStyleProfile(selected);
      
      // Update all profiles' is_active property
      setStyleProfiles(prev => 
        prev.map(profile => ({
          ...profile,
          is_active: profile.id === profileId
        }))
      );
      
      // Update localStorage with the active style's content_style and content_personality
      if (selected?.content_style) {
        localStorage.setItem("contentStyle", selected.content_style);
      }
      
      if (selected?.content_personality) {
        localStorage.setItem("contentPersonality", selected.content_personality);
      }
      
      toast({
        title: "Success",
        description: `${selected?.name} is now your active style profile`,
      });
    } catch (error: any) {
      console.error("Error setting active profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to set active profile",
      });
    }
  };

  // Delete a style profile
  const deleteStyleProfile = async (profileId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;
      
      // Don't allow deleting the active profile
      if (activeStyleProfile?.id === profileId) {
        toast({
          variant: "destructive",
          title: "Cannot Delete Active Profile",
          description: "Please select a different profile before deleting this one.",
        });
        return;
      }

      // Delete the style profile
      const { error } = await supabase
        .from('style_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', sessionData.session.user.id);

      if (error) throw error;
      
      // Update local state
      setStyleProfiles(prev => prev.filter(profile => profile.id !== profileId));
      
      toast({
        title: "Success",
        description: "Style profile deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting style profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete style profile",
      });
    }
  };

  const navigateToStyleProfiles = () => {
    navigate('/account');
    // Set the active tab to 'styles' in localStorage so Account component opens it
    localStorage.setItem('accountActiveTab', 'styles');
  };

  useEffect(() => {
    fetchSavedIdeas();
    fetchHooksAndStructures();
    fetchStyleProfiles();
  }, [selectedStatus]);

  const fetchHooksAndStructures = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      // Use the generic query method instead of the type-safe approach
      // since these tables aren't in the generated TypeScript types yet
      try {
        const { data: hooksData, error: hooksError } = await supabase
          .rpc('get_hooks', { user_id_param: sessionData.session.user.id });

        if (hooksError) throw hooksError;
        setHooks((hooksData || []) as HookData[]);
      } catch (fallbackError) {
        // Fallback to direct SQL query if RPC method isn't available
        const { data: fallbackHooksData, error: fallbackHooksError } = await supabase
          .from('script_hooks')
          .select('*')
          .eq('user_id', sessionData.session.user.id);
          
        if (fallbackHooksError) throw fallbackHooksError;
        setHooks((fallbackHooksData || []) as HookData[]);
      }

      // Same approach for structures
      try {
        const { data: structuresData, error: structuresError } = await supabase
          .rpc('get_structures', { user_id_param: sessionData.session.user.id });

        if (structuresError) throw structuresError;
        setStructures((structuresData || []) as StructureData[]);
      } catch (fallbackError) {
        // Fallback to direct SQL query if RPC method isn't available
        const { data: fallbackStructuresData, error: fallbackStructuresError } = await supabase
          .from('script_structures')
          .select('*')
          .eq('user_id', sessionData.session.user.id);
          
        if (fallbackStructuresError) throw fallbackStructuresError;
        setStructures((fallbackStructuresData || []) as StructureData[]);
      }
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

  // Check if the user has enough usage left for script generation
  const checkUsageLimits = async () => {
    try {
      // Use the check-usage-limits edge function
      const { data: usageResponse, error: usageError } = await supabase.functions.invoke('check-usage-limits', {
        body: { action: 'scripts' }
      });

      if (usageError) {
        console.error("Usage check error:", usageError);
        setError(`Usage check error: ${usageError.message}`);
        return false;
      }

      // If we can't proceed, show an appropriate message
      if (!usageResponse.canProceed) {
        console.error("Usage limit reached:", usageResponse.message);
        
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        
        if (!userId) {
          setError("Authentication required. Please log in.");
          return false;
        }
        
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', userId)
          .single();

        // Prepare upgrade message based on current tier
        let message = usageResponse.message || "You've reached your daily limit for generating scripts. ";
        
        if (subscription?.tier === 'free') {
          message += " Upgrade to Pro or Plus for more generations!";
        } else if (subscription?.tier === 'pro') {
          message += " Upgrade to Plus or Business for more generations!";
        } else if (subscription?.tier === 'plus') {
          message += " Upgrade to Business for unlimited generations!";
        }

        setError(message);
        toast({
          variant: "destructive",
          title: "Usage Limit Reached",
          description: message,
        });
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Error checking usage limits:", error);
      setError(`Error checking usage limits: ${error.message}`);
      return false;
    }
  };

  const generateScript = async () => {
    setLoading(true);
    setError(null);
    setGeneratedScript("");
    
    try {
      // Check if user can generate more scripts
      const canProceed = await checkUsageLimits();
      if (!canProceed) {
        setLoading(false);
        return;
      }

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

      // Construct required profile data for the API call
      const niche = userProfile?.content_niche || userProfile?.business_niche || userProfile?.product_niche || "";
      const audience = userProfile?.target_audience || "";
      const platform = Array.isArray(userProfile?.posting_platforms) && userProfile?.posting_platforms.length > 0 
        ? userProfile?.posting_platforms[0] 
        : "Instagram";
      const videoType = ideaToUse.category || "Tutorial";
      
      // Get additional style data from the active style profile
      let contentStyle = "";
      let contentPersonality = "";
      
      if (activeStyleProfile) {
        contentStyle = activeStyleProfile.content_style || "";
        contentPersonality = activeStyleProfile.content_personality || "";
      } else {
        // Fallback to localStorage if no active profile
        contentStyle = localStorage.getItem("contentStyle") || "";
        contentPersonality = localStorage.getItem("contentPersonality") || "";
      }
      
      console.log("Sending script generation request with profile data:", {
        niche, audience, platform, videoType, 
        contentStyle, contentPersonality,
        activeProfileName: activeStyleProfile?.name || "None"
      });

      // Call the generate-ideas function with the type parameter set to 'script'
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
          // Add required fields for the API
          niche,
          audience, 
          videoType,
          platform,
          // Add style information
          contentStyle,
          contentPersonality
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Failed to generate script: ${error.message || "Unknown error"}`);
      }
      
      if (!data) {
        throw new Error("No data received from script generation function");
      }
      
      if (data.error) {
        console.error("Error in function response:", data.error);
        throw new Error(`Error from AI service: ${data.error}`);
      }
      
      if (!data.script) {
        // If we have a raw response, it means the AI returned something but it wasn't JSON
        if (data.rawResponse) {
          console.log("Raw AI response:", data.rawResponse);
          throw new Error("The AI returned an invalid format. Please try again.");
        }
        
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
      setError(error.message || "Failed to generate script");
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

  // Update this to recalculate when showVisuals changes
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

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Style Profile Section - Updated to match Generator.tsx */}
          {activeStyleProfile && (
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 hover:bg-primary/15">
                  <Paintbrush className="h-3.5 w-3.5 mr-1.5" />
                  Style: {activeStyleProfile.name}
                </Badge>
              </div>
              <Button 
                variant="link" 
                onClick={navigateToStyleProfiles}
                className="text-sm"
              >
                Change Style Profile
              </Button>
            </div>
          )}

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
                    {filteredIdeas.length > 0 ? (
                      filteredIdeas.map((idea) => (
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
                      ))
                    ) : (
                      <CarouselItem className="pl-2 md:pl-4 pt-2 pb-2">
                        <div className="p-4 text-center">
                          <p className="text-muted-foreground">No saved ideas found. Try changing the filters or create a custom idea.</p>
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {filteredIdeas.length > 3 && (
                    <>
                      <CarouselPrevious className="-left-12 md:-left-16" />
                      <CarouselNext className="-right-12 md:-right-16" />
                    </>
                  )}
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
            
            {/* Hook and Structure dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="selectedHook">Opening Hook (Optional)</Label>
                <Select value={selectedHook || "none"} onValueChange={setSelectedHook}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hook" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No hook</SelectItem>
                    {hooks.map((hook) => (
                      <SelectItem key={hook.id} value={hook.id || ""}>
                        {hook.category}: {hook.hook.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="selectedStructure">Script Structure (Optional)</Label>
                <Select value={selectedStructure || "none"} onValueChange={setSelectedStructure}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default structure</SelectItem>
                    {structures.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id || ""}>
                        {structure.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button 
            onClick={generateScript} 
            disabled={loading || 
              (scriptType === "existing" && !selectedIdea) || 
              (scriptType === "custom" && (!customTitle || !customDescription))}
            className="w-full"
          >
            {loading ? (
              <>
                <span className="mr-2">Generating...</span>
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Script
              </>
            )}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
