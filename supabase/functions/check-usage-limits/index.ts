
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log("Starting check-usage-limits function");
    
    // Get request parameters and validate them
    let action: string;
    try {
      const reqBody = await req.json();
      action = reqBody.action;
      if (!action) {
        throw new Error("Missing required parameter: action");
      }
      console.log(`Requested action: ${action}`);
    } catch (err) {
      console.error("Error parsing request:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid request format", message: err.message, canProceed: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with auth context from request
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Try to get the user session from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No Authorization header found");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Authentication required", canProceed: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set auth token from the Authorization header
    supabaseClient.auth.setAuth(authHeader.replace('Bearer ', ''));

    // Get user session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError || !session) {
      console.error("Session error:", sessionError?.message || "No session found");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Authentication required", canProceed: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;
    console.log(`User ID: ${userId}`);

    // Check user's subscription tier
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (subError) {
      console.error("Error fetching subscription:", subError.message);
      return new Response(
        JSON.stringify({ error: "Database error", message: "Could not check subscription status", canProceed: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tier = subscription?.tier || 'free';
    console.log(`User tier: ${tier}`);

    // Business tier users always bypass usage limits
    if (tier === 'business') {
      console.log("Business tier user - bypassing usage limits");
      return new Response(
        JSON.stringify({ canProceed: true, message: "Business tier has unlimited usage", tier }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For other tiers, check usage limits using RPC
    console.log(`Checking usage limits for ${action}`);
    const { data: canProceed, error: rpcError } = await supabaseClient.rpc(
      'check_and_increment_usage', 
      { p_user_id: userId, p_action: action }
    );
    
    if (rpcError) {
      console.error("RPC error:", rpcError.message);
      return new Response(
        JSON.stringify({ error: "Usage check error", message: rpcError.message, canProceed: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Can proceed: ${canProceed}`);
    
    // Prepare appropriate response based on usage check result
    if (canProceed) {
      return new Response(
        JSON.stringify({ canProceed: true, message: "Within usage limits", tier }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const limitMessages = {
        'ideas': `You've reached your daily limit for generating ideas on the ${tier} plan.`,
        'scripts': `You've reached your daily limit for generating scripts on the ${tier} plan.`,
        'hooks': `You've reached your daily limit for generating hooks on the ${tier} plan.`
      };
      
      const message = limitMessages[action] || `You've reached your daily usage limit for ${action} on the ${tier} plan.`;
      
      return new Response(
        JSON.stringify({ canProceed: false, message, tier }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return new Response(
      JSON.stringify({ error: "Server error", message: err.message, canProceed: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
