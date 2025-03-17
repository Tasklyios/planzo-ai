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
import ChatWidget from "@/components/ChatWidget";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const WORDS_PER_MINUTE = 150;
  const { toast } = useToast();

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
        isImprovement: isUsingBaseScript
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
          isImprovement: isUsingBaseScript
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

  const handleScriptUpdate = (updatedScript: string) => {
    setScript(updatedScript);
  };

  const calculateWordCount = () => {
    const durationInMinutes = durationUnit === "seconds" 
      ? parseInt(duration) / 60 
      : parseInt(duration);
    
    return Math.round(durationInMinutes * WORDS_PER_MINUTE);
  };

  return (
    <div className="container py-6 space-y-8 max-w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Script Generator</h1>
        <div className="flex gap-2">
          {script && (
            <Button variant="outline" onClick={clearScript}>
              <Undo2 className="h-4 w-4 mr-2" />
              Clear Script
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={activeTab === "generator" ? generateScript : improveUserScript} 
            disabled={activeTab === "generator" ? isGenerating : isImproving}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(activeTab === "generator" ? isGenerating : isImproving) ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button 
            onClick={activeTab === "generator" ? generateScript : improveUserScript} 
            disabled={activeTab === "generator" ? isGenerating : isImproving}
          >
            {activeTab === "generator" ? (
              isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Script"
              )
            ) : (
              isImproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Improving...
                </>
              ) : (
                "Improve Script"
              )
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generator" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="generator">Generate New Script</TabsTrigger>
          <TabsTrigger value="improve">Improve Your Script</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="use-saved-idea" 
                      checked={useSavedIdea}
                      onCheckedChange={setUseSavedIdea}
                    />
                    <Label htmlFor="use-saved-idea">Use a saved idea</Label>
                  </div>
                  
                  {useSavedIdea ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select a saved idea</Label>
                        <VideoIdeaSelector onSelectIdea={handleSelectIdea} />
                      </div>
                      
                      {savedIdea && (
                        <div className="space-y-2 p-4 bg-muted rounded-md">
                          <p className="font-medium">{savedIdea.title}</p>
                          <p className="text-sm text-muted-foreground">{savedIdea.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                          rows={4}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
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

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="duration">Target Duration</Label>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Enter the target duration for your video
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex space-x-3">
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
                      <div className="mt-2 p-3 bg-muted rounded-md relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-6 w-6" 
                          onClick={handleRemoveHook}
                          aria-label="Remove hook"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-sm pr-6">{selectedHook}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 mt-2">
                    <Collapsible 
                      open={userScriptOpen} 
                      onOpenChange={setUserScriptOpen}
                      className="border rounded-md p-4"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Upload className="h-4 w-4 mr-2" />
                          <span>Already have a basic script? Add it here!</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Diamond className="h-4 w-4 ml-2 text-blue-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Premium feature - Available on paid plans
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {userScriptOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4 space-y-4">
                        <Textarea
                          id="base-script"
                          placeholder="Paste your existing script..."
                          value={baseScript}
                          onChange={(e) => setBaseScript(e.target.value)}
                          rows={6}
                        />
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="use-base-script" 
                            checked={isUsingBaseScript}
                            onCheckedChange={setIsUsingBaseScript}
                          />
                          <Label htmlFor="use-base-script">Use this script as a starting point</Label>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="improve" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="user-script">Paste Your Script Here</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
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
                  rows={8}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{activeTab === "improve" ? "Improved Script" : "Generated Script"}</h2>
                {useSavedIdea && savedIdea && (
                  <Button 
                    onClick={saveScriptToIdea} 
                    disabled={isSavingScript}
                    variant="secondary"
                  >
                    {isSavingScript ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save to Idea
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="whitespace-pre-wrap bg-muted p-4 rounded-md h-[400px] overflow-y-auto">
                {script}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Script Coach</h2>
              <ChatWidget script={script} onScriptUpdate={handleScriptUpdate} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Script;
