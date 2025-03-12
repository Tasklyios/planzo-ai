
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
  selectedHookTypes?: string[];
}

const GeneratedHooksGrid = ({
  hooks,
  onSaveHook,
  isSaving,
  filterHooksByCategory,
  getHookText,
  selectedHookTypes = ["question", "statistic", "story", "challenge"]
}: GeneratedHooksGridProps) => {
  if (!hooks || hooks.length === 0) return null;

  console.log("GeneratedHooksGrid - Hooks received:", hooks);
  console.log("Selected hook types:", selectedHookTypes);
  
  // Only filter hooks by categories that were selected
  const questionHooks = selectedHookTypes.includes("question") ? filterHooksByCategory(hooks, 'question') : [];
  const statisticHooks = selectedHookTypes.includes("statistic") ? filterHooksByCategory(hooks, 'statistic') : [];
  const storyHooks = selectedHookTypes.includes("story") ? filterHooksByCategory(hooks, 'story') : [];
  const challengeHooks = selectedHookTypes.includes("challenge") ? filterHooksByCategory(hooks, 'challenge') : [];
  
  // Log the counts for debugging
  console.log("Question hooks:", questionHooks.length);
  console.log("Statistic hooks:", statisticHooks.length);
  console.log("Story hooks:", storyHooks.length);
  console.log("Challenge hooks:", challengeHooks.length);
  
  // Count total hooks across all selected categories
  const totalHooks = questionHooks.length + statisticHooks.length + storyHooks.length + challengeHooks.length;

  // Helper function to create a grid of cards based on selected types
  const renderHookCards = () => {
    // Create an array of the selected hook types with their data
    const selectedHooks = [
      { type: "question", hooks: questionHooks, title: "Question Hooks", accentColor: "bg-blue-100 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800" },
      { type: "statistic", hooks: statisticHooks, title: "Statistic Hooks", accentColor: "bg-amber-100 dark:bg-amber-900/20", borderColor: "border-amber-200 dark:border-amber-800" },
      { type: "story", hooks: storyHooks, title: "Story Hooks", accentColor: "bg-green-100 dark:bg-green-900/20", borderColor: "border-green-200 dark:border-green-800" },
      { type: "challenge", hooks: challengeHooks, title: "Challenge Hooks", accentColor: "bg-purple-100 dark:bg-purple-900/20", borderColor: "border-purple-200 dark:border-purple-800" }
    ].filter(item => selectedHookTypes.includes(item.type) && item.hooks.length > 0);
    
    // When only one type is selected, make it full width
    if (selectedHooks.length === 1) {
      return (
        <div className="w-full">
          <HookCategoryCard 
            title={selectedHooks[0].title}
            hooks={selectedHooks[0].hooks}
            onSaveHook={onSaveHook}
            isSaving={isSaving}
            getHookText={getHookText}
            accentColor={selectedHooks[0].accentColor}
            borderColor={selectedHooks[0].borderColor}
          />
        </div>
      );
    }
    
    // For two types, display them in a simple grid
    else if (selectedHooks.length === 2) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedHooks.map((hookData, index) => (
            <HookCategoryCard 
              key={hookData.type}
              title={hookData.title}
              hooks={hookData.hooks}
              onSaveHook={onSaveHook}
              isSaving={isSaving}
              getHookText={getHookText}
              accentColor={hookData.accentColor}
              borderColor={hookData.borderColor}
            />
          ))}
        </div>
      );
    }
    
    // For three or four types, use a 2x2 grid layout
    else {
      return (
        <div className="space-y-6">
          {/* Create rows of two cards each */}
          {Array.from({ length: Math.ceil(selectedHooks.length / 2) }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedHooks.slice(rowIndex * 2, rowIndex * 2 + 2).map((hookData) => (
                <HookCategoryCard
                  key={hookData.type}
                  title={hookData.title}
                  hooks={hookData.hooks}
                  onSaveHook={onSaveHook}
                  isSaving={isSaving}
                  getHookText={getHookText}
                  accentColor={hookData.accentColor}
                  borderColor={hookData.borderColor}
                />
              ))}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold mr-4">Generated Hooks</h2>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/10">
            {totalHooks} hooks created
          </Badge>
          
          <div className="text-xs text-muted-foreground flex items-center">
            <Info className="h-3 w-3 mr-1" />
            Each hook type serves a different audience engagement purpose
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {renderHookCards()}
      </div>
    </div>
  );
};

export default GeneratedHooksGrid;
