
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

    // Create a detailed system prompt that positions the AI as a marketing expert
    const systemPrompt = `You are an elite marketing strategist and viral content expert specializing in ${platform} content.

Your expertise is creating viral content ideas for ${accountType} creators in the "${niche}" space targeting "${audience}".

CONTENT REQUIREMENTS:
- Create COMPLETELY ORIGINAL ideas (no templates or formulas!)
- Each idea must have a unique angle specific to ${niche}
- Ideas should be attention-grabbing but deliverable
- Focus on what would actually go viral for this specific creator

${accountType === 'personal' ? 
  `For this PERSONAL CREATOR account, focus on personality-driven content that builds authority and connection.` : 
  accountType === 'business' ? 
  `For this BUSINESS account, focus on thought leadership, industry expertise, and building brand trust.` :
  accountType === 'ecommerce' ? 
  `For this ECOMMERCE account, focus on product storytelling, demonstrations, and converting viewers to customers.` : 
  ''}

${styleProfile ? `CREATOR'S UNIQUE STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}

${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}

PLATFORM ADAPTATION: Optimize specifically for ${platform} with the right format, hooks, and engagement tactics.`;

    // Create a detailed user prompt with clear instructions
    const userPrompt = `Create 5 original, viral-potential video ideas for a ${accountType} creator in the "${niche}" niche targeting "${audience}" on ${platform}.

IMPORTANT CONTEXT ABOUT THIS CREATOR:
- Niche: ${niche}
- Target Audience: ${audience} 
- Platform: ${platform}
- Content Type: ${videoType || "Various formats"}
- Style: ${contentStyle || "Not specified"}
- Personality: ${contentPersonality || "Not specified"}
${customIdeas ? `- Creator's Own Ideas: "${customIdeas}"` : ""}

