
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.9";

// CORS headers for browser requests
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    // Validate environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or key missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing Supabase credentials" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!openAIApiKey) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured. Please set the OPENAI_API_KEY in your Supabase project." }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    let { niche, audience, videoType, platform = "TikTok", customIdeas = "" } = await req.json();
    console.log("Request received:", { niche, audience, videoType, platform, customIdeas: customIdeas ? "provided" : "not provided" });

    if (!niche || !audience || !videoType) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({ error: "Missing required parameters: niche, audience, and videoType are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this is an ad-related request for ecommerce users
    const isAdRequest = videoType.toLowerCase().includes('ad') || 
                        videoType.toLowerCase().includes('advertisement') ||
                        videoType.toLowerCase().includes('promotional');

    // Build the prompt
    let systemPrompt = `You are a creative content strategist who specializes in generating viral content ideas for social media.`;
    
    let promptContent = `Generate 5 highly engaging video ideas for ${platform} with the following criteria:
    - Niche: ${niche}
    - Target Audience: ${audience}
    - Video Type: ${videoType}
    
    For each idea, provide:
    1. A catchy title (maximum 60 characters)
    2. A detailed description that explains the core concept (100-150 words)
    3. Category (e.g., tutorial, reaction, challenge, etc.)
    4. 3 relevant hashtags (without the # symbol)`;

    // If this is an ad-related request, modify the prompt
    if (isAdRequest) {
      promptContent = `Generate 5 effective advertisement ideas for ${platform} with the following criteria:
      - Product/Service Niche: ${niche}
      - Target Audience: ${audience}
      - Ad Type: ${videoType}
      
      For each ad idea, provide:
      1. A compelling headline (maximum 60 characters)
      2. A detailed description explaining the ad concept and its unique selling proposition (100-150 words)
      3. Ad Category (e.g., product demo, testimonial, educational, promotional)
      4. 3 relevant hashtags (without the # symbol) for marketing`;
    }

    // If custom ideas are provided, include them in the prompt
    if (customIdeas && customIdeas.trim().length > 0) {
      promptContent += `\n\nPlease incorporate or take inspiration from these custom ideas the user has provided:\n${customIdeas}`;
    }

    // Add formatting instructions
    promptContent += `\n\nFormat the response as a valid JSON object with the following structure (and ONLY this structure):
    {
      "ideas": [
        {
          "title": "string",
          "description": "string",
          "category": "string",
          "tags": ["string", "string", "string"]
        }
      ]
    }
    
    IMPORTANT: Make sure the response is a complete and valid JSON object that can be parsed with JSON.parse().`;

    console.log("Using prompt:", promptContent);

    // Make the request to OpenAI
    console.log("Sending request to OpenAI API");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: promptContent
          }
        ],
        temperature: 0.7,
      }),
    });

    // Process the response
    if (!response.ok) {
      let errorMessage = "Unknown error occurred with OpenAI API";
      try {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        errorMessage = errorData.error?.message || errorData.error || errorMessage;
      } catch (jsonError) {
        console.error("Failed to parse OpenAI error response", jsonError);
      }
      
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errorMessage}` }),
        {
          status: 200, // Return 200 to the client even though the upstream service failed
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const data = await response.json();
    console.log("OpenAI response status:", response.status);
    
    const aiResponse = data.choices[0].message.content;
    console.log("OpenAI response received, first 100 characters:", aiResponse.substring(0, 100));

    // Parse the response as JSON
    try {
      const parsedResponse = JSON.parse(aiResponse);
      console.log("Successfully parsed OpenAI response as JSON");
      
      // Return the parsed ideas
      return new Response(JSON.stringify(parsedResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError, "Raw response:", aiResponse);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response. The AI might have returned an invalid format.",
          rawResponse: aiResponse.substring(0, 500) // Only return part of the response to avoid huge payloads
        }),
        {
          status: 200, // Return 200 to client even with parse error so we can handle it gracefully
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: `Server error: ${error.message || 'An unknown error occurred'}` 
      }),
      {
        status: 200, // Return 200 to the client even with server error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
