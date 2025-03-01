
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Create a Supabase client with the service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user_id and action from request
    const { user_id, action } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!action || !['ideas', 'scripts'].includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid action is required (ideas or scripts)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Checking usage limits for user ${user_id} for action: ${action}`);
    
    // Get user's subscription tier
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user_id)
      .maybeSingle();
    
    if (subscriptionError) {
      console.error("Error fetching subscription:", subscriptionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error fetching subscription data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get current usage for today
    const { data: usage, error: usageError } = await supabase
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle();
    
    if (usageError) {
      console.error("Error fetching usage:", usageError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error fetching usage data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Default to tier free if no subscription found
    const tier = subscription?.tier || 'free';
    console.log(`User subscription tier: ${tier}`);
    
    // Determine current usage
    const currentUsage = usage ? (action === 'ideas' ? usage.ideas_generated : usage.scripts_generated) : 0;
    console.log(`Current usage for ${action}: ${currentUsage}`);
    
    // Set max limit based on tier
    let maxLimit = 0;
    if (action === 'ideas') {
      switch (tier) {
        case 'free':
          maxLimit = 2;
          break;
        case 'pro':
          maxLimit = 20;
          break;
        case 'plus': // Properly handle the Plus tier
          maxLimit = 50; // Increased limit for plus tier
          break;
        case 'business':
          maxLimit = 1000;
          break;
        default:
          maxLimit = 2; // Default to free tier limit
      }
    } else if (action === 'scripts') {
      switch (tier) {
        case 'free':
          maxLimit = 1;
          break;
        case 'pro':
          maxLimit = 10;
          break;
        case 'plus': // Properly handle the Plus tier
          maxLimit = 25; // Increased limit for plus tier
          break;
        case 'business':
          maxLimit = 500;
          break;
        default:
          maxLimit = 1; // Default to free tier limit
      }
    }
    
    console.log(`Max limit for ${tier} tier and ${action} action: ${maxLimit}`);
    
    // Check if under limit
    const canProceed = currentUsage < maxLimit;
    console.log(`Can proceed: ${canProceed} (${currentUsage}/${maxLimit})`);
    
    if (!canProceed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          canProceed: false, 
          message: `You've reached your daily limit for ${action} (${currentUsage}/${maxLimit}).` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Increment usage counter
    const usageData = {
      user_id,
      date: new Date().toISOString().split('T')[0]
    };
    
    if (action === 'ideas') {
      usageData.ideas_generated = usage ? usage.ideas_generated + 1 : 1;
      usageData.scripts_generated = usage ? usage.scripts_generated : 0;
    } else if (action === 'scripts') {
      usageData.scripts_generated = usage ? usage.scripts_generated + 1 : 1;
      usageData.ideas_generated = usage ? usage.ideas_generated : 0;
    }
    
    if (usage) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_daily_usage')
        .update(usageData)
        .eq('id', usage.id);
      
      if (updateError) {
        console.error("Error updating usage:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Error updating usage data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('user_daily_usage')
        .insert([usageData]);
      
      if (insertError) {
        console.error("Error inserting usage:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Error inserting usage data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        canProceed: true, 
        tier: tier,
        usage: {
          current: currentUsage + 1,
          max: maxLimit
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
