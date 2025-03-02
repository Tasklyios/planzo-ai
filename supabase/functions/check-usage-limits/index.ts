
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

// Define CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Main function handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(
        JSON.stringify({ 
          error: 'No authorization header', 
          canProceed: false, 
          message: 'Authentication required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }
    
    // Get Supabase client with the auth context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })

    // Verify auth context
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError?.message)
      return new Response(
        JSON.stringify({ 
          error: userError?.message || 'User not authenticated', 
          canProceed: false, 
          message: 'Authentication required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Get the request body
    const { action } = await req.json()
    
    if (!action) {
      console.error('Missing action parameter')
      return new Response(
        JSON.stringify({ 
          error: 'Missing action parameter', 
          canProceed: false, 
          message: 'Please specify which action to check (ideas, scripts, hooks)' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    
    // Check for business tier first (they have unlimited access)
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (subscriptionError) {
      console.error('Error fetching subscription tier:', subscriptionError.message)
      // Continue with the check - don't block users if we can't check subscription
    }
    
    // Business tier users have unlimited usage
    if (subscriptionData?.tier === 'business') {
      console.log(`Business tier user ${user.id} granted unlimited access for ${action}`)
      return new Response(
        JSON.stringify({ 
          canProceed: true, 
          message: 'Business tier has unlimited access',
          tier: 'business'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // For other tiers, check and increment usage
    console.log(`Checking usage for user ${user.id}, action: ${action}`)
    const { data, error } = await supabase.rpc('check_and_increment_usage', {
      p_user_id: user.id,
      p_action: action,
    })

    if (error) {
      console.error('Error checking usage:', error.message)
      return new Response(
        JSON.stringify({ 
          error: `Usage check failed: ${error.message}`, 
          canProceed: false, 
          message: 'Unable to verify usage limits. Please try again.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Return the result (boolean from the RPC function)
    const canProceed = data === true
    
    if (canProceed) {
      console.log(`User ${user.id} has not reached limit for ${action}`)
      return new Response(
        JSON.stringify({ 
          canProceed: true, 
          message: `You can proceed with ${action}`,
          tier: subscriptionData?.tier || 'free'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      console.log(`User ${user.id} has reached limit for ${action}`)
      
      // Determine message based on subscription tier
      const tier = subscriptionData?.tier || 'free'
      let message = `You've reached your daily limit for ${action}.`
      
      if (tier === 'free') {
        message += ' Upgrade to Pro or Plus for more generations!'
      } else if (tier === 'pro') {
        message += ' Upgrade to Plus or Business for more generations!'
      } else if (tier === 'plus') {
        message += ' Upgrade to Business for unlimited generations!'
      }
      
      return new Response(
        JSON.stringify({ 
          canProceed: false, 
          message: message,
          tier: tier
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Still use 200 status for limit reached (not an error)
        }
      )
    }
  } catch (e) {
    // Catch any unexpected errors
    console.error('Unexpected error:', e.message)
    return new Response(
      JSON.stringify({ 
        error: `Unexpected error: ${e.message}`, 
        canProceed: false, 
        message: 'An unexpected error occurred. Please try again.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
