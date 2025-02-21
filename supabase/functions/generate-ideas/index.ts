const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, title, description, platform, tags } = await req.json();

    // If type is script, generate a video script
    if (type === 'script') {
      const prompt = `Create an engaging script for a ${platform} video with the following details:
      Title: ${title}
      Description: ${description}
      Tags: ${tags.join(', ')}
      
      Write a compelling script that:
      1. Starts with a strong hook to grab attention in the first 3 seconds
      2. Follows a clear structure (hook, introduction, main points, call to action)
      3. Uses conversational language appropriate for ${platform}
      4. Includes timestamps or section breaks
      5. Ends with a strong call to action
      
      Format the response as a well-structured script with sections clearly marked.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert video script writer who specializes in creating viral social media content.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Failed to generate script');
      }

      // Return the script in the expected format
      return new Response(
        JSON.stringify({
          script: data.choices[0].message.content,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle regular idea generation (keeping existing functionality)
    const prompt = `Generate 5 viral video ideas for ${platform} with the following criteria:
    - Niche: ${title}
    - Target Audience: ${description}
    
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
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a social media content strategist who helps creators make viral content.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const ideas = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(ideas), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
