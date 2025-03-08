
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { 
      niche, 
      audience = "content creators",
      videoType = "", 
      platform = "social media",
      customIdeas = "",
      contentStyle = "", 
      contentPersonality = "",
      previousIdeas = null,
      styleProfile = null,
      accountType = "personal"
    } = await req.json();

    console.log('Generating ideas with:', { 
      niche, audience, videoType, platform, accountType,
      hasCustomIdeas: !!customIdeas,
      hasStyleProfile: !!styleProfile
    });
    
    if (!niche) {
      return new Response(
        JSON.stringify({ error: "Niche is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Format the niche based on account type
    const formattedNiche = accountType === 'ecommerce' ? 
      `${niche} Products` : 
      accountType === 'business' ? 
        `${niche} Business` : 
        niche;

    // Create a strong system prompt that encourages original thinking
    const systemPrompt = `You are an expert content creator who specializes in creating original, valuable video ideas. 
Your task is to create 5 highly unique video ideas for a ${accountType || 'creator'} in the "${formattedNiche}" niche 
targeting "${audience || 'their audience'}" for ${platform || 'social media'}.

MOST IMPORTANT: Be extremely specific, avoid generic titles like "5 tips for..." or "How to..." - instead, create concrete, 
distinctive ideas that stand out. Each idea should have a unique angle or hook that makes viewers curious.

Your ideas must be:
- Highly specific to ${formattedNiche} (not general advice)
- Actually valuable to ${audience}
- Practical to implement
- Have an unexpected or interesting angle
- Be optimized for ${platform}

${styleProfile ? `Content style: "${styleProfile.name}": ${styleProfile.description}
Tone: ${styleProfile.tone}` : ''}

${contentStyle ? `Content style: ${contentStyle}` : ''}
${contentPersonality ? `Content personality: ${contentPersonality}` : ''}

Return EXACTLY 5 ideas in a consistent JSON format with title, category, description, and tags.`;

    // Create a detailed user prompt
    const userPrompt = `Create 5 unique, highly specific video ideas for a ${accountType} creator focused on "${formattedNiche}" 
targeting "${audience}" for ${platform}.

${customIdeas ? `For context (create completely different ideas): ${customIdeas}` : ''}
    
${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `Don't repeat these ideas: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Each idea must include:
- A highly specific and original title (avoid generic formats like "5 tips for..." or "How to...")
- A relevant category
- A detailed description that explains why this idea is valuable and unique
- 3-5 relevant tags

Format as valid JSON only:
{
  "ideas": [
    {
      "title": "Specific and original title here",
      "category": "Appropriate category",
      "description": "Detailed description explaining the value and uniqueness",
      "tags": ["tag1", "tag2", "tag3"]
    },
    ...more ideas
  ]
}`;

    // Call OpenAI with simpler but effective parameters
    console.log('Calling OpenAI API...');
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 1200,
        top_p: 1.0,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Error from OpenAI API: ${response.status} ${response.statusText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Get the response data
    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return new Response(
        JSON.stringify({ error: `AI service error: ${data.error.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Parse the response - simplified approach
    const rawResponse = data.choices[0].message.content;
    console.log('Raw AI response:', rawResponse);
    
    let ideas = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        if (parsedData.ideas && Array.isArray(parsedData.ideas)) {
          ideas = parsedData.ideas;
        }
      }
      
      // If we didn't get valid ideas, provide fallback
      if (ideas.length === 0) {
        console.log("Failed to parse ideas from OpenAI response. Using fallback parsing.");
        
        // Try to parse each idea section separately
        const ideaRegex = /(\d+\.\s+)(.+?)(?=\n|$)/g;
        let match;
        while ((match = ideaRegex.exec(rawResponse)) !== null) {
          ideas.push({
            title: match[2].trim(),
            category: "General",
            description: "Generated idea description",
            tags: ["content", "video", formattedNiche.toLowerCase().replace(/\s+/g, '-')]
          });
        }
      }
      
      // Ensure we have exactly 5 ideas with required fields
      if (ideas.length < 5) {
        console.log(`Only got ${ideas.length} ideas, creating fallbacks to reach 5`);
      }
      
      // Limit to exactly 5 ideas
      ideas = ideas.slice(0, 5);
      
      // Ensure all ideas have required fields
      ideas = ideas.map(idea => ({
        title: idea.title || `Idea for ${formattedNiche}`,
        category: idea.category || "General",
        description: idea.description || `A creative idea for ${formattedNiche}`,
        tags: Array.isArray(idea.tags) && idea.tags.length > 0 ? 
          idea.tags : ["content", "video", formattedNiche.toLowerCase().replace(/\s+/g, '-')]
      }));
      
      // If we still don't have 5 ideas, add fallbacks
      while (ideas.length < 5) {
        ideas.push({
          title: `Original ${formattedNiche} Concept ${ideas.length + 1}`,
          category: "Creative Content",
          description: `A unique approach to creating content about ${formattedNiche} that will resonate with ${audience}.`,
          tags: ["original", "content", formattedNiche.toLowerCase().replace(/\s+/g, '-')]
        });
      }
      
    } catch (error) {
      console.error("Error parsing ideas:", error);
      
      // Provide creative fallback ideas specific to the niche
      ideas = [
        {
          title: `The Unfiltered Truth About ${formattedNiche} Nobody's Telling You`,
          category: "Reality Check",
          description: `Pull back the curtain and reveal the honest, unfiltered realities of ${formattedNiche} that most people keep hidden. This transparent look builds authenticity and trust with ${audience}.`,
          tags: ["reality", "truth", "behind-the-scenes"]
        },
        {
          title: `I Tried the Most Controversial ${formattedNiche} Method for 30 Days`,
          category: "Experiment",
          description: `Document a 30-day journey testing a controversial or unusual approach to ${formattedNiche}, showing both successes and failures along the way.`,
          tags: ["experiment", "challenge", "results"]
        },
        {
          title: `What ${formattedNiche} Will Look Like in 5 Years (Based on Industry Insider Info)`,
          category: "Trend Analysis",
          description: `Share exclusive insights and predictions about the future of ${formattedNiche}, giving ${audience} valuable foresight to prepare for upcoming changes.`,
          tags: ["future", "trends", "predictions"]
        },
        {
          title: `The ${formattedNiche} Framework That Transformed My Results (With Real Examples)`,
          category: "Case Study",
          description: `Break down a specific strategy that dramatically improved your results in ${formattedNiche}, with concrete examples and actionable steps for ${audience}.`,
          tags: ["strategy", "framework", "results"]
        },
        {
          title: `Why Most ${audience} Fail at ${formattedNiche} (And How to Be Different)`,
          category: "Problem-Solution",
          description: `Analyze the common pitfalls that cause most people to struggle with ${formattedNiche}, then outline a clear path to success that avoids these mistakes.`,
          tags: ["mistakes", "solutions", "success"]
        }
      ];
    }

    console.log('Final ideas count:', ideas.length);

    // Return the ideas
    return new Response(
      JSON.stringify({ ideas }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
