
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

    // Enhanced system prompt with more specific guidance
    const systemPrompt = `You are an elite marketing strategist and viral content expert specializing in ${platform} content.

Your expertise is creating viral content ideas for ${validAccountType} creators in the "${niche}" space targeting "${audience}".

CONTENT REQUIREMENTS:
- Create COMPLETELY ORIGINAL ideas that would be considered high-quality and professional 
- Each idea must have a unique angle specific to ${niche}
- Ideas should be attention-grabbing, value-driven, and achievable
- Focus on what would actually go viral for this specific creator while maintaining credibility

${validAccountType === 'personal' ? 
  `For this PERSONAL CREATOR account:
  - Focus on building professional authority and genuine connection
  - Include a mix of formats: storytelling, tutorials, insider knowledge, and list-style content
  - Ideas should showcase expertise without appearing forced or inauthentic
  - Balance entertainment value with professional insights` : 
  validAccountType === 'business' ? 
  `For this BUSINESS account:
  - Focus on thought leadership, industry expertise, and building brand trust
  - Ideas should position the business as an authority while providing genuine value
  - Include a mix of educational content, behind-the-scenes, and industry insights
  - Prioritize ideas that establish credibility and trust with potential clients` :
  validAccountType === 'ecommerce' ? 
  `For this ECOMMERCE account:
  - Include a balance of direct product promotion and pure value-focused content
  - 60% of ideas should focus purely on helping the audience without explicit product mentions
  - 40% of ideas should showcase products in natural, problem-solving contexts
  - Prioritize educational content that positions the brand as an industry leader
  - Focus on building an engaged community around the niche, not just selling products` : 
  ''}

${styleProfile ? `CREATOR'S UNIQUE STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}

${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}

PLATFORM ADAPTATION: Optimize specifically for ${platform} with the right format, hooks, and engagement tactics.`;

    // Enhanced user prompt with clearer instructions
    const userPrompt = `Create 5 original, viral-potential video ideas for a ${validAccountType} creator in the "${niche}" niche targeting "${audience}" on ${platform}.

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

