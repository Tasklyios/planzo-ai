
import { supabase } from "@/integrations/supabase/client";

export async function invalidateQueries(action: string = "global"): Promise<void> {
  try {
    console.log(`Invalidating cache for: ${action}`);
    
    // Call the Supabase function to invalidate queries
    const { data, error } = await supabase.functions.invoke("invalidate-queries", {
      method: "POST",
      body: { action }
    });

    if (error) {
      console.error("Error invalidating queries:", error);
      throw error;
    }

    console.log("Cache invalidated successfully:", data);
  } catch (error) {
    console.error("Error invalidating queries:", error);
    // Don't rethrow the error to prevent app crashes
    // Just log it for debugging
  }
}
