
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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt;
    if (type === 'script') {
      prompt = `Write a detailed video script for a ${platform} video with the following details:
        Title: ${title}
        Description: ${description}
        Tags: ${tags ? tags.join(', ') : ''}
        
        The script should be engaging and follow ${platform}'s best practices. Include hooks, main points, and call-to-action.`;
    } else {
      prompt = `Generate 5 viral video ideas for ${platform} with:
        Niche: ${niche}
        Target Audience: ${audience}
        Video Type: ${videoType}
        
        Generate ideas in this JSON format:
        {
          "ideas": [
            {
              "title": "catchy title",
              "description": "detailed description",
              "category": "content category",
              "tags": ["tag1", "tag2", "tag3"]
            }
          ]
        }`;
    }

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
            content: type === 'script' 
              ? 'You are a professional video script writer who creates engaging social media content.'
              : 'You are a social media content strategist who generates viral video ideas. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    if (type === 'script') {
      return new Response(JSON.stringify({ script: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const parsedContent = JSON.parse(content);
      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Failed to parse generated content');
    }
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
