
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSavedHooks, deleteHook } from "@/services/hookService";
import { SavedHook, HookType } from "@/types/hooks";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Copy, Loader2, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SavedHooksView from "@/components/hooks/SavedHooksView";

const SavedHooks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Fetch saved hooks
  const { data: savedHooks, isLoading } = useQuery({
    queryKey: ['savedHooks'],
    queryFn: getSavedHooks,
  });

  // Delete hook mutation
  const deleteHookMutation = useMutation({
    mutationFn: deleteHook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedHooks'] });
      toast({
        title: "Hook deleted",
        description: "Your hook has been removed from saved hooks.",
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

  // Copy hook text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Hook text copied to clipboard successfully.",
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Could not copy text to clipboard.",
        });
      });
  };

  // Filter hooks by category
  const getFilteredHooks = () => {
    if (!savedHooks) return [];
    if (activeCategory === "all") return savedHooks;
    return savedHooks.filter(hook => hook.category === activeCategory);
  };

  // Filter hooks by category for SavedHooksView
  const filterHooksByCategory = (hooks: any[], category: string): any[] => {
    if (!hooks) return [];
    
    return hooks.filter(hook => {
      const hookCategory = 'category' in hook ? hook.category : '';
      return hookCategory.toLowerCase() === category.toLowerCase();
    });
  };

  // Get hook text based on hook type
  const getHookText = (hook: any): string => {
    if ('hook_text' in hook) return hook.hook_text;
    if ('hook' in hook) return hook.hook;
    return '';
  };

  // Get unique categories from hooks
  const getCategories = (): string[] => {
    if (!savedHooks) return [];
    const categories = savedHooks.map(hook => hook.category);
    return [...new Set(categories)];
  };

  const filteredHooks = getFilteredHooks();
  const categories = getCategories();

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Saved Hooks</h1>
        <p className="text-muted-foreground">Manage your collection of saved hooks for scripts</p>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle>Your Saved Hooks</CardTitle>
          <CardDescription>
            Use these hooks in your scripts or copy them for other content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !savedHooks || savedHooks.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No saved hooks yet</h3>
              <p className="text-muted-foreground mt-2">
                Head over to the Hook Generator to create and save some hooks
              </p>
              <Button 
                className="mt-4" 
                variant="default" 
                onClick={() => window.location.href = '/hooks'}
              >
                Go to Hook Generator
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <div className="overflow-x-auto pb-2">
                  <TabsList className="mb-4 flex">
                    <TabsTrigger value="all">All</TabsTrigger>
                    {categories.map(category => (
                      <TabsTrigger key={category} value={category} className="capitalize">
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value={activeCategory} className="mt-0">
                  <div className="grid gap-3">
                    {filteredHooks.map((hook) => (
                      <div 
                        key={hook.id} 
                        className="p-3 sm:p-4 border rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4"
                      >
                        <div className="flex-1 break-words whitespace-pre-wrap">
                          <p className="text-sm font-medium mb-1 capitalize">{hook.category} Hook</p>
                          <p className="text-sm sm:text-base">{hook.hook}</p>
                        </div>
                        <div className="flex gap-2 shrink-0 self-end sm:self-start">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(hook.hook)}
                            title="Copy to clipboard"
                            className="h-8 w-8 flex items-center justify-center"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteHookMutation.mutate(hook.id)}
                            disabled={deleteHookMutation.isPending}
                            title="Delete hook"
                            className="h-8 w-8 flex items-center justify-center"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedHooks;
