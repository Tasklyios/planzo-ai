
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.29.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key is missing');
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are missing');
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const requestBody = await req.json();
    const { title, description, contentStyle, hook, targetLength, userId, savedIdea } = requestBody;

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user exists if userId is provided
    if (userId) {
      // Verify user has not exceeded their daily script generation limit
      try {
        const { data: canGenerate, error: limitCheckError } = await supabase.rpc(
          'check_and_increment_usage',
          { feature_name: 'scripts' }
        );

        if (limitCheckError) {
          throw new Error(`Error checking usage limits: ${limitCheckError.message}`);
        }

        if (!canGenerate) {
          return new Response(
            JSON.stringify({ error: 'Daily script generation limit reached. Upgrade your plan for more scripts.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error('Error checking usage limits:', error);
        return new Response(
          JSON.stringify({ error: 'Error checking usage limits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Generating script for title: ${title}`);

    // Create prompt for script generation with emphasis on conversational, friendly tone
    let prompt = `
      Generate a video script for the following title and description:
      
      TITLE: ${title}
      DESCRIPTION: ${description || "N/A"}
      
      ${hook ? `HOOK TO USE AT THE START: ${hook}` : ""}
      
      ${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ""}
      
      TARGET VIDEO LENGTH: ${targetLength || "3-5"} minutes
      
      IMPORTANT:
      - Write the script in an extremely conversational tone, like a friend casually talking to another friend.
      - Use casual language, contractions, filler words (like "um", "you know", "actually"), and natural pauses.
      - Include informal transitions between topics.
      - Avoid formal language or "presenter voice" entirely.
      - Include natural speech patterns, brief tangents, and self-corrections occasionally.
      - Use simple words and short sentences, as if speaking off the cuff.
      - Maintain a warm, authentic tone throughout.
      - Don't be afraid to use slang (where appropriate) and casual expressions.
      - Avoid perfectionism - real people don't speak in perfectly structured paragraphs.
      - Adjust the script length to fit the target video duration of ${targetLength || "3-5"} minutes.
      
      The script should sound completely natural when read aloud - like something someone would actually say in a conversation, not like something written.
    `;

    // Call OpenAI API with more specific system role
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You write extremely conversational, authentic-sounding video scripts that sound exactly like how a real person talks to their friend. You don't sound like a professional presenter or educator - you write scripts that sound like genuine, unscripted conversation. You include natural speech patterns, casual language, brief tangents, and self-corrections. Your scripts never sound stiff or formal." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8, // Slightly higher temperature for more natural variations
    });

    const scriptContent = completion.choices[0]?.message?.content || "";

    // Return the generated script
    return new Response(
      JSON.stringify({ script: scriptContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
