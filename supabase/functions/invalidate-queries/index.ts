
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS for browsers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const bodyText = await req.text();
    // Safely parse JSON, handling empty body case
    const body = bodyText ? JSON.parse(bodyText) : {};
    const action = body.action || 'global';
    
    // Simulating successful invalidation
    console.log(`Invalidating queries for action: ${action}`);
    
    return new Response(
      JSON.stringify({ success: true, message: `Queries for ${action} invalidated` }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error invalidating queries:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      },
    )
  }
})
