
// Follow CORS headers setup from previous handlers
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has reached their usage limit
    const userId = session.user.id;
    const actionType = req.url.includes('type=script') ? 'scripts' : 'ideas';
    
    const { data: usageCheck, error: usageError } = await supabaseClient.rpc(
      'check_and_increment_usage',
      { p_user_id: userId, p_action: actionType }
    );

    if (usageError || usageCheck === false) {
      return new Response(
        JSON.stringify({
          error: 'Daily usage limit reached. Please upgrade your plan for more generations.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { type, ...requestData } = await req.json();

    // Create OpenAI API request
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    let prompt = '';
    let systemMessage = '';

    if (type === 'ideas') {
      const { niche, audience, videoType, platform, previousIdeas } = requestData;
      
      systemMessage = 'You are a creative content strategist specializing in viral video ideas.';
      
      prompt = `Generate 5 creative video ideas for ${platform} with the following criteria:
- Niche: ${niche}
- Target Audience: ${audience}
- Video Type: ${videoType}

${previousIdeas ? `Please avoid similar ideas to these previous ones: ${JSON.stringify(previousIdeas)}` : ''}

For each idea, provide:
1. A catchy title (max 60 chars)
2. A brief description explaining the video concept (2-3 sentences)
3. An appropriate category for the content
4. 3-5 relevant tags (without # symbols)

Format the response as a JSON object with an "ideas" array containing objects with title, description, category, and tags fields.`;
    } else if (type === 'script') {
      const { 
        title, 
        description, 
        category, 
        tags, 
        toneOfVoice, 
        duration, 
        additionalNotes,
        hook,
        structure 
      } = requestData;
      
      systemMessage = 'You are an expert video script writer specializing in engaging, high-performing social media content.';
      
      prompt = `Create a script for a video titled "${title}" based on this description: "${description}"
      
Category: ${category || 'No specific category'}
Tags: ${tags ? tags.join(', ') : 'No specific tags'}
Tone of Voice: ${toneOfVoice || 'Conversational'}
Target Duration: ${duration || '60'} seconds
Additional Notes: ${additionalNotes || 'None provided'}
${hook ? `Use this hook at the beginning: "${hook}"` : ''}
${structure ? `Follow this structure: "${structure}"` : ''}

Guidelines:
- For TikTok/Instagram Reels/YouTube Shorts, create vertical video-based content that is 15-60 seconds. For Feed posts, create content that encourages engagement.
- Include [VISUAL_GUIDE] sections with specific instructions for visuals/b-roll/shots/transitions
- Mark key moments with [TIMESTAMP] markers
- Include [HOOK] at the beginning to grab attention in first 3 seconds
- Include [CTA] near the end for viewer engagement
- Make the script conversational and engaging
- For longer videos (>30s), include multiple points/sections
- Format the entire response as a plain text script with line breaks for pauses
- The script should be timed to fit within the target duration`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid request type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openAIData = await openAIResponse.json();
    const responseContent = openAIData.choices[0].message.content;

    // Process the response based on request type
    let formattedResponse;
    if (type === 'ideas') {
      try {
        // Try to parse as JSON first
        formattedResponse = JSON.parse(responseContent);
      } catch (e) {
        // If parsing fails, try to extract JSON part
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          formattedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse OpenAI response as JSON');
        }
      }
    } else if (type === 'script') {
      formattedResponse = {
        script: responseContent
      };
    }

    return new Response(
      JSON.stringify(formattedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
