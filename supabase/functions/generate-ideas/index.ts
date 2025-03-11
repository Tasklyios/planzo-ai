
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

${validAccountType === 'ecommerce' ? 
  `FOR ECOMMERCE BRANDS - CRITICAL GUIDELINES:
  - Create ideas that build trust and authority WITHOUT mentioning products
  - 70% of ideas should focus purely on helping the audience with NO product references
  - 30% of ideas can naturally showcase products as solutions
  - Focus on educational content that establishes expertise in ${niche}
  - Build an engaged community by providing pure value first
  - Position the brand as a trusted advisor, not just a seller` : 
  validAccountType === 'personal' ? 
  `For this PERSONAL CREATOR account:
  - Focus on creating professional, straight-to-the-point content that avoids cringy or gimmicky approaches
  - Generate a diverse mix of content formats: storytelling, day-in-the-life, educational tutorials, top lists, behind-the-scenes
  - Ideas should showcase expertise without appearing forced or inauthentic
  - Each idea must have clear viral potential with strong hooks and unique angles
  - Avoid anything that feels amateur or desperate for attention` : 
  validAccountType === 'business' ? 
  `For this BUSINESS account:
  - Focus on thought leadership, industry expertise, and building brand trust
  - Ideas should position the business as an authority while providing genuine value
  - Include a mix of educational content, behind-the-scenes, and industry insights
  - Prioritize ideas that establish credibility and trust with potential clients` :
  ''}

