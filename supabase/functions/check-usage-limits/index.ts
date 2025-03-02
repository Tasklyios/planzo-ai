
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the request body
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Action parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a Supabase client with the user's JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    // Create a supabase client with service role key
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", canProceed: false }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Checking usage limits for user ${user.id} and action ${action}`);

    // Check if the user can proceed with the action
    const { data: canProceed, error: checkError } = await adminClient.rpc(
      "check_and_increment_usage",
      { feature_name: action }
    );

    if (checkError) {
      console.error(`Error checking usage limits: ${checkError.message}`);
      return new Response(
        JSON.stringify({
          error: `Error checking usage limits: ${checkError.message}`,
          canProceed: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the user's subscription tier
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error(`Error fetching subscription: ${subscriptionError.message}`);
      return new Response(
        JSON.stringify({
          error: `Error fetching subscription: ${subscriptionError.message}`,
          canProceed: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Define limits based on tier and action
    let message = "";
    let tierName = subscription?.tier || "free";
    
    // Create specific messages for each feature
    if (!canProceed) {
      if (action === 'ideas') {
        message = `You've reached your daily limit for generating ideas on the ${tierName} plan.`;
      } else if (action === 'scripts') {
        message = `You've reached your daily limit for generating scripts on the ${tierName} plan.`;
      } else if (action === 'hooks') {
        message = `You've reached your daily limit for generating hooks on the ${tierName} plan.`;
      } else {
        message = `You've reached your daily usage limit for the ${tierName} plan.`;
      }
    }

    return new Response(
      JSON.stringify({
        canProceed,
        message: message,
        tier: tierName
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error", canProceed: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
