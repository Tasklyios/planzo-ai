import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Anchor, Bookmark, Loader2, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSavedHooks, generateHooks, saveHook } from '@/services/hookService';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HookType } from '@/types/hooks';
import { useToast } from "@/components/ui/use-toast";

interface HookSelectorProps {
  onSelectHook: (hookText: string) => void;
  selectedHook?: string;
}

const normalizeHook = (hook: any): HookType => {
  let category = hook.category?.toLowerCase() || '';
  
  if (category === 'benefit' || category === 'problem-solution' || category === 'controversial') {
    category = 'challenge';
  }
  
  if (!['question', 'statistic', 'story', 'challenge'].includes(category)) {
    category = 'question';
  }
  
  return {
    id: hook.id,
    category: category,
    hook_text: hook.hook_text || hook.hook || '',
    created_at: hook.created_at,
  };
};

const HookSelector = ({ onSelectHook, selectedHook }: HookSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('saved');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [details, setDetails] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedHooks, setGeneratedHooks] = useState<HookType[]>([]);
  const [savingHookId, setSavingHookId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: savedHooksRaw, 
    isLoading: isLoadingSavedHooks,
    refetch: refetchSavedHooks
  } = useQuery({
    queryKey: ['savedHooks'],
    queryFn: getSavedHooks,
  });

  const saveHookMutation = useMutation({
    mutationFn: saveHook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedHooks'] });
      toast({
        title: "Hook saved",
        description: "Your hook has been saved successfully.",
      });
      setSavingHookId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to save hook",
        description: error.message,
      });
      setSavingHookId(null);
    },
  });

  const savedHooks = savedHooksRaw ? savedHooksRaw.map(normalizeHook) : [];

  useEffect(() => {
    if (!open) {
      setGeneratedHooks([]);
      setActiveTab('saved');
    }
  }, [open]);

  const filterHooks = (category: string, hooks: HookType[] | undefined) => {
    if (!hooks) return [];
    
    return hooks
      .filter(hook => 
        hook.category === category && 
        (searchTerm === '' || hook.hook_text.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  };

  const handleSelectHook = (hookText: string) => {
    onSelectHook(hookText);
    setOpen(false);
  };

  const handleSaveHook = (hook: HookType) => {
    setSavingHookId(hook.id || hook.hook_text);
    saveHookMutation.mutate(hook);
  };

  const isHookSaved = (hookText: string): boolean => {
    return savedHooks.some(savedHook => savedHook.hook_text === hookText);
  };

  const handleGenerateHooks = async () => {
    if (!topic.trim()) {
      toast({
        variant: "destructive",
        title: "Topic required",
        description: "Please enter a topic for your hooks."
      });
      return;
    }

    setGenerating(true);
    try {
      const generatedRawHooks = await generateHooks(topic, audience, details);
      
      const normalizedHooks = generatedRawHooks.map(normalizeHook);
      console.log("Normalized hooks with corrected categories:", normalizedHooks);
      
      setGeneratedHooks(normalizedHooks);
      setActiveTab('generate');
      
      toast({
        title: "Hooks generated",
        description: `${normalizedHooks.length} hooks have been generated for your topic.`
      });
    } catch (error: any) {
      console.error("Error generating hooks:", error);
      toast({
        variant: "destructive",
        title: "Error generating hooks",
        description: error.message || "Failed to generate hooks. Please try again."
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSheetOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    
    if (isOpen) {
      setActiveTab('generate');
      
      if (topic && audience && details) {
        handleGenerateHooks();
      }
    } else {
      setGeneratedHooks([]);
      setActiveTab('saved');
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <Anchor className="mr-2 h-4 w-4" />
          Add a Hook
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg" side="right">
        <SheetHeader>
          <SheetTitle>Select a Hook</SheetTitle>
          <SheetDescription>
            Choose from your saved hooks or generate new ones
          </SheetDescription>
        </SheetHeader>
        
        <Tabs 
          defaultValue="saved" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved">Saved Hooks</TabsTrigger>
            <TabsTrigger value="generate">Generate New</TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved" className="mt-4 space-y-4">
            <Input
              placeholder="Search hooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            {isLoadingSavedHooks ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !savedHooks || savedHooks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No saved hooks found. Create some in the Hooks section or generate new ones.</p>
                <Button 
                  variant="outline" 
                  className="mt-2" 
                  onClick={() => setActiveTab('generate')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Generate New Hooks
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="question" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="question">Question</TabsTrigger>
                  <TabsTrigger value="statistic">Statistic</TabsTrigger>
                  <TabsTrigger value="story">Story</TabsTrigger>
                  <TabsTrigger value="challenge">Challenge</TabsTrigger>
                </TabsList>
                
                {['question', 'statistic', 'story', 'challenge'].map(category => (
                  <TabsContent key={category} value={category} className="max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2 py-2">
                      {filterHooks(category, savedHooks).length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          {searchTerm ? 'No matching hooks found' : `No ${category} hooks saved`}
                        </p>
                      ) : (
                        filterHooks(category, savedHooks).map(hook => (
                          <Button
                            key={hook.id}
                            variant="ghost"
                            className="w-full justify-start text-left p-3 h-auto"
                            onClick={() => handleSelectHook(hook.hook_text)}
                          >
                            {hook.hook_text}
                          </Button>
                        ))
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </TabsContent>
          
          <TabsContent value="generate" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input 
                  id="topic" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-muted"
                  readOnly
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input 
                  id="audience" 
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="bg-muted"
                  readOnly
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="details">Additional Details</Label>
                <Textarea 
                  id="details" 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="bg-muted min-h-24"
                  readOnly
                />
              </div>
              
              <Button
                onClick={handleGenerateHooks}
                disabled={generating || !topic.trim()}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Hooks
                  </>
                )}
              </Button>
            </div>
            
            {generatedHooks.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="font-medium">Generated Hooks</h3>
                
                <Tabs defaultValue="question" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="question">Question</TabsTrigger>
                    <TabsTrigger value="statistic">Statistic</TabsTrigger>
                    <TabsTrigger value="story">Story</TabsTrigger>
                    <TabsTrigger value="challenge">Challenge</TabsTrigger>
                  </TabsList>
                  
                  {['question', 'statistic', 'story', 'challenge'].map(category => (
                    <TabsContent key={category} value={category} className="max-h-[40vh] overflow-y-auto">
                      <div className="space-y-2 py-2">
                        {filterHooks(category, generatedHooks).length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            No {category} hooks generated
                          </p>
                        ) : (
                          filterHooks(category, generatedHooks).map((hook, index) => (
                            <div 
                              key={`generated-${category}-${index}`}
                              className="p-3 border rounded-md flex justify-between items-start"
                            >
                              <p className="flex-1">{hook.hook_text}</p>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={saveHookMutation.isPending && savingHookId === (hook.id || hook.hook_text) || isHookSaved(hook.hook_text)}
                                  onClick={() => handleSaveHook(hook)}
                                  title={isHookSaved(hook.hook_text) ? "Already saved" : "Save hook"}
                                >
                                  {saveHookMutation.isPending && savingHookId === (hook.id || hook.hook_text) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Bookmark 
                                      className="h-4 w-4" 
                                      fill={isHookSaved(hook.hook_text) ? "currentColor" : "none"} 
                                    />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="px-2"
                                  onClick={() => handleSelectHook(hook.hook_text)}
                                >
                                  Use
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default HookSelector;
