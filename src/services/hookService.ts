
import { supabase } from "@/integrations/supabase/client";
import { HookType, SavedHook } from "@/types/hooks";

export const generateHooks = async (
  topic: string,
  audience: string,
  details?: string
): Promise<HookType[]> => {
  try {
    // Check usage limits
    const { data: canUse, error: usageError } = await supabase.rpc(
      'check_and_increment_usage',
      { feature_name: 'hooks' }
    );

    if (usageError) throw usageError;
    if (!canUse) {
      throw new Error("You've reached your daily limit for hook generation");
    }

    // Call Supabase Edge Function to generate hooks
    const { data, error } = await supabase.functions.invoke("generate-hooks", {
      body: { topic, audience, details },
    });

    if (error) throw error;
    
    return data.hooks || [];
  } catch (error: any) {
    console.error("Error generating hooks:", error);
    throw new Error(error.message || "Failed to generate hooks");
  }
};

export const getSavedHooks = async (): Promise<SavedHook[]> => {
  try {
    const { data, error } = await supabase
      .from("script_hooks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("Error fetching saved hooks:", error);
    throw new Error(error.message || "Failed to fetch saved hooks");
  }
};

export const saveHook = async (hook: HookType): Promise<SavedHook> => {
  try {
    const { data, error } = await supabase
      .from("script_hooks")
      .insert({
        hook: hook.hook_text,
        category: hook.category || "general"
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error saving hook:", error);
    throw new Error(error.message || "Failed to save hook");
  }
};

export const deleteSavedHook = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("script_hooks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error: any) {
    console.error("Error deleting saved hook:", error);
    throw new Error(error.message || "Failed to delete saved hook");
  }
};
