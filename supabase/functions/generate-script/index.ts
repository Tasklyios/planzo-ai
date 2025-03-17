
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standard speaking rate to use throughout the application
const STANDARD_SPEAKING_RATE = 150; // words per minute

// Helper function to detect if content is product-focused
function detectProductFocus(title: string, description: string, category: string): boolean {
  const productTerms = ['product', 'sell', 'selling', 'purchase', 'buy', 'shop', 'store', 'ecommerce', 'e-commerce', 'retail'];
  const combinedText = `${title} ${description} ${category}`.toLowerCase();
  return productTerms.some(term => combinedText.includes(term));
}

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
    const { title, description, contentStyle, hook, targetLength, targetDuration, wordsPerMinute, userId, savedIdea } = await req.json();

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

    // Calculate approximate word count based on duration and standard speaking rate
    let targetWordCount = null;
    let timeRangeDescription = "";
    
    if (targetDuration) {
      // Always use the standard speaking rate, ignore any passed wordsPerMinute
      const [minDuration, maxDuration] = targetDuration.split('-').map(Number);
      const avgDuration = (minDuration + maxDuration) / 2;
      targetWordCount = Math.round(avgDuration * STANDARD_SPEAKING_RATE);
      
      // Create a description of the target length for the prompt
      timeRangeDescription = `${targetDuration} minutes (approximately ${targetWordCount} words at standard speaking rate)`;
      console.log(`Calculated target word count: ${targetWordCount} words`);
    } else if (targetLength) {
      // Map target length to human-readable duration (for backward compatibility)
      const lengthMapping = {
        "15-30": "15-30 seconds",
        "30-60": "30-60 seconds",
        "1-2": "1-2 minutes",
        "2-3": "2-3 minutes",
        "3-5": "3-5 minutes"
      };

      timeRangeDescription = lengthMapping[targetLength as keyof typeof lengthMapping] || "30-60 seconds";
    } else {
      timeRangeDescription = "30-60 seconds";
    }

    // Get the actual title and description to use (from savedIdea or direct input)
    const scriptTitle = savedIdea ? savedIdea.title : title;
    const scriptDescription = savedIdea ? savedIdea.description : description;
    const scriptCategory = savedIdea?.category || "";

    // Get user information to personalize the script generation
    let userProfile = null;
    let accountType = "personal";
    let contentType = null;
    if (userId) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('content_style, content_personality, account_type, content_type')
          .eq('id', userId)
          .maybeSingle();
          
        if (!profileError && profile) {
          userProfile = profile;
          accountType = profile.account_type || "personal";
          contentType = profile.content_type || null;
          console.log("User profile retrieved:", userProfile);
        }
      } catch (error) {
        console.error("Error retrieving user profile:", error);
        // Non-blocking error - continue with generation
      }
    }

    // Detect if this is an ecommerce product-focused content or not
    const isProductFocused = detectProductFocus(scriptTitle, scriptDescription, scriptCategory);
    
    // Simplified system prompt to reduce token usage
    let systemPrompt = `Create a ${timeRangeDescription} script for "${scriptTitle}" that:
- Starts with a hook${hook ? " (provided below)" : ""}
- Uses natural speech
- Includes [action notes] in brackets when needed
- Is concise for social media${targetWordCount ? `\n- Aims for ~${targetWordCount} words` : ''}`;

    // Condense account-specific instructions
    if (accountType === 'ecommerce') {
      systemPrompt += `\n${isProductFocused ? "- Balance education with subtle product references" : "- Focus entirely on providing valuable, educational content"}`;
    } else if (accountType === 'personal') {
      systemPrompt += "\n- Be personal and relatable";
      
      if (contentType === 'talking_head') {
        systemPrompt += "\n- Write for direct camera speech with [action notes]";
      } else if (contentType === 'text_based') {
        systemPrompt += "\n- Format for on-screen text with [TEXT OVERLAY] markers";
      }
    } else if (accountType === 'business') {
      systemPrompt += "\n- Balance professionalism with authenticity";
    }

    // Create a simplified user prompt
    let userPrompt = `Script for: "${scriptTitle}"
${scriptDescription ? `Context: ${scriptDescription}` : ''}`;

    // Add the hook to the prompt if provided
    if (hook) {
      userPrompt += `\nStart with: "${hook}"`;
    }

    // Add category-specific guidance if needed
    if (scriptCategory) {
      userPrompt += `\nCategory: ${scriptCategory}`;
    }

    // Call OpenAI API with gpt-4o-mini model
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
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status} ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Received response from OpenAI');

    const script = data.choices[0].message.content.trim();

    // Return the generated script
    return new Response(
      JSON.stringify({ 
        script, 
        wordCount: script.split(/\s+/).length,
        estimatedDuration: Math.round(script.split(/\s+/).length / STANDARD_SPEAKING_RATE * 10) / 10
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in script generation:', error);
    return new Response(
      JSON.stringify({ error: `Error generating script: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
