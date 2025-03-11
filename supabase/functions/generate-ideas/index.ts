
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

    // Validate accountType to ensure it's explicitly one of the allowed values
    const validAccountType = ['personal', 'ecommerce', 'business'].includes(accountType) 
      ? accountType 
      : 'personal';

    console.log('Validated account type:', validAccountType);

    // Create a very direct, stricter system prompt to avoid introductory text
    const systemPrompt = `You are a content idea generator API. Your ONLY task is to output exactly 5 content ideas in a structured format without ANY introduction, greeting, or conclusion text.

DO NOT start with phrases like "Here are 5 ideas..." or introduce yourself.
DO NOT include ANY text outside of the 5 numbered ideas.
START DIRECTLY with "1." and end after idea #5.

Each idea must include:
- A short, specific title
- A single category/format tag
- A brief 1-2 sentence description
- 3-5 relevant hashtags

Make each idea distinctly different and highly creative.

${styleProfile ? `STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}
${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}`;

    // Create a simple, direct user prompt
    let userPrompt = `Generate 5 viral content ideas for ${validAccountType} creator in "${niche}" targeting "${audience}" on ${platform}.

${validAccountType === 'ecommerce' ? 
`For ECOMMERCE content:
- 4 of 5 ideas MUST be purely educational with ZERO product mentions
- These ideas should focus on solving problems, sharing expertise, or entertaining the audience
- Only 1 idea can subtly mention product category (not specific products)
- NO selling language or promotional content in educational ideas` : ''}

