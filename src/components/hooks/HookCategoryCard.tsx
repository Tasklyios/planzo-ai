
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkIcon } from "lucide-react";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hooks.map((hook, index) => (
          <div key={index} className="p-3 border rounded-md flex justify-between items-start gap-2">
            <p>{getHookText(hook)}</p>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => 'hook_text' in hook ? onSaveHook(hook as HookType) : null}
              disabled={isSaving}
            >
              <BookmarkIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default HookCategoryCard;
