
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2 } from "lucide-react";
import { HookType, SavedHook } from "@/types/hooks";

interface SavedHooksViewProps {
  savedHooks: SavedHook[] | undefined;
  isFetchingHooks: boolean;
  handleDeleteHook: (id: string) => void;
  isDeleting: boolean;
  filterHooksByCategory: (hooks: (SavedHook[] | HookType[]), category: string) => (HookType | SavedHook)[];
  getHookText: (hook: HookType | SavedHook) => string;
}

const SavedHooksView = ({
  savedHooks,
  isFetchingHooks,
  handleDeleteHook,
  isDeleting,
  filterHooksByCategory,
  getHookText
}: SavedHooksViewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Hooks</CardTitle>
        <CardDescription>Your bookmarked hooks that can be used in scripts</CardDescription>
      </CardHeader>
      <CardContent>
        {isFetchingHooks ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !savedHooks || savedHooks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No saved hooks yet. Generate and bookmark some hooks to see them here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {['question', 'statistic', 'story', 'challenge'].map(category => {
              const hooksInCategory = filterHooksByCategory(savedHooks, category);
              if (hooksInCategory.length === 0) return null;
              
              return (
                <div key={category}>
                  <h3 className="font-medium capitalize mb-2">{category} Hooks</h3>
                  <div className="space-y-2">
                    {hooksInCategory.map(hook => (
                      <div 
                        key={hook.id} 
                        className="p-3 border rounded-md flex justify-between items-start"
                      >
                        <p>{getHookText(hook)}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteHook(hook.id)}
                          disabled={isDeleting}
                        >
                          <Bookmark className="h-4 w-4 text-primary" fill="currentColor" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedHooksView;
