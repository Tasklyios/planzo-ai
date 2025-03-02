
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // Create Supabase client with auth context from the request
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Get authorization header from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Authorization header',
          canProceed: false,
          message: 'Authentication required'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ 
          error: userError?.message || 'User not authenticated',
          canProceed: false,
          message: 'Authentication required'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the request body
    const { action } = await req.json();
    
    if (!action) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing action parameter',
          canProceed: false,
          message: 'Invalid request'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // First, check if user has a business subscription (unlimited usage)
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which just means they're on the free tier
      console.error('Subscription fetch error:', subError);
      return new Response(
        JSON.stringify({ 
          error: subError.message,
          canProceed: false,
          message: 'Error checking subscription'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Business tier users have unlimited usage
    if (subscription?.tier === 'business') {
      return new Response(
        JSON.stringify({ 
          canProceed: true, 
          message: 'Business tier has unlimited usage',
          tier: 'business'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For other tiers, check the usage against limits
    // Call the Postgres function to check and increment usage
    const { data, error: usageError } = await supabase.rpc(
      'check_and_increment_usage',
      { p_user_id: user.id, p_action: action }
    );

    if (usageError) {
      console.error('Usage check error:', usageError);
      return new Response(
        JSON.stringify({ 
          error: usageError.message,
          canProceed: false,
          message: 'Error checking usage limits'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If the function returns true, user can proceed, otherwise they've hit their limit
    const canProceed = data === true;
    
    let message = canProceed 
      ? `${action} usage incremented successfully` 
      : `You've reached your daily limit for ${action}`;

    return new Response(
      JSON.stringify({ 
        canProceed, 
        message,
        tier: subscription?.tier || 'free'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        canProceed: false,
        message: 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
