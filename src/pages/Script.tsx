import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Undo2, Save, HelpCircle, Timer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import VideoIdeaSelector from "@/components/script/VideoIdeaSelector";
import HookSelector from "@/components/script/HookSelector";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [wordsPerMinute, setWordsPerMinute] = useState(150);
  const { toast } = useToast();

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
        wordsPerMinute,
        userId,
        savedIdea: useSavedIdea ? savedIdea : null,
      });

      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: {
          title: scriptTitle,
          description: scriptDescription,
          contentStyle,
          hook: selectedHook || null,
          targetLength: null,
          targetDuration: targetDurationRange,
          wordsPerMinute,
          userId,
          savedIdea: useSavedIdea ? savedIdea : null,
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
    
    return Math.round(durationInMinutes * wordsPerMinute);
  };

  const approximateWordCount = calculateWordCount();

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
          <Button variant="outline" onClick={generateScript} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button onClick={generateScript} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Script"
            )}
          </Button>
        </div>
      </div>

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
                      onValueChange={setDurationUnit}
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
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="words-per-minute">
                      Speaking Rate (words per minute): {wordsPerMinute}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-2 max-w-xs">
                            <p>Average speaking rates:</p>
                            <p>120-150: Slow, deliberate speech</p>
                            <p>150-180: Conversational speech</p>
                            <p>180-200: Fast-paced, energetic speech</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1">
                    {[120, 150, 180].map((rate) => (
                      <Button
                        key={rate}
                        type="button"
                        variant={wordsPerMinute === rate ? "default" : "outline"}
                        className="h-9 text-xs"
                        onClick={() => setWordsPerMinute(rate)}
                      >
                        {rate === 120 ? "Slow" : rate === 150 ? "Normal" : "Fast"}
                        <span className="ml-1 opacity-70">({rate})</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {approximateWordCount && (
                  <div className="p-3 bg-muted rounded-md flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <p className="text-sm">
                      Approximate word count: <strong>{approximateWordCount} words</strong>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Add a Hook (Optional)</Label>
                </div>
                <HookSelector onSelectHook={handleSelectHook} selectedHook={selectedHook} />
                
                {selectedHook && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">{selectedHook}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {script && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Script</h2>
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
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
              {script}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Script;
