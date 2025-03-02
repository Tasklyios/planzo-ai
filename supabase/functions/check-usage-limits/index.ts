
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Verify JWT token from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(
        JSON.stringify({ 
          error: 'Missing Authorization header',
          canProceed: false,
          message: 'You must be logged in to check usage limits'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the action from the request body
    let action: string
    try {
      const body = await req.json()
      action = body.action
      
      if (!action) {
        console.error('Missing action parameter')
        return new Response(
          JSON.stringify({ 
            error: 'Missing action parameter',
            canProceed: false,
            message: 'Action parameter is required (ideas, scripts, or hooks)'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (err) {
      console.error('Error parsing request body:', err)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          canProceed: false,
          message: 'Request body must be valid JSON with an action field'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the user from the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          canProceed: false,
          message: 'Your session may have expired. Please log in again.'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Checking usage for user ${user.id} and action ${action}`)

    // Call the check_and_increment_usage function
    const { data, error } = await supabase
      .rpc('check_and_increment_usage', {
        p_user_id: user.id,
        p_action: action
      })

    if (error) {
      console.error('Database function error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          canProceed: false,
          message: 'Error checking usage limits. Please try again later.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the user's subscription tier to provide specific upgrade messages
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (subError) {
      console.error('Error fetching subscription:', subError)
    }
    
    const tier = subscription?.tier || 'free'
    
    // If check_and_increment_usage returned false, the user has reached their limit
    if (data === false) {
      let upgradeMessage = "You've reached your daily limit for "
      
      switch (action) {
        case 'ideas':
          upgradeMessage += "generating ideas. "
          break
        case 'scripts':
          upgradeMessage += "generating scripts. "
          break
        case 'hooks':
          upgradeMessage += "generating hooks. "
          break
        default:
          upgradeMessage += "this action. "
      }
      
      // Add tier-specific upgrade recommendation
      if (tier === 'free') {
        upgradeMessage += "Upgrade to Pro or Plus for more generations!"
      } else if (tier === 'pro') {
        upgradeMessage += "Upgrade to Plus or Business for more generations!"
      } else if (tier === 'plus') {
        upgradeMessage += "Upgrade to Business for unlimited generations!"
      }
      
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message: upgradeMessage,
          tierInfo: tier
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return success if the user can proceed
    return new Response(
      JSON.stringify({ 
        canProceed: true,
        message: 'Usage limit check passed'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    // Log the error
    console.error('Unexpected error in check-usage-limits:', err)
    
    // Return a formatted error response
    return new Response(
      JSON.stringify({ 
        error: 'Server error',
        canProceed: false,
        message: 'An unexpected error occurred. Please try again later.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
