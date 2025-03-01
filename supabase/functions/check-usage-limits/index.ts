
// supabase/functions/check-usage-limits/index.ts
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();
    console.log(`Checking usage limits for action: ${action}`);

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed');
    }

    // Get user's subscription tier
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      // Default to free tier if we can't determine the subscription
      const tier = 'free';
      
      // Create a free tier subscription for the user if it doesn't exist
      await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        tier: 'free'
      }).select().maybeSingle();

      const maxLimit = tier === 'free' ? 5 : 
                       tier === 'pro' ? 20 : 
                       tier === 'plus' ? 50 : 1000;
                       
      console.log(`New user with default tier: ${tier}, limit: ${maxLimit}`);
      
      // Allow the action since it's a new user
      return new Response(
        JSON.stringify({ 
          canProceed: true, 
          message: "New user - first usage allowed" 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const tier = subscription?.tier || 'free';
    console.log(`User subscription tier: ${tier}`);

    // Get current usage for today
    const { data: usage, error: usageError } = await supabase
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error("Error fetching usage:", usageError);
      throw new Error(`Failed to check usage: ${usageError.message}`);
    }

    // Determine current usage value based on action type
    const currentUsage = usage 
      ? (action === 'ideas' ? usage.ideas_generated : usage.scripts_generated) || 0 
      : 0;
    
    console.log(`Current usage for ${action}: ${currentUsage}`);

    // Set max limit based on tier
    const maxLimit = tier === 'free' ? 5 : 
                    tier === 'pro' ? 20 : 
                    tier === 'plus' ? 50 : 1000;
    
    console.log(`Max limit for tier ${tier}: ${maxLimit}`);

    if (currentUsage >= maxLimit) {
      console.log(`Usage limit reached: ${currentUsage}/${maxLimit}`);
      return new Response(
        JSON.stringify({ 
          canProceed: false, 
          message: `You've reached your daily limit for ${action === 'ideas' ? 'idea generation' : 'script generation'}.` 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Update usage counter
    if (!usage) {
      // Insert new usage record
      await supabase.from('user_daily_usage').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        ideas_generated: action === 'ideas' ? 1 : 0,
        scripts_generated: action === 'scripts' ? 1 : 0
      });
    } else {
      // Update existing usage record
      await supabase.from('user_daily_usage').update({
        ideas_generated: action === 'ideas' ? (usage.ideas_generated || 0) + 1 : (usage.ideas_generated || 0),
        scripts_generated: action === 'scripts' ? (usage.scripts_generated || 0) + 1 : (usage.scripts_generated || 0)
      }).eq('id', usage.id);
    }

    console.log(`Usage updated. User can proceed with ${action}.`);
    return new Response(
      JSON.stringify({ 
        canProceed: true, 
        message: "Usage limit check passed",
        tier: tier,
        currentUsage: currentUsage + 1,
        maxLimit: maxLimit 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in check-usage-limits:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        canProceed: false,
        message: `Error checking usage limits: ${error.message}`
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
