
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, action } = await req.json();

    // Skip database queries for non-authenticated requests
    if (!user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          canProceed: false, 
          error: "User not authenticated" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user's subscription tier
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user_id)
      .maybeSingle();

    if (subscriptionError) {
      console.error("Error fetching subscription:", subscriptionError);
    }

    const tier = subscriptionData?.tier || "free";

    // Call the database function to check and increment usage
    const { data, error } = await supabase
      .rpc("check_and_increment_usage", { feature_name: action });

    if (error) {
      console.error("Error checking usage limits:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          canProceed: false, 
          error: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get current usage for reporting
    const { data: usageData, error: usageError } = await supabase
      .from("user_daily_usage")
      .select(action === "ideas" ? "ideas_generated" : "scripts_generated")
      .eq("user_id", user_id)
      .eq("date", new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (usageError) {
      console.error("Error fetching usage data:", usageError);
    }

    // Determine max usage based on tier
    let maxUsage = 5; // Default for free tier
    if (tier === "plus") maxUsage = 50;
    else if (tier === "pro") maxUsage = 200;
    else if (tier === "business") maxUsage = 1000;

    const currentUsage = action === "ideas" 
      ? (usageData?.ideas_generated || 0)
      : (usageData?.scripts_generated || 0);

    console.log(`Can proceed: ${data} (${currentUsage}/${maxUsage})\n`);

    return new Response(
      JSON.stringify({
        success: true,
        canProceed: data,
        tier,
        usage: {
          current: currentUsage,
          max: maxUsage
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        canProceed: false, 
        error: err.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
