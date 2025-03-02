
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
      auth: { persistSession: false }
    });

    const { action } = await req.json();
    
    if (!action || !['ideas', 'scripts', 'hooks'].includes(action)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid action. Must be one of: 'ideas', 'scripts', or 'hooks'" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call our database function to check usage limits
    const { data, error } = await supabase.rpc('check_and_increment_usage', {
      feature_name: action
    });

    if (error) {
      console.error("Error checking usage limits:", error);
      return new Response(
        JSON.stringify({ 
          error: `Error checking usage limits: ${error.message}`,
          canProceed: false 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data) {
      // User has reached their limit
      const message = `You've reached your daily limit for ${action} generation.`;
      console.log(message);
      
      return new Response(
        JSON.stringify({ 
          canProceed: false,
          message
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        canProceed: true,
        message: `Usage limit check passed for ${action}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: `Unexpected error: ${error.message}`,
        canProceed: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