${validAccountType === 'personal' ? 
  `FOR PERSONAL BRANDS:
  - Create a MIX of content formats: storytelling (1-2 ideas), educational/tutorial (1-2 ideas), and list-based (1-2 ideas)
  - Ideas must be professional, credible, and authentic - avoid anything that seems forced or gimmicky
  - Each idea should showcase expertise while still being entertaining
  - Focus on ideas that build meaningful connection with ${audience}` :
  validAccountType === 'ecommerce' ? 
  `FOR ECOMMERCE BRANDS:
  - Include 3 ideas that focus ONLY on helping the audience with no direct product promotion
  - Include 2 ideas that naturally showcase products as solutions to audience problems
  - All ideas should establish the brand as a trusted authority in the ${niche} space
  - Focus on educational content that genuinely helps ${audience}
  - Avoid overly promotional angles - prioritize building trust and engagement` :
  validAccountType === 'business' ? 
  `FOR BUSINESS BRANDS:
  - Ideas should establish industry authority and thought leadership
  - Include case studies, insider knowledge, and educational content
  - Focus on building trust and credibility with potential clients
  - Demonstrate expertise without being overly technical or jargon-heavy` : ''
}

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
          
          // Enhanced fallback examples based on account type
          let exampleIdeas = "";
          
          if (validAccountType === 'ecommerce') {
            exampleIdeas = `
- "We Asked Olympians How They Use Our ${niche} Products - They Didn't Hold Back"
- "The ${niche} Ritual That All Pro Athletes Swear By (No Products Required)"
- "I Spent 30 Days Testing Every ${niche} Hack So You Don't Have To"
- "The Surprising Connection Between ${niche} and Mental Performance That No One's Talking About"
- "We Let ${audience} Design Our Next ${niche} Innovation and The Results Are Fascinating"`;
          } else if (validAccountType === 'business') {
            exampleIdeas = `
- "The Client Strategy We Refused to Share With Our ${niche} Competitors Until Now"
- "What 100 Successful ${niche} Professionals Have in Common - Our 3-Year Research Study"
- "The Unconventional ${niche} Framework That Cut Our Client's Costs by 40%"
- "Behind Closed Doors: How Top ${niche} Firms Actually Make Strategic Decisions"
- "The ${niche} Analysis Method That Changed How We Approach Every Client Project"`;
          } else {
            exampleIdeas = `
- "The ${niche} Technique I Discovered After Losing My Biggest Client (Changed Everything)"
- "Inside My ${niche} Process: The 15-Minute Routine That Transformed My Results"
- "Why Everything You've Heard About ${niche} is Wrong - My 10-Year Journey"
- "The Counterintuitive ${niche} Approach That Doubled My Productivity"
- "I Studied 50 ${niche} Experts' Morning Routines - The Common Thread Nobody Talks About"`;
          }
          
          const stricterPrompt = `${userPrompt}

IMPORTANT: Your previous ideas were too templated. Create TRULY ORIGINAL ideas like these examples:${exampleIdeas}

IMPORTANT GUIDELINES:
- For personal brands, include a mix of formats (storytelling, educational, list-based)
- For ecommerce brands, include both pure value content (3 ideas) and product showcase content (2 ideas)
- For business brands, focus on thought leadership and expertise demonstration
- All ideas should feel professional, credible, and authentic`;
          
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
      
      // Enhanced fallback ideas for each account type
      if (ideas.length < 5) {
        let fallbackIdeas = [];
        
        if (validAccountType === 'ecommerce') {
          fallbackIdeas = [
            // Pure value ideas (no product promotion)
            {
              title: `The ${niche} Training Approach That Elite Athletes Never Share Publicly`,
              category: "Expert Insights",
              description: `Break down an advanced training approach used by professionals in the ${niche} world that everyday enthusiasts can adapt. This positions your brand as having insider knowledge while providing pure value to ${audience} without mentioning products.`,
              tags: ["expertinsights", "trainingtips", niche.toLowerCase().replace(/\s+/g, '')]
            },
            {
              title: `What ${audience} Get Wrong About ${niche} Recovery (According to Science)`,
              category: "Myth Busting",
              description: `Debunk common misconceptions about recovery in the ${niche} space using scientific evidence and expert insights. This educational content builds authority and trust with your audience without pushing products directly.`,
              tags: ["mythbusting", "recovery", "sciencebacked"]
            },
            {
              title: `I Interviewed 50 ${niche} Coaches About Their #1 Mental Performance Hack`,
              category: "Community Insights",
              description: `Share valuable insights from industry professionals about the mental side of ${niche} performance. This community-focused content positions your brand as connected and knowledgeable while providing immense value.`,
              tags: ["mentalperformance", "experttips", "community"]
            },
            // Product-focused ideas
            {
              title: `We Asked Pro ${niche} Athletes to Brutally Critique Our Products (Their Feedback Changed Everything)`,
              category: "Product Development",
              description: `Show authentic feedback from professional athletes about your ${niche} products, highlighting both praise and criticism. This transparent approach builds trust with ${audience} while naturally showcasing your products and commitment to quality.`,
              tags: ["honestfeedback", "productdevelopment", "athletetested"]
            },
            {
              title: `The Unconventional ${niche} Test: How Our Products Perform in Extreme Conditions`,
              category: "Product Performance",
              description: `Document putting your ${niche} products through unusual or extreme testing scenarios to demonstrate durability, effectiveness, and quality. This entertaining yet informative content naturally showcases product benefits in a non-promotional way.`,
              tags: ["producttesting", "extremeconditions", "qualityproof"]
            }
          ];
        } else if (validAccountType === 'business') {
          fallbackIdeas = [
            {
              title: `The ${niche} Framework We Use With Fortune 500 Clients (Full Breakdown)`,
              category: "Business Methodology",
              description: `Provide an in-depth look at a proprietary framework or methodology your business uses with top clients. This positions your business as having enterprise-level expertise while providing actionable insights to ${audience}.`,
              tags: ["methodology", "framework", "expertinsights"]
            },
            {
              title: `What Our Research of 100+ ${niche} Companies Revealed About Growth Patterns`,
              category: "Industry Research",
              description: `Share original research findings from analyzing companies in the ${niche} space, highlighting patterns and insights that aren't commonly discussed. This establishes your business as a thought leader with unique, data-driven perspectives.`,
              tags: ["research", "industrytrends", "datadriveninsights"]
            },
            {
              title: `Behind Our Most Successful ${niche} Project: The Strategy That Changed Everything`,
              category: "Case Study",
              description: `Present a detailed case study of your most impactful project, breaking down the strategy, challenges, and results. This practical demonstration of your expertise shows potential clients what you can achieve for them.`,
              tags: ["casestudy", "successstory", "strategy"]
            },
            {
              title: `The Unconventional ${niche} Approach That Our Competitors Refuse to Try`,
              category: "Innovative Methodology",
              description: `Explain a unique or contrarian approach your business takes to ${niche} challenges that differentiates you from competitors. This positions your business as innovative and forward-thinking in the industry.`,
              tags: ["innovation", "differentiation", "thoughtleadership"]
            },
            {
              title: `Inside Our ${niche} Decision-Making Process: How We Help Clients Navigate Uncertainty`,
              category: "Business Insights",
              description: `Provide a transparent look at how your business approaches complex decisions in the ${niche} space, offering a window into your strategic thinking process that builds credibility with ${audience}.`,
              tags: ["decisionmaking", "strategy", "transparency"]
            }
          ];
        } else {
          fallbackIdeas = [
            // Storytelling format
            {
              title: `The ${niche} Mistake That Nearly Ended My Career (And The Comeback Strategy)`,
              category: "Personal Story",
              description: `Share a vulnerable yet professional story about a significant setback in your ${niche} journey and the strategic approach that helped you recover. This narrative format builds authentic connection while demonstrating resilience and expertise.`,
              tags: ["comeback", "lessonslearned", "strategy"]
            },
            {
              title: `My 10-Year ${niche} Evolution: The Unexpected Turning Points That Changed Everything`,
              category: "Journey Reflection",
              description: `Document the key milestones and pivotal moments in your professional development in the ${niche} space, highlighting insights gained along the way. This reflection-based content builds credibility and relatability with ${audience}.`,
              tags: ["journey", "growth", "milestones"]
            },
            // Educational/tutorial format
            {
              title: `The ${niche} System I Created After Working With 100+ Clients (Full Breakdown)`,
              category: "Methodology Tutorial",
              description: `Provide a detailed walkthrough of a proven system or framework you've developed from extensive experience. This educational content positions you as an authority while delivering actionable value to ${audience}.`,
              tags: ["system", "methodology", "expertinsights"]
            },
            // List-based format
            {
              title: `5 Counter-Intuitive ${niche} Principles I Discovered After Analyzing Top Performers`,
              category: "Research Insights",
              description: `Share evidence-based insights from studying successful people in the ${niche} space that challenge conventional wisdom. This list-format content demonstrates your analytical thinking and research-backed expertise.`,
              tags: ["research", "principles", "success"]
            },
            {
              title: `The 3-Part ${niche} Framework That Transformed My Results (And Client Outcomes)`,
              category: "Framework Breakdown",
              description: `Break down a specific, actionable framework that's delivered measurable results, with examples and implementation steps. This structured approach showcases your systematic expertise while providing immediate value.`,
              tags: ["framework", "results", "implementation"]
            }
          ];
        }
        
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
      
      // Enhanced creative fallback ideas that ensure professionalism and value
      let fallbackIdeas = [];
      
      if (validAccountType === 'ecommerce') {
        fallbackIdeas = [
          // Pure value content (no product promotion)
          {
            title: `The Overlooked ${niche} Training Technique That Transformed Elite Athletes' Performance`,
            category: "Expert Training",
            description: `Share an effective but underutilized training approach in the ${niche} space that delivers surprising results. This educational content positions your brand as knowledgeable and helpful without mentioning products directly.`,
            tags: ["trainingtips", "performanceenhancement", "expertadvice"]
          },
          {
            title: `What Science Really Says About ${niche} Recovery: Debunking Common Myths`,
            category: "Educational Content",
            description: `Present evidence-based information about recovery in the ${niche} space, correcting misconceptions that might be holding your audience back. This demonstrates your brand's commitment to accuracy and education.`,
            tags: ["sciencebacked", "recovery", "mythbusting"]
          },
          {
            title: `The ${niche} Mental Performance Strategies Used by Olympic Athletes`,
            category: "Performance Psychology",
            description: `Explore the psychological aspects of ${niche} performance based on techniques used by top competitors. This valuable content helps your audience improve without any product promotion.`,
            tags: ["mentalstrength", "performancepsychology", "mindset"]
          },
          // Product-focused content
          {
            title: `How We Redesigned Our ${niche} Products Based on Feedback from 1,000+ Users`,
            category: "Product Development",
            description: `Document your product development process, highlighting how customer feedback shapes improvements. This transparent approach builds trust while naturally showcasing your products' evolution and benefits.`,
            tags: ["productdevelopment", "customerdriven", "innovation"]
          },
          {
            title: `Real ${audience} Put Our ${niche} Products to the Test: Unfiltered Results`,
            category: "Product Testing",
            description: `Feature authentic testing scenarios with real customers using your products in their daily ${niche} activities. This genuine approach demonstrates product benefits through real-world application rather than direct promotion.`,
            tags: ["realresults", "customertesting", "authenticity"]
          }
        ];
      } else {
        fallbackIdeas = [
          // Mix of formats for personal brands
          {
            title: `The ${niche} Strategy That Transformed My Business After a Major Setback`,
            category: "Personal Story",
            description: `Share a professional yet personal story about overcoming a significant challenge in your ${niche} journey, focusing on the strategic approach that led to success. This narrative builds connection while demonstrating expertise and resilience.`,
            tags: ["strategy", "resilience", "growth"]
          },
          {
            title: `Behind the Scenes: My Exact ${niche} Process That Delivers Consistent Results`,
            category: "Methodology Breakdown",
            description: `Provide a detailed look at your professional workflow or methodology, offering actionable insights that ${audience} can implement. This transparent approach builds trust and positions you as a generous expert.`,
            tags: ["process", "behindthescenes", "methodology"]
          },
          {
            title: `3 Counterintuitive ${niche} Principles I Discovered After Working With Top Performers`,
            category: "Expert Insights",
            description: `Share unexpected but effective principles you've identified through professional experience, challenging conventional wisdom with evidence-based alternatives. This thought leadership content establishes your innovative expertise.`,
            tags: ["principles", "expertise", "innovation"]
          },
          {
            title: `The ${niche} Analysis Framework That Completely Changed My Client Approach`,
            category: "Professional Framework",
            description: `Break down a specific analytical framework you use in your professional work, with examples of how it leads to better outcomes. This structured content demonstrates your systematic expertise and delivers immediate value.`,
            tags: ["framework", "analysis", "professional"]
          },
          {
            title: `What My Research of 50+ Successful ${niche} Cases Revealed About Sustainable Growth`,
            category: "Research Findings",
            description: `Present insights from your analysis of successful examples in the ${niche} space, focusing on patterns and principles that lead to long-term results. This research-based content establishes your authority and analytical thinking.`,
            tags: ["research", "growthstrategy", "analysis"]
          }
        ];
      }
      
      ideas = fallbackIdeas;
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
