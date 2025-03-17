
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
      accountType = "personal",
      businessDescription = "",
      contentType = "",
      postingFrequency = ""
    } = await req.json();

    console.log('Generating ideas with:', { 
      niche, audience, videoType, platform, accountType,
      contentType, postingFrequency,
      hasCustomIdeas: !!customIdeas,
      hasStyleProfile: !!styleProfile,
      hasBusinessDescription: !!businessDescription
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

    // Build content type description based on the content_type field
    let contentTypeDescription = "";
    if (contentType === "talking_head") {
      contentTypeDescription = "Create ideas optimized for talking head videos where the creator speaks directly to the camera.";
    } else if (contentType === "text_based") {
      contentTypeDescription = "Focus on ideas that work well as text-based clips with minimal on-camera presence, using animated text and visuals.";
    } else if (contentType === "mixed") {
      contentTypeDescription = "Create a mix of ideas that combine talking head segments with text-based visuals for variety.";
    }

    // Build posting frequency guidance
    let frequencyGuidance = "";
    if (postingFrequency === "daily") {
      frequencyGuidance = "These ideas should be suitable for daily content creation (5-7 times per week), so consider ease of production and sustainable topics.";
    } else if (postingFrequency === "multiple_times_a_week") {
      frequencyGuidance = "These ideas should work for posting 2-4 times per week, balancing depth with regular production schedule.";
    } else if (postingFrequency === "weekly") {
      frequencyGuidance = "Focus on weekly content ideas that can be more in-depth and higher production value.";
    } else if (postingFrequency === "monthly") {
      frequencyGuidance = "Create ideas for monthly content that can be more comprehensive and higher production quality.";
    } else if (postingFrequency === "irregularly") {
      frequencyGuidance = "Create a mix of both quick, easy-to-produce ideas and more in-depth content for irregular posting schedules.";
    }

    // Updated system prompt to emphasize research-backed ideas across all account types
    const systemPrompt = `You are Planzo AI, a specialist in creating viral-worthy, research-backed video ideas for social media. You excel at crafting highly specific, data-driven content concepts for platforms like TikTok, YouTube Shorts, and Instagram Reels.

You understand trends analysis, audience psychology, and engagement metrics to craft compelling content that maximizes views, shares, and watch time.

${validAccountType === 'business' && businessDescription ? 
  `BUSINESS CONTEXT: This is for a business in the ${niche} niche. Business description: ${businessDescription}` : ''}
  
${contentTypeDescription ? `CONTENT TYPE: ${contentTypeDescription}` : ''}

${frequencyGuidance ? `POSTING FREQUENCY: ${frequencyGuidance}` : ''}

Your ONLY task is to output exactly 5 content ideas in a structured format without ANY introduction, greeting, or conclusion text.

DO NOT start with phrases like "Here are 5 ideas..." or introduce yourself.
DO NOT include ANY text outside of the 5 numbered ideas.
START DIRECTLY with "1." and end after idea #5.

Each idea MUST include:
- A specific, clear title with a concrete angle or approach (never vague or generic)
- A precise content format tag
- A data-backed description referencing specific statistics, studies or trends
- 3-5 relevant hashtags based on trending conversations in this space

IMPORTANT: Each idea must:
1. Include at least one specific number, statistic or percentage 
2. Reference a concrete, testable strategy or technique
3. Tie to a specific current trend (within last 60 days) or evergreen pain point
4. Be immediately actionable without further research
5. Precisely target the emotional trigger that would make someone watch

Make each idea distinctly different and supported by factual elements.

${contentType === "talking_head" ? "Format ideas to work well as talking head videos with direct-to-camera presentation." : ""}
${contentType === "text_based" ? "Format ideas to work well with text animations, graphics and minimal on-camera presence." : ""}

${styleProfile ? `STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}
${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}`;

    // Updated user prompt with more specificity and ecommerce balance instructions
    let userPrompt = `Generate 5 viral content ideas for ${validAccountType} creator in "${niche}" targeting "${audience}" on ${platform}.

DO NOT generate generic, fluffy ideas. EVERY idea must be:
- Ultra-specific with actionable details
- Backed by data or referenced studies/statistics 
- Tied to a verified trend or evergreen problem
- Concrete enough to be immediately usable

${contentType ? `FORMAT: These ideas should be optimized for ${contentType === "talking_head" ? "talking head videos" : contentType === "text_based" ? "text-based visual content" : "mixed content combining talking head and text-based elements"}.` : ""}

${postingFrequency ? `FREQUENCY: Content will be posted ${postingFrequency.replace("_", " ")}.` : ""}

${validAccountType === 'ecommerce' ? 
`For ECOMMERCE content:
- At least 3 of 5 ideas MUST be purely educational with ZERO product mentions
- These educational ideas should focus on the AUDIENCE'S needs and challenges, not your product
- Focus on value-first content that builds trust and establishes expertise
- Include ideas that target common pain points or aspirations of your audience, even if not directly related to your products
- The remaining ideas can subtly incorporate product category mentions (not specific products)
- NO selling language or promotional content in educational ideas` : ''}

${validAccountType === 'business' ? 
`For BUSINESS content:
- Avoid corporate speak - focus on concrete results your audience cares about
- Reference specific business case studies or data points
- Include at least one metric or KPI improvement in each idea
- Focus on specific challenges in your industry with actionable solutions` : ''}

${validAccountType === 'personal' ? 
`For PERSONAL BRAND content:
- Avoid vague "day in the life" content unless there's a specific, unusual hook
- Reference specific results you've personally achieved or studies you can cite
- Focus on unique approaches or contrarian takes backed by evidence
- Include specific metrics, percentages or numbers in headlines` : ''}

${customIdeas ? `CREATOR'S OWN IDEAS TO INSPIRE YOU: "${customIdeas}"` : ""}
${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `DO NOT REPEAT THESE PREVIOUS IDEAS: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Each idea MUST follow this exact format:
1. TITLE: [specific, data-backed title with concrete angle]
   CATEGORY: [specific content format]
   DESCRIPTION: [evidence-based explanation with at least one statistic or data point]
   HASHTAGS: [3-5 relevant hashtags]
`;

    // Make sure OPENAI_API_KEY is set
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error: API key missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Call OpenAI API with updated Planzo AI personality
    console.log('Calling OpenAI API for idea generation with research-focused Planzo AI personality...');
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Updated to use the faster, more cost-effective model
        messages: [
          { 
            role: "system", 
            content: systemPrompt 
          },
          { 
            role: "user", 
            content: userPrompt 
          }
        ],
        temperature: 0.85,
        max_tokens: 1500,
        top_p: 0.95,
        frequency_penalty: 0.5, 
        presence_penalty: 0.5  
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

// Helper function to generate evidence-based backup ideas based on account type
function getBackupIdeas(niche, audience, accountType, count) {
  const ideas = [];
  
  // Different idea templates based on account type, all with specific data points
  if (accountType === 'ecommerce') {
    const ecommerceIdeas = [
      {
        title: `The 5 Most Common ${niche} Myths (Disproven by a 2024 Study with 1,450+ Consumers)`,
        category: "Myth Busting",
        description: `Debunk widespread ${niche} misconceptions with evidence from recent research showing 73% of consumers have been misled. Reveal the factual alternatives backed by scientific consensus.`,
        tags: ["mythbusting", "consumerresearch", niche.toLowerCase().replace(/\s+/g, '')]
      },
      {
        title: `I Analyzed 250+ Top ${niche.split(' ')[0]} Accounts - Here's Exactly What Works in 2024`,
        category: "Data Analysis",
        description: `Share the precise content formats that generated 3.2x higher engagement rates based on our competitive analysis. The winning approach only took 34% of the effort but delivered 187% better results.`,
        tags: ["competitoranalysis", "datainsights", "trendstudy"]
      },
      {
        title: `3 Proven ${niche} Techniques That Increased Conversions by 41% (And 2 That Backfired)`,
        category: "A/B Test Results",
        description: `Reveal the exact techniques from our 90-day testing period that boosted conversion rates from 2.8% to 3.95%. The third method alone generated an 18% lift when implemented correctly.`,
        tags: ["abtesting", "conversionrate", "datadriventips"]
      },
      {
        title: `The Overlooked ${niche} Strategy That 79% of Industry Leaders Are Now Adopting`,
        category: "Trend Analysis",
        description: `Explore the emerging approach that top companies are quietly implementing. Data shows early adopters seeing a 27% increase in customer retention and 42% higher repeat purchase rates within 60 days.`,
        tags: ["industrysecrets", "strategytips", "earlytrends"]
      },
      {
        title: `How to Create a ${niche} System That Saves 7+ Hours Per Week (Based on Data from 120+ Businesses)`,
        category: "Productivity Blueprint",
        description: `Step-by-step framework for building an efficient system based on real-world data from successful businesses. The average team reclaimed 7.4 hours weekly while improving quality metrics by 18%.`,
        tags: ["productivity", "systemization", "timemanagement"]
      }
    ];
    for (let i = 0; i < count && i < ecommerceIdeas.length; i++) {
      ideas.push(ecommerceIdeas[i]);
    }
  } else if (accountType === 'business') {
    const businessIdeas = [
      {
        title: `The ROI Analysis: ${niche} Investments That Delivered 280% Returns in 12 Months`,
        category: "ROI Case Study",
        description: `Detailed breakdown of high-performing business investments with exact figures and timelines. Research from 37 companies shows the key factors that drove 3.8x higher returns than industry average.`,
        tags: ["ROIanalysis", "businessstrategy", "investmentreturns"]
      },
      {
        title: `The 15-Minute ${niche} Audit That Found $42,000 in Hidden Revenue Opportunities`,
        category: "Business Optimization",
        description: `Simple yet powerful business audit process that identified substantial revenue leaks in 94% of businesses reviewed. The average discovery was worth $42,350 in annual recurring revenue.`,
        tags: ["businessaudit", "revenuegrowth", "optimization"]
      },
      {
        title: `5 Client Acquisition Strategies That Reduced Our CAC by 64% in 60 Days`,
        category: "Client Acquisition",
        description: `Evidence-based breakdown of how we tested 12 acquisition channels and found 5 that dramatically reduced Customer Acquisition Cost from $278 down to $98 while maintaining lead quality.`,
        tags: ["customeracquisition", "leadgeneration", "marketingstrategy"]
      },
      {
        title: `The ${niche} Meeting Framework That Increased Team Productivity by 32%`,
        category: "Team Performance",
        description: `Step-by-step guide to implementing the data-backed meeting structure that saved 5.4 hours per employee weekly while improving project completion rates by almost a third.`,
        tags: ["teamproductivity", "meetings", "performance"]
      },
      {
        title: `How We Created a ${niche} Referral System Generating 43% of New Business`,
        category: "Growth Strategy",
        description: `Detailed walkthrough of building a referral engine that now drives 43% of all new business at a 76% lower acquisition cost compared to paid channels, based on data from 18 months of testing.`,
        tags: ["referralmarketing", "businessgrowth", "clientacquisition"]
      }
    ];
    for (let i = 0; i < count && i < businessIdeas.length; i++) {
      ideas.push(businessIdeas[i]);
    }
  } else {
    // Personal brand ideas
    const personalIdeas = [
      {
        title: `I Tested 7 Viral ${niche} Techniques - Only 2 Actually Worked (With 215% Better Results)`,
        category: "Experiment Results",
        description: `Honest review after testing popular techniques with real metrics. Two methods outperformed others by 215%, while the most popular one on social media completely failed in controlled testing.`,
        tags: ["experiments", "mythbusting", "realresults"]
      },
      {
        title: `The 30-Day ${niche} Challenge That Improved My Results by 78% (Full Breakdown)`,
        category: "Challenge Results",
        description: `Comprehensive documentation of my 30-day experiment with before/after metrics and daily insights. The structured approach yielded 78% better outcomes than my previous 3-month average.`,
        tags: ["30daychallenge", "transformation", "results"]
      },
      {
        title: `5 ${niche} Mistakes I Made That Cost Me $8,700 (And How You Can Avoid Them)`,
        category: "Lessons Learned",
        description: `Transparent breakdown of costly mistakes with specific numbers and consequences. Detailed explanation of exactly what went wrong and the precise steps I took to correct each issue.`,
        tags: ["mistakes", "lessonslearned", "transparency"]
      },
      {
        title: `The Counterintuitive ${niche} Approach That 3X'd My Growth in 60 Days`,
        category: "Growth Strategy",
        description: `Data-backed case study of how going against conventional wisdom led to unexpected success. Metrics show a 312% improvement over standard methods based on tracking 14 key performance indicators.`,
        tags: ["growthhacking", "counterintuitive", "results"]
      },
      {
        title: `I Analyzed 100+ Successful ${niche} Creators and Found These 3 Surprising Patterns`,
        category: "Creator Research",
        description: `Revealing findings from studying top creators in the space. The data shows 3 consistent patterns present in 87% of successful accounts but only 9% of struggling ones.`,
        tags: ["creatorresearch", "successpatterns", "analysis"]
      }
    ];
    for (let i = 0; i < count && i < personalIdeas.length; i++) {
      ideas.push(personalIdeas[i]);
    }
  }
  
  return ideas;
}
