
import React from 'react';
import { HookType, SavedHook } from "@/types/hooks";
import HookCategoryCard from './HookCategoryCard';

interface GeneratedHooksGridProps {
  hooks: (HookType | SavedHook)[];
  onSaveHook: (hook: HookType) => void;
  isSaving: boolean;
  filterHooksByCategory: (hooks: (HookType[] | SavedHook[]), category: string) => (HookType | SavedHook)[];
  getHookText: (hook: HookType | SavedHook) => string;
}

const GeneratedHooksGrid = ({
  hooks,
  onSaveHook,
  isSaving,
  filterHooksByCategory,
  getHookText
}: GeneratedHooksGridProps) => {
  if (hooks.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Generated Hooks</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HookCategoryCard 
            title="Question Hooks"
            hooks={filterHooksByCategory(hooks, 'question')}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
          />
          
          <HookCategoryCard 
            title="Statistic Hooks"
            hooks={filterHooksByCategory(hooks, 'statistic')}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HookCategoryCard 
            title="Story Hooks"
            hooks={filterHooksByCategory(hooks, 'story')}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
          />
          
          <HookCategoryCard 
            title="Challenge Hooks"
            hooks={filterHooksByCategory(hooks, 'challenge')}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneratedHooksGrid;
