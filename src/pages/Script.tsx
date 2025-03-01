
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GeneratedIdea } from '@/types/idea';
import { getSavedHooks } from '@/services/hookService';
import HookSelector from '@/components/script/HookSelector';
import VideoIdeaSelector from '@/components/script/VideoIdeaSelector';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Script = () => {
  const [scriptContent, setScriptContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Function to handle hook selection
  const handleSelectHook = (hookText: string) => {
    // Insert the hook at the beginning of the script content
    setScriptContent(prevContent => `${hookText}\n\n${prevContent || ''}`);
  };

  // Function to handle idea selection
  const handleSelectIdea = (idea: GeneratedIdea) => {
    setSelectedIdea(idea);
    setTitle(idea.title);
    setDescription(idea.description);
    
    // Extract tags if available and add to details
    if (idea.tags && idea.tags.length > 0) {
      setDetails(`Tags: ${idea.tags.join(', ')}\nCategory: ${idea.category || 'General'}`);
    }
  };

  // Function to save the script
  const handleSaveScript = async () => {
    if (!scriptContent.trim()) {
      toast({
        variant: "destructive",
        title: "Cannot save empty script",
        description: "Please generate or write a script before saving.",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to save your script.",
        });
        return;
      }

      const { error } = await supabase
        .from('scripts')
        .insert({
          content: scriptContent,
          user_id: session.user.id,
          idea_id: selectedIdea?.id || null,
        });

      if (error) throw error;

      // If selected idea exists, update its script field
      if (selectedIdea?.id) {
        const { error: updateError } = await supabase
          .from('video_ideas')
          .update({ script: scriptContent })
          .eq('id', selectedIdea.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Script saved successfully",
        description: "Your script has been saved to your account.",
      });
    } catch (error: any) {
      console.error('Error saving script:', error);
      toast({
        variant: "destructive",
        title: "Error saving script",
        description: error.message || "Failed to save your script. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to generate a script using AI
  const handleGenerateScript = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please enter a title or select an idea for your script.",
      });
      return;
    }

    setLoading(true);
    // This is a placeholder for future AI script generation
    // In a real implementation, this would call an edge function
    
    // Simulate script generation with a delay
    setTimeout(() => {
      const generatedScript = `# ${title}\n\n## Introduction\nHook: Grab your audience's attention with a strong opener.\n\n## Main Content\n1. First key point about ${title}\n2. Second key point with supporting details\n3. Third key point with examples\n\n## Conclusion\nSummarize the main points and include a call to action.\n\n[Generated script for demonstration purposes]`;
      setScriptContent(generatedScript);
      setLoading(false);
      
      toast({
        title: "Script generated",
        description: "Your script has been generated. Feel free to edit it before saving.",
      });
    }, 2000);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Generate Scripts</h1>
        <p className="text-muted-foreground">Create engaging scripts for your content</p>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">Script Generator</TabsTrigger>
          <TabsTrigger value="ideas">Select from Ideas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Script Generator</CardTitle>
                <CardDescription>Enter your content details to generate a script</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., How to meditate effectively" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="e.g., A step-by-step guide to meditation"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Additional details</Label>
                  <Textarea 
                    id="details" 
                    placeholder="Add any specific details or requirements for your script"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleGenerateScript} 
                  className="w-full mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Script"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Script</CardTitle>
                <CardDescription>
                  {selectedIdea ? `Script for: ${selectedIdea.title}` : "Your generated script will appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  placeholder="Your script will be generated here" 
                  className="min-h-[200px]"
                />
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveScript}
                  disabled={loading || !scriptContent.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Script"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ideas" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Video Idea</CardTitle>
                <CardDescription>Choose from your existing video ideas</CardDescription>
              </CardHeader>
              <CardContent>
                <VideoIdeaSelector onSelectIdea={handleSelectIdea} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add a Hook</CardTitle>
                <CardDescription>Select a hook to start your script</CardDescription>
              </CardHeader>
              <CardContent>
                <HookSelector onSelectHook={handleSelectHook} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Script;
