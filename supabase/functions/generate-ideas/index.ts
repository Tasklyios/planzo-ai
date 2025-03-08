
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

    // Use a more powerful model for better quality ideas
    const model = modelOverride || "gpt-4o-mini"; // Use provided model or default to gpt-4o-mini
    
    console.log('Using model:', model);
    console.log('System prompt:', prompt.systemPrompt);
    console.log('User prompt:', prompt.userPrompt);
    
    const apiRequestBody = {
      model: model,
      messages: [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content: prompt.userPrompt }
      ],
      temperature: 0.85, // Increased for more creativity
      max_tokens: 2000, // Increased for more detailed responses
      top_p: 0.98,
      frequency_penalty: 0.6,
      presence_penalty: 0.6,
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
  
  // Base system prompt with detailed instructions for high-quality idea generation
  let systemPrompt = `You are an expert viral content strategist specializing in creating high-performing video concepts for ${platform || 'social media'}.

Your task is to generate EXCEPTIONALLY CREATIVE and HIGHLY SPECIFIC video ideas for a ${accountType || 'business'} in the ${nicheToUse} niche that targets ${audience || 'their audience'}.`;
  
  // Add account type specific context with detailed instructions
  if (accountType) {
    systemPrompt += `\n\nACCOUNT TYPE DETAILS:`;
    
    if (accountType === 'personal') {
      systemPrompt += `\nThis is a PERSONAL CREATOR account in the ${nicheToUse} niche. 
Focus on authentic, personality-driven content that:
- Showcases the creator's unique expertise and perspective
- Builds a personal connection with ${audience}
- Uses first-person narratives and personal experiences
- Creates opportunities for the creator to demonstrate their unique value and insights`;
    } else if (accountType === 'ecommerce') {
      systemPrompt += `\nThis is an E-COMMERCE BUSINESS selling ${nicheToUse}.
Focus on product-centric content that:
- Demonstrates product benefits in unexpected, attention-grabbing ways
- Shows real results and transformations using the products
- Creates desire through creative demonstrations and use cases
- Differentiates these products from competitors with unique angles`;
    } else if (accountType === 'business') {
      systemPrompt += `\nThis is a ${nicheToUse} BUSINESS targeting ${audience} clients/customers.
Focus on authority-building content that:
- Demonstrates expertise and thought leadership in the ${nicheToUse} space
- Provides exceptional value that positions this business as the go-to solution
- Addresses specific pain points of ${audience}
- Shows proven results and case studies in a compelling way`;
    }
  }
  
  // Enhanced platform-specific guidance
  if (platform) {
    systemPrompt += `\n\nPLATFORM-SPECIFIC STRATEGY FOR ${platform.toUpperCase()}:`;
    
    if (platform === 'TikTok') {
      systemPrompt += `
- Create ideas that hook viewers in the FIRST 2 SECONDS
- Utilize pattern interrupts, unexpected twists, and information gaps
- Incorporate trending audio, transitions, and formats when relevant
- Design content that prompts strong viewer emotional reactions (surprise, curiosity, validation)
- Include "storytime" or multi-part series potential for high-performing ideas
- Focus on concepts that work well with TikTok's informal, authentic aesthetic`;
    } else if (platform === 'Instagram Reels') {
      systemPrompt += `
- Develop visually striking concepts that stand out in a crowded feed
- Create ideas that work well with Instagram's more polished, aspirational aesthetic
- Include concepts with strong visual transitions and reveal moments
- Design content that's both entertaining AND educational for higher reach
- Focus on ideas that showcase personality while maintaining higher production value
- Incorporate opportunities for location tagging and product showcasing`;
    } else if (platform === 'YouTube Shorts') {
      systemPrompt += `
- Create ideas that combine entertainment with substantial value/education
- Design concepts that can lead viewers to longer-form content
- Focus on searchable topics with clear, specific titles
- Include ideas that demonstrate expertise and build channel authority
- Develop concepts that work well with YouTube's recommendation algorithm
- Incorporate highly specific, niche-focused keywords into the content concepts`;
    }
  }
  
  // Add style profile information with concrete applications
  if (styleProfile) {
    systemPrompt += `\n\nSTYLE PROFILE: "${styleProfile.name}": ${styleProfile.description}
Tone: ${styleProfile.tone}

Apply this style to every idea by:
- Using language and concepts that match this specific tone
- Creating scenarios and hooks that align with this style
- Developing concepts where this style creates maximum viewer engagement`;
  }

  // Add content style and personality with specific applications
  if (contentStyle) {
    systemPrompt += `\n\nCONTENT STYLE: ${contentStyle}
Apply this style by creating ideas that specifically demonstrate this approach in action.`;
  }

  if (contentPersonality) {
    systemPrompt += `\n\nCONTENT PERSONALITY: ${contentPersonality}
Ensure all ideas allow this personality to shine through with specific content angles.`;
  }

  // Viral content strategy guidance
  systemPrompt += `\n\nVIRAL CONTENT STRATEGY:
1. Create ULTRA-SPECIFIC ideas (not generic templates) with concrete angles and examples
2. Focus on high-engagement triggers: curiosity gaps, unexpected revelations, emotional resonance
3. Incorporate current social media trends when relevant to the niche
4. Design ideas with built-in shareability factors (controversy, validation, identity, utility)
5. Create hooks that use psychological triggers (curiosity, surprise, validation, fear of missing out)
6. Develop ideas that have a clear "aha moment" or emotional payoff
7. Ensure each idea has a specific, UNIQUE angle (not just templates with the niche plugged in)`;

  // Add eco-brand specific viral tactics if applicable
  if (isEcoBrand) {
    systemPrompt += `\n\nECO-FRIENDLY CONTENT STRATEGY:
- Create before/after transformation videos showing environmental impact
- Design concepts that educate viewers on surprising eco-facts
- Develop "behind-the-scenes" ideas showing sustainable processes
- Create comparative concepts showing eco vs. conventional alternatives
- Design myth-busting content about sustainability misconceptions`;
  }

  // Output format instructions
  systemPrompt += `\n\nOUTPUT INSTRUCTIONS:
1. Generate EXACTLY ${numIdeas} UNIQUE video ideas
2. Each idea must be SPECIFIC to ${nicheToUse} and ${audience}, not a generic template
3. Include a catchy, platform-appropriate title for each idea
4. Assign each idea a relevant category that describes the content type
5. Write a detailed description explaining what makes this idea compelling
6. Include 3-5 relevant tags for each idea
7. Format output as valid JSON only, no explanation text`;

  // User prompt construction
  let userPrompt = `Create ${numIdeas} highly creative and SPECIFIC viral video ideas for a ${accountType || 'business'} focused on ${nicheToUse} targeting ${audience || 'their audience'}.`;
  
  if (videoType) {
    userPrompt += ` The videos should be in the format of ${videoType}.`;
  }
  
  if (platform) {
    userPrompt += ` Optimize these ideas specifically for ${platform} with appropriate hooks and formats.`;
  }
  
  if (contentStyle) {
    userPrompt += ` The content style should be ${contentStyle}.`;
  }
  
  if (contentPersonality) {
    userPrompt += ` The content personality is ${contentPersonality}.`;
  }
  
  // Add custom ideas as inspiration with specific instructions
  if (customIdeas && customIdeas.trim()) {
    userPrompt += `\n\nHere are some custom ideas to use as inspiration (build upon these themes but create completely new concepts):
${customIdeas}`;
  }
  
  // Add information about previous ideas to avoid repetition
  if (previousIdeas && previousIdeas.titles && previousIdeas.titles.length > 0) {
    userPrompt += `\n\nAVOID creating ideas similar to these previously generated ideas:`;
    for (let i = 0; i < Math.min(previousIdeas.titles.length, 10); i++) {
      userPrompt += `\n- ${previousIdeas.titles[i]}`;
    }
  }
  
  // Request specific eco-friendly content if applicable
  if (isEcoBrand) {
    userPrompt += `\n\nThis is an eco-friendly brand, so focus on sustainability aspects, environmental benefits, and create ideas that educate and inspire viewers about eco-conscious living while highlighting the products.`;
  }
  
  // Specify the output format
  userPrompt += `\n\nPlease respond with EXACTLY ${numIdeas} highly specific and creative ideas in this JSON format:
  {
    "ideas": [
      {
        "title": "Specific, Attention-Grabbing Title Here",
        "category": "Content Category",
        "description": "Detailed description of the video idea with specific angles",
        "tags": ["tag1", "tag2", "tag3"]
      },
      ...
    ]
  }`;
  
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
