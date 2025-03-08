
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

    // Enhanced system prompt for the AI
    const systemPrompt = `You are an elite creative script writer for short-form videos who crafts COMPLETELY ORIGINAL scripts that sound like real humans talking.

Your scripts are highly distinctive, conversational, and natural. They are NEVER generic or formulaic.

KEY PRINCIPLES:
1. ORIGINALITY - Create something that feels fresh and unique, never recycled
2. AUTHENTICITY - Write in a genuine, conversational tone with natural speech patterns
3. SPECIFICITY - Include concrete details and examples that make the script vivid
4. ENGAGEMENT - Craft compelling hooks and maintain viewer interest
5. PERSONALITY - Infuse the script with character that fits the creator's style

${userProfile?.account_type ? `You're writing for a ${userProfile.account_type.toUpperCase()} CREATOR who wants to build authentic connections with their audience.` : ''}
${userProfile?.content_style ? `Content style: ${userProfile.content_style}` : ''}
${userProfile?.content_personality ? `Content personality: ${userProfile.content_personality}` : ''}`;

    // Create detailed prompt with strong guidance on authenticity
    const userPrompt = `
Write a completely original, conversational script for a ${timeRange} ${contentStyle || "authentic"} video about: "${scriptTitle}"

${scriptDescription ? `Additional context: ${scriptDescription}` : ''}
${hook ? `Start with this specific hook: "${hook}"` : ''}

ESSENTIAL REQUIREMENTS:
- Write as if a real person is speaking naturally - include pauses, filler words, self-corrections
- Use [brackets] to indicate camera directions, actions, or tone changes
- Create something truly UNIQUE that doesn't follow standard templates
- Include natural dialogue with personality, avoiding formulaic phrases
- Make the script specific to this exact topic, not something that could be used for anything
- Incorporate authentic moments that feel spontaneous (humor, vulnerability, personal observations)
- Avoid marketing-speak or overly polished language
- Format with natural line breaks to indicate speech rhythms

NEVER write a script that:
- Uses generic templates or formulas
- Sounds like a corporate message or sales pitch
- Contains clichéd phrases or predictable structure
- Could apply to multiple topics by just changing a few words

For product videos: Focus on authentic storytelling around specific benefits
For educational content: Use a conversational teaching style with concrete examples
For lifestyle content: Include specific personal details and genuine reactions

The final script should feel completely unique and tailored specifically to this topic.
`;

    // Call OpenAI API with improved parameters for originality
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // Using gpt-4o-mini as specified
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 1.0,  // Higher temperature for more creativity and originality
        max_tokens: 800,   // Adjust based on expected script length
        top_p: 0.95,       // Slightly higher top_p for more diverse outputs
        frequency_penalty: 0.9,  // Higher frequency penalty to reduce repetitive patterns
        presence_penalty: 0.9,   // Higher presence penalty to encourage more novel content
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
    
    // Check for quality and originality
    const qualityCheck = validateScriptQuality(script, scriptTitle);
    if (qualityCheck.issues.length > 0) {
      console.log("Script quality issues detected:", qualityCheck.issues);
      // We'll still return the script but log the issues
    }

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

// Helper function to check script quality and originality
function validateScriptQuality(script, title) {
  const issues = [];
  
  // Check script length
  if (script.length < 200) {
    issues.push("Script is too short");
  }
  
  // Check for common template patterns
  const templatePatterns = [
    /^Hey (guys|everyone|followers)/i,
    /welcome back to my channel/i,
    /don't forget to like and subscribe/i,
    /if you enjoyed this video/i,
    /in today's video/i
  ];
  
  templatePatterns.forEach(pattern => {
    if (pattern.test(script)) {
      issues.push(`Contains generic template pattern: ${pattern}`);
    }
  });
  
  // Check if script contains the title or key concepts
  const titleWords = title.toLowerCase().split(/\s+/).filter(word => word.length > 4);
  let titleWordsFound = 0;
  
  titleWords.forEach(word => {
    if (script.toLowerCase().includes(word)) {
      titleWordsFound++;
    }
  });
  
  if (titleWordsFound < Math.min(2, titleWords.length)) {
    issues.push("Script may not be specific to the requested topic");
  }
  
  // Check for camera directions
  if (!script.includes('[')) {
    issues.push("Missing camera directions or action cues");
  }
  
  return {
    issues,
    score: 10 - issues.length
  };
}