${styleProfile ? `CREATOR'S UNIQUE STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}

${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}

PLATFORM ADAPTATION: Optimize specifically for ${platform} with the right format, hooks, and engagement tactics.`;

    // Enhanced user prompt with clearer instructions
    const userPrompt = `Create 5 original, viral-potential video ideas for a ${validAccountType} creator in the "${niche}" niche targeting "${audience}" on ${platform}.

${validAccountType === 'ecommerce' ? 
  `FOR ECOMMERCE BRANDS - IMPORTANT:
  - Create 3-4 ideas that focus PURELY on helping ${audience} with NO product mentions:
    * Educational content about ${niche} trends/techniques
    * Industry insights and expert advice
    * Community-focused content
    * Tips and strategies that provide immediate value
  - Only 1-2 ideas should involve products, and these must be naturally integrated
  - ALL ideas must establish the brand as a trusted authority in ${niche}
  - Focus on content that genuinely helps your audience succeed
  - Build trust through expertise and generosity, not selling` :
  validAccountType === 'personal' ? 
  `FOR PERSONAL BRANDS - IMPORTANT GUIDELINES:
  - Create a DIVERSE MIX of formats with NO REPETITION:
    * 1 professional storytelling idea (narrative-driven, personal experience)
    * 1 "day in the life" or behind-the-scenes style content
    * 1 educational or tutorial content that demonstrates expertise
    * 1 list-based content (e.g., "Top 5 ${niche} strategies")
    * 1 trend-based or current event analysis
  - All ideas must be PROFESSIONAL and STRAIGHT-TO-THE-POINT - avoid anything that feels gimmicky or cringy
  - Each idea should have CLEAR VIRAL POTENTIAL with strong hooks and unique angles
  - Aim for ideas that would genuinely interest ${audience} and provide real value
  - Focus on content that builds authority while being authentic and relatable` :
  validAccountType === 'business' ? 
  `FOR BUSINESS BRANDS:
  - Ideas should establish industry authority and thought leadership
  - Include case studies, insider knowledge, and educational content
  - Focus on building trust and credibility with potential clients
  - Demonstrate expertise without being overly technical or jargon-heavy` : ''
}

${customIdeas ? `CREATOR'S OWN IDEAS: "${customIdeas}"` : ""}

${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `DO NOT REPEAT THESE PREVIOUS IDEAS: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Format each idea with:
1. A specific, scroll-stopping title
2. Content category/format
3. Detailed description
4. 3-5 relevant hashtags`;

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
- "What a $50K ${niche} Expert Taught Me in Just One Hour (Worth Every Penny)"
- "My Daily ${niche} Routine: The 15-Minute System That Doubled My Results"
- "I Studied Every Top ${niche} Creator's Process for 30 Days - Here's What Actually Works"
- "Behind-the-Scenes: What Managing a ${niche} Business Really Looks Like"
- "5 ${niche} Myths I Believed Until I Worked With Industry Leaders"`;
          }
          
          const stricterPrompt = `${userPrompt}

IMPORTANT: Your previous ideas were too templated. Create TRULY ORIGINAL ideas like these examples:${exampleIdeas}

FOR PERSONAL BRAND CREATORS:
- Create a diverse mix of content formats with NO REPETITION:
  * 1 storytelling idea with a specific narrative focus
  * 1 behind-the-scenes or day-in-the-life content 
  * 1 educational or expert insight video
  * 1 list-based content with a compelling angle
  * 1 trend analysis or current event perspective
- All ideas must be professional, straight-to-the-point, and have viral potential
- Avoid cringy, clickbaity or gimmicky approaches entirely`;
          
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
              title: `What ${niche} Coaches Never Tell Their Students (Insider Training Secrets)`,
              category: "Expert Education",
              description: `Share advanced training principles and insider knowledge that coaches typically reserve for their top clients. This positions your brand as having deep expertise while providing immense value to the audience without any product promotion.`,
              tags: ["trainingtips", "expertadvice", "insiderknowledge"]
            },
            {
              title: `The Truth About ${niche} Recovery: Science vs. Popular Myths`,
              category: "Myth Busting",
              description: `Break down common misconceptions about recovery in the ${niche} space using scientific research and expert insights. This educational content builds credibility while genuinely helping your audience improve their results.`,
              tags: ["sciencebacked", "recovery", "mythbusting"]
            },
            {
              title: `I Interviewed 50 Elite ${niche} Athletes About Their Mental Game`,
              category: "Research & Insights",
              description: `Share valuable insights from top performers about the mental aspects of ${niche} performance. This community-focused content positions your brand as well-connected while providing unique value to your audience.`,
              tags: ["mentalperformance", "eliteinsights", "mindset"]
            },
            // Product-focused ideas (but still value-first)
            {
              title: `Behind The Scenes: How Elite Athletes Train With Our ${niche} Equipment`,
              category: "Product Showcase",
              description: `Document professional athletes using your products in their actual training routines, showing both the benefits and practical applications. This natural product integration builds credibility while providing valuable training insights.`,
              tags: ["behindthescenes", "elitetraining", "productinsights"]
            },
            {
              title: `The Complete ${niche} Gear Guide (Including Competitors' Products)`,
              category: "Product Education",
              description: `Create an unbiased, comprehensive guide to all ${niche} equipment options, including competitor products. This transparent approach builds trust while naturally positioning your products within the broader market context.`,
              tags: ["gearguide", "productcomparison", "honestreviews"]
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
          // Personal brand content formats with high viral potential
          fallbackIdeas = [
            // Storytelling format - professional and authentic
            {
              title: `What I Learned After Losing My Biggest ${niche} Client (And How It Made Me Better)`,
              category: "Storytelling",
              description: `Share a professional yet vulnerable narrative about overcoming a significant challenge in your ${niche} journey, focusing on the valuable lessons and growth that resulted. This narrative builds authentic connection while demonstrating resilience and expertise in a way that's relatable to ${audience}.`,
              tags: ["professionaljourney", "growthstory", niche.toLowerCase().replace(/\s+/g, '')]
            },
            // Day in the life format
            {
              title: `Behind-the-Scenes: My Actual ${niche} Workday From Start to Finish`,
              category: "Day in the Life",
              description: `Document your authentic daily routine as a ${niche} professional, showing both the glamorous and challenging aspects of your work. This transparent look into your process builds trust and satisfies viewers' curiosity about what success in this field actually requires.`,
              tags: ["behindthescenes", "dayinthelife", "workroutine"]
            },
            // List-based format with a compelling angle
            {
              title: `5 ${niche} Techniques That Successful Professionals Never Share Publicly`,
              category: "List-Based Content",
              description: `Reveal specific, actionable techniques used by top performers in the ${niche} space that aren't commonly discussed. This insider content positions you as an authority with valuable knowledge while delivering practical value to ${audience} in an easily digestible format.`,
              tags: ["insidertips", "expertstrategies", "successsecrets"]
            },
            // Educational/tutorial format
            {
              title: `The ${niche} Framework I Developed After Working With 100+ Clients`,
              category: "Educational Content",
              description: `Break down your professional methodology into a clear, actionable framework that viewers can apply to their own work. This educational content showcases your systematic expertise while providing immediate value, establishing you as a generous thought leader in the ${niche} space.`,
              tags: ["framework", "methodology", "expertinsights"]
            },
            // Trend analysis format
            {
              title: `Why The Latest ${niche} Trend Is Actually Problematic (And What To Do Instead)`,
              category: "Trend Analysis",
              description: `Provide a thoughtful, well-reasoned critique of a current trend in the ${niche} space, offering alternative approaches based on your professional experience. This contrarian perspective demonstrates critical thinking and positions you as someone who prioritizes effectiveness over following the crowd.`,
              tags: ["trendanalysis", "industryinsights", "professionalperspective"]
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
      
      // Enhanced creative fallback ideas for personal brands with diverse formats
      let fallbackIdeas = [];
      
      if (validAccountType === 'personal') {
        fallbackIdeas = [
          // Storytelling format
          {
            title: `The ${niche} Experiment That Changed My Entire Business Approach`,
            category: "Storytelling",
            description: `Share a specific, compelling narrative about a professional experiment that led to unexpected insights in your ${niche} journey. This storytelling format builds authentic connection while demonstrating your innovative thinking and willingness to test and learn.`,
            tags: ["professionalstory", "experiment", "businessinsights"]
          },
          // Day in the life format
          {
            title: `What My Day as a ${niche} Professional Actually Looks Like (No Filters)`,
            category: "Day in the Life",
            description: `Provide an authentic, unfiltered look at your workday, showing both the challenges and rewards of working in the ${niche} space. This transparency builds credibility and trust with ${audience} while satisfying their curiosity about the reality behind the scenes.`,
            tags: ["behindthescenes", "realitycheck", "professionallife"]
          },
          // List-based format
          {
            title: `5 Counter-Intuitive ${niche} Principles I Discovered After Years of Trial and Error`,
            category: "List-Based Content",
            description: `Present specific, evidence-based insights from your professional experience that challenge conventional wisdom in the ${niche} space. This list format makes the content easily digestible while your contrary perspective makes it stand out from typical advice.`,
            tags: ["unconventionalwisdom", "expertinsights", "professionaltips"]
          },
          // Educational/tutorial format
          {
            title: `The Strategic ${niche} Framework That Transformed My Client Results`,
            category: "Educational Content",
            description: `Break down a specific methodology you've developed through professional experience, with clear steps and real examples. This educational content positions you as a systematic thinker and generous expert while providing immediate practical value to ${audience}.`,
            tags: ["methodology", "expertframework", "professionaldevelopment"]
          },
          // Trend analysis format
          {
            title: `The Truth About the Latest ${niche} Trend That No One Is Discussing`,
            category: "Trend Analysis",
            description: `Offer a nuanced perspective on a current trend in the ${niche} space, drawing on your professional expertise to highlight overlooked aspects. This critical analysis showcases your industry knowledge and independent thinking, establishing you as a thoughtful authority.`,
            tags: ["trendanalysis", "industryinsights", "expertperspective"]
          }
        ];
      } else if (validAccountType === 'ecommerce') {
        fallbackIdeas = [
          // Pure value ideas (no product promotion)
          {
            title: `What ${niche} Coaches Never Tell Their Students (Insider Training Secrets)`,
            category: "Expert Education",
            description: `Share advanced training principles and insider knowledge that coaches typically reserve for their top clients. This positions your brand as having deep expertise while providing immense value to the audience without any product promotion.`,
            tags: ["trainingtips", "expertadvice", "insiderknowledge"]
          },
          {
            title: `The Truth About ${niche} Recovery: Science vs. Popular Myths`,
            category: "Myth Busting",
            description: `Break down common misconceptions about recovery in the ${niche} space using scientific evidence and expert insights. This educational content builds authority and trust with your audience without pushing products directly.`,
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
      } else {
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
