
// Import XHR using the correct syntax for Deno edge functions
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      SUPABASE_URL || '',
      SUPABASE_ANON_KEY || ''
    );

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
      numIdeas = 5, // Default to 5
      isEcoRelated,
      isEcommerce,
      marketResearch,
      modelOverride,
      styleProfile, // New parameter for style profile
      accountType // Add account type
    } = await req.json();

    // Start tracking time for performance measurement
    const startTime = Date.now();
    
    // Validate required inputs
    if (!niche) {
      return new Response(
        JSON.stringify({ error: "Niche is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log('Generating ideas with:', { 
      niche, audience, videoType, platform,
      customIdeasLength: customIdeas?.length || 0,
      numIdeas: 5, // Always use 5 ideas
      contentStyle,
      contentPersonality,
      accountType,
      hasStyleProfile: !!styleProfile,
      styleProfileName: styleProfile?.name
    });

    // Always use exactly 5 ideas regardless of what was passed
    const requestedNumIdeas = 5;
    
    // Detect if this is an eco brand to apply optimizations
    const isEcoBrand = isEcoRelated || detectEcoBrand(niche, customIdeas);

    // Construct the prompt differently based on whether it's an eco brand or not
    const prompt = constructAdvancedPrompt({
      niche,
      audience,
      videoType,
      platform,
      customIdeas,
      contentStyle,
      contentPersonality,
      previousIdeas,
      isEcoBrand,
      numIdeas: requestedNumIdeas, // Always force exactly 5 ideas
      isEcommerce,
      marketResearch,
      styleProfile,
      accountType
    });

    // Always use gpt-4o-mini as specified
    const model = "gpt-4o-mini";
    
    console.log('Using model:', model);
    console.log('System prompt:', prompt.systemPrompt);
    console.log('User prompt:', prompt.userPrompt);
    
    const apiRequestBody = {
      model: model,
      messages: [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content: prompt.userPrompt }
      ],
      // Improved parameters for better quality and creativity
      temperature: 0.9, // Higher temperature for more creative ideas
      max_tokens: 2500, // Increased token limit for more detailed responses
      top_p: 0.95, // Slightly higher top_p for more diverse ideas
      frequency_penalty: 0.8, // Higher to reduce repetitiveness
      presence_penalty: 0.8, // Higher to encourage novel content
    };

    // Call the OpenAI API
    console.log('Calling OpenAI API...');
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(apiRequestBody)
    });

    // Get the response data
    const data = await response.json();
    
    // Log any errors from the OpenAI API
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
    
    // Process and validate the response
    let ideas = parseAndValidateIdeas(rawResponse, isEcoBrand);
    
    // Ensure we return exactly 5 ideas - no more, no less
    if (ideas.length > 5) {
      ideas = ideas.slice(0, 5);
      console.log('Trimmed ideas to 5');
    } else if (ideas.length < 5) {
      // If less than 5 ideas were generated, create compelling fallbacks
      ideas = createCompellingFallbackIdeas(ideas, niche, audience, accountType, platform, videoType);
      console.log('Created compelling fallback ideas to reach 5 total');
    }
    
    console.log('Final ideas count:', ideas.length);
    
    // Calculate the time taken
    const timeElapsed = Date.now() - startTime;
    console.log(`Ideas generated in ${timeElapsed}ms`);

    // Return the ideas with additional debug info
    return new Response(
      JSON.stringify({ 
        ideas: ideas.slice(0, 5), // Ensure we only return 5 ideas
        rawResponse,
        debug: {
          modelUsed: model,
          timeElapsed,
          ideasCount: ideas.length,
          inputData: {
            niche,
            audience,
            videoType,
            platform,
            contentStyle,
            contentPersonality,
            styleProfileName: styleProfile?.name,
            accountType,
            nicheUsed: determineProperNiche(accountType, niche)
          }
        }
      }),
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

// Helper function to determine the proper niche based on account type
function determineProperNiche(accountType, providedNiche) {
  // Default to the provided niche if no account type is specified
  if (!accountType) return providedNiche;
  
  console.log(`Determining proper niche for account type: ${accountType}, provided niche: ${providedNiche}`);
  
  // For personal accounts, we should use the niche directly (content niche)
  if (accountType === 'personal') {
    return providedNiche; // This should be content_niche from the profile
  }
  
  // For ecommerce accounts, we add "Product" suffix if it's not already there
  if (accountType === 'ecommerce') {
    if (!providedNiche.toLowerCase().includes('product')) {
      return `${providedNiche} Products`;
    }
    return providedNiche;
  }
  
  // For business accounts, we add "Business" suffix if it's not already there
  if (accountType === 'business') {
    if (!providedNiche.toLowerCase().includes('business')) {
      return `${providedNiche} Business`;
    }
    return providedNiche;
  }
  
  // Fallback to the provided niche
  return providedNiche;
}

// Helper function to create compelling fallback ideas when AI generates fewer than 5
function createCompellingFallbackIdeas(existingIdeas, niche, audience, accountType, platform, videoType) {
  const nicheToUse = determineProperNiche(accountType, niche);
  const audienceTarget = audience || "your target audience";
  
  // More specific and high-performing fallback templates based on platform and account type
  const fallbackTemplates = [];
  
  // Personal account fallbacks
  if (accountType === 'personal') {
    fallbackTemplates.push(
      {
        title: `A Day in My Life as a ${nicheToUse} Creator`,
        category: "Lifestyle",
        description: `Take ${audienceTarget} behind the scenes of your daily routine, showing authentic moments that make your ${nicheToUse} content unique.`,
        tags: ["dayinthelife", "creator", "behindthescenes"]
      },
      {
        title: `What I Wish I Knew Before Starting in ${nicheToUse}`,
        category: "Educational",
        description: `Share valuable insights and lessons learned that will resonate with ${audienceTarget} who are interested in ${nicheToUse}.`,
        tags: ["lessons", "advice", "experience"]
      },
      {
        title: `The Truth About ${nicheToUse} Nobody Talks About`,
        category: "Reveal",
        description: `Create an honest, myth-busting video that reveals the hidden realities of ${nicheToUse} that will surprise ${audienceTarget}.`,
        tags: ["truth", "exposed", "reality"]
      },
      {
        title: `5 ${nicheToUse} Hacks That Changed Everything`,
        category: "Tips & Tricks",
        description: `Demonstrate game-changing hacks that will genuinely help ${audienceTarget} solve common problems in ${nicheToUse}.`,
        tags: ["hacks", "tips", "solutions"]
      },
      {
        title: `Answering ${nicheToUse} Questions You're Too Afraid to Ask`,
        category: "Q&A",
        description: `Address taboo or uncomfortable questions about ${nicheToUse} that ${audienceTarget} want answers to but rarely see discussed.`,
        tags: ["questions", "taboo", "answers"]
      }
    );
  }
  // Ecommerce account fallbacks
  else if (accountType === 'ecommerce') {
    fallbackTemplates.push(
      {
        title: `${nicheToUse} Unboxing: First Impressions`,
        category: "Product Reveal",
        description: `Create an authentic unboxing experience that showcases your product's packaging, first impressions, and immediate value to ${audienceTarget}.`,
        tags: ["unboxing", "review", "firstimpressions"]
      },
      {
        title: `${nicheToUse} vs. Competitors: Honest Comparison`,
        category: "Comparison",
        description: `Compare your ${nicheToUse} with competitors, highlighting unique advantages while being honest about differences that matter to ${audienceTarget}.`,
        tags: ["comparison", "review", "honest"]
      },
      {
        title: `3 Unexpected Ways to Use Our ${nicheToUse}`,
        category: "Product Tips",
        description: `Demonstrate creative, non-obvious ways to use your products that add extra value for ${audienceTarget} and showcase versatility.`,
        tags: ["hacks", "howto", "creative"]
      },
      {
        title: `Real Customer Transformations with ${nicheToUse}`,
        category: "Testimonial",
        description: `Feature authentic before-and-after results from real customers using your ${nicheToUse}, specifically chosen to resonate with ${audienceTarget}.`,
        tags: ["results", "transformation", "testimonial"]
      },
      {
        title: `Behind the Scenes: How We Make ${nicheToUse}`,
        category: "Brand Story",
        description: `Take ${audienceTarget} behind the scenes of your product creation process, building trust through transparency and craftsmanship.`,
        tags: ["behindthescenes", "making", "craftsmanship"]
      }
    );
  }
  // Business account fallbacks
  else if (accountType === 'business') {
    fallbackTemplates.push(
      {
        title: `How We Solved This ${nicheToUse} Challenge for a Client`,
        category: "Case Study",
        description: `Share a compelling success story that demonstrates your expertise in solving real problems for clients in the ${nicheToUse} industry.`,
        tags: ["casestudy", "success", "solution"]
      },
      {
        title: `${nicheToUse} Industry Trends You Can't Ignore`,
        category: "Industry Insights",
        description: `Provide valuable industry analysis and predictions that position your business as a thought leader for ${audienceTarget}.`,
        tags: ["trends", "insights", "industry"]
      },
      {
        title: `A Day Working with Our ${nicheToUse} Team`,
        category: "Company Culture",
        description: `Showcase your team's expertise and workplace culture to build trust and connection with ${audienceTarget}.`,
        tags: ["team", "behindthescenes", "culture"]
      },
      {
        title: `${nicheToUse} Mistakes Costing You Money (And How to Fix Them)`,
        category: "Problem Solving",
        description: `Identify common pain points for ${audienceTarget} and demonstrate how your business solutions address these costly issues.`,
        tags: ["mistakes", "solutions", "roi"]
      },
      {
        title: `Client Transformation: ${nicheToUse} Success Story`,
        category: "Testimonial",
        description: `Feature a detailed client success story with specific metrics and outcomes that prove your ${nicheToUse} business delivers results for ${audienceTarget}.`,
        tags: ["success", "transformation", "results"]
      }
    );
  }
  // Generic fallbacks (used if account type is not specified)
  else {
    fallbackTemplates.push(
      {
        title: `${nicheToUse} Secrets Experts Don't Share`,
        category: "Insider Knowledge",
        description: `Reveal valuable insider information about ${nicheToUse} that will give ${audienceTarget} an advantage others don't have.`,
        tags: ["secrets", "insider", "tips"]
      },
      {
        title: `Is ${nicheToUse} Worth It? Honest Review`,
        category: "Review",
        description: `Provide a balanced, authentic assessment of ${nicheToUse} that helps ${audienceTarget} make informed decisions.`,
        tags: ["review", "honest", "worthit"]
      },
      {
        title: `I Tried ${nicheToUse} for 30 Days - Here's What Happened`,
        category: "Challenge",
        description: `Document a 30-day journey with ${nicheToUse}, showing real results and experiences that will resonate with ${audienceTarget}.`,
        tags: ["challenge", "results", "journey"]
      },
      {
        title: `${nicheToUse} Myth-Busting: What Really Works`,
        category: "Educational",
        description: `Debunk common misconceptions about ${nicheToUse} with evidence-based information that helps ${audienceTarget} avoid mistakes.`,
        tags: ["mythbusting", "facts", "education"]
      },
      {
        title: `The Future of ${nicheToUse}: Trends for 2025`,
        category: "Trends",
        description: `Provide forward-looking insights about ${nicheToUse} that position you as a thought leader for ${audienceTarget}.`,
        tags: ["future", "trends", "predictions"]
      }
    );
  }
  
  // Add platform-specific optimizations
  if (platform) {
    for (let template of fallbackTemplates) {
      if (platform.toLowerCase().includes('tiktok')) {
        template.title = addTiktokFlair(template.title);
        template.tags.push('tiktok', 'viral');
      } else if (platform.toLowerCase().includes('instagram')) {
        template.title = addInstagramFlair(template.title);
        template.tags.push('instagram', 'reels');
      } else if (platform.toLowerCase().includes('youtube')) {
        template.title = addYoutubeFlair(template.title);
        template.tags.push('youtube', 'shorts');
      }
    }
  }
  
  // Add existing ideas first
  const finalIdeas = [...existingIdeas];
  
  // Fill remaining slots with fallback templates
  while (finalIdeas.length < 5) {
    // Get a fallback that's not too similar to existing ideas
    const usedTitles = finalIdeas.map(idea => idea.title.toLowerCase());
    
    let uniqueTemplateFound = false;
    let templateIndex = 0;
    
    // Try to find a template that's not too similar to existing ideas
    while (!uniqueTemplateFound && templateIndex < fallbackTemplates.length) {
      const template = fallbackTemplates[templateIndex];
      const isTooSimilar = usedTitles.some(title => 
        title.includes(template.title.toLowerCase().substring(0, 10)) || 
        template.title.toLowerCase().includes(title.substring(0, 10))
      );
      
      if (!isTooSimilar) {
        finalIdeas.push(template);
        uniqueTemplateFound = true;
      }
      
      templateIndex++;
      
      // If we've gone through all templates and none are unique enough,
      // just add the next one with a slight modification
      if (templateIndex >= fallbackTemplates.length && !uniqueTemplateFound) {
        const template = fallbackTemplates[finalIdeas.length % fallbackTemplates.length];
        const modifiedTemplate = {
          ...template,
          title: `${template.title} (Updated for ${new Date().getFullYear()})`,
          description: `New perspective: ${template.description}`
        };
        finalIdeas.push(modifiedTemplate);
        uniqueTemplateFound = true;
      }
    }
  }
  
  return finalIdeas;
}

// Helper functions for platform-specific title optimization
function addTiktokFlair(title) {
  const tiktokPrefixes = ["POV: ", "Tell me you're ", "When you ", "#", "I didn't know ", "They didn't tell me "];
  const usePrefix = Math.random() > 0.5;
  
  if (usePrefix) {
    const prefix = tiktokPrefixes[Math.floor(Math.random() * tiktokPrefixes.length)];
    if (prefix === "#") {
      return title.replace(/\s+/g, '') + " #viral #fyp";
    }
    return prefix + title;
  }
  
  return title;
}

function addInstagramFlair(title) {
  if (title.length > 50) {
    return title.substring(0, 50) + "...";
  }
  if (Math.random() > 0.7) {
    return "✨ " + title + " ✨";
  }
  return title;
}

function addYoutubeFlair(title) {
  if (Math.random() > 0.7) {
    return title + " (You Won't Believe What Happened!)";
  }
  if (Math.random() > 0.5) {
    return title + " | Life-Changing Results";
  }
  return title;
}

// Helper function to detect if the niche is related to eco brands
function detectEcoBrand(niche, customIdeas) {
  const ecoKeywords = [
    'eco', 'green', 'sustainable', 'environment', 'recycled', 'organic', 
    'natural', 'biodegradable', 'zero waste', 'eco-friendly', 'vegan', 
    'plant-based', 'carbon neutral', 'compostable', 'ethical', 'clean'
  ];
  
  // Check if any eco keywords are in the niche or custom ideas
  const nicheMatches = ecoKeywords.some(keyword => 
    niche?.toLowerCase().includes(keyword.toLowerCase())
  );
  
  const customIdeasMatches = customIdeas && ecoKeywords.some(keyword => 
    customIdeas.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return nicheMatches || customIdeasMatches;
}

// Enhanced prompt construction for better idea generation
function constructAdvancedPrompt({ 
  niche,
  audience,
  videoType,
  platform,
  customIdeas,
  contentStyle,
  contentPersonality,
  previousIdeas,
  isEcoBrand,
  numIdeas,
  isEcommerce,
  marketResearch,
  styleProfile,
  accountType
}) {
  // Use the correct niche based on account type
  const nicheToUse = determineProperNiche(accountType, niche);
  console.log(`Using niche: ${nicheToUse} for prompt construction (account type: ${accountType})`);
  
  // Enhanced system prompt with detailed instructions for high-quality idea generation
  let systemPrompt = `You are an expert content strategist and creative director specializing in developing highly original, engaging, and strategically effective video concepts for ${platform || 'social media'}.

Your expertise is in creating ideas that are:
1. TRULY ORIGINAL - not generic templates or formulas seen across social media
2. HIGHLY SPECIFIC to the client's exact niche and audience
3. STRATEGICALLY VALUABLE with clear goals and audience impact
4. CREATIVELY INNOVATIVE with unique angles that stand out
5. DATA-INFORMED based on what performs well on each platform

Your task is to generate ${numIdeas} EXCEPTIONAL video ideas for a ${accountType || 'business'} in the ${nicheToUse} niche targeting ${audience || 'their audience'}.`;

  // Add detailed account type specific context with concrete examples and considerations
  if (accountType) {
    systemPrompt += `\n\nACCOUNT TYPE DETAILS:`;
    
    if (accountType === 'personal') {
      systemPrompt += `\nThis is a PERSONAL CREATOR account in the ${nicheToUse} niche. 
Focus on authentic, personality-driven content that:
- Showcases the creator's unique expertise and personal journey in ${nicheToUse}
- Creates genuine emotional connections with ${audience} through storytelling
- Positions them as a trustworthy, relatable authority in ${nicheToUse}
- Differentiates them from other creators in the same space through unique content angles
- Leverages personal experiences to create content that cannot be easily replicated

STRONG EXAMPLES:
- "My 3 Biggest ${nicheToUse} Mistakes That Cost Me $XX,XXX" (specific, authentic, valuable)
- "What ${audience} Don't Know About ${nicheToUse}: Industry Secrets Revealed" (insider knowledge)
- "I Tried This Unconventional ${nicheToUse} Approach For 30 Days - Unexpected Results" (unique experiment)

WEAK EXAMPLES TO AVOID:
- "5 Tips for ${nicheToUse}" (too generic, thousands of similar videos exist)
- "How To Succeed in ${nicheToUse}" (lacks specificity and unique angle)
- "${nicheToUse} Tutorial" (too broad, no unique value proposition)`;
    } else if (accountType === 'ecommerce') {
      systemPrompt += `\nThis is an E-COMMERCE BUSINESS selling ${nicheToUse}.
Focus on product-centric content that:
- Showcases products solving specific, relatable problems for ${audience}
- Demonstrates unexpected benefits and use cases that differentiate these products
- Creates desire through creative demonstration formats and authentic customer stories
- Leverages social proof in innovative ways that build instant credibility
- Uses before/after transformations with specific, measurable improvements

STRONG EXAMPLES:
- "We Asked ${audience} Their Biggest ${nicheToUse} Frustration - Watch How Our Product Solved It In 30 Seconds" (problem-solution format)
- "This ${nicheToUse} Hack Using Our Product Went Viral - Here's The Science Behind Why It Works" (trend + education)
- "3 Unexpected Ways Our Customers Use Our ${nicheToUse} That We Never Designed For" (surprising uses)

WEAK EXAMPLES TO AVOID:
- "Check Out Our New ${nicheToUse}" (lacks specific benefit or hook)
- "Why Our ${nicheToUse} Is Better" (generic claim without specificity)
- "${nicheToUse} Product Review" (too generic, lacks emotional appeal)`;
    } else if (accountType === 'business') {
      systemPrompt += `\nThis is a ${nicheToUse} BUSINESS targeting ${audience} clients/customers.
Focus on authority-building content that:
- Demonstrates specific, measurable results achieved for clients (with real data)
- Provides exceptional value that positions this business as the definitive expert
- Addresses highly specific pain points ${audience} face that competitors miss
- Shows proprietary frameworks or methodologies that create superior outcomes
- Leverages client success stories in compelling narrative formats

STRONG EXAMPLES:
- "The Exact ${nicheToUse} Strategy That Increased Our Client's ROI by 287% (Case Study)" (specific results)
- "The 3 Critical ${nicheToUse} Mistakes 90% of ${audience} Make (And Our Proven Fix)" (problem-solution)
- "Behind-The-Scenes: Our Proprietary ${nicheToUse} Process That Outperforms The Industry Standard by 47%" (unique methodology)

WEAK EXAMPLES TO AVOID:
- "Why You Need ${nicheToUse} Services" (too generic, lacks specific value)
- "Benefits of Working With Our ${nicheToUse} Company" (generic, company-centric)
- "${nicheToUse} Tips for Success" (doesn't demonstrate unique expertise)`;
    }
  }
  
  // Enhanced platform-specific guidance with platform-native content strategies
  if (platform) {
    systemPrompt += `\n\nPLATFORM-SPECIFIC STRATEGY FOR ${platform.toUpperCase()}:`;
    
    if (platform.toLowerCase().includes('tiktok')) {
      systemPrompt += `
TikTok requires ideas that:
- Hook viewers in the FIRST 1-2 SECONDS with a provocative statement or visual
- Use pattern interrupts and unexpected twists to maintain attention
- Have clearly defined emotional triggers (curiosity, surprise, validation, controversy)
- Can be executed in clear, rapidly-paced segments under 60 seconds
- Feel authentic and "in-the-moment" rather than overly produced
- Include opportunities for trending sounds, transitions, or formats
- Have potential for user engagement (comments, stitches, duets)

TIKTOK FORMAT EXAMPLES:
- "What they don't tell you about..." (insider revelations)
- "POV: When you discover..." (relatable scenarios)
- "I wasn't going to share this but..." (exclusive information)
- "This ${nicheToUse} hack changed everything..." (transformation)
- "The real reason why..." (myth-busting)`;
    } else if (platform.toLowerCase().includes('instagram')) {
      systemPrompt += `
Instagram Reels requires ideas that:
- Have strong visual appeal and aesthetic consistency with the brand
- Balance entertainment value with educational substance
- Include visually striking transitions or reveal moments
- Can work well with text overlays for key points
- Are polished but still authentic (higher production value than TikTok)
- Incorporate trending audio where appropriate but not at expense of brand voice
- Have save-worthy information that users will return to

INSTAGRAM FORMAT EXAMPLES:
- "3 ${nicheToUse} secrets I wish I knew sooner..." (valuable insights)
- "This before & after ${nicheToUse} transformation..." (visual impact)
- "Watch how we created this..." (process reveal)
- "Did you know this about ${nicheToUse}?" (educational surprise)
- "Save this ${nicheToUse} guide for later..." (valuable resource)`;
    } else if (platform.toLowerCase().includes('youtube')) {
      systemPrompt += `
YouTube Shorts requires ideas that:
- Combine entertainment with substantial educational value
- Use searchable concepts that align with what users actively seek information on
- Have clear, direct titles that promise specific value
- Build channel authority and potentially drive viewers to longer content
- Include strong calls-to-action for subscribing or watching more
- Can stand alone as valuable content but hint at deeper expertise
- Appeal to both algorithm discovery and direct search

YOUTUBE FORMAT EXAMPLES:
- "This is why your ${nicheToUse} isn't working..." (problem identification)
- "The truth about ${nicheToUse} that experts hide..." (contrarian insight)
- "I tested every ${nicheToUse} technique so you don't have to..." (experimentation)
- "One ${nicheToUse} change that improves results by X%..." (specific improvement)
- "The only ${nicheToUse} hack that actually works..." (definitive solution)`;
    }
  }
  
  // Add style profile information with concrete applications and examples
  if (styleProfile) {
    systemPrompt += `\n\nSTYLE PROFILE: "${styleProfile.name}": ${styleProfile.description}
Tone: ${styleProfile.tone}

Apply this style to every idea by:
- Using language, pacing and concepts that embody this specific tone
- Creating scenarios and hooks that naturally align with this style
- Developing concepts where this style creates maximum viewer engagement and differentiates content
- Ensuring creative flourishes match this style's aesthetic and emotional qualities

Content created with this style should feel distinctively different from generic content and immediately recognizable as fitting this brand voice.`;
  }

  // Add content style and personality with specific applications and examples
  if (contentStyle) {
    systemPrompt += `\n\nCONTENT STYLE: ${contentStyle}
Apply this style by creating ideas that specifically:
- Embody the pacing, energy and aesthetic qualities of the "${contentStyle}" approach
- Use hooks, transitions, and payoffs typical of this specific style
- Align with viewer expectations for "${contentStyle}" content while adding unique twists
- Stand out among other "${contentStyle}" content through distinctive angles`;
  }

  if (contentPersonality) {
    systemPrompt += `\n\nCONTENT PERSONALITY: ${contentPersonality}
Ensure all ideas showcase this personality by:
- Crafting content angles that naturally highlight these personality traits
- Creating scenarios where this personality shines through authentically
- Designing hooks and premises that play to the strengths of this personality type
- Differentiating from others in the ${nicheToUse} space through this unique personality lens`;
  }

  // Enhanced viral content strategy guidance with specific tactics
  systemPrompt += `\n\nADVANCED CONTENT STRATEGY:
1. CREATE ULTRA-SPECIFIC IDEAS with concrete scenarios, examples, and unique hooks
2. IDENTIFY VIEWER PAIN POINTS AND DESIRES that competitors are missing
3. USE PSYCHOLOGICAL TRIGGERS strategically: curiosity gaps, unexpected revelations, identity reinforcement
4. CRAFT "AHA MOMENT" PREMISES where viewers experience a perspective shift
5. DESIGN IDEAS WITH SPECIFIC SHAREABILITY FACTORS (practical value, emotional impact, identity signaling)
6. INCORPORATE "CONTENT GAPS" - address questions in ${nicheToUse} that have high interest but low quality content
7. DEVELOP "CONTENT FRANCHISES" - ideas that could become signature series for this creator/brand
8. FOCUS ON TANGIBLE TRANSFORMATIONS with measurable before/after states
9. CREATE IDEAS THAT NATURALLY INVITE ENGAGEMENT through debate, opinion, or experience sharing

Each idea must be:
- UNIQUELY VALUABLE: Provides genuine utility or insight not easily found elsewhere
- SPECIFICALLY CRAFTED: Tailored precisely for the intersection of this niche, audience, and platform
- CREATIVELY DISTINCTIVE: Uses unexpected angles, formats, or premises to stand out
- STRATEGICALLY SOUND: Designed to achieve clear business/creator goals (authority, engagement, conversion)`;

  // Add eco-brand specific viral tactics if applicable with specific examples
  if (isEcoBrand) {
    systemPrompt += `\n\nECO-FRIENDLY CONTENT STRATEGY:
- Create before/after transformation scenarios showing specific environmental impact metrics
- Design "myth vs. reality" concepts about common sustainability misconceptions
- Develop "behind-the-scenes" ideas revealing sustainable processes with unexpected details
- Create comparative demonstrations showing eco vs. conventional alternatives with measurable differences
- Design educational content that makes complex sustainability concepts simple and actionable

ECO-CONTENT EXAMPLES:
- "We measured the actual environmental impact of our ${nicheToUse} vs. traditional options (the results shocked us)"
- "The unexpected truth about 'eco-friendly' ${nicheToUse} claims - what labels don't tell you"
- "How we transformed our ${nicheToUse} process to reduce waste by X% (behind-the-scenes)"`;
  }

  // Enhanced output format instructions with quality criteria
  systemPrompt += `\n\nOUTPUT INSTRUCTIONS:
1. Generate EXACTLY ${numIdeas} COMPLETELY UNIQUE video ideas (no thematic repetition)
2. Each idea must be SPECIFICALLY TAILORED to ${nicheToUse} and ${audience} - avoid generic templates
3. Include a compelling, platform-appropriate title for each idea (optimized for the viewer psychology of that platform)
4. Assign each idea a relevant content category that indicates the content type and strategy
5. Write a detailed description (4-5 sentences) explaining:
   - The specific premise and hook
   - Why this idea will resonate with the audience
   - How it differentiates from typical content in this space
   - The strategic value and expected outcome
6. Include 3-5 relevant, searchable tags for each idea
7. Format output as valid JSON only, no explanation text

QUALITY CHECK: Before submitting, ensure each idea:
- Has a unique angle not represented in the other ideas
- Contains specific details that couldn't apply to any other niche
- Would genuinely stand out among thousands of similar videos
- Delivers clear value aligned with audience needs and platform behavior`;

  // User prompt construction with enhanced specificity
  let userPrompt = `Create ${numIdeas} highly creative, original, and SPECIFIC video ideas for a ${accountType || 'business'} focused on ${nicheToUse} targeting ${audience || 'their audience'}.`;
  
  if (videoType) {
    userPrompt += ` The videos should be in the ${videoType} format, specifically leveraging the strengths of this format for this niche.`;
  }
  
  if (platform) {
    userPrompt += ` These ideas need to be specifically designed for ${platform}, using native hooks, formats, and engagement patterns that perform well on this platform.`;
  }
  
  if (contentStyle) {
    userPrompt += ` The content style should be "${contentStyle}" - apply this style authentically rather than formulaically.`;
  }
  
  if (contentPersonality) {
    userPrompt += ` The content personality is "${contentPersonality}" - ensure this personality is showcased through the specific angles and approaches.`;
  }
  
  // Add custom ideas as inspiration with improved instructions
  if (customIdeas && customIdeas.trim()) {
    userPrompt += `\n\nHere are some existing ideas for context (create COMPLETELY DIFFERENT concepts, but understand the business from these):
${customIdeas}`;
  }
  
  // Add information about previous ideas to avoid repetition
  if (previousIdeas && previousIdeas.titles && previousIdeas.titles.length > 0) {
    userPrompt += `\n\nDo NOT create ideas similar to these previously created ideas:`;
    for (let i = 0; i < Math.min(previousIdeas.titles.length, 10); i++) {
      userPrompt += `\n- ${previousIdeas.titles[i]}`;
    }
  }
  
  // Request specific eco-friendly content if applicable
  if (isEcoBrand) {
    userPrompt += `\n\nThis is an eco-friendly brand, so focus on sustainability aspects, environmental benefits, and create ideas that educate and inspire viewers about eco-conscious living while highlighting the offerings in an authentic way.`;
  }
  
  // Specify the output format with enhanced example
  userPrompt += `\n\nRespond with EXACTLY ${numIdeas} highly specific, creative, and strategically sound ideas in this JSON format:
  {
    "ideas": [
      {
        "title": "Specific, Compelling Title Optimized for Platform",
        "category": "Content Category/Strategy",
        "description": "Detailed description of the premise, hook, audience value, and strategic purpose. Include specific details that make this idea unique to this niche and audience. Explain why this idea will stand out and drive results.",
        "tags": ["relevant-tag", "niche-specific", "searchable"]
      },
      ...
    ]
  }
  
Remember that each idea must be COMPLETELY UNIQUE with a distinct angle, highly specific to ${nicheToUse} and ${audience}, and optimized for ${platform || 'the platform'}. Generic templates or formulas will not be effective.`;
  
  return { systemPrompt, userPrompt };
}

// Improved parser function with better error handling and recovery
function parseAndValidateIdeas(rawResponse, isEcoBrand) {
  try {
    // Find JSON in the response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('No JSON found in the response');
      // Attempt to extract ideas directly from the text
      return extractIdeasFromText(rawResponse);
    }
    
    const jsonString = jsonMatch[0];
    
    console.log('Extracted JSON string:', jsonString);
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
      
      if (!parsedData.ideas || !Array.isArray(parsedData.ideas)) {
        throw new Error('JSON does not contain ideas array');
      }
      
      return parsedData.ideas.map(cleanIdeaData);
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      return extractIdeasFromText(rawResponse);
    }
  } catch (error) {
    console.error('Error in parseAndValidateIdeas:', error);
    return [];
  }
}

