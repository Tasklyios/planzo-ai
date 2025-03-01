
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // Parse the request body to get the action
    const { action } = await req.json()
    if (!action) {
      throw new Error('Missing action parameter')
    }

    // Initialize Supabase client with the project URL and service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '' // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the user ID from the JWT in the Authorization header
    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData, error: jwtError } = await supabase.auth.getUser(jwt)

    if (jwtError || !userData?.user?.id) {
      console.error('JWT verification error:', jwtError)
      return new Response(
        JSON.stringify({
          error: 'Authentication failed',
          canProceed: false,
          message: 'You must be logged in to use this feature'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = userData.user.id

    // Get the user's subscription tier (default to 'free' if not found)
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .maybeSingle()

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError)
    }

    const tier = subscription?.tier || 'free'

    // Get the current usage for today
    const { data: usageData, error: usageError } = await supabase
      .from('user_daily_usage')
      .select(action === 'ideas' ? 'ideas_generated' : 'scripts_generated')
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle()

    if (usageError) {
      console.error('Error fetching usage data:', usageError)
    }

    const currentUsage = action === 'ideas'
      ? usageData?.ideas_generated || 0
      : usageData?.scripts_generated || 0

    // Set max limit based on tier and action
    let maxLimit = 0
    if (action === 'ideas') {
      maxLimit = tier === 'free' ? 2 :
                tier === 'pro' ? 20 :
                tier === 'plus' ? 50 :
                tier === 'business' ? 1000 : 2
    } else if (action === 'scripts') {
      maxLimit = tier === 'free' ? 1 :
                tier === 'pro' ? 10 :
                tier === 'plus' ? 25 :
                tier === 'business' ? 500 : 1
    }

    console.log(`User ${userId} with tier ${tier} has used ${currentUsage}/${maxLimit} ${action}`)

    // Check if under limit
    if (currentUsage >= maxLimit) {
      return new Response(
        JSON.stringify({
          canProceed: false,
          message: `You've reached your daily limit for ${action} generation (${currentUsage}/${maxLimit}).`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If we got here, the user can proceed
    // We'll update the usage counter in the database when the actual generation happens
    return new Response(
      JSON.stringify({
        canProceed: true,
        message: 'Usage limit check passed',
        currentUsage,
        maxLimit
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error checking usage limits:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Error checking usage limits',
        canProceed: false,
        message: `Error checking usage limits: ${error.message || 'Unknown error'}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
