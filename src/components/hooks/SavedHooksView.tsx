
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Loader2, Check } from "lucide-react";
import { HookType, SavedHook } from "@/types/hooks";
import { GeneratedIdea } from "@/types/idea";
import { useToast } from "@/components/ui/use-toast";
import VideoIdeaSelector from '../script/VideoIdeaSelector';
import ApplyHookToIdea from './ApplyHookToIdea';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SavedHooksViewProps {
  savedHooks: (HookType | SavedHook)[] | undefined;
  isFetchingHooks: boolean;
  handleDeleteHook: (id: string) => void;
  isDeleting?: boolean;
  filterHooksByCategory: (hooks: (HookType | SavedHook)[], category: string) => (HookType | SavedHook)[];
  getHookText: (hook: HookType | SavedHook) => string;
  onSelectHook?: (hook: HookType) => void;
  selectedIdea?: GeneratedIdea | null;
}

const SavedHooksView = ({
  savedHooks,
  isFetchingHooks,
  handleDeleteHook,
  isDeleting,
  filterHooksByCategory,
  getHookText,
  onSelectHook,
  selectedIdea
}: SavedHooksViewProps) => {
  const { toast } = useToast();
  const [selectedHook, setSelectedHook] = React.useState<HookType | null>(null);
  const [selectedIdeaLocal, setSelectedIdeaLocal] = React.useState<GeneratedIdea | null>(selectedIdea || null);

  React.useEffect(() => {
    if (selectedIdea) {
      setSelectedIdeaLocal(selectedIdea);
    }
  }, [selectedIdea]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Hook text has been copied to your clipboard.",
    });
  };

  const handleSelectHook = (hook: HookType | SavedHook) => {
    // Convert SavedHook to HookType if needed
    const hookToSelect: HookType = {
      id: 'id' in hook ? hook.id : '',
      category: 'category' in hook ? hook.category : '',
      hook_text: getHookText(hook),
      created_at: 'created_at' in hook ? hook.created_at : '',
    };
    
    setSelectedHook(hookToSelect);
    
    if (onSelectHook) {
      onSelectHook(hookToSelect);
    }
  };

  const handleSelectIdea = (idea: GeneratedIdea) => {
    setSelectedIdeaLocal(idea);
  };

  if (isFetchingHooks) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!savedHooks || savedHooks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have any saved hooks yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Tabs defaultValue="question" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="statistic">Statistic</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="challenge">Challenge</TabsTrigger>
          </TabsList>

          {['question', 'statistic', 'story', 'challenge'].map(category => (
            <TabsContent key={category} value={category}>
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2 p-2">
                  {filterHooksByCategory(savedHooks, category).length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No {category} hooks saved
                    </p>
                  ) : (
                    filterHooksByCategory(savedHooks, category).map(hook => {
                      const isSelected = selectedHook?.id === ('id' in hook ? hook.id : '');
                      
                      return (
                        <div 
                          key={'id' in hook ? hook.id : ''}
                          className={`p-3 border rounded-md flex flex-col gap-2 ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <p>{getHookText(hook)}</p>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyToClipboard(getHookText(hook))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHook('id' in hook ? hook.id : '')}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSelectHook(hook)}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Selected
                                </>
                              ) : (
                                'Select'
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Apply Hook to Idea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <VideoIdeaSelector onSelectIdea={handleSelectIdea} />
            
            {selectedIdeaLocal && (
              <div className="mt-4 space-y-2">
                <Badge>{selectedIdeaLocal.category}</Badge>
                <h3 className="font-medium">{selectedIdeaLocal.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedIdeaLocal.description.substring(0, 100)}
                  {selectedIdeaLocal.description.length > 100 ? '...' : ''}
                </p>
              </div>
            )}
            
            {selectedHook && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Selected Hook</h3>
                <div className="p-3 border rounded-md bg-secondary/20">
                  <p>{selectedHook.hook_text}</p>
                  <Badge variant="outline" className="mt-2">
                    {selectedHook.category}
                  </Badge>
                </div>
              </div>
            )}
            
            {selectedIdeaLocal && selectedHook && (
              <ApplyHookToIdea 
                idea={selectedIdeaLocal} 
                hook={selectedHook} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SavedHooksView;
