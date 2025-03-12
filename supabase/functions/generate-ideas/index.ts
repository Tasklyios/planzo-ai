
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
      businessDescription = ""
    } = await req.json();

    console.log('Generating ideas with:', { 
      niche, audience, videoType, platform, accountType,
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

    // Updated system prompt to emphasize research-backed ideas across all account types
    const systemPrompt = `You are Planzo AI, a specialist in creating viral-worthy, research-backed video ideas for social media. You excel at crafting highly specific, data-driven content concepts for platforms like TikTok, YouTube Shorts, and Instagram Reels.

You understand trends analysis, audience psychology, and engagement metrics to craft compelling content that maximizes views, shares, and watch time.

${validAccountType === 'business' && businessDescription ? 
  `BUSINESS CONTEXT: This is for a business in the ${niche} niche. Business description: ${businessDescription}` : ''}

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

${styleProfile ? `STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}
${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}`;

    // Updated user prompt with more specificity
    let userPrompt = `Generate 5 viral content ideas for ${validAccountType} creator in "${niche}" targeting "${audience}" on ${platform}.

DO NOT generate generic, fluffy ideas. EVERY idea must be:
- Ultra-specific with actionable details
- Backed by data or referenced studies/statistics 
- Tied to a verified trend or evergreen problem
- Concrete enough to be immediately usable

${validAccountType === 'ecommerce' ? 
`For ECOMMERCE content:
- 4 of 5 ideas MUST be purely educational with ZERO product mentions
- Focus on evidence-based solutions to specific problems faced by your target audience
- Ideas should cite real results (e.g., "This technique increased conversions by 37% in our A/B test")
- Include specific numbers and metrics whenever possible
- Only 1 idea can subtly mention product category (not specific products)
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
        description: `Review findings from interviews with 35 industry experts showing how this specific approach is driving 2.7x more qualified traffic. Learn the exact implementation steps with ROI metrics.`,
        tags: ["industrytrends", "expertanalysis", "growthmetrics"]
      },
      {
        title: `The Only 5 ${niche} Metrics That Actually Predict Revenue (Based on 10,000+ Transactions)`,
        category: "Data Insights",
        description: `Share the specific KPIs that showed 94% correlation with revenue growth in our 12-month analysis. The second metric is overlooked by 84% of businesses but predicted sales spikes with 89% accuracy.`,
        tags: ["revenueanalysis", "businessmetrics", "datavisualizations"]
      }
    ];
    
    for (let i = 0; i < count; i++) {
      ideas.push(ecommerceIdeas[i % ecommerceIdeas.length]);
    }
  } else if (accountType === 'business') {
    const businessIdeas = [
      {
        title: `How We Increased Employee Retention by 34% Using This Specific ${niche} Framework`,
        category: "Case Study Results",
        description: `Walk through the exact 4-step process that reduced our turnover from 24% to 15.8% over 6 months, saving $187,000 in recruitment costs. The key third step only required 2 hours per week to implement.`,
        tags: ["employeeretention", "hrmetrics", "businesscase"]
      },
      {
        title: `The 15-Minute ${niche} Audit That Found $417,000 in Overlooked Opportunities`,
        category: "Process Optimization",
        description: `Share the specific checklist that identified 7 critical efficiency gaps across our operations. Our clients have now implemented this audit across 23 departments with an average ROI of 347%.`,
        tags: ["businessaudit", "costoptimization", "efficiencymetrics"]
      },
      {
        title: `7 Leadership Trends Transforming ${niche} (Based on LinkedIn's 2024 Industry Report)`,
        category: "Trend Analysis",
        description: `Analyze the latest LinkedIn data showing how companies implementing these specific leadership practices are experiencing 41% higher team productivity and 28% better talent acquisition success.`,
        tags: ["leadershiptrends", "industryreport", "datadriveninsights"]
      },
      {
        title: `How These 3 Companies Are Using AI to Revolutionize Their ${niche} (With Real Results)`,
        category: "Industry Innovation",
        description: `Examine case studies from 3 mid-sized businesses that reduced operational costs by 23-37% through specific AI implementations. The second company achieved ROI within just 48 days of deployment.`,
        tags: ["aiinnovation", "businesscases", "techimplementation"]
      },
      {
        title: `The Exact Customer Service Script That Increased Our ${niche} Satisfaction Scores by 62%`,
        category: "Process Implementation",
        description: `Share the word-for-word template that transformed our customer satisfaction metrics from 72% to 92% in just 60 days. This approach also led to a 28% increase in repeat purchases worth $324,000.`,
        tags: ["customersatisfaction", "servicescripts", "loyaltymetrics"]
      }
    ];
    
    for (let i = 0; i < count; i++) {
      ideas.push(businessIdeas[i % businessIdeas.length]);
    }
  } else {
    // Personal brand evidence-based ideas
    const personalIdeas = [
      {
        title: `I Tested 7 Viral ${niche} Methods and Only 2 Actually Worked - The Data Will Surprise You`,
        category: "Experiment Results",
        description: `I documented my 60-day experiment testing popular ${niche} techniques, measuring precise before/after metrics. Method #4 promised a 300% improvement but delivered only 17%, while the unexpected winner improved results by 214%.`,
        tags: ["testedmethods", "experimentresults", "datareveal"]
      },
      {
        title: `The 20/80 ${niche} Analysis: How I Identified the 20% of Efforts Producing 80% of My Results`,
        category: "Productivity Analysis",
        description: `I tracked every action for 30 days and discovered the specific 4.2 hours per week that generated 83% of my progress. I've compiled the exact time-tracking template and decision framework I used.`,
        tags: ["productivitydata", "timeanalysis", "efficiencyhacks"]
      },
      {
        title: `5 ${niche} Tools That Saved Me 11.5 Hours Per Week (With Actual Screen Time Data)`,
        category: "Tool Comparison",
        description: `I documented my workflow before and after implementing these specific tools, with precise time savings metrics for each step. Tool #3 had a 932% ROI based on time saved versus monthly cost.`,
        tags: ["productivitytools", "timetracking", "workflowoptimization"]
      },
      {
        title: `What Actually Happened When I Followed the Viral ${niche} Advice for 30 Days Straight`,
        category: "Challenge Results",
        description: `I implemented the exact technique that got 42M views on TikTok, documenting daily metrics including a 23% improvement in week 1, followed by an unexpected 17% decline in week 3. Here's the complete data.`,
        tags: ["challengeresults", "trendanalysis", "datatracking"]
      },
      {
        title: `3 Counter-Intuitive ${niche} Strategies That Increased My Results by 218% (With Evidence)`,
        category: "Proven Methods",
        description: `I'm sharing the exact approaches that contradicted conventional wisdom but delivered measurable improvements. Strategy #2 initially seemed riskiest but produced a consistent 43% better outcome across 17 test cases.`,
        tags: ["provenmethods", "dataevidence", "resultsanalysis"]
      }
    ];
    
    for (let i = 0; i < count; i++) {
      ideas.push(personalIdeas[i % personalIdeas.length]);
    }
  }
  
  return ideas.slice(0, count);
}
