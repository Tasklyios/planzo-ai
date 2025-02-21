
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const onRequestPost = async (context: any) => {
  try {
    const { niche, audience, videoType, platform } = await context.request.json();

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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

    const data = await response.json();
    const ideas = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(ideas), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
