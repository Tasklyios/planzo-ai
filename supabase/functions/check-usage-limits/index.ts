
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  action: string; // 'ideas' or 'scripts'
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Add CORS headers to all responses
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user ID from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false, 
          canProceed: false,
          message: 'User not authenticated'
        }),
        { headers, status: 401 }
      );
    }

    const requestData: RequestBody = await req.json();
    const action = requestData.action;

    // Check the action type is valid
    if (action !== 'ideas' && action !== 'scripts') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          canProceed: false,
          message: 'Invalid action type. Must be "ideas" or "scripts".'
        }),
        { headers, status: 400 }
      );
    }

    console.log(`Checking usage limits for user ${user.id} for action: ${action}`);

    // Check usage limits by calling check_and_increment_usage function
    // Note: The function only checks usage, it doesn't increment it yet
    const { data: usageCheckResult, error: usageCheckError } = await supabaseClient
      .rpc('check_and_increment_usage', { feature_name: action });

    if (usageCheckError) {
      console.error('Error checking usage limits:', usageCheckError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          canProceed: false,
          message: `Error checking usage limits: ${usageCheckError.message}`
        }),
        { headers, status: 500 }
      );
    }

    // Get user's subscription tier
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription tier:', subscriptionError);
    }

    const tier = subscription?.tier || 'free';
    
    // Get current usage count
    const { data: usageData, error: usageError } = await supabaseClient
      .from('user_daily_usage')
      .select(action === 'ideas' ? 'ideas_generated' : 'scripts_generated')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();
    
    // Handle case where no usage record exists yet
    const currentUsage = usageData 
      ? (action === 'ideas' ? usageData.ideas_generated : usageData.scripts_generated) || 0
      : 0;
      
    // Define usage limits based on tier
    const maxLimit = tier === 'free' ? 5 
      : tier === 'plus' ? 50 
      : tier === 'pro' ? 200 
      : tier === 'business' ? 1000 
      : 5;
      
    const canProceed = usageCheckResult === true;
    
    return new Response(
      JSON.stringify({
        success: true,
        canProceed,
        tier,
        usage: {
          current: currentUsage,
          max: maxLimit
        }
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        canProceed: false,
        message: error.message || 'An unexpected error occurred'
      }),
      { headers, status: 500 }
    );
  }
});
