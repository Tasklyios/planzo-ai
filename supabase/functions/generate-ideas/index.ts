
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { 
      niche, 
      audience, 
      videoType, 
      platform, 
      customIdeas, 
      previousIdeas 
    } = await req.json();

    console.log("Received request with parameters:", { niche, audience, videoType, platform });
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing API key" 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const prompt = `Generate 5 viral video ideas for ${platform} with the following criteria:
- Niche: ${niche}
- Target Audience: ${audience}
- Video Type: ${videoType}

${previousIdeas && previousIdeas.titles && previousIdeas.titles.length > 0 ? 
  `IMPORTANT: Avoid similar ideas to these previously generated ideas:
  - Titles: ${previousIdeas.titles.join(', ')}
  - Categories: ${previousIdeas.categories.join(', ')}
  Make sure to create NEW and DIFFERENT ideas that are not repetitive or too similar to these.` 
  : ''}

${customIdeas ? `Custom ideas request: ${customIdeas}` : ''}

For each idea, provide:
- A catchy title
- A brief description (2-3 sentences about the content)
- Category
- 3-5 relevant hashtags

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

    console.log("Sending request to OpenAI");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "Error from AI service: " + error }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log("OpenAI response received, first 100 characters:", data.choices[0].message.content.substring(0, 100));

    try {
      const ideas = JSON.parse(data.choices[0].message.content);
      return new Response(JSON.stringify(ideas), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      // Return the raw response if JSON parsing fails
      return new Response(JSON.stringify({ 
        ideas: [],
        error: "Failed to parse AI response", 
        rawResponse: data.choices[0].message.content 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || "An unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
