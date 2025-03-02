
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Undo2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import VideoIdeaSelector from "@/components/script/VideoIdeaSelector";
import HookSelector from "@/components/script/HookSelector";
import { supabase } from "@/integrations/supabase/client";

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

      // Use the actual video idea title and description if using a saved idea
      const scriptTitle = useSavedIdea ? savedIdea.title : title;
      const scriptDescription = useSavedIdea ? savedIdea.description : description;

      console.log("Sending parameters:", {
        title: scriptTitle,
        description: scriptDescription,
        contentStyle,
        hook: selectedHook,
        userId,
        savedIdea: useSavedIdea ? savedIdea : null,
      });

      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: {
          title: scriptTitle,
          description: scriptDescription,
          contentStyle,
          hook: selectedHook,
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

      if (data.error) {
        console.error('Error in function response:', data.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error from AI service: ${data.error}`,
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
      const { error } = await supabase
        .from("video_ideas")
        .update({ script: script })
        .eq("id", savedIdea.id);

      if (error) {
        throw error;
      }

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
    // If they select an idea, automatically switch to saved idea mode
    setUseSavedIdea(true);
  };

  const clearScript = () => {
    setScript("");
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
        {/* Left Column: Video Details */}
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

        {/* Right Column: Content Style & Hook */}
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
              
              <div className="space-y-2">
                <Label>Add a Hook to Your Script</Label>
                <HookSelector onSelectHook={handleSelectHook} selectedHook={selectedHook} />
                
                {selectedHook && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">{selectedHook}</p>
                  </div>
                )}
              </div>

              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Scripts are generated with a natural, conversational tone - like a friend talking to a friend.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Script Output Section */}
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
