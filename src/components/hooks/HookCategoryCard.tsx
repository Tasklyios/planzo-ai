
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkIcon } from "lucide-react";
import { HookType, SavedHook } from "@/types/hooks";

interface HookCategoryCardProps {
  title: string;
  hooks: (HookType | SavedHook)[];
  onSaveHook: (hook: HookType) => void;
  isSaving: boolean;
  getHookText: (hook: HookType | SavedHook) => string;
  accentColor?: string;
  borderColor?: string;
}

const HookCategoryCard = ({ 
  title, 
  hooks, 
  onSaveHook, 
  isSaving,
  getHookText,
  accentColor,
  borderColor
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

  const isHookSaved = (hook: HookType | SavedHook): boolean => {
    // Consider a hook saved if it has an id property
    return 'id' in hook;
  };

  const getHookId = (hook: HookType | SavedHook): string => {
    if ('id' in hook && hook.id) return hook.id;
    return 'hook_text' in hook ? hook.hook_text : hook.hook;
  };

  return (
    <Card className={`${accentColor ? accentColor : ''} ${borderColor ? borderColor : ''}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hooks.map((hook, index) => (
          <div key={index} className="p-3 border rounded-md flex justify-between items-start gap-2">
            <p className="text-sm">{getHookText(hook)}</p>
            <div className="flex-shrink-0">
              <BookmarkIcon 
                className={`h-4 w-4 cursor-pointer ${isHookSaved(hook) ? "text-primary fill-primary" : "text-muted-foreground hover:text-primary transition-colors"}`}
                onClick={() => !isHookSaved(hook) && 'hook_text' in hook ? onSaveHook(hook as HookType) : null}
                aria-label={isHookSaved(hook) ? "Already saved" : "Save hook"}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default HookCategoryCard;
