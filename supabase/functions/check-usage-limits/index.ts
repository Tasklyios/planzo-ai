
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const handleCors = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }
  return null
}

interface UsageRequest {
  action: string
}

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) {
    console.log('Returning CORS preflight response')
    return corsResponse
  }

  try {
    // Get Authorization header
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
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with auth from request
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify the JWT and get the user ID
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: jwtError } = await supabase.auth.getUser(jwt)
    
    if (jwtError || !user) {
      console.error('JWT verification failed:', jwtError)
      return new Response(
        JSON.stringify({
          error: 'JWT verification failed',
          canProceed: false,
          message: 'Authentication required'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const requestData: UsageRequest = await req.json()
    const { action } = requestData

    if (!action) {
      console.error('Missing required parameters:', action)
      return new Response(
        JSON.stringify({
          error: 'Missing required parameter: action',
          canProceed: false,
          message: 'Missing required parameter'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Checking usage for user ${user.id}, action: ${action}`)

    try {
      // Call the check_and_increment_usage SQL function
      const { data: result, error: checkError } = await supabase.rpc(
        'check_and_increment_usage',
        {
          p_user_id: user.id,
          p_action: action
        }
      )

      if (checkError) {
        console.error('Error checking usage limits:', checkError)
        return new Response(
          JSON.stringify({
            error: checkError.message,
            canProceed: false,
            message: 'Error checking usage limits'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (result === true) {
        console.log('User can proceed')
        return new Response(
          JSON.stringify({
            canProceed: true,
            message: 'Usage limit check passed'
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } else {
        console.log('User reached usage limit')
        
        // Get the user's subscription tier to provide better feedback
        const { data: subscription, error: tierError } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .maybeSingle()
        
        let message = `You've reached your daily limit for generating ${action}.`
        
        if (!tierError && subscription) {
          if (subscription.tier === 'free') {
            message += " Upgrade to Pro or Plus for more generations!";
          } else if (subscription.tier === 'pro') {
            message += " Upgrade to Plus or Business for more generations!";
          } else if (subscription.tier === 'plus') {
            message += " Upgrade to Business for unlimited generations!";
          }
        }

        return new Response(
          JSON.stringify({
            canProceed: false,
            message
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    } catch (error) {
      console.error('Unexpected error checking usage:', error)
      return new Response(
        JSON.stringify({
          error: 'Unexpected error checking usage',
          canProceed: false,
          message: error.message || 'Internal server error'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
        canProceed: false,
        message: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}
