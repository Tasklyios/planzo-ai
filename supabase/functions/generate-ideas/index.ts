
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    // Parse the request body
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));

    // Handle different request types
    if (requestData.type === 'script_coach') {
      return await handleScriptCoach(requestData);
    } else {
      // Default: Generate content ideas
      return await generateContentIdeas(requestData);
    }
  } catch (error) {
    console.error("Error in generate-ideas function:", error);
    return new Response(
      JSON.stringify({ 
        error: `Function error: ${error.message}`,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleScriptCoach(data) {
  const { message, script, conversation } = data;
  
  try {
    // Format the conversation history
    const messages = [
      {
        role: "system",
        content: "You are an expert script coach that helps content creators improve their scripts. Provide constructive feedback and suggestions to make their content more engaging and effective."
      }
    ];

    // Add conversation history
    if (Array.isArray(conversation)) {
      conversation.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // Add current message and script
    messages.push({
      role: "user",
      content: `My script is: """${script}"""\n\nMy question/request: ${message}`
    });

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API error:", result);
      throw new Error(`OpenAI API error: ${result.error?.message || 'Unknown error'}`);
    }

    let updatedScript = null;
    let aiResponse = result.choices[0].message.content;

    // Check if response contains a script suggestion
    if (aiResponse.includes("```") && aiResponse.includes("UPDATED_SCRIPT")) {
      const scriptMatches = aiResponse.match(/```(?:UPDATED_SCRIPT)?\n([\s\S]*?)```/);
      if (scriptMatches && scriptMatches[1]) {
        updatedScript = scriptMatches[1].trim();
        // Remove the script part from the response
        aiResponse = aiResponse.replace(/```(?:UPDATED_SCRIPT)?\n[\s\S]*?```/, "[Script suggestions applied]");
      }
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse, 
        updatedScript 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error in script coach handler:", error);
    return new Response(
      JSON.stringify({ error: `Script coach error: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function generateContentIdeas(data) {
  const { 
    niche, 
    audience, 
    videoType, 
    platform = 'TikTok', 
    customIdeas = '', 
    previousIdeas = null 
  } = data;

  if (!niche || !audience || !videoType) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: niche, audience, or videoType' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    console.log(`Generating content ideas for: ${niche}, ${audience}, ${videoType}, ${platform}`);

    // Construct the prompt
    let prompt = `Generate 5 creative and viral content ideas for ${platform} with the following criteria:
- Niche: ${niche}
- Target Audience: ${audience}
- Content Type: ${videoType}

Each idea should be:
1. Original and attention-grabbing
2. Aligned with current trends on ${platform}
3. Designed to maximize engagement (comments, shares)
4. Formatted to work well on ${platform}`;

    // Add platform-specific guidance
    if (platform === 'TikTok') {
      prompt += `\n\nFor TikTok, focus on short-form content that's 15-60 seconds. Create content that encourages user participation, leverages trending sounds, and has a hook in the first 3 seconds.`;
    } else if (platform === 'Instagram') {
      prompt += `\n\nFor Instagram, consider both Reels (short-form) and regular posts. Focus on visually appealing content, storytelling elements, and content that fits the aesthetic preferences of Instagram users.`;
    } else if (platform === 'YouTube') {
      prompt += `\n\nFor YouTube, consider both long-form content and Shorts. Focus on searchable topics, in-depth value, and clear thumbnails/titles that drive clicks.`;
    }

    // Add custom ideas as context if provided
    if (customIdeas && customIdeas.trim()) {
      prompt += `\n\nHere are some specific ideas I'm interested in exploring further. Use these as inspiration:\n${customIdeas}`;
    }

    // Add previous ideas context to avoid repetition
    if (previousIdeas && previousIdeas.count > 0) {
      prompt += `\n\nPlease avoid these previously generated ideas:\n`;
      
      const maxExamplesToShow = Math.min(previousIdeas.titles.length, 10);
      for (let i = 0; i < maxExamplesToShow; i++) {
        prompt += `- ${previousIdeas.titles[i]}\n`;
      }
    }

    prompt += `\n\nFor each idea, provide:
- A catchy title (make it compelling and click-worthy)
- A clear description explaining the content concept
- Category (e.g., Educational, Entertainment, Tutorial)
- 3-5 relevant hashtags (without the # symbol)

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

    // Call OpenAI API
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
            content: 'You are a social media content strategist who helps creators make viral content. Provide creative, trendy, and platform-appropriate content ideas.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    // Parse the response
    const result = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API error:", result);
      throw new Error(`OpenAI API error: ${result.error?.message || 'Unknown error'}`);
    }

    let ideas;
    try {
      // Try to parse the response content as JSON
      const content = result.choices[0].message.content;
      console.log("Raw AI response:", content);
      
      // Handle cases where the model directly returns JSON or when it wraps it in markdown
      let jsonContent = content;
      
      // Check if the response is wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1].trim();
      }
      
      ideas = JSON.parse(jsonContent);
      
      // Validate the response structure
      if (!ideas.ideas || !Array.isArray(ideas.ideas)) {
        throw new Error("Invalid response format: missing ideas array");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Return the raw response for debugging
      return new Response(
        JSON.stringify({ 
          error: `Failed to parse AI response: ${parseError.message}`,
          rawResponse: result.choices[0].message.content
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify(ideas),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error generating content ideas:", error);
    return new Response(
      JSON.stringify({ error: `Error generating ideas: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
