
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const onRequestPost = async (context: any) => {
  try {
    const { 
      niche, 
      audience, 
      videoType, 
      platform, 
      customIdeas, 
      previousIdeas, 
      numIdeas,
      accountType,
      businessDescription,
      contentType,
      postingFrequency
    } = await context.request.json();

    // Build a more detailed prompt based on user profile
    let promptDetails = '';
    
    // Add account type specific details
    if (accountType === 'personal') {
      promptDetails += `You're generating ideas for a personal brand creator.\n`;
      
      if (contentType) {
        promptDetails += `- Content Type: ${contentType === 'talking_head' ? 'Talking head videos where the creator speaks directly to camera' : 
                          contentType === 'text_based' ? 'Text-overlay style videos with visuals or b-roll footage' : 
                          'Mixed format videos combining talking head segments with text overlays'}\n`;
      }
      
      if (postingFrequency) {
        promptDetails += `- Posting Frequency: ${postingFrequency}\n`;
      }
    } else if (accountType === 'ecommerce') {
      promptDetails += `You're generating ideas for an e-commerce business selling products.\n`;
    } else if (accountType === 'business') {
      promptDetails += `You're generating ideas for a business.\n`;
      if (businessDescription) {
        promptDetails += `- Business Description: ${businessDescription}\n`;
      }
    }

    const prompt = `Generate ${numIdeas || 5} viral video ideas for ${platform} with the following criteria:
    ${promptDetails}
    - Niche: ${niche}
    - Target Audience: ${audience}
    - Video Type: ${videoType}
    
    ${customIdeas ? `Consider these custom ideas as inspiration:\n${customIdeas}\n` : ''}
    
    ${previousIdeas && previousIdeas.titles && previousIdeas.titles.length > 0 ? 
      `Please avoid these previously generated ideas:\n${previousIdeas.titles.join("\n")}\n` : ''}
    
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
