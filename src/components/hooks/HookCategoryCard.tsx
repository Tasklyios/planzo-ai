
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkIcon, Loader2 } from "lucide-react";
import { HookType, SavedHook } from "@/types/hooks";

interface HookCategoryCardProps {
  title: string;
  hooks: (HookType | SavedHook)[];
  onSaveHook: (hook: HookType) => void;
  isSaving: boolean;
  getHookText: (hook: HookType | SavedHook) => string;
}

const HookCategoryCard = ({ 
  title, 
  hooks, 
  onSaveHook, 
  isSaving,
  getHookText
}: HookCategoryCardProps) => {
  if (!hooks || hooks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          No hooks available for this category
        </CardContent>
      </Card>
    );
  }

  // Function to check if a hook is saved (already bookmarked)
  const isHookSaved = (hook: HookType | SavedHook): boolean => {
    // If it has 'hook' property and not 'hook_text', it's a SavedHook
    return !('hook_text' in hook);
  };

  // Function to get the hook ID for saving state tracking
  const getHookId = (hook: HookType | SavedHook): string => {
    if ('id' in hook && hook.id) return hook.id;
    return 'hook_text' in hook ? hook.hook_text : hook.hook;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hooks.map((hook, index) => (
          <div key={index} className="p-3 border rounded-md flex justify-between items-start gap-2">
            <p className="text-sm">{getHookText(hook)}</p>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => 'hook_text' in hook ? onSaveHook(hook as HookType) : null}
              disabled={isSaving || isHookSaved(hook)}
              className={isHookSaved(hook) ? "text-primary" : ""}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BookmarkIcon 
                  className="h-4 w-4" 
                  fill={isHookSaved(hook) ? "currentColor" : "none"} 
                />
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default HookCategoryCard;
