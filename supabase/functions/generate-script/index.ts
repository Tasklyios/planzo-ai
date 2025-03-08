
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

    // Enhanced examples of good and bad scripts
    const goodExample = `
Example of a GOOD script (authentic, engaging, conversational):

[Looking out window] Ugh, another rainy day in Seattle. That's 14 days straight now. 

[Turning to camera] You know what's weird though? I've actually started to enjoy these rainy mornings.

[Sipping from mug] There's something about the sound of rain hitting the window while I'm wrapped in a blanket with my coffee.

My therapist would probably call this "reframing" but I just call it survival. [Laughs]

What's something you've learned to appreciate that you used to hate? Drop it in the comments!

[Rain sounds intensify]
`;

    const badExample = `
Example of a BAD script (avoid this generic, sales-pitchy style):

Hey everyone! Have you ever faced a challenge while running? I know I have. But wearing the right sunglasses changed everything for me.

When I put on my sunnies, not only did I block out the glare, but I also found my focus. I could see clearly, push through those tough miles, and I felt unstoppable.

Sunnies became my secret weapon. Now I want to hear from you! How have #SunniesForSuccess helped your run? Let's inspire each other! Share your stories in the comments below!
`;

    // Create prompt for script generation with emphasis on authentic tone
    let systemPrompt = `You are an expert scriptwriter for short-form social media videos specialized in creating highly original, authentic, and engaging scripts that sound like real people talking. 
    
Your scripts are NEVER generic or templated - they are unique, distinctive, and tailored specifically to the creator's topic, style, and audience.`;

    // Add account type specific instructions if available
    if (userProfile?.account_type) {
      if (userProfile.account_type === 'personal') {
        systemPrompt += `\n\nYou're writing for a PERSONAL CREATOR who wants to showcase their unique personality and build an authentic connection with their audience. The script should feel natural, conversational, and distinctly personal.`;
      } else if (userProfile.account_type === 'ecommerce') {
        systemPrompt += `\n\nYou're writing for an E-COMMERCE BUSINESS that needs to showcase their products in a way that feels authentic, not salesy. Focus on storytelling around the product and creating genuine customer connection.`;
      } else if (userProfile.account_type === 'business') {
        systemPrompt += `\n\nYou're writing for a BUSINESS that wants to demonstrate authority and expertise while maintaining an approachable, human tone. The script should build trust and position them as leaders in their field.`;
      }
    }

    // Add content style and personality if available
    if (userProfile?.content_style) {
      systemPrompt += `\n\nContent style: ${userProfile.content_style}`;
    }
    
    if (userProfile?.content_personality) {
      systemPrompt += `\n\nContent personality: ${userProfile.content_personality}`;
    }

    // Create user prompt with specific instructions
    let prompt = `
      Write a completely original, highly distinctive script for a ${timeRange} ${contentStyle || "authentic"} video about: "${scriptTitle}".
      
      ${scriptDescription ? `Additional context: ${scriptDescription}` : ''}
      ${hook ? `Start with this hook: "${hook}"` : ''}
      
      THE SCRIPT MUST:
      - Be COMPLETELY ORIGINAL and NOT read like a template or generic content
      - Sound like a real person talking naturally, with personality and imperfections
      - Include natural speech patterns (pauses, filler words, self-corrections) in [brackets]
      - Use conversational language that feels authentic
      - Avoid clichés and generic motivational language
      - Include specific details that make the content unique and believable
      - Feel like something a friend would say, not a corporate message
      - Include moments of authenticity (humor, vulnerability, specific experiences)
      - Sound nothing like a sales pitch unless explicitly requested
      - Format script with natural breaks for pacing and emphasis
      - Include specific, concrete examples rather than generic statements
      - Use a unique angle or perspective that makes this script different from others on the same topic
      
      ${goodExample}
      
      DO NOT write a script like this:
      ${badExample}
      
      If this is a product video, focus on authentic storytelling around the product, not generic benefits.
      For educational content, use a teaching style that's casual and relatable.
      
      The final script should be formatted with natural line breaks to indicate pauses and camera directions in [brackets].
    `;

    // Call OpenAI API with improved parameters for more original content
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // Using more powerful model for better originality
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,  // Higher temperature for more creativity and originality
        max_tokens: 800,   // Adjust based on expected script length
        top_p: 0.95,       // Slightly higher top_p for more diverse outputs
        frequency_penalty: 0.8,  // Higher frequency penalty to reduce repetitive patterns
        presence_penalty: 0.8,   // Higher presence penalty to encourage more novel content
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
