
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Received request data:", requestData);

    const { niche, audience, videoType, platform, customIdeas } = requestData;
    console.log("Processing request with params:", { niche, audience, videoType, platform, customIdeas });

    if (!niche || !audience || !videoType || !platform) {
      console.error("Missing required fields:", { niche, audience, videoType, platform });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          message: 'Please provide all required fields: niche, audience, videoType, and platform'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error("OpenAI API key not configured");
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          message: 'OpenAI API key is not configured'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const prompt = `Generate 5 viral ${platform} video ideas for ${audience} in the ${niche} niche.
The video type should be: ${videoType}

Create ideas based on these proven formats:
1. How-to and tutorials that solve specific problems
2. Behind-the-scenes insights and real experiences
3. Data-driven content with specific numbers/results
4. Myth-busting and truth-revealing content
5. Personal journey and transformation stories

Each idea should:
- Hook viewers in first 3 seconds
- Include specific numbers or results
- Focus on real experiences/data
- Create instant curiosity
- Provide actionable value

Format response as JSON with this structure:
{
  "ideas": [
    {
      "title": "string (attention-grabbing hook)",
      "description": "string (specific value proposition)",
      "category": "string (content type)",
      "tags": ["string"] (3-5 relevant keywords)
    }
  ]
}

${customIdeas ? `\nUse these custom ideas as additional inspiration:\n${customIdeas}` : ''}`;

    console.log("Sending request to OpenAI...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert content strategist who creates viral ideas based on proven formulas. Focus on hooks that create instant curiosity, specific results, and actionable insights.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API error',
          message: errorData.error?.message || 'Failed to generate ideas'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log("Received response from OpenAI:", data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format',
          message: 'Invalid response format from OpenAI'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      const parsedContent = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed OpenAI response:", parsedContent);

      if (!parsedContent.ideas || !Array.isArray(parsedContent.ideas)) {
        console.error('Invalid ideas format:', parsedContent);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid response format',
            message: 'Invalid ideas format from OpenAI'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(parsedContent),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Parse error',
          message: 'Failed to parse AI response'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to generate ideas. Please try again.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
