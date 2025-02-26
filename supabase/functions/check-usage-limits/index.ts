
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tier, action } = await req.json()
    
    // Define limits based on tier
    const limits = {
      free: { ideas: 2, scripts: 2 },
      pro: { ideas: 10, scripts: 20 },
      plus: { ideas: 20, scripts: 30 },
      business: { ideas: 1000, scripts: 1000 }
    }

    const tierLimits = limits[tier as keyof typeof limits] || limits.free
    const limit = action === 'ideas' ? tierLimits.ideas : tierLimits.scripts

    return new Response(
      JSON.stringify({ limit }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
