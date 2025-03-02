
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Get user details
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("User authentication error:", userError);
      return new Response(
        JSON.stringify({ 
          error: "User not authenticated", 
          canProceed: false, 
          message: "Authentication required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      );
    }
    
    const userId = user.id;
    
    // Parse request body
    const { action } = await req.json();
    
    if (!action || !['ideas', 'scripts', 'hooks'].includes(action)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid action specified", 
          canProceed: false, 
          message: "Please provide a valid action (ideas, scripts, or hooks)" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    // First, check if the user has a business subscription - if so, bypass usage check
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (subscriptionError) {
      console.error("Error fetching subscription:", subscriptionError);
      // Continue with the check instead of returning an error
    }
    
    // Business tier users get unlimited usage
    if (subscription?.tier === 'business') {
      console.log(`Business tier user ${userId} - granting unlimited usage for ${action}`);
      return new Response(
        JSON.stringify({ 
          canProceed: true, 
          message: "Business tier: unlimited usage allowed", 
          subscription: subscription 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }
    
    // For other tiers, execute the usage check function
    const { data, error } = await supabaseClient.rpc(
      'check_and_increment_usage',
      { feature_name: action }
    );
    
    if (error) {
      console.error("Error checking usage:", error);
      return new Response(
        JSON.stringify({ 
          error: "Error checking usage limits", 
          canProceed: false, 
          message: error.message || "Unable to check usage limits" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }
    
    // Determine message based on tier
    let message = "";
    if (data === false) {
      const tierLimits = {
        free: { ideas: 5, scripts: 3, hooks: 5 },
        pro: { ideas: 20, scripts: 10, hooks: 15 },
        plus: { ideas: 50, scripts: 25, hooks: 30 }
      };
      
      // Default to free tier limits if no subscription found
      const tier = subscription?.tier || 'free';
      const limit = tierLimits[tier][action] || 5;
      
      message = `You've reached your daily limit of ${limit} ${action} for the ${tier} plan. `;
      
      if (tier === 'free') {
        message += "Upgrade to Pro or Plus for more generations!";
      } else if (tier === 'pro') {
        message += "Upgrade to Plus or Business for more generations!";
      } else if (tier === 'plus') {
        message += "Upgrade to Business for unlimited generations!";
      }
    }
    
    return new Response(
      JSON.stringify({ 
        canProceed: data, 
        message: data ? "Usage within limits" : message,
        subscription: subscription 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error", 
        canProceed: false, 
        message: err.message || "An unexpected error occurred" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
