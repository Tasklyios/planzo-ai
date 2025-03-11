
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

    // Get user information to personalize the script generation
    let userProfile = null;
    if (userId) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('content_style, content_personality, account_type')
          .eq('id', userId)
          .maybeSingle();
          
        if (!profileError && profile) {
          userProfile = profile;
          console.log("User profile retrieved:", userProfile);
        }
      } catch (error) {
        console.error("Error retrieving user profile:", error);
        // Non-blocking error - continue with generation
      }
    }

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

    // For ecommerce accounts, add special instructions
    if (userProfile?.account_type === 'ecommerce') {
      // Check if the idea description or title contains any product keywords
      const productKeywords = [
        'product', 'our', 'we sell', 'buy', 'purchase', 'shop', 'item', 'merchandise',
        'collection', 'line', 'brand', 'stock', 'deal', 'discount', 'promo', 'promotion',
        'limited edition', 'exclusive', 'new release', 'launch', 'introducing', 'featuring',
        'showcase', 'try', 'get yours', 'shipping', 'order', 'available', 'sold'
      ];
      
      const mentionsProducts = productKeywords.some(keyword => 
        scriptTitle.toLowerCase().includes(keyword) || 
        (scriptDescription && scriptDescription.toLowerCase().includes(keyword))
      );
      
      if (!mentionsProducts) {
        systemPrompt += `

CRITICAL FOR ECOMMERCE CONTENT:
- This is a VALUE-FIRST video that should NOT mention specific products
- Focus 100% on providing valuable, educational content about ${scriptTitle}
- Position as an authority in the industry through expertise, not selling
- Build trust by sharing genuine insights without any product promotion
- Do NOT include phrases like "our product", "we sell", or any selling language
- Treat this content as if you were an independent expert educator, not a brand`;
      } else {
        systemPrompt += `

FOR PRODUCT-RELATED CONTENT:
- Prioritize education and value over direct selling
- When mentioning products, focus on how they solve specific problems
- Balance product mentions with substantial educational content (at least 70% education)
- Maintain an authentic, helpful tone throughout
- Avoid pushy sales language and instead focus on genuine benefits
- Talk about products as solutions to specific problems`;
      }
    }

    systemPrompt += `

${userProfile?.content_style ? `CONTENT STYLE: ${userProfile.content_style}` : contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${userProfile?.content_personality ? `PERSONALITY: ${userProfile.content_personality}` : ''}`;

    // Create a detailed user prompt
    const userPrompt = `Write a natural, engaging script for a ${timeRange} video titled: "${scriptTitle}"

${scriptDescription ? `TOPIC CONTEXT: ${scriptDescription}` : ''}
${hook ? `START WITH THIS HOOK: "${hook}"` : ''}

The script must:
1. Sound like authentic human speech with natural conversational flow
2. Provide specific value about THIS EXACT TOPIC (not generic advice)
3. Have a clear beginning, middle, and end
4. Include [camera directions] or [action notes] in brackets where needed
5. Feel like a real person talking, not a generic marketing video

Format with natural line breaks to indicate speaking rhythm. Make it sound like you're having a genuine conversation with the viewer.`;

    // Call OpenAI API
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
        top_p: 1
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
