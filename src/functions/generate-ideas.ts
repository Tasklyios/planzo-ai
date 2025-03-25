
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
      promptDetails += `- Focus on product showcases, customer testimonials, unboxing experiences, and product tutorials.\n`;
      promptDetails += `- Product Niche: ${niche}\n`;
      
      if (videoType) {
        promptDetails += `- Video Type: ${videoType}\n`;
      }
    } else if (accountType === 'business') {
      promptDetails += `You're generating ideas for a business.\n`;
      if (businessDescription) {
        promptDetails += `- Business Description: ${businessDescription}\n`;
      }
      promptDetails += `- Business Niche: ${niche}\n`;
      promptDetails += `- Focus on thought leadership, customer success stories, service explanations, and industry insights.\n`;
      
      if (videoType) {
        promptDetails += `- Video Type: ${videoType}\n`;
      }
    }

    // Expert prompt for viral content creation
    const expertPrompt = `You are an expert in viral social media content creation, specializing in YouTube, TikTok, and Instagram Reels. Your goal is to generate highly engaging video ideas, scripts, and hooks that maximize views, shares, and watch time. You understand trends, audience psychology, and platform algorithms to craft compelling content. Always provide structured video ideas with strong hooks, engaging storytelling elements, and clear calls to action. Adapt ideas for different niches when needed.`;

    // Create a more concise prompt to reduce token usage
    const prompt = `${expertPrompt}

Generate ${numIdeas || 5} viral video ideas for ${platform || 'social media'} with:
    ${promptDetails}
    - Niche: ${niche}
    - Target Audience: ${audience}
    ${videoType ? `- Video Type: ${videoType}` : ''}
    
    ${customIdeas ? `Consider these custom ideas as inspiration:\n${customIdeas}\n` : ''}
    
    ${previousIdeas && previousIdeas.titles && previousIdeas.titles.length > 0 ? 
      `Avoid these previously generated ideas:\n${previousIdeas.titles.join(", ")}\n` : ''}
    
    Make sure each idea has a powerful hook that would grab viewers' attention in the first 3 seconds. Focus on ideas that could go viral through psychological triggers like curiosity, emotion, controversy, or utility.
    
    Format as JSON with this structure:
    {
      "ideas": [
        {
          "title": "string",
          "description": "string - make this detailed enough to generate a good script from",
          "category": "string",
          "tags": ["string"],
          "hook_text": "string - a short attention-grabbing hook for the start of the video",
          "hook_category": "string - a category label for the hook (e.g., 'question', 'statistic', 'story')",
          "emoji": "string - a single emoji that represents the idea content"
        }
      ]
    }`;

    console.log("Sending prompt to OpenAI:", prompt);

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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log("Received response from OpenAI");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid response format from OpenAI:", data);
      throw new Error("Invalid response format from OpenAI");
    }
    
    try {
      const ideas = JSON.parse(data.choices[0].message.content);
      
      if (!ideas.ideas || !Array.isArray(ideas.ideas)) {
        console.error("Invalid ideas format:", ideas);
        throw new Error("Invalid ideas format in OpenAI response");
      }

      // Use a synchronous approach for assigning emojis
      ideas.ideas.forEach((idea: any) => {
        // If emoji isn't provided, generate one synchronously
        if (!idea.emoji) {
          const getEmojiForIdea = (title: string, category: string): string => {
            // Simple synchronous emoji selection based on content
            const topicKeywords: Record<string, string> = {
              'tutorial': '📝',
              'how-to': '📝',
              'review': '⭐️',
              'food': '🍔',
              'fitness': '💪',
              'tech': '📱',
              'beauty': '💄',
              'fashion': '👗',
              'travel': '✈️',
              'gaming': '🎮',
              'music': '🎵',
              'business': '💼',
              'product': '📦',
              'showcase': '🎁',
              'testimonial': '👍',
              'unboxing': '📦',
              'service': '🛠️',
              'leadership': '👑'
            };
            
            const searchText = (title + ' ' + category).toLowerCase();
            
            for (const [keyword, emoji] of Object.entries(topicKeywords)) {
              if (searchText.includes(keyword.toLowerCase())) {
                return emoji;
              }
            }
            
            return '🍎'; // Default emoji
          };
          
          idea.emoji = getEmojiForIdea(idea.title, idea.category);
        }
      });

      console.log("Processed ideas successfully, returning response");
      return new Response(JSON.stringify(ideas), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError, "Raw content:", data.choices[0].message.content);
      throw new Error(`Error parsing OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(JSON.stringify({ error: error.message || "An unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
