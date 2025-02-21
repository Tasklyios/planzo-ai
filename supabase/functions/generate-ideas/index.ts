
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
    const { niche, audience, videoType, platform } = await req.json();

    const systemPrompt = `You are an expert social media strategist specializing in viral content creation. 
    You understand current trends, audience psychology, and what makes content go viral on different platforms. 
    Your suggestions should be data-driven, engaging, and tailored to platform-specific best practices.`;

    const userPrompt = `Create 5 viral-worthy video ideas for ${platform} that will genuinely engage and provide value to the audience.

    Content Parameters:
    - Niche: ${niche}
    - Target Audience: ${audience}
    - Video Type: ${videoType}
    
    For each idea, provide:
    1. A highly clickable, emotionally engaging title (but not clickbait)
    2. A strategic description explaining why this will work
    3. The specific content category
    4. 3 trending, relevant hashtags
    
    Consider:
    - Current trends and viral patterns on ${platform}
    - Audience pain points and desires
    - Platform-specific best practices
    - Hooks that grab attention in first 3 seconds
    - Storytelling elements that keep viewers engaged
    - Call-to-actions that drive engagement
    
    Format as JSON:
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const ideas = JSON.parse(data.choices[0].message.content);

    // Validate the response format
    if (!ideas.ideas || !Array.isArray(ideas.ideas)) {
      throw new Error('Invalid response format from AI');
    }

    return new Response(JSON.stringify(ideas), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate ideas. Please try again.',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