${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `DO NOT REPEAT THESE PREVIOUS IDEAS: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Each idea MUST include:
1. A HIGHLY SPECIFIC title that would make viewers stop scrolling (not generic "How to" or "5 Tips" formulas)
2. A relevant content category
3. A detailed description explaining why this idea would perform well with ${audience}
4. 3-5 relevant hashtags or tags

FORMAT AS VALID JSON ONLY:
{
  "ideas": [
    {
      "title": "Compelling, specific, original title here",
      "category": "Content category",
      "description": "Detailed description of the content and why it would be effective",
      "tags": ["tag1", "tag2", "tag3"]
    },
    // 4 more ideas
  ]
}`;

    // Call OpenAI with effective parameters
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
        top_p: 1.0
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
      
      // Validate ideas quality
      if (ideas.length > 0) {
        // Check if ideas are just templates with the niche plugged in
        const templatePatterns = [
          /^5 Tips for/i,
          /^How to/i,
          /^Top \d+ Ways/i,
          /^The Ultimate Guide to/i
        ];
        
        let templatedIdeasCount = 0;
        ideas.forEach(idea => {
          if (templatePatterns.some(pattern => pattern.test(idea.title))) {
            templatedIdeasCount++;
          }
        });
        
        // If more than 60% of ideas look templated, regenerate with stricter instructions
        if (templatedIdeasCount >= Math.floor(ideas.length * 0.6)) {
          console.log("Detected templated ideas, running fallback with creative examples");
          
          // Use more specific instructions with examples
          const stricterPrompt = `${userPrompt}

IMPORTANT: Your previous ideas were too templated. Create TRULY ORIGINAL ideas like these examples:
- "I Secretly Recorded My Boss's ${niche} Advice for 30 Days — Here's What Happened"
- "The ${niche} Technique That Got Me Fired (But Tripled My Income)"
- "${audience} Are Shocked When This ${niche} Hack Actually Works"
- "The Embarrassing ${niche} Mistake 90% of ${audience} Make (And How I Fixed It)"
- "What Top ${niche} Experts Don't Want You to Know About Their Morning Routine"`;
          
          const stricterResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: stricterPrompt }
              ],
              temperature: 1.0,
              max_tokens: 1200
            }),
          });
          
          if (stricterResponse.ok) {
            const stricterData = await stricterResponse.json();
            const stricterRawResponse = stricterData.choices[0].message.content;
            console.log('Stricter AI response:', stricterRawResponse);
            
            const stricterJsonMatch = stricterRawResponse.match(/\{[\s\S]*\}/);
            if (stricterJsonMatch) {
              const stricterParsedData = JSON.parse(stricterJsonMatch[0]);
              if (stricterParsedData.ideas && Array.isArray(stricterParsedData.ideas)) {
                ideas = stricterParsedData.ideas;
              }
            }
          }
        }
      }
      
      // If we still don't have 5 valid ideas, add creative fallbacks
      if (ideas.length < 5) {
        const fallbackIdeas = [
          {
            title: `The ${niche} Secret I Discovered By Accident (${audience} Are Stunned)`,
            category: "Personal Discovery",
            description: `Share an unexpected insight or technique you discovered in the ${niche} field that contradicts conventional wisdom but delivers amazing results. Show before/after proof to build credibility.`,
            tags: ["gamechanging", "discovery", niche.toLowerCase().replace(/\s+/g, '')]
          },
          {
            title: `I Tested The Viral ${niche} Trend For 30 Days (Honest Results)`,
            category: "Experiment",
            description: `Document your journey testing a trending ${niche} technique that's popular with ${audience}, showing both the struggles and victories. This transparency creates trust and high engagement.`,
            tags: ["experiment", "results", "trending"]
          },
          {
            title: `What ${audience} Don't Realize About ${niche} (Industry Insider Reveals All)`,
            category: "Industry Secrets",
            description: `Expose common misconceptions or little-known facts about ${niche} that most ${audience} aren't aware of, positioning yourself as an authentic industry insider with valuable perspective.`,
            tags: ["insider", "secrets", "truth"]
          },
          {
            title: `The ${niche} Framework That Changed Everything For My ${accountType === 'business' ? 'Business' : accountType === 'ecommerce' ? 'Product Sales' : 'Content'}`,
            category: "Strategy Breakdown",
            description: `Break down a specific, actionable framework that dramatically improved your results in ${niche}, with concrete examples and steps that ${audience} can immediately implement.`,
            tags: ["strategy", "framework", "results"]
          },
          {
            title: `Why Most ${audience} Fail With ${niche} (And How To Be Different)`,
            category: "Problem-Solution",
            description: `Analyze the common pitfalls that cause most people to struggle with ${niche}, then outline a unique path to success that avoids these mistakes. This contrarian approach builds authority.`,
            tags: ["mistakes", "solution", "success"]
          }
        ];
        
        // Add fallback ideas until we have 5
        while (ideas.length < 5) {
          ideas.push(fallbackIdeas[ideas.length % fallbackIdeas.length]);
        }
      }
      
      // Limit to exactly 5 ideas
      ideas = ideas.slice(0, 5);
      
      // Ensure all ideas have required fields
      ideas = ideas.map(idea => ({
        title: idea.title || `Viral ${niche} Concept`,
        category: idea.category || "Creative Content",
        description: idea.description || `A unique approach to creating content about ${niche} that will resonate with ${audience}.`,
        tags: Array.isArray(idea.tags) && idea.tags.length > 0 ? 
          idea.tags : ["viral", "content", niche.toLowerCase().replace(/\s+/g, '-')]
      }));
      
    } catch (error) {
      console.error("Error parsing ideas:", error);
      
      // Creative fallback ideas that encourage virality
      ideas = [
        {
          title: `I Tested The "Impossible" ${niche} Technique That Everyone Said Wouldn't Work`,
          category: "Experiment",
          description: `Document yourself attempting a controversial or challenging ${niche} technique that most experts dismiss, showing surprising results that challenge conventional wisdom. The contrarian angle creates debate and sharing.`,
          tags: ["experiment", "controversial", "results"]
        },
        {
          title: `The ${niche} Mistake I Made That Cost Me $10,000 (And How You Can Avoid It)`,
          category: "Cautionary Tale",
          description: `Share a significant failure or mistake in your ${niche} journey, the expensive lesson you learned, and how ${audience} can avoid the same fate. This vulnerability creates trust and high engagement.`,
          tags: ["mistake", "lesson", "warning"]
        },
        {
          title: `What ${audience} Don't Know About ${niche} Could Be Costing Them (Here's Why)`,
          category: "Industry Insights",
          description: `Reveal hidden costs or missed opportunities in ${niche} that most ${audience} overlook, providing specific examples and actionable solutions that demonstrate your expertise.`,
          tags: ["insights", "expertise", "opportunity"]
        },
        {
          title: `The ${niche} Method That Generated $XXX in 30 Days (With Proof)`,
          category: "Case Study",
          description: `Breakdown a specific, replicable method in ${niche} that produced exceptional results, showing real evidence and explaining exactly how ${audience} can implement it themselves.`,
          tags: ["method", "proof", "results"]
        },
        {
          title: `Why I Stopped Following ${niche} "Best Practices" (And What I Do Instead)`,
          category: "Contrarian Approach",
          description: `Challenge the standard advice in ${niche}, explain why it's ineffective for ${audience}, and present your alternative approach with evidence of better results. This creates curiosity and sharing.`,
          tags: ["contrarian", "strategy", "results"]
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
