
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  action: 'ideas' | 'scripts' | 'hooks';
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context of the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { 
            Authorization: req.headers.get('Authorization')!,
          } 
        } 
      }
    );

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required', 
          message: 'Please sign in to check usage limits',
          canProceed: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    const userId = session.user.id;
    const { action } = await req.json() as RequestBody;

    // First, get the user's subscription tier
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single();
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') { // Not found is okay
      return new Response(
        JSON.stringify({ 
          error: subscriptionError.message, 
          message: 'Error checking subscription status',
          canProceed: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Use 'free' tier if no subscription record exists
    const tier = subscription?.tier || 'free';
    
    // IMPORTANT: If user is on Business tier, allow unlimited usage
    if (tier === 'business') {
      return new Response(
        JSON.stringify({ 
          canProceed: true,
          tier
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // For all other tiers, check daily usage
    const { data: usage, error: usageError } = await supabaseClient
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle();
    
    if (usageError) {
      return new Response(
        JSON.stringify({ 
          error: usageError.message, 
          message: 'Error checking usage',
          canProceed: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    // Calculate current usage
    const currentUsage = usage ? (
      action === 'ideas' ? usage.ideas_generated : 
      action === 'scripts' ? usage.scripts_generated : 
      usage.hooks_generated
    ) : 0;
    
    // Define limits based on tier and action
    let limit = 0;
    
    if (action === 'ideas') {
      limit = tier === 'free' ? 2 : tier === 'pro' ? 20 : tier === 'plus' ? 50 : 99999;
    } else if (action === 'scripts') {
      limit = tier === 'free' ? 1 : tier === 'pro' ? 10 : tier === 'plus' ? 25 : 99999;
    } else {
      limit = tier === 'free' ? 3 : tier === 'pro' ? 15 : tier === 'plus' ? 30 : 99999;
    }
    
    if (currentUsage >= limit) {
      // User has reached their limit
      let message = `You've reached your daily limit for ${action} on the ${tier} plan.`;
      
      // Add upgrade suggestion based on current tier
      if (tier === 'free') {
        message += ' Upgrade to Pro or Plus for more generations!';
      } else if (tier === 'pro') {
        message += ' Upgrade to Plus or Business for more generations!';
      } else if (tier === 'plus') {
        message += ' Upgrade to Business for unlimited generations!';
      }
      
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message,
          tier,
          currentUsage,
          limit
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // User is under their limit, can proceed
    return new Response(
      JSON.stringify({ 
        canProceed: true,
        tier,
        currentUsage,
        limit
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        canProceed: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
