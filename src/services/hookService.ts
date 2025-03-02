
import { supabase } from "@/integrations/supabase/client";
import { HookType, SavedHook } from "@/types/hooks";

export const generateHooks = async (
  topic: string,
  audience: string,
  details?: string
): Promise<HookType[]> => {
  try {
    // First check usage limits
    const { data: usageResponse, error: usageError } = await supabase.functions.invoke('check-usage-limits', {
      body: { action: 'hooks' }
    });

    if (usageError) {
      console.error("Usage check error:", usageError);
      throw new Error(`Usage check error: ${usageError.message}`);
    }

    // Check if we can proceed or not
    if (usageResponse && !usageResponse.canProceed) {
      console.error("Usage limit reached:", usageResponse.message);
      throw new Error(usageResponse.message || "You've reached your daily limit for generating hooks.");
    }

    // Call Supabase Edge Function to generate hooks
    const { data, error } = await supabase.functions.invoke("generate-hooks", {
      body: { topic, audience, details },
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(error.message || "Failed to generate hooks");
    }
    
    if (!data || !data.hooks) {
      console.error("No hooks returned from the edge function:", data);
      throw new Error("No hooks were returned. Please try again.");
    }
    
    console.log("Hooks generated successfully:", data.hooks);
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
    // Get the current user ID first
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from("script_hooks")
      .insert({
        hook: hook.hook_text,
        category: hook.category || "general",
        user_id: userId
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
