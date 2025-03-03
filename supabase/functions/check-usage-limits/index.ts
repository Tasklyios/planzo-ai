
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("Check usage limits function loaded");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Extract the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No Authorization header found");
      return new Response(
        JSON.stringify({
          error: "Authentication error",
          canProceed: false,
          message: "You must be logged in to perform this action"
        }),
        {
          status: 200, // Use 200 status even for errors to avoid client-side rejection
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Authorization header found:", authHeader.substring(0, 20) + "...");

    // Create Supabase client with the Authorization header
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_ANON_KEY") ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({
          error: "Authentication error",
          canProceed: false,
          message: "You must be logged in to perform this action"
        }),
        {
          status: 200, // Changed from 401 to 200 to avoid client-side rejection
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (!user) {
      console.error("No user found in session");
      return new Response(
        JSON.stringify({
          error: "Authentication error",
          canProceed: false,
          message: "You must be logged in to perform this action"
        }),
        {
          status: 200, // Changed from 401 to 200 to avoid client-side rejection
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Successfully authenticated user ${user.id}`);
    
    // Get the request data
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          canProceed: false,
          message: "Invalid request format"
        }),
        {
          status: 200, // Changed from 400 to 200 to avoid client-side rejection
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { action } = requestData;
    
    if (!action) {
      return new Response(
        JSON.stringify({
          error: "Missing action parameter",
          canProceed: false,
          message: "Invalid request"
        }),
        {
          status: 200, // Changed from 400 to 200 to avoid client-side rejection
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Checking usage for user ${user.id}, action: ${action}`);

    // Get the user's subscription tier
    const { data: subscription, error: subError } = await supabaseClient
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (subError) {
      console.error("Error fetching subscription:", subError);
      // Continue with free tier as default if there's an error
    }
    
    // Default to free tier if no subscription found
    const tier = subscription?.tier || "free";

    console.log(`User ${user.id} has subscription tier: ${tier}`);
    
    // Business tier has unlimited usage
    if (tier === "business") {
      return new Response(
        JSON.stringify({ canProceed: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }
    
    // Get current usage for today
    const { data: usage, error: usageError } = await supabaseClient
      .from("user_daily_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", new Date().toISOString().split("T")[0])
      .maybeSingle();

    if (usageError) {
      console.error("Error fetching usage:", usageError);
      // Continue with zero usage as default if there's an error
    }

    // Default usage to 0 if no record found
    const currentUsage = {
      ideas_generated: usage?.ideas_generated || 0,
      scripts_generated: usage?.scripts_generated || 0,
      hooks_generated: usage?.hooks_generated || 0
    };

    console.log(`Current usage for ${action}:`, currentUsage);
    
    // Define limits for each tier and action
    const limits = {
      free: {
        ideas: 5,
        scripts: 3,
        hooks: 5
      },
      pro: {
        ideas: 20,
        scripts: 10,
        hooks: 15
      },
      plus: {
        ideas: 50,
        scripts: 25,
        hooks: 30
      },
      business: {
        ideas: 1000,
        scripts: 500,
        hooks: 500
      }
    };
    
    // Get the appropriate limit
    const limit = limits[tier as keyof typeof limits][action as keyof typeof limits.free] || 0;
    let currentCount = 0;
    
    // Get the current usage count for the requested action
    if (action === "ideas") {
      currentCount = currentUsage.ideas_generated;
    } else if (action === "scripts") {
      currentCount = currentUsage.scripts_generated;
    } else if (action === "hooks") {
      currentCount = currentUsage.hooks_generated;
    }
    
    console.log(`Usage limit for ${tier} tier, ${action}: ${limit}, current: ${currentCount}`);
    
    // Check if usage is within limits
    if (currentCount >= limit) {
      // User has reached their limit, deny access
      return new Response(
        JSON.stringify({
          canProceed: false,
          message: `You've reached your daily limit (${limit}) for ${action}. Upgrade to Business for unlimited generations!`,
          currentUsage: currentCount,
          limit: limit
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 // Using 200 status even for "limit reached" to avoid errors
        }
      );
    }
    
    // If we get here, user can proceed
    return new Response(
      JSON.stringify({
        canProceed: true,
        currentUsage: currentCount,
        limit: limit,
        remaining: limit - currentCount
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in check-usage-limits:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        canProceed: false,
        message: "An error occurred while checking usage limits"
      }),
      {
        status: 200, // Use 200 status even for errors to avoid client-side rejection
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
