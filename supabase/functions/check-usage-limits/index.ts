
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
    const { action, count = 1 } = await req.json();
    
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

    console.log('User subscription tier:', subscriptionData?.tier);

    // For business tier, always allow but still track usage
    const tier = subscriptionData?.tier || 'free';
    const isBusiness = tier === 'business';

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
    let maxLimit = 10; // Default limit updated to 10 for ideas
    
    if (action === 'ideas') {
      if (tier === 'free') maxLimit = 10; // Updated from 5 to 10
      else if (tier === 'pro') maxLimit = 20;
      else if (tier === 'plus') maxLimit = 50;
      else if (tier === 'business') maxLimit = 999; // Using 999 for business tier
    } else if (action === 'scripts') {
      if (tier === 'free') maxLimit = 3;
      else if (tier === 'pro') maxLimit = 10;
      else if (tier === 'plus') maxLimit = 25;
      else if (tier === 'business') maxLimit = 999;
    } else if (action === 'hooks') {
      if (tier === 'free') maxLimit = 5;
      else if (tier === 'pro') maxLimit = 15;
      else if (tier === 'plus') maxLimit = 30;
      else if (tier === 'business') maxLimit = 999;
    }

    // For ideas specifically, use the number 5 instead of 1 for increment
    const incrementCount = (action === 'ideas') ? 5 : 1;
    
    // Check if user would exceed their limit (but always let business tier proceed)
    if (!isBusiness && currentUsage + incrementCount > maxLimit) {
      return new Response(
        JSON.stringify({
          canProceed: false,
          message: `You've reached your daily limit for ${action}. Upgrade your plan for more.`,
          currentUsage,
          maxLimit
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment usage counter with the correct count (even for business tier)
    const usage = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      ideas_generated: action === 'ideas' ? incrementCount : 0,
      scripts_generated: action === 'scripts' ? incrementCount : 0,
      hooks_generated: action === 'hooks' ? incrementCount : 0
    };

    if (usageData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_daily_usage')
        .update({
          ideas_generated: action === 'ideas' ? (usageData.ideas_generated || 0) + incrementCount : (usageData.ideas_generated || 0),
          scripts_generated: action === 'scripts' ? (usageData.scripts_generated || 0) + incrementCount : (usageData.scripts_generated || 0),
          hooks_generated: action === 'hooks' ? (usageData.hooks_generated || 0) + incrementCount : (usageData.hooks_generated || 0)
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
          userId: user.id,
          incrementBy: incrementCount
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
