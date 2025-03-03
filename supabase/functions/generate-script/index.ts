
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.28.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const openAIKey = Deno.env.get('OPENAI_API_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({
  apiKey: openAIKey,
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if request is from allowed domains
  try {
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
        
        console.log("Usage limit check passed");
      } catch (error) {
        console.error('Error checking usage limits:', error);
        return new Response(
          JSON.stringify({ error: error.message || 'Error checking usage limits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Map target length to actual time ranges for prompt
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

    // Create prompt for script generation with emphasis on conversational, friendly tone
    let prompt = `
      Write a short, engaging script for a ${timeRange} ${contentStyle} video about: "${scriptTitle}".
      
      ${scriptDescription ? `Additional context: ${scriptDescription}` : ''}
      ${hook ? `Start with this hook: "${hook}"` : ''}
      
      The script should be:
      - Concise and direct, optimized for ${timeRange} of content
      - Written in a conversational, natural-sounding voice
      - Engaging from the very first line to capture attention quickly
      - Written in a first-person perspective (using "I", "we", etc.)
      - Formatted as plain text (no timestamps, scene directions, or camera angles)
      - Easy to read aloud without sounding scripted
      - Include transitions between points for a smooth flow
      
      The script should NOT:
      - Include any formatting like [INTRO], [HOOK], etc.
      - Include any placeholder text or timestamps
      - Sound robotic or overly formal
      
      For short-form content (under 60 seconds):
      - Focus on ONE main point or idea only
      - Get to the point immediately
      - Use short, punchy sentences
      - Include a clear call-to-action at the end
      
      The script should sound completely natural when read aloud - like something someone would actually say in a conversation, not like something written.
    `;

    console.log("Sending request to OpenAI");

    // Call OpenAI API with more specific system role
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert script writer for short-form social media videos. Write concise, engaging scripts that sound natural when spoken. Focus on conversational tone and getting to the point quickly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
    });

    const scriptContent = completion.choices[0]?.message?.content || "";
    
    console.log("Script generated successfully");

    // Return the generated script
    return new Response(
      JSON.stringify({ script: scriptContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating script:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
