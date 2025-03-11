
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { GeneratedIdea } from '@/types/idea';
import { HookType } from '@/types/hooks';
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ApplyHookToIdeaProps {
  idea: GeneratedIdea | null;
  hook: HookType | null;
}

const ApplyHookToIdea = ({ idea, hook }: ApplyHookToIdeaProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mutation for updating the idea with the hook
  const applyHookMutation = useMutation({
    mutationFn: async () => {
      if (!idea || !hook) return null;
      
      const { data, error } = await supabase
        .from('video_ideas')
        .update({ 
          hook_text: hook.hook_text || hook.hook || '',
          hook_category: hook.category 
        })
        .eq('id', idea.id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Hook applied",
        description: "The hook has been applied to your idea successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['savedIdeas'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to apply hook",
        description: error.message,
      });
    },
  });
  
  if (!idea || !hook) {
    return null;
  }
  
  return (
    <Button
      onClick={() => applyHookMutation.mutate()}
      disabled={applyHookMutation.isPending}
      className="mt-4 w-full"
    >
      {applyHookMutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Applying Hook...
        </>
      ) : (
        <>
          <Check className="mr-2 h-4 w-4" />
          Apply Hook to "{idea.title}"
        </>
      )}
    </Button>
  );
};

export default ApplyHookToIdea;
