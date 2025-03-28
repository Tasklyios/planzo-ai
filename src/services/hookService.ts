
import { cast, supabase, supabaseTyped } from "@/integrations/supabase/client";
import { HookType, SavedHook } from "@/types/hooks";
import { VIRAL_CONTENT_PROMPT } from "@/types/idea";

export const generateHooks = async (
  topic: string, 
  audience: string, 
  details: string,
  hookTypes: string[] = ["question", "statistic", "story", "challenge"]
): Promise<HookType[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error("You must be logged in to generate hooks");
    }

    const { data, error } = await supabase.functions.invoke('generate-hooks', {
      body: { 
        topic, 
        audience, 
        details,
        expertPrompt: VIRAL_CONTENT_PROMPT,
        hookTypes 
      }
    });
    
    if (error) {
      console.error('Error generating hooks:', error);
      throw new Error(error.message);
    }
    
    if (!data || !data.hooks || !Array.isArray(data.hooks) || data.hooks.length === 0) {
      throw new Error('No hooks were generated. Please try a different topic or audience.');
    }
    
    return data.hooks.map((hook: any) => ({
      id: `hook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      hook_text: hook.hook_text || hook.hook,
      category: hook.category || 'other',
      is_saved: false,
    }));
  } catch (error: any) {
    console.error('Error in generateHooks:', error);
    const message = error.message || "Failed to generate hooks";
    
    // Check for specific error cases
    if (message.includes('daily limit')) {
      throw new Error("You've reached your daily limit for generating hooks. Upgrade your plan for more generations.");
    }
    
    if (message.includes('rate limit')) {
      throw new Error("Rate limit exceeded. Please wait a few minutes before trying again.");
    }
    
    throw new Error(message);
  }
};

export const saveHook = async (hook: HookType): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error("You must be logged in to save hooks");
    }
    
    const { data, error } = await supabase
      .from('saved_hooks')
      .insert({
        hook: hook.hook_text,
        category: hook.category,
        user_id: cast(session.session.user.id)
      })
      .select('id');
    
    if (error) {
      console.error('Error saving hook:', error);
      throw new Error(`Failed to save hook: ${error.message}`);
    }
    
    console.log('Hook saved successfully:', data);
  } catch (error: any) {
    console.error('Error in saveHook:', error);
    throw new Error(error.message || "Failed to save hook");
  }
};

export const getSavedHooks = async (): Promise<SavedHook[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error("You must be logged in to view saved hooks");
    }

    const { data, error } = await supabaseTyped.filter('saved_hooks', 'user_id', cast(session.session.user.id))
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error retrieving hooks:', error);
      throw new Error(`Failed to retrieve hooks: ${error.message}`);
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(hook => ({
      id: hook.id,
      hook: hook.hook,
      category: hook.category,
      user_id: hook.user_id,
      created_at: hook.created_at,
      is_saved: true,
    }));
  } catch (error: any) {
    console.error('Error in getSavedHooks:', error);
    throw new Error(error.message || "Failed to retrieve saved hooks");
  }
};

export const deleteHook = async (hookId: string): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error("You must be logged in to delete hooks");
    }
    
    const { error } = await supabase
      .from('saved_hooks')
      .delete()
      .match({ 
        id: cast(hookId), 
        user_id: cast(session.session.user.id) 
      });
    
    if (error) {
      console.error('Error deleting hook:', error);
      throw new Error(`Failed to delete hook: ${error.message}`);
    }
    
    console.log('Hook deleted successfully');
  } catch (error: any) {
    console.error('Error in deleteHook:', error);
    throw new Error(error.message || "Failed to delete hook");
  }
};

// Add the missing deleteSavedHook function that's being imported in SavedHooks.tsx
export const deleteSavedHook = deleteHook;
