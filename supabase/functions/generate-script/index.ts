
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // OpenAI credentials
  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get request parameters
    const { title, description, contentStyle, hook, targetLength, userId, savedIdea } = await req.json();

    // Validate required fields
    if ((!title && !savedIdea) || (!savedIdea && !title)) {
      return new Response(
        JSON.stringify({ error: 'Title or saved idea is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting script generation for: ${savedIdea ? savedIdea.title : title}`);

    // Check if the user exists and usage limits
    if (userId) {
      try {
        // Check usage limits using the database function
        const { data: usageLimitCheck, error: usageCheckError } = await supabase.rpc(
          'check_and_increment_usage',
          { p_user_id: userId, p_action: 'scripts' }
        );

        if (usageCheckError) {
          console.error("Usage check error:", usageCheckError);
          return new Response(
            JSON.stringify({ error: `Error checking usage limits: ${usageCheckError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (usageLimitCheck === false) {
          console.error("Usage limit reached");
          return new Response(
            JSON.stringify({ error: "Daily script generation limit reached" }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error("Error checking user or usage limits:", error);
        return new Response(
          JSON.stringify({ error: `Error checking user or usage limits: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Map target length to human-readable duration
    const lengthMapping = {
      "15-30": "15-30 seconds",
      "30-60": "30-60 seconds",
      "1-2": "1-2 minutes",
      "2-3": "2-3 minutes",
      "3-5": "3-5 minutes"
    };

    const timeRange = lengthMapping[targetLength as keyof typeof lengthMapping] || "30-60 seconds";

    // Get the actual title and description to use (from savedIdea or direct input)
    const scriptTitle = savedIdea ? savedIdea.title : title;
    const scriptDescription = savedIdea ? savedIdea.description : description;
    const scriptCategory = savedIdea?.category || "";

    // Get user information to personalize the script generation
    let userProfile = null;
    let accountType = "personal";
    if (userId) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('content_style, content_personality, account_type')
          .eq('id', userId)
          .maybeSingle();
          
        if (!profileError && profile) {
          userProfile = profile;
          accountType = profile.account_type || "personal";
          console.log("User profile retrieved:", userProfile);
        }
      } catch (error) {
        console.error("Error retrieving user profile:", error);
        // Non-blocking error - continue with generation
      }
    }

    // Detect if this is an ecommerce product-focused content or not
    const isProductFocused = detectProductFocus(scriptTitle, scriptDescription, scriptCategory);
    
    // Create a focused system prompt for script writing based on account type
    let systemPrompt = `You are a master script writer specializing in creating engaging content for ${userProfile?.account_type || 'content creators'}.

Your goal is to write a conversational, authentic script that:

1. Sounds exactly like natural human speech (include filler words, pauses, self-corrections)
2. Delivers valuable, specific information on the exact topic
3. Uses a clear narrative structure with proper flow 
4. Includes [directional notes] or [action cues] in brackets
5. Matches the requested content style and personality
6. Is optimized for the specified length: ${timeRange}

IMPORTANT GUIDELINES:
- Write in a CONVERSATIONAL tone as if speaking to a friend
- Do NOT use corporate language or generic templates
- Include natural speaking patterns (um, like, you know, etc. in moderation)
- Add personality and originality to make the script unique
- Write with line breaks to indicate speaking rhythm`;

    // Tailor the script based on account type and if it's for an ecommerce product
    if (accountType === 'ecommerce') {
      // Check if this is a "pure value" idea (non-product)
      if (!isProductFocused) {
        systemPrompt += `

CRITICAL FOR VALUE-FIRST ECOMMERCE CONTENT:
- This script is for PURE VALUE CONTENT that should NOT mention any products
- Focus 100% on providing valuable, educational content about ${scriptTitle}
- Avoid ANY selling language or product references
- Do NOT include phrases like "our product", "we sell", "check out", etc.
- Position the content as educational expertise, not selling
- Write as if you are an independent expert educator, not a brand
- The goal is to build trust and authority through genuine value
- ZERO product mentions, ZERO brand mentions, ZERO selling language`;
      } else {
        systemPrompt += `

FOR PRODUCT-RELATED ECOMMERCE CONTENT:
- Balance education (80%) with subtle product references (20%)
- Focus primarily on solving audience problems and providing value
- When mentioning products, focus on solutions not features
- Keep product mentions natural and integrated into value content
- Avoid pushy sales language - be helpful and solution-oriented
- Never sound like you're "selling" - maintain an authentic, helpful tone`;
      }
    } else if (accountType === 'personal') {
      systemPrompt += `

FOR PERSONAL CREATOR CONTENT:
- Focus on authentic storytelling and connecting with the audience
- Be personal, vulnerable and relatable while maintaining expertise
- Share genuine insights, experiences, and lessons learned
- Use stories to illustrate points rather than just facts
- Create content that feels uniquely yours rather than generic`;
    } else if (accountType === 'business') {
      systemPrompt += `

FOR BUSINESS CONTENT:
- Balance professionalism with authentic, human connection
- Focus on building trust, authority, and credibility
- Include specific examples, case studies, and evidence
- Maintain a consistent brand voice while being conversational
- Position the business as a helpful guide solving real problems`;
    }

    systemPrompt += `

${userProfile?.content_style ? `CONTENT STYLE: ${userProfile.content_style}` : contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${userProfile?.content_personality ? `PERSONALITY: ${userProfile.content_personality}` : ''}`;

    // Create a detailed user prompt with specific guides based on content type
    let userPrompt = `Write a natural, engaging script for a ${timeRange} video titled: "${scriptTitle}"

${scriptDescription ? `TOPIC CONTEXT: ${scriptDescription}` : ''}
${hook ? `START WITH THIS HOOK: "${hook}"` : ''}`;

    // Add content category-specific guidance
    if (scriptCategory) {
      userPrompt += `\nCONTENT CATEGORY: ${scriptCategory}`;
      
      // Add specific guidance based on content category
      if (scriptCategory.toLowerCase().includes("myth") || scriptCategory.toLowerCase().includes("bust")) {
        userPrompt += `
For this myth-busting content:
- Start with a common misconception that many believe
- Build tension around why this myth is so prevalent
- Use authoritative but friendly tone when presenting the truth
- Include specific evidence or examples that disprove the myth
- End with actionable advice based on the correct information`;
      } 
      else if (scriptCategory.toLowerCase().includes("behind") || scriptCategory.toLowerCase().includes("scenes")) {
        userPrompt += `
For this behind-the-scenes content:
- Start by building curiosity about what people don't normally see
- Use lots of specific details that create vivid imagery
- Share genuine challenges and how they were overcome
- Include moments of vulnerability or authenticity
- End by connecting the behind-the-scenes reality to a broader lesson`;
      }
      else if (scriptCategory.toLowerCase().includes("data") || scriptCategory.toLowerCase().includes("analysis")) {
        userPrompt += `
For this data-driven content:
- Start with an intriguing finding or pattern that hooks attention
- Explain your methodology briefly but clearly
- Focus on surprising insights rather than just listing statistics
- Humanize the data by connecting it to real-world implications
- End with actionable conclusions based on what the data reveals`;
      }
      else if (scriptCategory.toLowerCase().includes("story") || scriptCategory.toLowerCase().includes("personal")) {
        userPrompt += `
For this storytelling content:
- Start in the middle of action or with a compelling question
- Include sensory details and emotional moments
- Create a clear narrative arc with tension and resolution
- Use dialogue or internal thoughts to make the story dynamic
- End by connecting the story to a meaningful lesson or takeaway`;
      }
      else if (scriptCategory.toLowerCase().includes("review") || scriptCategory.toLowerCase().includes("guide")) {
        userPrompt += `
For this review/guide content:
- Start by establishing your credibility and experience
- Focus on specific, detailed observations rather than general statements
- Balance positives and negatives for authenticity
- Include practical examples of when/how/why something works
- End with clear recommendations or next steps for the viewer`;
      }
    }

    // Add final guidelines for all scripts
    userPrompt += `

The script must:
1. Sound like authentic human speech with natural conversational flow
2. Provide specific value about THIS EXACT TOPIC (not generic advice)
3. Have a clear beginning, middle, and end
4. Include [camera directions] or [action notes] in brackets where needed
5. Feel like a real person talking, not a generic marketing video

Format with natural line breaks to indicate speaking rhythm. Make it sound like you're having a genuine conversation with the viewer.`;

    // Call OpenAI API with creative parameters
    console.log('Calling OpenAI API for script generation');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 800,
        top_p: 1,
        presence_penalty: 0.6,
        frequency_penalty: 0.6
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Error from OpenAI API: ${response.status} ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAiData = await response.json();

    if (!openAiData.choices || openAiData.choices.length === 0 || !openAiData.choices[0].message) {
      console.error('Invalid response from OpenAI:', openAiData);
      return new Response(
        JSON.stringify({ error: 'Received an invalid response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const script = openAiData.choices[0].message.content.trim();
    
    console.log('Script generated successfully');

    // Return the script
    return new Response(
      JSON.stringify({ script }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-script function:', error);
    return new Response(
      JSON.stringify({ error: `Error generating script: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to detect if content is product-focused
function detectProductFocus(title: string, description: string, category: string): boolean {
  const combinedText = (title + ' ' + description + ' ' + category).toLowerCase();
  
  // Product-focused categories
  const productCategories = [
    'product', 'review', 'unboxing', 'showcase', 'demo', 'tutorial', 
    'how-to', 'guide', 'comparison', 'versus', 'vs', 'buyer'
  ];
  
  // Product-related phrases
  const productPhrases = [
    'product', 'item', 'gear', 'equipment', 'device', 'tool',
    'buy', 'purchase', 'shop', 'sale', 'deal', 'offer',
    'our', 'we sell', 'collection', 'line', 'model', 'brand',
    'review', 'unbox', 'test', 'try out', 'check out'
  ];
  
  // Check for product categories
  const hasProductCategory = productCategories.some(cat => 
    category.toLowerCase().includes(cat)
  );
  
  // Check for product phrases in title or description
  const hasProductPhrases = productPhrases.some(phrase => 
    combinedText.includes(phrase)
  );
  
  return hasProductCategory || hasProductPhrases;
}
