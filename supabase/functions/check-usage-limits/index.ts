
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message: "Authentication required. Please log in."
        }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    // Create authenticated client using user's JWT
    const jwt = authHeader.replace('Bearer ', '');
    const authenticatedSupabase = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    // Get user information from JWT
    const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message: "Invalid authentication. Please log in again." 
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message: "Invalid request format." 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { action } = body;
    
    if (!action) {
      console.error('No action specified in request');
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message: "No action specified." 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user has Business tier (they can skip the check)
    const { data: subscriptionData, error: subError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('Error checking subscription tier:', subError);
    } else if (subscriptionData?.tier === 'business') {
      console.log('Business tier user detected, skipping usage check');
      return new Response(
        JSON.stringify({ 
          canProceed: true,
          message: "Business tier users have unlimited access." 
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Call the check_and_increment_usage function
    const { data, error } = await supabase.rpc(
      'check_and_increment_usage',
      { p_user_id: user.id, p_action: action }
    );

    if (error) {
      console.error('Error checking usage limits:', error);
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message: `Error checking usage limits: ${error.message}` 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Handle the response from the function
    if (data === true) {
      return new Response(
        JSON.stringify({ 
          canProceed: true,
          message: "Usage limit check passed." 
        }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      // Get the user's subscription tier to provide a helpful message
      const { data: tierData } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle();

      const tier = tierData?.tier || 'free';
      
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message: `You've reached your daily ${action} limit for your ${tier} tier. Please upgrade your plan for additional generations.` 
        }),
        { status: 200, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Unexpected error in check-usage-limits:', error);
    return new Response(
      JSON.stringify({ 
        canProceed: false,
        message: "An unexpected error occurred. Please try again later." 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
