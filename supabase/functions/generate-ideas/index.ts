
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
    console.log('Received request with:', { niche, audience, videoType, platform });

    const systemPrompt = `You are an expert social media content creator specializing in viral content for ${platform}.
    Your task is to generate engaging, platform-optimized video ideas that have high potential for virality.`;

    const userPrompt = `Generate 5 viral video ideas based on:
    - Niche: ${niche}
    - Target Audience: ${audience}
    - Content Type: ${videoType}

    Each idea must follow this exact JSON format without any additional text or formatting:
    {
      "ideas": [
        {
          "title": "The exact video title",
          "description": "A compelling description of the video content",
          "category": "The content category",
          "tags": ["tag1", "tag2", "tag3"]
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
        temperature: 0.8,
        max_tokens: 1000,
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
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response from OpenAI');
    }

    let ideas;
    try {
      ideas = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse AI response');
    }

    if (!ideas.ideas || !Array.isArray(ideas.ideas)) {
      console.error('Invalid ideas format:', ideas);
      throw new Error('Invalid ideas format from AI');
    }

    // Validate each idea has the required fields
    ideas.ideas = ideas.ideas.map(idea => ({
      title: String(idea.title || ''),
      description: String(idea.description || ''),
      category: String(idea.category || 'General'),
      tags: Array.isArray(idea.tags) ? idea.tags.map(String) : []
    }));

    console.log('Sending response:', ideas);
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
