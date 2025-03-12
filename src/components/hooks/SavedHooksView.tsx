
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { HookType, SavedHook } from "@/types/hooks";
import { useToast } from "@/components/ui/use-toast";
import { GeneratedIdea } from '@/types/idea';

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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Hook text has been copied to your clipboard.",
    });
  };

  const handleSelectHook = (hook: HookType | SavedHook) => {
    if (onSelectHook) {
      // Convert SavedHook to HookType if needed
      const hookToSelect: HookType = {
        id: 'id' in hook ? hook.id : '',
        category: 'category' in hook ? hook.category : '',
        hook_text: getHookText(hook),
        created_at: 'created_at' in hook ? hook.created_at : '',
      };
      
      onSelectHook(hookToSelect);
    }
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
    <div className="w-full">
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
              <div className="space-y-3 p-2">
                {filterHooksByCategory(savedHooks, category).length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No {category} hooks saved
                  </p>
                ) : (
                  filterHooksByCategory(savedHooks, category).map(hook => (
                    <div 
                      key={'id' in hook ? hook.id : ''}
                      className="p-4 border rounded-md flex flex-col gap-3"
                    >
                      <p className="break-words whitespace-pre-wrap text-sm">{getHookText(hook)}</p>
                      <div className="flex justify-end gap-2">
                        {onSelectHook && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectHook(hook)}
                            className="h-8 w-8 flex items-center justify-center"
                            title="Use this hook"
                          >
                            {selectedIdea ? 
                              <BookmarkCheck className="h-4 w-4 text-primary" /> : 
                              <Bookmark className="h-4 w-4" />
                            }
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(getHookText(hook))}
                          className="h-8 w-8 flex items-center justify-center"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHook('id' in hook ? hook.id : '')}
                          disabled={isDeleting}
                          className="h-8 w-8 flex items-center justify-center"
                          title="Delete hook"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SavedHooksView;
