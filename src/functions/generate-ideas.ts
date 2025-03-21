
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
      postingFrequency,
      // For script coach
      type,
      message,
      script,
      conversation
    } = await context.request.json();

    // Handle different types of requests
    if (type === 'script_coach') {
      // This functionality has been removed
      return new Response(JSON.stringify({
        error: "Script coach functionality is no longer available"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Create a more concise prompt to reduce token usage
    const prompt = `Generate ${numIdeas || 5} viral video ideas for ${platform} with:
    ${promptDetails}
    - Niche: ${niche}
    - Target Audience: ${audience}
    - Video Type: ${videoType}
    
    ${customIdeas ? `Consider these custom ideas as inspiration:\n${customIdeas}\n` : ''}
    
    ${previousIdeas && previousIdeas.titles && previousIdeas.titles.length > 0 ? 
      `Avoid these previously generated ideas:\n${previousIdeas.titles.join(", ")}\n` : ''}
    
    Format as JSON with this structure:
    {
      "ideas": [
        {
          "title": "string",
          "description": "string - make this detailed enough to generate a good script from",
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
        model: 'gpt-4o-mini', // Using the most cost-effective model
        messages: [
          { role: 'system', content: 'You are a social media content strategist who helps creators make viral content.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000, // Capping the output token length
      }),
    });

    const data = await response.json();
    const ideas = JSON.parse(data.choices[0].message.content);

    // Add expiration date to each idea (24 hours from now)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    
    ideas.ideas.forEach((idea: any) => {
      idea.expires_at = expirationDate.toISOString();
    });

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
