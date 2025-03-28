
import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { generateHooks, saveHook } from '@/services/hookService';
import { HookType } from '@/types/hooks';
import { GeneratedIdea } from '@/types/idea';
import { useMutation } from '@tanstack/react-query';
import HookGeneratorForm from '@/components/hooks/HookGeneratorForm';
import GeneratedHooksGrid from '@/components/hooks/GeneratedHooksGrid';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const Hooks = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [details, setDetails] = useState('');
  const [generatedHooks, setGeneratedHooks] = useState<HookType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [useSavedIdea, setUseSavedIdea] = useState(false);
  const [selectedHookTypes, setSelectedHookTypes] = useState<string[]>(["question", "statistic", "story", "challenge"]);

  const saveHookMutation = useMutation({
    mutationFn: saveHook,
    onSuccess: () => {
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
      setGeneratedHooks(prevHooks => 
        prevHooks.map(h => 
          h.is_saved ? { ...h, is_saved: false } : h
        )
      );
    },
  });

  const handleGenerateHooks = async () => {
    if ((!topic && !selectedIdea) || (useSavedIdea && !selectedIdea)) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: useSavedIdea ? "Please select a saved idea." : "Please provide a topic.",
      });
      return;
    }

    if (selectedHookTypes.length === 0) {
      toast({
        variant: "destructive",
        title: "Hook types required",
        description: "Please select at least one hook type.",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const topicToUse = selectedIdea ? selectedIdea.title : topic;
      const detailsToUse = selectedIdea ? 
        `${selectedIdea.description}\n\nTags: ${selectedIdea.tags?.join(', ')}` : 
        details;
      
      const hooks = await generateHooks(topicToUse, audience, detailsToUse, selectedHookTypes);
      const hooksWithSavedState = hooks.map(hook => ({
        ...hook,
        is_saved: false
      }));
      setGeneratedHooks(hooksWithSavedState);
    } catch (error: any) {
      console.error("Failed to generate hooks:", error);
      setError(error.message || "Failed to generate hooks");
      
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to generate hooks",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetryGeneration = () => {
    setError(null);
    handleGenerateHooks();
  };

  const navigateToBilling = () => {
    navigate('/billing');
  };

  const handleSaveHook = (hook: HookType) => {
    setGeneratedHooks(prevHooks => 
      prevHooks.map(h => 
        h.hook_text === hook.hook_text 
          ? { ...h, is_saved: true }
          : h
      )
    );
    
    saveHookMutation.mutate(hook);
  };

  const filterHooksByCategory = (hooks: HookType[], category: string): HookType[] => {
    if (!hooks) return [];
    
    return hooks.filter(hook => {
      const hookCategory = hook.category || '';
      return hookCategory.toLowerCase() === category.toLowerCase();
    });
  };

  const getHookText = (hook: HookType): string => {
    return hook.hook_text || '';
  };

  const handleSelectIdea = (idea: GeneratedIdea) => {
    setSelectedIdea(idea);
    
    setTopic(idea.title);
    
    if (idea.tags && idea.tags.length > 0) {
      const audienceTags = idea.tags.filter(tag => 
        tag.toLowerCase().includes('audience') || 
        tag.toLowerCase().includes('demographic')
      );
      
      if (audienceTags.length > 0) {
        setAudience(audienceTags.join(', '));
      }
    }
    
    setDetails(idea.description);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Hook Generator</h1>
        <p className="text-muted-foreground">Create attention-grabbing hooks for your content</p>
      </div>

      <div className="space-y-4">
        <HookGeneratorForm 
          topic={topic}
          setTopic={setTopic}
          audience={audience}
          setAudience={setAudience}
          details={details}
          setDetails={setDetails}
          handleGenerateHooks={handleGenerateHooks}
          isGenerating={isGenerating}
          useSavedIdea={useSavedIdea}
          setUseSavedIdea={setUseSavedIdea}
          onIdeaSelect={handleSelectIdea}
          selectedIdea={selectedIdea}
          selectedHookTypes={selectedHookTypes}
          setSelectedHookTypes={setSelectedHookTypes}
        />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error generating hooks</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{error}</p>
              {error.includes("daily limit") && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button 
                    variant="outline" 
                    onClick={navigateToBilling}
                    className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20"
                  >
                    Upgrade Plan
                  </Button>
                  <Button 
                    onClick={handleRetryGeneration}
                    className="bg-destructive/20 hover:bg-destructive/30 text-destructive"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              {!error.includes("daily limit") && (
                <div className="mt-2">
                  <Button 
                    onClick={handleRetryGeneration}
                    className="bg-destructive/20 hover:bg-destructive/30 text-destructive"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <GeneratedHooksGrid 
          hooks={generatedHooks}
          onSaveHook={handleSaveHook}
          isSaving={false}
          filterHooksByCategory={filterHooksByCategory}
          getHookText={getHookText}
          selectedHookTypes={selectedHookTypes}
        />
      </div>
    </div>
  );
};

export default Hooks;
