
import React from 'react';
import { HookType, SavedHook } from "@/types/hooks";
import HookCategoryCard from './HookCategoryCard';
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface GeneratedHooksGridProps {
  hooks: (HookType | SavedHook)[];
  onSaveHook: (hook: HookType) => void;
  isSaving: boolean;
  filterHooksByCategory: (hooks: (HookType | SavedHook)[], category: string) => (HookType | SavedHook)[];
  getHookText: (hook: HookType | SavedHook) => string;
}

const GeneratedHooksGrid = ({
  hooks,
  onSaveHook,
  isSaving,
  filterHooksByCategory,
  getHookText
}: GeneratedHooksGridProps) => {
  if (!hooks || hooks.length === 0) return null;

  console.log("GeneratedHooksGrid - Hooks received:", hooks);
  
  const questionHooks = filterHooksByCategory(hooks, 'question');
  const statisticHooks = filterHooksByCategory(hooks, 'statistic');
  const storyHooks = filterHooksByCategory(hooks, 'story');
  const challengeHooks = filterHooksByCategory(hooks, 'challenge');
  
  console.log("Question hooks:", questionHooks.length);
  console.log("Statistic hooks:", statisticHooks.length);
  console.log("Story hooks:", storyHooks.length);
  console.log("Challenge hooks:", challengeHooks.length);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Generated Hooks</h2>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10">
            {hooks.length} hooks created
          </Badge>
          
          <div className="text-xs text-muted-foreground flex items-center">
            <Info className="h-3 w-3 mr-1" />
            Each hook type serves a different audience engagement purpose
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HookCategoryCard 
            title="Question Hooks"
            hooks={questionHooks}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
            accentColor="bg-blue-100 dark:bg-blue-900/20"
            borderColor="border-blue-200 dark:border-blue-800"
          />
          
          <HookCategoryCard 
            title="Statistic Hooks"
            hooks={statisticHooks}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
            accentColor="bg-amber-100 dark:bg-amber-900/20"
            borderColor="border-amber-200 dark:border-amber-800"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HookCategoryCard 
            title="Story Hooks"
            hooks={storyHooks}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
            accentColor="bg-green-100 dark:bg-green-900/20"
            borderColor="border-green-200 dark:border-green-800"
          />
          
          <HookCategoryCard 
            title="Challenge Hooks"
            hooks={challengeHooks}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
            accentColor="bg-purple-100 dark:bg-purple-900/20"
            borderColor="border-purple-200 dark:border-purple-800"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneratedHooksGrid;
