
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    // Properly get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header found' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create a Supabase client with the authorization header
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user session - this will use the provided auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Authenticated user ID:', user.id);

    // Parse request body
    const { topic, audience, details } = await req.json();
    console.log('Generating hooks for:', { topic, audience, details });

    if (!topic || !audience) {
      throw new Error('Topic and audience are required');
    }

    // Prepare the prompt for OpenAI
    const prompt = `
      Create 8 attention-grabbing hooks for a ${topic} video targeting ${audience}.
      ${details ? `Additional context: ${details}` : ''}
      
      Return exactly 2 hooks of each category:
      1. Question hooks: Thought-provoking questions that make the viewer curious
      2. Statistic hooks: Surprising facts or statistics that grab attention
      3. Story hooks: Short narrative or anecdote openings
      4. Challenge hooks: Phrases that challenge common misconceptions
      
      Format your response as a JSON array with objects containing:
      - hook_text: The actual hook text
      - category: One of "question", "statistic", "story", or "challenge"
    `;

    console.log('Sending request to OpenAI');
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional content creator assistant that generates attention-grabbing hooks for videos. Respond only with the requested JSON format.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Extract the generated hooks from the OpenAI response
    let hooks = [];
    try {
      const content = data.choices[0].message.content;
      // Try to parse the response as JSON
      hooks = JSON.parse(content);
      // If the response isn't a proper array, try to extract JSON from the text
      if (!Array.isArray(hooks)) {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          hooks = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      // Fallback if parsing fails
      const content = data.choices[0].message.content;
      hooks = [
        { hook_text: "Failed to parse hooks. Please try again.", category: "question" }
      ];
    }

    // Validate and format hooks
    const formattedHooks = hooks.map(hook => ({
      hook_text: typeof hook.hook_text === 'string' ? hook.hook_text : String(hook.hook_text || ''),
      category: ['question', 'statistic', 'story', 'challenge'].includes(hook.category) 
        ? hook.category 
        : 'question'
    }));

    console.log('Returning hooks to client');
    return new Response(
      JSON.stringify({ hooks: formattedHooks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-hooks function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
