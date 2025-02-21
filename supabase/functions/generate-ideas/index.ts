
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { type, title, description, platform, tags, niche, audience, videoType } = await req.json();
    
    // Validate OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    let prompt;
    if (type === 'script') {
      // Generate script for an existing idea
      prompt = `Generate a video script for a ${platform} video with the following details:
      Title: ${title}
      Description: ${description}
      Tags: ${tags ? tags.join(', ') : ''}
      
      Format the script with clear sections including:
      - Hook/Intro
      - Main Content
      - Call to Action
      
      Keep the tone engaging and suited for ${platform}.`;
    } else {
      // Generate new ideas
      prompt = `Generate 5 viral video ideas for ${platform} with the following criteria:
      - Niche: ${niche}
      - Target Audience: ${audience}
      - Video Type: ${videoType}
      
      For each idea, provide:
      - A catchy title
      - A brief description
      - Category
      - 3 relevant hashtags (without the # symbol)`;
    }

    console.log('Making request to OpenAI with prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a social media content strategist who helps creators make viral content.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let result;
    if (type === 'script') {
      // Return the generated script directly
      result = { script: data.choices[0].message.content };
    } else {
      // Parse the ideas response
      try {
        result = JSON.parse(data.choices[0].message.content);
      } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        throw new Error('Failed to parse generated ideas');
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
