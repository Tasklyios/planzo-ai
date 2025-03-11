
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { usernames, platform, notes, userId } = await req.json();
    
    // This endpoint is being deprecated - return a fallback response
    console.log("Content style analysis is deprecated. Returning fallback values.");
    
    // Provide fallback values
    const styleAnalysis = {
      contentStyle: "This feature has been deprecated.",
      contentPersonality: "Please use regular content creation features.",
      strengths: [
        "Clear communication",
        "Direct approach",
        "Effective messaging"
      ]
    };

    return new Response(
      JSON.stringify(styleAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-content-style function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'This feature has been deprecated' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
