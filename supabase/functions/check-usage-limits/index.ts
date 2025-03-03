
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT from the request headers
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No Authorization header or invalid format');
      return new Response(
        JSON.stringify({
          error: 'Authentication error',
          canProceed: false,
          message: 'Authentication failed: No valid Bearer token provided!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get the JWT token
    const jwt = authHeader.split(' ')[1];
    
    if (!jwt) {
      console.error('No JWT found in Authorization header');
      return new Response(
        JSON.stringify({
          error: 'Authentication error',
          canProceed: false,
          message: 'Authentication failed: No JWT token found!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Initialize Supabase client with JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    });

    // Verify the JWT is valid by getting the user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.error('JWT verification failed:', userError?.message || 'No user found');
      return new Response(
        JSON.stringify({
          error: 'Authentication error',
          canProceed: false,
          message: `Authentication failed: ${userError?.message || 'User not found'}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse the request body
    const { action } = await req.json();
    
    if (!action) {
      return new Response(
        JSON.stringify({
          error: 'Missing parameters',
          canProceed: false,
          message: 'Action parameter is required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check user's tier in subscriptions table
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle();

    // For business tier, always allow
    if (subscriptionData?.tier === 'business') {
      return new Response(
        JSON.stringify({
          canProceed: true,
          message: 'Business tier has unlimited usage'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default to free tier if no subscription found
    const tier = subscriptionData?.tier || 'free';

    // Check current usage
    const { data: usageData, error: usageError } = await supabase
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle();

    // Get the current usage count
    let currentUsage = 0;
    if (usageData) {
      if (action === 'ideas') currentUsage = usageData.ideas_generated || 0;
      else if (action === 'scripts') currentUsage = usageData.scripts_generated || 0;
      else if (action === 'hooks') currentUsage = usageData.hooks_generated || 0;
    }

    // Determine max limit based on tier and action
    let maxLimit = 5; // Default limit
    
    if (action === 'ideas') {
      if (tier === 'free') maxLimit = 5;
      else if (tier === 'pro') maxLimit = 20;
      else if (tier === 'plus') maxLimit = 50;
    } else if (action === 'scripts') {
      if (tier === 'free') maxLimit = 3;
      else if (tier === 'pro') maxLimit = 10;
      else if (tier === 'plus') maxLimit = 25;
    } else if (action === 'hooks') {
      if (tier === 'free') maxLimit = 5;
      else if (tier === 'pro') maxLimit = 15;
      else if (tier === 'plus') maxLimit = 30;
    }

    // Check if user is over their limit
    if (currentUsage >= maxLimit) {
      return new Response(
        JSON.stringify({
          canProceed: false,
          message: `You've reached your daily limit for ${action}. Upgrade your plan for more.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment usage counter
    const usage = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      ideas_generated: action === 'ideas' ? 1 : 0,
      scripts_generated: action === 'scripts' ? 1 : 0,
      hooks_generated: action === 'hooks' ? 1 : 0
    };

    if (usageData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_daily_usage')
        .update({
          ideas_generated: action === 'ideas' ? (usageData.ideas_generated || 0) + 1 : (usageData.ideas_generated || 0),
          scripts_generated: action === 'scripts' ? (usageData.scripts_generated || 0) + 1 : (usageData.scripts_generated || 0),
          hooks_generated: action === 'hooks' ? (usageData.hooks_generated || 0) + 1 : (usageData.hooks_generated || 0)
        })
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0]);

      if (updateError) {
        console.error('Error updating usage:', updateError);
        return new Response(
          JSON.stringify({
            error: 'Database error',
            canProceed: false,
            message: `Failed to update usage: ${updateError.message}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('user_daily_usage')
        .insert([usage]);

      if (insertError) {
        console.error('Error inserting usage:', insertError);
        return new Response(
          JSON.stringify({
            error: 'Database error',
            canProceed: false,
            message: `Failed to record usage: ${insertError.message}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({
        canProceed: true,
        message: 'Usage limit checked and updated successfully',
        debug: {
          tier,
          currentUsage,
          maxLimit,
          userId: user.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unhandled error in check-usage-limits:', error);
    return new Response(
      JSON.stringify({
        error: 'Server error',
        canProceed: false,
        message: error.message || 'An unexpected error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
