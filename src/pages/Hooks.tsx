
import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateHooks, saveHook, getSavedHooks, deleteSavedHook } from '@/services/hookService';
import { HookType, SavedHook } from '@/types/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HookGeneratorForm from '@/components/hooks/HookGeneratorForm';
import GeneratedHooksGrid from '@/components/hooks/GeneratedHooksGrid';
import SavedHooksView from '@/components/hooks/SavedHooksView';

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

  const filterHooksByCategory = (hooks: (HookType | SavedHook)[], category: string): (HookType | SavedHook)[] => {
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
          <HookGeneratorForm 
            topic={topic}
            setTopic={setTopic}
            audience={audience}
            setAudience={setAudience}
            details={details}
            setDetails={setDetails}
            handleGenerateHooks={handleGenerateHooks}
            isGenerating={isGenerating}
          />

          <GeneratedHooksGrid 
            hooks={generatedHooks}
            onSaveHook={handleSaveHook}
            isSaving={saveHookMutation.isPending}
            filterHooksByCategory={filterHooksByCategory}
            getHookText={getHookText}
          />
        </TabsContent>

        <TabsContent value="saved">
          <SavedHooksView 
            savedHooks={savedHooks}
            isFetchingHooks={isFetchingHooks}
            handleDeleteHook={handleDeleteHook}
            isDeleting={deleteHookMutation.isPending}
            filterHooksByCategory={filterHooksByCategory}
            getHookText={getHookText}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Hooks;
