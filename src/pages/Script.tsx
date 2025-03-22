import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Undo2, Save, HelpCircle, Timer, X, Upload, ChevronDown, ChevronUp, Diamond } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import VideoIdeaSelector from "@/components/script/VideoIdeaSelector";
import HookSelector from "@/components/script/HookSelector";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";

const Script = () => {
  const [title, setTitle] = useState("");
  const [savedIdea, setSavedIdea] = useState<any | null>(null);
  const [description, setDescription] = useState("");
  const [script, setScript] = useState("");
  const [contentStyle, setContentStyle] = useState("educational");
  const [selectedHook, setSelectedHook] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [useSavedIdea, setUseSavedIdea] = useState(false);
  const [isSavingScript, setIsSavingScript] = useState(false);
  const [duration, setDuration] = useState("60");
  const [durationUnit, setDurationUnit] = useState("seconds");
  const [userScriptOpen, setUserScriptOpen] = useState(false);
  const [baseScript, setBaseScript] = useState("");
  const [isUsingBaseScript, setIsUsingBaseScript] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");
  const [isImproving, setIsImproving] = useState(false);
  const [userScript, setUserScript] = useState("");
  const [scriptStats, setScriptStats] = useState<{wordCount?: number, estimatedDuration?: number, targetWordCount?: number} | null>(null);
  const WORDS_PER_MINUTE = 150;
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [roughScriptOpen, setRoughScriptOpen] = useState(false);

  useEffect(() => {
    if (durationUnit === "seconds" && duration.includes('.')) {
      setDuration(Math.round(parseFloat(duration) * 60).toString());
    } else if (durationUnit === "minutes" && !duration.includes('.')) {
      setDuration((parseInt(duration) / 60).toString());
    }
  }, [durationUnit]);

  const handleDurationUnitChange = (newUnit: string) => {
    if (newUnit === durationUnit) return;
    
    if (newUnit === "minutes" && durationUnit === "seconds") {
      const minutes = (parseInt(duration) / 60).toFixed(2);
      setDuration(parseFloat(minutes).toString());
    } else if (newUnit === "seconds" && durationUnit === "minutes") {
      const seconds = Math.round(parseFloat(duration) * 60);
      setDuration(seconds.toString());
    }
    
    setDurationUnit(newUnit);
  };

  const generateScript = async () => {
    if (useSavedIdea && !savedIdea) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a saved idea.",
      });
      return;
    }

    if (!useSavedIdea && !title) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter a title for your script.",
      });
      return;
    }

    setIsGenerating(true);
    setScriptStats(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      const scriptTitle = useSavedIdea ? savedIdea.title : title;
      const scriptDescription = useSavedIdea ? savedIdea.description : description;

      let targetDurationInMinutes;
      if (durationUnit === "seconds") {
        targetDurationInMinutes = (parseInt(duration) / 60).toFixed(2);
      } else {
        targetDurationInMinutes = duration;
      }
      
      const minDuration = (parseFloat(targetDurationInMinutes) * 0.9).toFixed(2);
      const maxDuration = (parseFloat(targetDurationInMinutes) * 1.1).toFixed(2);
      const targetDurationRange = `${minDuration}-${maxDuration}`;

      console.log("Sending parameters:", {
        title: scriptTitle,
        description: scriptDescription,
        contentStyle,
        hook: selectedHook || null,
        targetLength: null,
        targetDuration: targetDurationRange,
        wordsPerMinute: WORDS_PER_MINUTE,
        userId,
        savedIdea: useSavedIdea ? savedIdea : null,
        userScript: isUsingBaseScript ? baseScript : null,
        isImprovement: isUsingBaseScript,
        roughScript: isUsingBaseScript ? baseScript : null
      });

      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: {
          title: scriptTitle,
          description: scriptDescription,
          contentStyle,
          hook: selectedHook || null,
          targetLength: null,
          targetDuration: targetDurationRange,
          wordsPerMinute: WORDS_PER_MINUTE,
          userId,
          savedIdea: useSavedIdea ? savedIdea : null,
          userScript: isUsingBaseScript ? baseScript : null,
          isImprovement: isUsingBaseScript,
          roughScript: isUsingBaseScript ? baseScript : null
        },
      });

      if (error) {
        console.error('Error generating script:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to generate script: ${error.message}`,
        });
        return;
      }

      if (data && data.error) {
        console.error('Error in function response:', data.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error from AI service: ${data.error}`,
        });
        return;
      }

      if (!data || !data.script) {
        console.error('Invalid response from function:', data);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Received an invalid response from the server. Please try again.",
        });
        return;
      }

      setScript(data.script);
      setScriptStats({
        wordCount: data.wordCount,
        estimatedDuration: data.estimatedDuration,
        targetWordCount: data.targetWordCount
      });
      
      toast({
        title: "Success",
        description: "Script generated successfully!",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const improveUserScript = async () => {
    if (!userScript.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter your script first.",
      });
      return;
    }

    setIsImproving(true);
    setScriptStats(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: {
          userScript: userScript.trim(),
          contentStyle,
          userId,
          isImprovement: true,
        },
      });

      if (error) {
        console.error('Error improving script:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to improve script: ${error.message}`,
        });
        return;
      }

      if (data && data.error) {
        console.error('Error in function response:', data.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error from AI service: ${data.error}`,
        });
        return;
      }

      if (!data || !data.script) {
        console.error('Invalid response from function:', data);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Received an invalid response from the server. Please try again.",
        });
        return;
      }

      setScript(data.script);
      setScriptStats({
        wordCount: data.wordCount,
        estimatedDuration: data.estimatedDuration
      });
      
      toast({
        title: "Success",
        description: "Your script has been improved successfully!",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const saveScriptToIdea = async () => {
    if (!script) {
      toast({
        variant: "destructive",
        title: "No script to save",
        description: "Please generate a script first.",
      });
      return;
    }

    if (!useSavedIdea || !savedIdea) {
      toast({
        variant: "destructive",
        title: "Cannot save script",
        description: "You need to select a saved idea to save the script.",
      });
      return;
    }

    setIsSavingScript(true);

    try {
      console.log("Saving script to idea ID:", savedIdea.id);
      console.log("Script content:", script);
      
      const { error } = await supabase
        .from("video_ideas")
        .update({ 
          script: script,
          is_saved: true 
        })
        .eq("id", savedIdea.id);

      if (error) {
        throw error;
      }

      setSavedIdea({
        ...savedIdea,
        script: script
      });

      toast({
        title: "Success",
        description: "Script saved to idea successfully!",
      });
    } catch (error: any) {
      console.error("Error saving script:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save script. Please try again.",
      });
    } finally {
      setIsSavingScript(false);
    }
  };

  const handleSelectHook = (hookText: string) => {
    setSelectedHook(hookText);
  };

  const handleRemoveHook = () => {
    setSelectedHook("");
    toast({
      title: "Hook removed",
      description: "The hook has been removed from your script.",
    });
  };

  const handleSelectIdea = (idea: any) => {
    setSavedIdea(idea);
    setUseSavedIdea(true);
  };

  const clearScript = () => {
    setScript("");
  };

  const calculateWordCount = () => {
    const durationInMinutes = durationUnit === "seconds" 
      ? parseInt(duration) / 60 
      : parseInt(duration);
    
    return Math.round(durationInMinutes * WORDS_PER_MINUTE);
  };

  return (
    <div className="container py-4 md:py-6 space-y-4 md:space-y-8 max-w-full px-2 md:px-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Script Generator</h1>
        <div className="flex flex-wrap gap-2">
          {script && (
            <Button variant="outline" onClick={clearScript} size={isMobile ? "sm" : "default"} className="h-9">
              <Undo2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={activeTab === "generator" ? generateScript : improveUserScript} 
            disabled={activeTab === "generator" ? isGenerating : isImproving}
            size={isMobile ? "sm" : "default"}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(activeTab === "generator" ? isGenerating : isImproving) ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button 
            onClick={activeTab === "generator" ? generateScript : improveUserScript} 
            disabled={activeTab === "generator" ? isGenerating : isImproving}
            size={isMobile ? "sm" : "default"}
            className="h-9"
          >
            {activeTab === "generator" ? (
              isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isMobile ? "Loading..." : "Generating..."}
                </>
              ) : (
                <>Generate{!isMobile && " Script"}</>
              )
            ) : (
              isImproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isMobile ? "Loading..." : "Improving..."}
                </>
              ) : (
                <>Improve{!isMobile && " Script"}</>
              )
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generator" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 md:mb-6 w-full">
          <TabsTrigger value="generator" className="flex-1">Generate New Script</TabsTrigger>
          <TabsTrigger value="improve" className="flex-1">Improve Your Script</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-4 md:space-y-6">
              <Card>
                <CardContent className="pt-4 md:pt-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="use-saved-idea" 
                      checked={useSavedIdea}
                      onCheckedChange={setUseSavedIdea}
                    />
                    <Label htmlFor="use-saved-idea">Use a saved idea</Label>
                  </div>
                  
                  {useSavedIdea ? (
                    <div className="space-y-3 md:space-y-4">
                      <div className="space-y-2">
                        <Label>Select a saved idea</Label>
                        <VideoIdeaSelector onSelectIdea={handleSelectIdea} />
                      </div>
                      
                      {savedIdea && (
                        <div className="space-y-2 p-3 md:p-4 bg-muted rounded-md">
                          <p className="font-medium">{savedIdea.title}</p>
                          <p className="text-sm text-muted-foreground">{savedIdea.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Video Title</Label>
                        <Input
                          id="title"
                          placeholder="Enter a title for your video"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what your video is about"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={isMobile ? 3 : 4}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 md:pt-6">
                  <Collapsible
                    open={roughScriptOpen}
                    onOpenChange={setRoughScriptOpen}
                    className="space-y-4"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="rough-script" className="cursor-pointer">Already have a rough script? Add it here</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <HelpCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  The AI will use your rough script as a starting point and enhance it based on your other inputs
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {roughScriptOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4">
                      <Textarea
                        id="rough-script"
                        placeholder="Paste your rough script here..."
                        value={baseScript}
                        onChange={(e) => setBaseScript(e.target.value)}
                        rows={isMobile ? 3 : 4}
                      />
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="use-base-script" 
                          checked={isUsingBaseScript}
                          onCheckedChange={setIsUsingBaseScript}
                        />
                        <Label htmlFor="use-base-script">Use this as a starting point for the AI</Label>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 md:space-y-6">
              <Card>
                <CardContent className="pt-4 md:pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content-style">Content Style</Label>
                    <Select
                      value={contentStyle}
                      onValueChange={setContentStyle}
                    >
                      <SelectTrigger id="content-style">
                        <SelectValue placeholder="Select a content style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="entertaining">Entertaining</SelectItem>
                        <SelectItem value="informative">Informative</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="controversial">Controversial</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="duration">Target Duration</Label>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Enter the target duration for your video (approximately {calculateWordCount()} words at {WORDS_PER_MINUTE} words per minute)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex space-x-2 md:space-x-3">
                      <div className="flex-1">
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          placeholder="Duration"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="w-1/3">
                        <Select
                          value={durationUnit}
                          onValueChange={handleDurationUnitChange}
                        >
                          <SelectTrigger id="duration-unit" className="w-full">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seconds">Seconds</SelectItem>
                            <SelectItem value="minutes">Minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Add a Hook (Optional)</Label>
                    </div>
                    <HookSelector 
                      onSelectHook={handleSelectHook} 
                      selectedHook={selectedHook}
                      topic={useSavedIdea ? savedIdea?.title : title}
                      audience=""
                      details={useSavedIdea ? savedIdea?.description : description}
                    />
                    
                    {selectedHook && (
                      <div className="mt-2 p-2 md:p-3 bg-muted rounded-md relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-1 right-1 md:top-2 md:right-2 h-6 w-6" 
                          onClick={handleRemoveHook}
                          aria-label="Remove hook"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-sm pr-6">{selectedHook}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="improve" className="space-y-4 md:space-y-6">
          <Card>
            <CardContent className="pt-4 md:pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="user-script">Paste Your Script Here</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Paste your existing script here and our AI will enhance it to be more engaging
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="user-script"
                  placeholder="Paste your script text here..."
                  value={userScript}
                  onChange={(e) => setUserScript(e.target.value)}
                  rows={isMobile ? 6 : 8}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="improve-content-style">Content Style</Label>
                <Select
                  value={contentStyle}
                  onValueChange={setContentStyle}
                >
                  <SelectTrigger id="improve-content-style">
                    <SelectValue placeholder="Select a content style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="entertaining">Entertaining</SelectItem>
                    <SelectItem value="informative">Informative</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                    <SelectItem value="controversial">Controversial</SelectItem>
                    <SelectItem value="storytelling">Storytelling</SelectItem>
                    <SelectItem value="viral">Viral/Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {script && (
        <Card className="mt-4 md:mt-8">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-semibold">{activeTab === "improve" ? "Improved Script" : "Generated Script"}</h2>
              <div className="flex items-center gap-2 md:gap-4">
                {scriptStats && (
                  <div className="text-sm text-muted-foreground flex flex-col items-end">
                    <span>{scriptStats.wordCount} words</span>
                    <span>~{scriptStats.estimatedDuration} min</span>
                  </div>
                )}
                
                {useSavedIdea && savedIdea && (
                  <Button 
                    onClick={saveScriptToIdea} 
                    disabled={isSavingScript}
                    variant="secondary"
                    size={isMobile ? "sm" : "default"}
                    className="h-8"
                  >
                    {isSavingScript ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-2" />
                        Save to Idea
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="whitespace-pre-wrap bg-muted p-3 md:p-4 rounded-md h-[250px] md:h-[400px] overflow-y-auto text-sm md:text-base">
              {script}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Script;
