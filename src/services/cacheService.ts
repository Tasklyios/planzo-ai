
import { supabase } from "@/integrations/supabase/client";

export async function invalidateQueries(action: string = "global"): Promise<void> {
  try {
    await supabase.functions.invoke("invalidate-queries", {
      method: "POST",
      body: { action }
    });
  } catch (error) {
    console.error("Error invalidating queries:", error);
    throw error;
  }
}
