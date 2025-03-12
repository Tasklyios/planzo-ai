
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Zap, Loader2 } from "lucide-react";
import VideoIdeaSelector from '../script/VideoIdeaSelector';
import { GeneratedIdea } from '@/types/idea';
import { cn } from '@/lib/utils';

interface HookGeneratorFormProps {
  topic: string;
  setTopic: (value: string) => void;
  audience: string;
  setAudience: (value: string) => void;
  details: string;
  setDetails: (value: string) => void;
  handleGenerateHooks: () => void;
  isGenerating: boolean;
  useSavedIdea: boolean;
  setUseSavedIdea: (value: boolean) => void;
  onIdeaSelect: (idea: GeneratedIdea) => void;
  selectedIdea: GeneratedIdea | null;
  selectedHookTypes: string[];
  setSelectedHookTypes: (types: string[]) => void;
}

const HookGeneratorForm = ({
  topic,
  setTopic,
  audience,
  setAudience,
  details,
  setDetails,
  handleGenerateHooks,
  isGenerating,
  useSavedIdea,
  setUseSavedIdea,
  onIdeaSelect,
  selectedIdea,
  selectedHookTypes,
  setSelectedHookTypes
}: HookGeneratorFormProps) => {
  
  const toggleHookType = (type: string) => {
    if (selectedHookTypes.includes(type)) {
      setSelectedHookTypes(selectedHookTypes.filter(t => t !== type));
    } else {
      setSelectedHookTypes([...selectedHookTypes, type]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Viral Hook Generator</CardTitle>
                <CardDescription>Create attention-grabbing hooks that stop users from scrolling</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="use-saved-idea" className="text-sm">Use Saved Idea</Label>
                <Switch
                  id="use-saved-idea"
                  checked={useSavedIdea}
                  onCheckedChange={setUseSavedIdea}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {useSavedIdea ? (
              <VideoIdeaSelector onSelectIdea={onIdeaSelect} />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="topic">What's your content about?</Label>
                  <Input 
                    id="topic" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Mindfulness meditation benefits" 
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Who's your target audience?</Label>
                  <Input 
                    id="audience" 
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Working professionals ages 25-40" 
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Additional details (optional)</Label>
                  <Textarea 
                    id="details" 
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Add any specific details, key messages, or emotional tone for your hooks" 
                    disabled={isGenerating}
                    className="min-h-24"
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full blue-gradient" 
              onClick={handleGenerateHooks}
              disabled={isGenerating || (!useSavedIdea && !topic) || (useSavedIdea && !selectedIdea) || selectedHookTypes.length === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate {selectedHookTypes.length === 4 ? 'All' : 'Selected'} Hook Types
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="sm:block">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle>Hook Types</CardTitle>
            <CardDescription>Select the types of hooks you want (choose at least one)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div 
              className={cn(
                "bg-muted rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/80",
                selectedHookTypes.includes("question") && "bg-primary/10 hover:bg-primary/20 border border-primary/50"
              )}
              onClick={() => toggleHookType("question")}
            >
              <h3 className="font-medium">Question Hooks</h3>
              <p className="text-sm text-muted-foreground">Trigger curiosity with thought-provoking questions</p>
            </div>
            <div 
              className={cn(
                "bg-muted rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/80",
                selectedHookTypes.includes("statistic") && "bg-primary/10 hover:bg-primary/20 border border-primary/50"
              )}
              onClick={() => toggleHookType("statistic")}
            >
              <h3 className="font-medium">Statistic Hooks</h3>
              <p className="text-sm text-muted-foreground">Create pattern-interrupts with surprising data points</p>
            </div>
            <div 
              className={cn(
                "bg-muted rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/80",
                selectedHookTypes.includes("story") && "bg-primary/10 hover:bg-primary/20 border border-primary/50"
              )}
              onClick={() => toggleHookType("story")}
            >
              <h3 className="font-medium">Story Hooks</h3>
              <p className="text-sm text-muted-foreground">Build emotional connection with relatable narratives</p>
            </div>
            <div 
              className={cn(
                "bg-muted rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/80",
                selectedHookTypes.includes("challenge") && "bg-primary/10 hover:bg-primary/20 border border-primary/50"
              )}
              onClick={() => toggleHookType("challenge")}
            >
              <h3 className="font-medium">Challenge Hooks</h3>
              <p className="text-sm text-muted-foreground">Create polarizing reactions by challenging assumptions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HookGeneratorForm;
