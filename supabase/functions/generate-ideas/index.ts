
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
    const prompt = constructPrompt({
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

    // Use a more efficient model and optimize parameters for faster generation
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
      temperature: isEcoBrand ? 0.7 : 0.8, // Slightly more creative for eco brands
      max_tokens: 1500,
      top_p: 0.95,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
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
      // If less than 5 ideas were generated, pad with generic ones up to 5
      // BUT make them relevant to the niche/audience and account type
      const nicheLabel = getNicheLabel(accountType, niche);
      const audienceTarget = audience || "your target audience";
      
      const genericIdeas = [
        {
          title: `${nicheLabel} Quick Demo`,
          category: "Product Showcase",
          description: `A brief demonstration highlighting key features of your ${nicheLabel} offering for ${audienceTarget}.`,
          tags: ["product", "demo", "features"]
        },
        {
          title: `${audienceTarget} Testimonial`,
          category: "Social Proof",
          description: `Share positive feedback from a satisfied ${audienceTarget} customer about your ${nicheLabel} content.`,
          tags: ["testimonial", "review", "customer"]
        },
        {
          title: `Behind the Scenes: ${nicheLabel}`,
          category: "Brand Story",
          description: `Show how your ${nicheLabel} content is created specifically for ${audienceTarget}.`,
          tags: ["behindthescenes", "process", "team"]
        },
        {
          title: `How-To: ${nicheLabel} Guide`,
          category: "Educational",
          description: `Step-by-step guide showing ${audienceTarget} how to get the most value from your ${nicheLabel} content.`,
          tags: ["tutorial", "howto", "guide"]
        },
        {
          title: `${nicheLabel} vs Alternatives`,
          category: "Educational",
          description: `Compare your ${nicheLabel} approach with alternatives to show its unique advantages for ${audienceTarget}.`,
          tags: ["comparison", "versus", "better"]
        }
      ];
      
      while (ideas.length < 5) {
        ideas.push(genericIdeas[ideas.length % genericIdeas.length]);
      }
      
      console.log('Padded ideas to reach 5');
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
            accountType
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

// Helper function to get a label for the niche based on account type
function getNicheLabel(accountType, niche) {
  if (accountType === 'ecommerce') {
    return `${niche} Product`;
  } else if (accountType === 'business') {
    return `${niche} Business`;
  } else {
    return niche; // For personal accounts or undefined account types
  }
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

// Helper function to construct the prompt
function constructPrompt({ 
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
  // Base system prompt
  let systemPrompt = `You are a viral video idea generator specializing in creating engaging, attention-grabbing content ideas specifically for ${accountType || 'business'} accounts. Your goal is to help content creators make videos that will perform well on ${platform || 'social media'}.`;
  
  // Add account type specific context
  if (accountType) {
    systemPrompt += `\n\nACCOUNT TYPE: ${accountType}. `;
    
    if (accountType === 'personal') {
      systemPrompt += `Generate ideas for a personal creator in the ${niche} niche targeting ${audience}.`;
    } else if (accountType === 'ecommerce') {
      systemPrompt += `Generate ideas for an e-commerce business selling products in the ${niche} category targeting ${audience} customers.`;
    } else if (accountType === 'business') {
      systemPrompt += `Generate ideas for a ${niche} business targeting ${audience} clients/customers.`;
    }
  }
  
  // Add eco-brand specific instructions if applicable
  if (isEcoBrand) {
    systemPrompt += `\n\nSPECIAL INSTRUCTIONS: You are generating ideas for an eco-friendly brand. Focus on creating viral-worthy content that highlights sustainability, environmental benefits, and ethical aspects of the products. Include ideas that use trending eco-hashtags, sustainability challenges, and impactful environmental messaging that resonates with eco-conscious consumers.`;
  }

  // Add style profile information if available
  if (styleProfile) {
    systemPrompt += `\n\nSTYLE PROFILE: The user has a style profile named "${styleProfile.name}": ${styleProfile.description}. 
    The tone should be: ${styleProfile.tone}.`;
    // Removed references to topics and avoidTopics
  }

  // Add content style and personality if available
  if (contentStyle) {
    systemPrompt += `\n\nCONTENT STYLE: ${contentStyle}`;
  }

  if (contentPersonality) {
    systemPrompt += `\n\nCONTENT PERSONALITY: ${contentPersonality}`;
  }

  systemPrompt += `\n\nRules for generating ideas:
1. Focus on short-form video ideas that are likely to go viral for ${platform || 'social media'}
2. Make sure ideas are specific enough to guide content creation
3. Generate distinctive ideas that don't overlap too much
4. Each idea should include a clear hook to grab attention in the first few seconds
5. Format each idea with a catchy title, a category, and a brief description
6. ALWAYS output only valid JSON in the exact format requested
7. ALWAYS generate EXACTLY ${numIdeas} ideas, no more, no less`;

  // Add platform-specific guidance
  if (platform === 'TikTok') {
    systemPrompt += `\n\nFor TikTok: Focus on trends, hooks that grab attention in the first 3 seconds, and content that encourages engagement through comments, shares, or user participation.`;
  } else if (platform === 'Instagram Reels') {
    systemPrompt += `\n\nFor Instagram Reels: Focus on visually appealing content, aesthetic presentation, lifestyle elements, and product showcases that look polished and professional.`;
  } else if (platform === 'YouTube Shorts') {
    systemPrompt += `\n\nFor YouTube Shorts: Focus on informative, educational, or highly entertaining content that provides value and encourages channel subscription.`;
  }
  
  // Add eco-brand specific viral tactics
  if (isEcoBrand) {
    systemPrompt += `\n\nViral tactics for eco brands:
1. Before/after transformation videos showing environmental impact
2. Shocking statistics or facts presented visually
3. "Did you know" sustainability facts that surprise viewers
4. Behind-the-scenes of sustainable production processes
5. Quick product demos highlighting eco-benefits
6. Sustainable life hacks using the products
7. Environmental impact comparisons (your product vs conventional)`;
  }

  // User prompt construction
  let userPrompt = `Please generate EXACTLY ${numIdeas} unique video ideas for a ${niche} ${accountType || 'business'} targeting ${audience}.`;
  
  if (videoType) {
    userPrompt += ` The videos should be in the format of ${videoType}.`;
  }
  
  if (contentStyle) {
    userPrompt += ` The content style should be ${contentStyle}.`;
  }
  
  if (contentPersonality) {
    userPrompt += ` The content personality is ${contentPersonality}.`;
  }
  
  if (customIdeas && customIdeas.trim()) {
    userPrompt += `\n\nHere are some custom ideas to inspire you (but don't copy them directly):\n${customIdeas}`;
  }
  
  // Add information about previous ideas to avoid repetition
  if (previousIdeas && previousIdeas.titles && previousIdeas.titles.length > 0) {
    userPrompt += `\n\nPlease do NOT repeat or closely match these previously generated ideas:`;
    for (let i = 0; i < Math.min(previousIdeas.titles.length, 10); i++) {
      userPrompt += `\n- ${previousIdeas.titles[i]}`;
    }
  }
  
  // Request specific eco-friendly content if applicable
  if (isEcoBrand) {
    userPrompt += `\n\nThis is an eco-friendly brand, so focus on sustainability aspects, environmental benefits, and create ideas that educate and inspire viewers about eco-conscious living while highlighting the products.`;
  }
  
  // Specify the output format
  userPrompt += `\n\nPlease respond with EXACTLY ${numIdeas} ideas in this JSON format without any explanations or other text:
  {
    "ideas": [
      {
        "title": "Catchy Title Here",
        "category": "Category Name Here",
        "description": "Brief description of the video idea here",
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