// Helper function to extract ideas from text when JSON parsing fails
function extractIdeasFromText(text) {
  try {
    const ideas = [];
    
    // Look for patterns like "1. Title:" or "#1: Title"
    const titleMatches = text.match(/(?:^|\n)(?:\d+\.|\#\d+:?)\s*([^\n]+)/g);
    
    if (titleMatches && titleMatches.length > 0) {
      titleMatches.slice(0, 5).forEach((match, index) => {
        const title = match.replace(/(?:^|\n)(?:\d+\.|\#\d+:?)\s*/, '').trim();
        
        // Try to find description (everything between this title and the next, or the end)
        const startPos = text.indexOf(match) + match.length;
        const nextTitlePos = index < titleMatches.length - 1 ? 
          text.indexOf(titleMatches[index + 1]) : text.length;
        
        let description = text.substring(startPos, nextTitlePos).trim();
        
        // Remove any category labels
        description = description.replace(/^(?:Category|Type):[^\n]+\n/i, '');
        
        ideas.push({
          title,
          category: "General",
          description: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
          tags: [title.split(' ')[0].toLowerCase(), "video", "content"]
        });
      });
    }
    
    return ideas;
  } catch (error) {
    console.error('Error in extractIdeasFromText:', error);
    return [];
  }
}

// Helper function to clean and validate idea data
function cleanIdeaData(idea) {
  return {
    title: typeof idea.title === 'string' ? idea.title.trim() : 'Untitled Idea',
    category: typeof idea.category === 'string' ? idea.category.trim() : 'General',
    description: typeof idea.description === 'string' ? idea.description.trim() : '',
    tags: Array.isArray(idea.tags) ? 
      idea.tags.map(tag => typeof tag === 'string' ? tag.trim().toLowerCase() : '') : 
      ['content', 'video']
  };
}
