
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // The current time
    const now = new Date().toISOString();
    
    // Find expired ideas (created more than 24 hours ago, not saved, not scheduled)
    const { data, error } = await supabase
      .from('video_ideas')
      .delete()
      .lt('expires_at', now)
      .is('is_saved', false)
      .is('scheduled_for', null);

    if (error) {
      throw error;
    }

    console.log(`Successfully cleaned up expired ideas`);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Expired ideas cleaned up' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error cleaning up expired ideas:', error);
    
    return new Response(
      JSON.stringify({ error: `Failed to clean up expired ideas: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
