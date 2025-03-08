
// Import XHR using the correct syntax for Deno edge functions
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
      audience, 
      videoType, 
      platform, 
      customIdeas, 
      contentStyle,
      contentPersonality,
      previousIdeas,
      styleProfile,
      accountType
    } = await req.json();

    console.log('Generating ideas with:', { 
      niche, audience, videoType, platform,
      customIdeasLength: customIdeas?.length || 0,
      contentStyle,
      contentPersonality,
      accountType,
      hasStyleProfile: !!styleProfile,
      styleProfileName: styleProfile?.name
    });
    
    if (!niche) {
      return new Response(
        JSON.stringify({ error: "Niche is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Simplify all logic for determining niche and prompt construction
    const nicheToUse = accountType === 'ecommerce' ? 
      `${niche} Products` : 
      accountType === 'business' ? 
        `${niche} Business` : 
        niche;

    // Create a more straightforward system prompt
    const systemPrompt = `You are an expert content strategist creating highly original, engaging video ideas.
    
TASK: Create 5 original video ideas for a ${accountType || 'creator'} in the ${nicheToUse} niche targeting ${audience || 'their audience'}.

YOUR IDEAS MUST BE:
1. HIGHLY SPECIFIC to ${nicheToUse}
2. VALUABLE to ${audience || 'the audience'}
3. DISTINCTIVE with unexpected hooks or angles
4. OPTIMIZED for ${platform || 'social media'}
5. PRACTICAL to implement

${styleProfile ? `STYLE: "${styleProfile.name}": ${styleProfile.description}
Tone: ${styleProfile.tone}` : ''}

${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}

Respond with exactly 5 unique ideas in JSON format with title, category, description, and tags.`;

    // Simplified user prompt
    const userPrompt = `Create 5 unique, specific video ideas for a ${accountType || 'creator'} focused on ${nicheToUse} for ${audience || 'their audience'}.
    
${customIdeas ? `Some existing ideas (create completely different ones): ${customIdeas}` : ''}
    
${previousIdeas && previousIdeas.titles ? `Don't repeat these ideas: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Each idea must have:
- An original title (not generic like "5 tips for..." or "How to...")
- A relevant category
- A detailed description (why it's valuable and how it's unique)
- 3-5 relevant tags

Format as valid JSON only: 
{"ideas": [{"title": "", "category": "", "description": "", "tags": []}]}`;

    // Use gpt-4o-mini with simplified parameters
    console.log('Calling OpenAI API with simplified prompt');
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
        temperature: 0.8,
        max_tokens: 1500, // Reduced to avoid timeouts
        top_p: 0.9,
        frequency_penalty: 0.6,
        presence_penalty: 0.6,
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

    // Parse the generated content
    const rawResponse = data.choices[0].message.content;
    console.log('Raw AI response:', rawResponse);
    
    let ideas = [];
    try {
      // Try to parse JSON response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        if (parsedData.ideas && Array.isArray(parsedData.ideas)) {
          ideas = parsedData.ideas;
        }
      }
      
      // If JSON parsing failed, extract ideas from text
      if (ideas.length === 0) {
        const ideaRegex = /(\d+\.\s+)(.+?)(?=\n|$)/g;
        let match;
        while ((match = ideaRegex.exec(rawResponse)) !== null) {
          ideas.push({
            title: match[2].trim(),
            category: "General",
            description: "Generated idea description",
            tags: ["content", "video", nicheToUse.toLowerCase().replace(/\s+/g, '-')]
          });
        }
      }
      
      // Ensure we have 5 ideas
      while (ideas.length < 5) {
        ideas.push({
          title: `Creative ${nicheToUse} Idea ${ideas.length + 1}`,
          category: "Backup Idea",
          description: `A compelling ${nicheToUse} video idea tailored for ${audience || 'your audience'}.`,
          tags: ["content", "video", nicheToUse.toLowerCase().replace(/\s+/g, '-')]
        });
      }
      
      // Limit to exactly 5 ideas
      ideas = ideas.slice(0, 5);
      
      // Ensure all ideas have required fields
      ideas = ideas.map(idea => ({
        title: idea.title || `Idea for ${nicheToUse}`,
        category: idea.category || "General",
        description: idea.description || `A creative idea for ${nicheToUse}`,
        tags: Array.isArray(idea.tags) && idea.tags.length > 0 ? 
          idea.tags : ["content", "video", nicheToUse.toLowerCase().replace(/\s+/g, '-')]
      }));
      
    } catch (error) {
      console.error("Error parsing ideas:", error);
      // Provide fallback ideas
      ideas = [
        {
          title: `Behind the Scenes: The Reality of ${nicheToUse}`,
          category: "Documentary",
          description: `Take ${audience || 'your audience'} behind the curtain to show the true day-to-day realities of ${nicheToUse}. This transparent look builds trust and satisfies curiosity.`,
          tags: ["behindthescenes", "reality", "transparent"]
        },
        {
          title: `What I Wish I Knew Before Starting in ${nicheToUse}`,
          category: "Educational",
          description: `Share valuable lessons learned and insider knowledge about ${nicheToUse} that will help ${audience || 'your audience'} avoid common pitfalls.`,
          tags: ["lessons", "advice", "experience"]
        },
        {
          title: `The Unexpected Benefits of ${nicheToUse}`,
          category: "Informational",
          description: `Reveal surprising advantages and positive outcomes of ${nicheToUse} that most people don't realize, providing valuable insights for ${audience || 'your audience'}.`,
          tags: ["benefits", "surprising", "insights"]
        },
        {
          title: `A Day in the Life: ${nicheToUse} Edition`,
          category: "Lifestyle",
          description: `Show an authentic, hour-by-hour breakdown of what working in ${nicheToUse} actually looks like, with both challenges and rewards.`,
          tags: ["dayinthelife", "routine", "authentic"]
        },
        {
          title: `Common ${nicheToUse} Myths Debunked`,
          category: "Educational",
          description: `Address and correct widespread misconceptions about ${nicheToUse} with evidence-based information to help ${audience || 'your audience'} make better decisions.`,
          tags: ["mythbusting", "facts", "education"]
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
