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
    
    // Updated system prompt to match Planzo AI's personality and expertise
    let systemPrompt = `You are Planzo AI, a specialist in creating viral-worthy scripts for social media videos. You excel at crafting engaging scripts for platforms like TikTok, YouTube Shorts, and Instagram Reels.

ONLY output the script text with no introduction or conclusion. 
DO NOT prefix with phrases like "Here's a script" or "Script for". 
START DIRECTLY with the script content.

Create a ${timeRange} script about "${scriptTitle}" with these requirements:
- Start with an attention-grabbing hook
- Use natural human speech with conversational fillers
- Be specific and value-focused
- Include [action notes] in brackets when needed
- Be concise and punchy for social media`;

    // Tailor the script based on account type and if it's for an ecommerce product
    if (accountType === 'ecommerce') {
      // Check if this is a "pure value" idea (non-product)
      if (!isProductFocused) {
        systemPrompt += `
CRITICAL FOR VALUE-FIRST ECOMMERCE CONTENT:
- Focus 100% on providing valuable, educational content 
- Avoid ANY selling language or product references
- Do NOT include phrases like "our product", "we sell", "check out", etc.
- Write as if you are an independent expert educator, not a brand
`;
      } else {
        systemPrompt += `
FOR PRODUCT-RELATED ECOMMERCE CONTENT:
- Balance education (80%) with subtle product references (20%)
- Focus primarily on solving audience problems and providing value
- Keep product mentions natural and integrated
`;
      }
    } else if (accountType === 'personal') {
      systemPrompt += `
FOR PERSONAL CREATOR CONTENT:
- Be personal, vulnerable and relatable
- Share genuine insights and experiences
- Use stories to illustrate points rather than just facts
`;
    } else if (accountType === 'business') {
      systemPrompt += `
FOR BUSINESS CONTENT:
- Balance professionalism with authentic connection
- Focus on building trust and credibility
- Include specific examples and evidence
`;
    }

    systemPrompt += `
${userProfile?.content_style ? `CONTENT STYLE: ${userProfile.content_style}` : contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${userProfile?.content_personality ? `PERSONALITY: ${userProfile.content_personality}` : ''}`;

    // Create a detailed user prompt
    let userPrompt = `Write a punchy, engaging script for a ${timeRange} video titled: "${scriptTitle}"

${scriptDescription ? `TOPIC CONTEXT: ${scriptDescription}` : ''}
${hook ? `START WITH THIS HOOK: "${hook}"` : ''}`;

    // Add content category-specific guidance
    if (scriptCategory) {
      userPrompt += `\nCONTENT CATEGORY: ${scriptCategory}`;
      
      // Add specific guidance based on content category
      if (scriptCategory.toLowerCase().includes("myth") || scriptCategory.toLowerCase().includes("bust")) {
        userPrompt += `
For this myth-busting content:
- Start with a common misconception
- Build tension around why this myth is prevalent
- Present the truth with evidence
- End with actionable advice`;
      } 
      else if (scriptCategory.toLowerCase().includes("behind") || scriptCategory.toLowerCase().includes("scenes")) {
        userPrompt += `
For this behind-the-scenes content:
- Start by building curiosity
- Use specific details that create vivid imagery
- Share genuine challenges and solutions
- Include moments of authenticity`;
      }
    }

    // Add final guidelines for all scripts
    userPrompt += `

Make the script sound like authentic human speech with natural flow.
Format with line breaks to indicate speaking rhythm.
Include [camera directions] or [action notes] in brackets where needed.
BE CONCISE - focus on high-impact statements and specific value.`;

    // Call OpenAI API with updated Planzo AI personality
    console.log('Calling OpenAI API for script generation with Planzo AI personality');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
function detectProductFocus(title, description, category) {
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
