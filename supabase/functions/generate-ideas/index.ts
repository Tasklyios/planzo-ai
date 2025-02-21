
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
    const { niche, audience, videoType, platform } = await req.json();
    
    // Validate required fields
    if (!niche || !audience || !videoType || !platform) {
      throw new Error('Missing required fields: niche, audience, videoType, and platform are required');
    }

    // Validate OpenAI API key
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const prompt = `Generate 5 viral video ideas for ${platform} with the following criteria:
    - Niche: ${niche}
    - Target Audience: ${audience}
    - Video Type: ${videoType}
    
    For each idea, provide:
    - A catchy title
    - A brief description
    - Category
    - 3 relevant hashtags (without the # symbol)
    
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

    console.log('Sending request to OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a social media content strategist who helps creators make viral content.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Parse the response to ensure it's valid JSON
    const ideas = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(ideas), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
