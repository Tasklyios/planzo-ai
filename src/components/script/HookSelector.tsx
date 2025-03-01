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
import { Anchor, Loader2, Plus } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { getSavedHooks, generateHooks } from '@/services/hookService';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HookType } from '@/types/hooks';
import { useToast } from "@/components/ui/use-toast";

interface HookSelectorProps {
  onSelectHook: (hookText: string) => void;
}

// Helper function to normalize hook data structure
const normalizeHook = (hook: any): HookType => {
  return {
    id: hook.id,
    category: hook.category,
    hook_text: hook.hook_text || hook.hook || '',
    created_at: hook.created_at,
    // Don't include user_id in normalized hook as it's not in HookType
  };
};

const HookSelector = ({ onSelectHook }: HookSelectorProps) => {
  // ... keep existing code (state variables, handlers, etc.)
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('saved');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [details, setDetails] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedHooks, setGeneratedHooks] = useState<HookType[]>([]);
  const { toast } = useToast();
  
  // Fetch saved hooks
  const { 
    data: savedHooksRaw, 
    isLoading: isLoadingSavedHooks,
    refetch: refetchSavedHooks
  } = useQuery({
    queryKey: ['savedHooks'],
    queryFn: getSavedHooks,
  });

  // Normalize saved hooks to match HookType
  const savedHooks = savedHooksRaw ? savedHooksRaw.map(normalizeHook) : [];

  // Clear generated hooks when the sheet is closed
  useEffect(() => {
    if (!open) {
      setGeneratedHooks([]);
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
      // Normalize the generated hooks to match HookType
      const normalizedHooks = generatedRawHooks.map(normalizeHook);
      setGeneratedHooks(normalizedHooks);
      
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
                  placeholder="e.g., Meditation, Cryptocurrency, Fitness" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input 
                  id="audience" 
                  placeholder="e.g., Beginners, Investors, Working professionals" 
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="details">Additional Details (Optional)</Label>
                <Textarea 
                  id="details" 
                  placeholder="Any specific requirements or context for your hooks"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
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
                            <Button
                              key={`generated-${category}-${index}`}
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
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default HookSelector;
