
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
    // First validate the OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log('Received request body:', JSON.stringify(body));
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, title, description, platform, tags, niche, audience, videoType } = body;

    let prompt;
    if (type === 'script') {
      prompt = `Write a script for a ${platform} video with the following details:
      Title: ${title}
      Description: ${description}
      Tags: ${tags ? tags.join(', ') : ''}
      
      Write the script in this format:
      
      HOOK:
      [Attention-grabbing opening]
      
      MAIN CONTENT:
      [Main points and content]
      
      CALL TO ACTION:
      [Engaging call to action]
      
      Keep it concise and engaging for ${platform}.`;
    } else {
      prompt = `Generate 5 viral video ideas for ${platform} with these criteria:
      - Niche: ${niche}
      - Target Audience: ${audience}
      - Video Type: ${videoType}
      
      Format each idea as valid JSON with:
      - title: catchy title
      - description: brief description
      - category: content category
      - tags: array of 3 relevant hashtags (without # symbol)
      
      Structure the response as: {"ideas": [{idea1}, {idea2}, etc]}`;
    }

    console.log('Sending prompt to OpenAI:', prompt);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a professional social media content creator who specializes in creating viral content.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'OpenAI API request failed', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response:', openAIData);

    if (!openAIData.choices?.[0]?.message?.content) {
      return new Response(
        JSON.stringify({ error: 'Invalid response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = openAIData.choices[0].message.content;

    if (type === 'script') {
      // For scripts, return the content directly
      return new Response(
        JSON.stringify({ script: content }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // For ideas, try to parse the JSON response
      try {
        const parsedIdeas = JSON.parse(content);
        return new Response(
          JSON.stringify(parsedIdeas),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('Error parsing OpenAI response as JSON:', e);
        return new Response(
          JSON.stringify({ error: 'Failed to parse generated ideas', content }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error) {
    console.error('Unexpected error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
