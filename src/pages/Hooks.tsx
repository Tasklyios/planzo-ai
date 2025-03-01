
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Zap, BookmarkIcon, Bookmark, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateHooks, saveHook, getSavedHooks, deleteSavedHook } from '@/services/hookService';
import { HookType, SavedHook } from '@/types/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Hooks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [details, setDetails] = useState('');
  const [generatedHooks, setGeneratedHooks] = useState<HookType[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch saved hooks
  const { data: savedHooks, isLoading: isFetchingHooks } = useQuery({
    queryKey: ['savedHooks'],
    queryFn: getSavedHooks,
  });

  // Save hook mutation
  const saveHookMutation = useMutation({
    mutationFn: saveHook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedHooks'] });
      toast({
        title: "Hook saved",
        description: "Your hook has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to save hook",
        description: error.message,
      });
    },
  });

  // Delete hook mutation
  const deleteHookMutation = useMutation({
    mutationFn: deleteSavedHook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedHooks'] });
      toast({
        title: "Hook deleted",
        description: "Your hook has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete hook",
        description: error.message,
      });
    },
  });

  const handleGenerateHooks = async () => {
    if (!topic || !audience) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both topic and target audience.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const hooks = await generateHooks(topic, audience, details);
      setGeneratedHooks(hooks);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to generate hooks",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveHook = (hook: HookType) => {
    saveHookMutation.mutate(hook);
  };

  const handleDeleteHook = (id: string) => {
    deleteHookMutation.mutate(id);
  };

  const filterHooksByCategory = (hooks: HookType[] | SavedHook[], category: string) => {
    return hooks.filter(hook => hook.category === category);
  };

  // Function to get the hook text regardless of whether it's a HookType or SavedHook
  const getHookText = (hook: HookType | SavedHook): string => {
    return 'hook_text' in hook ? hook.hook_text : hook.hook;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Hook Generator</h1>
        <p className="text-muted-foreground">Create attention-grabbing hooks for your content</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Hooks</TabsTrigger>
          <TabsTrigger value="saved">Saved Hooks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Hook Generator</CardTitle>
                  <CardDescription>Tell us what your content is about and we'll create engaging hooks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">What's your content about?</Label>
                    <Input 
                      id="topic" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Mindfulness meditation benefits" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Who's your target audience?</Label>
                    <Input 
                      id="audience" 
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g., Working professionals ages 25-40" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="details">Additional details (optional)</Label>
                    <Textarea 
                      id="details" 
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Add any specific details or requirements for your hooks" 
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full blue-gradient" 
                    onClick={handleGenerateHooks}
                    disabled={isGenerating || !topic || !audience}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Hooks
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Hook Types</CardTitle>
                  <CardDescription>Different styles for different platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted rounded-lg p-3">
                    <h3 className="font-medium">Question Hooks</h3>
                    <p className="text-sm text-muted-foreground">Engage your audience with thought-provoking questions</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <h3 className="font-medium">Statistic Hooks</h3>
                    <p className="text-sm text-muted-foreground">Grab attention with surprising facts and numbers</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <h3 className="font-medium">Story Hooks</h3>
                    <p className="text-sm text-muted-foreground">Begin with a compelling narrative or anecdote</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <h3 className="font-medium">Challenge Hooks</h3>
                    <p className="text-sm text-muted-foreground">Address common misconceptions or beliefs</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {generatedHooks.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Generated Hooks</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Question Hooks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {filterHooksByCategory(generatedHooks, 'question').map((hook, index) => (
                        <div key={index} className="p-3 border rounded-md flex justify-between items-start gap-2">
                          <p>{getHookText(hook)}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => 'hook_text' in hook ? handleSaveHook(hook as HookType) : null}
                            disabled={saveHookMutation.isPending}
                          >
                            <BookmarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistic Hooks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {filterHooksByCategory(generatedHooks, 'statistic').map((hook, index) => (
                        <div key={index} className="p-3 border rounded-md flex justify-between items-start gap-2">
                          <p>{getHookText(hook)}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => 'hook_text' in hook ? handleSaveHook(hook as HookType) : null}
                            disabled={saveHookMutation.isPending}
                          >
                            <BookmarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Story Hooks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {filterHooksByCategory(generatedHooks, 'story').map((hook, index) => (
                        <div key={index} className="p-3 border rounded-md flex justify-between items-start gap-2">
                          <p>{getHookText(hook)}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => 'hook_text' in hook ? handleSaveHook(hook as HookType) : null}
                            disabled={saveHookMutation.isPending}
                          >
                            <BookmarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Challenge Hooks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {filterHooksByCategory(generatedHooks, 'challenge').map((hook, index) => (
                        <div key={index} className="p-3 border rounded-md flex justify-between items-start gap-2">
                          <p>{getHookText(hook)}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => 'hook_text' in hook ? handleSaveHook(hook as HookType) : null}
                            disabled={saveHookMutation.isPending}
                          >
                            <BookmarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Hooks</CardTitle>
              <CardDescription>Your bookmarked hooks that can be used in scripts</CardDescription>
            </CardHeader>
            <CardContent>
              {isFetchingHooks ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !savedHooks || savedHooks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No saved hooks yet. Generate and bookmark some hooks to see them here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {['question', 'statistic', 'story', 'challenge'].map(category => {
                    const hooksInCategory = filterHooksByCategory(savedHooks, category);
                    if (hooksInCategory.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="font-medium capitalize mb-2">{category} Hooks</h3>
                        <div className="space-y-2">
                          {hooksInCategory.map(hook => (
                            <div 
                              key={(hook as SavedHook).id} 
                              className="p-3 border rounded-md flex justify-between items-start"
                            >
                              <p>{getHookText(hook)}</p>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteHook((hook as SavedHook).id)}
                                disabled={deleteHookMutation.isPending}
                              >
                                <Bookmark className="h-4 w-4 text-blue-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Hooks;