${customIdeas ? `CREATOR'S OWN IDEAS TO INSPIRE YOU: "${customIdeas}"` : ""}
${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `DO NOT REPEAT THESE PREVIOUS IDEAS: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Each idea MUST follow this exact format:
1. TITLE: [attention-grabbing title]
   CATEGORY: [specific content format]
   DESCRIPTION: [brief explanation]
   HASHTAGS: [3-5 relevant hashtags]

`;

    // Call OpenAI with your custom GPT model
    console.log('Calling OpenAI API for idea generation with custom GPT model...');
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using gpt-4o as it's a versatile model that can handle custom instructions well
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 1.2, // Higher temperature for more creativity and variety
        max_tokens: 1200,
        top_p: 1.0,
        frequency_penalty: 0.5, // Add slight penalty to discourage repetitive content
        presence_penalty: 0.5  // Add slight penalty to encourage diverse topics
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

    // Parse the response
    const rawResponse = data.choices[0].message.content;
    console.log('Raw AI response:', rawResponse);
    
    // More robust idea parsing with improved regex patterns
    let ideas = [];
    
    try {
      // Split by numbered ideas (1., 2., etc.)
      const ideaRegex = /(\d+)\.\s+(.*?)(?=\s*\d+\.\s+|$)/gs;
      const matches = [...rawResponse.matchAll(ideaRegex)];
      
      if (matches.length > 0) {
        ideas = matches.map(match => {
          const ideaText = match[2].trim();
          
          // Extract components using clear markers
          const titleMatch = ideaText.match(/(?:TITLE:?\s*)(.*?)(?=\s*CATEGORY|FORMAT|DESCRIPTION|HASHTAG|$)/is);
          const categoryMatch = ideaText.match(/(?:CATEGORY|FORMAT):?\s*(.*?)(?=\s*DESCRIPTION|HASHTAG|$)/is);
          const descriptionMatch = ideaText.match(/(?:DESCRIPTION):?\s*(.*?)(?=\s*HASHTAG|$)/is);
          const hashtagsMatch = ideaText.match(/(?:HASHTAGS?):?\s*(.*?)(?=$)/is);
          
          // Extract the values or provide defaults
          const title = titleMatch ? titleMatch[1].trim() : `Idea ${match[1]}`;
          const category = categoryMatch ? categoryMatch[1].trim() : "Content";
          const description = descriptionMatch ? descriptionMatch[1].trim() : "";
          
          // Process hashtags
          let tags = [];
          if (hashtagsMatch && hashtagsMatch[1]) {
            const hashtagText = hashtagsMatch[1].trim();
            // Handle both #tag format and comma-separated format
            if (hashtagText.includes('#')) {
              tags = hashtagText.split(/\s+/).map(tag => tag.replace('#', '').trim()).filter(Boolean);
            } else {
              tags = hashtagText.split(/,|\//).map(tag => tag.trim()).filter(Boolean);
            }
          }
          
          // If no tags were extracted, generate some based on other fields
          if (tags.length === 0) {
            const nicheTag = niche.toLowerCase().replace(/\s+/g, '');
            tags = [nicheTag, 'content', platform.toLowerCase().replace(/\s+/g, '')];
          }
          
          return {
            title,
            category,
            description,
            tags
          };
        });
      }
      
      // Ensure we have exactly 5 well-formed ideas
      if (ideas.length < 5) {
        console.log(`Only parsed ${ideas.length} ideas, generating backup ideas to reach 5`);
        const backupIdeas = getBackupIdeas(niche, audience, validAccountType, 5 - ideas.length);
        ideas = [...ideas, ...backupIdeas];
      }
      
      // Take exactly 5 ideas
      ideas = ideas.slice(0, 5);
      
      // Ensure each idea has all required fields
      ideas = ideas.map(idea => ({
        title: idea.title || `${niche} Tips for ${audience}`,
        category: idea.category || "Quick Tips",
        description: idea.description || `Valuable insights about ${niche} specifically curated for ${audience}.`,
        tags: idea.tags && idea.tags.length ? idea.tags : [niche.toLowerCase().replace(/\s+/g, ''), 'content', 'tips']
      }));
      
    } catch (error) {
      console.error("Error parsing ideas:", error);
      // Generate fallback ideas rather than returning an error
      ideas = getBackupIdeas(niche, audience, validAccountType, 5);
      console.log("Using fallback ideas due to parsing error");
    }

    console.log(`Successfully returning ${ideas.length} ideas:`, ideas);

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

// Helper function to generate backup ideas based on account type
function getBackupIdeas(niche, audience, accountType, count) {
  const ideas = [];
  
  // Different idea templates based on account type
  if (accountType === 'ecommerce') {
    const ecommerceIdeas = [
      {
        title: `5 Common ${niche} Myths Debunked`,
        category: "Myth Busting",
        description: `Explode popular misconceptions about ${niche} with science-backed facts that your audience needs to know.`,
        tags: ["mythbusting", "facts", niche.toLowerCase().replace(/\s+/g, '')]
      },
      {
        title: `What Happened When I Tracked My ${niche.split(' ')[0]} Progress for 30 Days`,
        category: "Personal Experiment",
        description: `A transparent look at real results and unexpected discoveries from a month-long ${niche} experiment.`,
        tags: ["experiment", "results", "tracking"]
      },
      {
        title: `3 ${niche} Hacks That Actually Work (And 2 That Don't)`,
        category: "Tested Tips",
        description: `Save time and frustration with these verified ${niche} techniques that deliver real results.`,
        tags: ["hacks", "tested", "tips"]
      },
      {
        title: `The Unexpected History of ${niche} Nobody Talks About`,
        category: "Deep Dive",
        description: `Fascinating origin stories and evolution of ${niche} that will change how you think about it.`,
        tags: ["history", "facts", "deepdive"]
      },
      {
        title: `Behind-the-Scenes: How Top ${audience.split(' ')[0]}s Approach ${niche}`,
        category: "Expert Insights",
        description: `Exclusive peeks into the routines and strategies of leading ${audience} when it comes to ${niche}.`,
        tags: ["behindthescenes", "experts", "insights"]
      }
    ];
    
    for (let i = 0; i < count; i++) {
      ideas.push(ecommerceIdeas[i % ecommerceIdeas.length]);
    }
  } else {
    // Ideas for personal/business accounts
    const generalIdeas = [
      {
        title: `What Nobody Tells You About ${niche} (But Should)`,
        category: "Honest Talk",
        description: `The unfiltered truth about ${niche} that will save you time, money, and frustration.`,
        tags: ["truth", "insights", niche.toLowerCase().replace(/\s+/g, '')]
      },
      {
        title: `I Tried 5 ${niche} Techniques: Here's The Clear Winner`,
        category: "Comparison Test",
        description: `An authentic side-by-side test revealing which approach to ${niche} actually delivers results.`,
        tags: ["tested", "comparison", "results"]
      },
      {
        title: `The 60-Second ${niche} Hack That Changed Everything`,
        category: "Quick Tip",
        description: `This simple but powerful adjustment to your ${niche} routine delivers immediate improvements.`,
        tags: ["quicktip", "hack", "gamechanger"]
      },
      {
        title: `Behind-the-Scenes: The Real Process of ${niche}`,
        category: "Reality Check",
        description: `The unfiltered, messy truth about what ${niche} actually looks like day-to-day.`,
        tags: ["behindthescenes", "reality", "process"]
      },
      {
        title: `3 ${niche} Trends About to Explode in 2025`,
        category: "Trend Forecast",
        description: `Get ahead of the curve with these emerging developments in the ${niche} space that few are talking about yet.`,
        tags: ["trends", "predictions", "future"]
      }
    ];
    
    for (let i = 0; i < count; i++) {
      ideas.push(generalIdeas[i % generalIdeas.length]);
    }
  }
  
  return ideas.slice(0, count);
}
