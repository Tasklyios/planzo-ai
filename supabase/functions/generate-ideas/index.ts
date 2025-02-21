
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
      prompt = `Write a script for a ${platform} video with these details:
        Title: ${title}
        Description: ${description}
        Tags: ${tags ? tags.join(', ') : ''}
        
        Format the script with:
        
        HOOK:
        [Attention-grabbing opening]
        
        MAIN CONTENT:
        [Main points and content]
        
        CALL TO ACTION:
        [Engaging call to action]
        
        Keep it engaging and suited for ${platform}.`;
    } else {
      prompt = `Generate 5 viral video ideas for ${platform} with:
        Niche: ${niche}
        Target Audience: ${audience}
        Video Type: ${videoType}
        
        For each idea include:
        - title
        - description
        - category
        - tags (3 relevant hashtags without # symbol)
        
        Format as JSON: {"ideas": [{idea1}, {idea2}, etc]}`;
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
              ? 'You are a professional script writer for social media content.'
              : 'You are a social media content strategist who creates viral content ideas.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (type === 'script') {
      return new Response(
        JSON.stringify({ script: content }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Parse ideas JSON response
      try {
        const parsedContent = JSON.parse(content);
        return new Response(
          JSON.stringify(parsedContent),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('Error parsing OpenAI response:', e);
        throw new Error('Failed to parse generated ideas');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
