
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    // Parse the request body
    const { niche, audience, videoType, platform, customIdeas } = await req.json();
    console.log("Request data:", { niche, audience, videoType, platform, customIdeas });
    
    // Check if this is an e-commerce ad request
    const isAdRequest = videoType.toLowerCase().includes('ad') || 
                         videoType.toLowerCase().includes('ads') || 
                         videoType.toLowerCase().includes('advertisement') ||
                         videoType.toLowerCase().includes('promotional');
    
    // Construct the appropriate prompt based on whether it's an ad request or not
    let promptContent;
    
    if (isAdRequest) {
      promptContent = `Generate 5 viral product advertisement ideas for ${platform} with the following criteria:
      - Product Niche: ${niche}
      - Target Audience: ${audience}
      - Ad Type: ${videoType}
      
      For each idea, provide:
      - A catchy title that will make customers want to buy the product
      - A compelling description that highlights product benefits and includes a clear call-to-action
      - Category (e.g., Testimonial, Demo, Before/After, etc.)
      - 3 relevant hashtags (without the # symbol) to maximize reach
      
      ${customIdeas ? `Consider these additional ideas or requirements: ${customIdeas}` : ''}
      
      Format the response as JSON with this structure:
      {
        "ideas": [
          {
            "title": "string",
            "description": "string",
            "category": "string",
            "tags": ["string"]
          }
        ]
      }`;
    } else {
      promptContent = `Generate 5 viral video ideas for ${platform} with the following criteria:
      - Niche: ${niche}
      - Target Audience: ${audience}
      - Video Type: ${videoType}
      
      For each idea, provide:
      - A catchy title
      - A brief description
      - Category
      - 3 relevant hashtags (without the # symbol)
      
      ${customIdeas ? `Consider these additional ideas or requirements: ${customIdeas}` : ''}
      
      Format the response as JSON with this structure:
      {
        "ideas": [
          {
            "title": "string",
            "description": "string",
            "category": "string",
            "tags": ["string"]
          }
        ]
      }`;
    }

    console.log("Using prompt:", promptContent);

    if (!openAIApiKey) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key is not configured. Please set the OPENAI_API_KEY in your Supabase project."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Make the request to OpenAI
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
            content: isAdRequest 
              ? 'You are a marketing expert who specializes in creating viral product advertisements for social media.'
              : 'You are a social media content strategist who helps creators make viral content.' 
          },
          { role: 'user', content: promptContent }
        ],
      }),
    });

    // Process the response
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}` 
        }),
        {
          status: 502, // Bad Gateway to indicate upstream service error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const data = await response.json();
    console.log("OpenAI response status:", response.status);
    
    const aiResponse = data.choices[0].message.content;
    console.log("OpenAI response:", aiResponse);

    try {
      // Try to parse the JSON response
      const ideas = JSON.parse(aiResponse);
      
      // Return the ideas
      return new Response(JSON.stringify(ideas), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError, "Raw response:", aiResponse);
      return new Response(
        JSON.stringify({ 
          error: `Failed to parse OpenAI response: ${parseError.message}`,
          rawResponse: aiResponse 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
