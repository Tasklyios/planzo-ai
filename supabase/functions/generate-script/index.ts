
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
    const { 
      title, 
      description, 
      contentStyle, 
      hook, 
      targetLength, 
      targetDuration, 
      wordsPerMinute, 
      userId, 
      savedIdea,
      userScript,
      isImprovement,
      roughScript
    } = await req.json();

    // Validate required fields based on mode
    if (isImprovement) {
      if (!userScript) {
        return new Response(
          JSON.stringify({ error: 'User script is required for improvement' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      if ((!title && !savedIdea) || (!savedIdea && !title)) {
        return new Response(
          JSON.stringify({ error: 'Title or saved idea is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Starting ${isImprovement ? 'script improvement' : 'script generation'} for: ${isImprovement ? 'user script' : (savedIdea ? savedIdea.title : title)}`);

    // Check if the user exists and usage limits
    if (userId) {
      try {
        // Check usage limits using the database function
        const { data: usageLimitCheck, error: usageCheckError } = await supabase.functions.invoke(
          'check-usage-limits',
          { 
            body: { 
              action: 'scripts',
              isImprovement: isImprovement 
            }
          }
        );

        if (usageCheckError) {
          console.error("Usage check error:", usageCheckError);
          return new Response(
            JSON.stringify({ error: `Error checking usage limits: ${usageCheckError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (usageLimitCheck && !usageLimitCheck.canProceed) {
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
      // Parse the duration range and calculate word count more explicitly
      const durationParts = targetDuration.split('-').map(Number);
      
      if (durationParts.length !== 2 || isNaN(durationParts[0]) || isNaN(durationParts[1])) {
        return new Response(
          JSON.stringify({ error: `Invalid target duration format: ${targetDuration}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const minDuration = durationParts[0];
      const maxDuration = durationParts[1];
      
      // Calculate min and max word counts
      const minWordCount = Math.round(minDuration * STANDARD_SPEAKING_RATE);
      const maxWordCount = Math.round(maxDuration * STANDARD_SPEAKING_RATE);
      
      // Use the average for the target
      targetWordCount = Math.round((minWordCount + maxWordCount) / 2);
      
      // Create a description for the prompt
      timeRangeDescription = `${minDuration.toFixed(2)}-${maxDuration.toFixed(2)} minutes (approximately ${minWordCount}-${maxWordCount} words at standard speaking rate)`;
      console.log(`Calculated target word count range: ${minWordCount}-${maxWordCount} words, target: ${targetWordCount}`);
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
    const isProductFocused = !isImprovement && detectProductFocus(scriptTitle, scriptDescription, scriptCategory);
    
    // Expert prompt for viral content creation - less cringy version
    const expertPrompt = `You are an expert scriptwriter who creates authentic, engaging content for social media. Your goal is to write scripts that connect with viewers through genuine value and storytelling, avoiding excessive hype or clickbait. Prioritize authentic communication that builds trust with the audience while still capturing attention in a competitive social media environment.`;
    
    let systemPrompt = "";
    let userPrompt = "";

    if (isImprovement) {
      // System prompt for improving an existing script - less cringy
      systemPrompt = `${expertPrompt}

Your task is to refine the user's script into a more effective and authentic version while preserving the core message.

Guidelines:
- Maintain the original intent and key message
- Make the script conversational and genuine
- Create natural hooks that intrigue viewers without sounding forced
- Include [action notes] in brackets when appropriate
- Focus on value and storytelling rather than hype
- Keep the same approximate length as the original
- Format for the specified content style: ${contentStyle || "engaging"}`;

      // User prompt for improvement
      userPrompt = `Here is my script that needs improvement:

${userScript}

Please refine this script to be more engaging and effective while maintaining an authentic tone and keeping the core message intact.`;

    } else {
      // Simplified system prompt to reduce token usage - less cringy
      systemPrompt = `${expertPrompt}

Create a ${timeRangeDescription} script for "${scriptTitle}" that:
- Starts with a natural introduction${hook ? " (provided below)" : ""}
- Uses conversational language
- Includes [action notes] in brackets when needed
- Is concise for social media
- Focuses on providing value and building genuine connection with viewers`;

      // Add specific word count target instruction if we have calculated one
      if (targetWordCount) {
        systemPrompt += `\n- The script should be approximately ${targetWordCount} words (${timeRangeDescription})`;
      }

      // Condense account-specific instructions
      if (accountType === 'ecommerce') {
        systemPrompt += `\n${isProductFocused ? "- Balance education with subtle product references" : "- Focus entirely on providing valuable, educational content"}`;
      } else if (accountType === 'personal') {
        systemPrompt += "\n- Be personable and authentic";
        
        if (contentType === 'talking_head') {
          systemPrompt += "\n- Write for direct camera speech with [action notes]";
        } else if (contentType === 'text_based') {
          systemPrompt += "\n- Format for on-screen text with [TEXT OVERLAY] markers";
        }
      } else if (accountType === 'business') {
        systemPrompt += "\n- Balance professionalism with authenticity";
      }

      // Create a simplified user prompt
      userPrompt = `Script for: "${scriptTitle}"
${scriptDescription ? `Context: ${scriptDescription}` : ''}`;

      // Add the hook to the prompt if provided
      if (hook) {
        userPrompt += `\nStart with: "${hook}"`;
      }

      // Add category-specific guidance if needed
      if (scriptCategory) {
        userPrompt += `\nCategory: ${scriptCategory}`;
      }

      // If roughScript (from the main generator) is provided, add it to the prompt
      if (roughScript) {
        userPrompt += `\n\nHere's a rough script I've drafted that you should use as a starting point:
${roughScript}

Please build upon this script to make it more professional and engaging while keeping the core ideas.`;
      }
      // If userScript is provided (base script from collapsible), add it to the prompt
      else if (userScript) {
        userPrompt += `\n\nHere's a basic script I've drafted that you should improve and expand upon:
${userScript}

Please refine this script while keeping the core message intact.`;
      }
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
    const actualWordCount = script.split(/\s+/).length;
    
    // Calculate estimated duration from actual word count
    const estimatedDuration = actualWordCount / STANDARD_SPEAKING_RATE;
    
    console.log(`Generated script with ${actualWordCount} words (target was ${targetWordCount || 'not specified'})`);
    console.log(`Estimated duration: ${estimatedDuration.toFixed(2)} minutes`);

    // Return the generated script
    return new Response(
      JSON.stringify({ 
        script, 
        wordCount: actualWordCount,
        estimatedDuration: Math.round(estimatedDuration * 10) / 10,
        targetWordCount: targetWordCount
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
