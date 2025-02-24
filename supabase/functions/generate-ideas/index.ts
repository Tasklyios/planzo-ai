
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VIRAL_IDEA_EXAMPLES = [
  {
    title: "I Tested 100 Dating App Bios and This One Got the Most Matches",
    description: "A data-driven experiment testing different dating app bios, revealing the psychology behind what makes people swipe right. Including surprising statistics and real user reactions.",
    category: "Dating & Relationships",
    tags: ["datingapps", "relationships", "experiment"]
  },
  {
    title: "How I Made $10,000 in 24 Hours with This Side Hustle",
    description: "Step-by-step breakdown of a unique side hustle opportunity, showing real earnings, time investment, and actionable steps viewers can take.",
    category: "Finance",
    tags: ["sidehustle", "makemoney", "finance"]
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, audience, videoType, platform, customIdeas } = await req.json();

    const prompt = `Generate 5 viral video ideas for ${platform} with the following criteria:
    - Niche: ${niche}
    - Target Audience: ${audience}
    - Video Type: ${videoType}
    ${customIdeas ? `\nConsider these additional ideas as inspiration:\n${customIdeas}` : ''}
    
    For each idea, provide:
    - A catchy title that will make people want to watch
    - A brief description explaining the content
    - Category (one or two words)
    - 3 relevant hashtags (without the # symbol)
    
    Structure the response exactly like this example (the structure is very important):
    {
      "ideas": [
        {
          "title": "I Tested 100 Dating App Bios and This One Got the Most Matches",
          "description": "A data-driven experiment testing different dating app bios, revealing the psychology behind what makes people swipe right. Including surprising statistics and real user reactions.",
          "category": "Dating & Relationships",
          "tags": ["datingapps", "relationships", "experiment"]
        }
      ]
    }`;

    console.log("Sending request to OpenAI with prompt:", prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a social media content strategist who helps creators make viral content. You MUST output only valid JSON that matches the example structure exactly.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("OpenAI response:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    try {
      const parsedContent = JSON.parse(data.choices[0].message.content);
      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
