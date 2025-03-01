
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const requestData = await req.json();
    const { title, description, contentStyle, hook, userId } = requestData;

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get a token to authenticate to OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    // Create a prompt with all the information we have
    let prompt = `Generate a detailed script for a short-form video with the title: "${title}".`;
    
    if (description) {
      prompt += ` The video should be about: "${description}".`;
    }
    
    if (contentStyle) {
      prompt += ` The content style should be: "${contentStyle}".`;
    }

    if (hook) {
      prompt += ` The video should start with this hook: "${hook}".`;
    }

    prompt += ` The script should be concise, engaging, and formatted with clear sections (intro, main points, call to action).`;

    console.log('Sending prompt to OpenAI:', prompt);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert script writer for short-form videos. Create concise, engaging scripts with clear structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 750,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const scriptText = data.choices[0].message.content;

    console.log('Generated script:', scriptText);

    // If user ID is provided, save to database
    if (userId) {
      const { error: insertError } = await supabase
        .from('scripts')
        .insert({
          user_id: userId,
          title: title,
          content: scriptText,
          description: description || '',
          hook: hook || '',
          content_style: contentStyle || '',
        });

      if (insertError) {
        console.error('Error saving script to database:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        script: scriptText,
        title,
        description,
        contentStyle,
        hook
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
