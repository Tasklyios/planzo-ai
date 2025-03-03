
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

  try {
    // Get the OpenAI API key from the environment
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ error: 'Missing OpenAI API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the request body
    const { prompt, category, topic, emotion, platform, userId, numHooks = 5 } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if the user has reached their usage limit
    if (userId) {
      try {
        const { data, error } = await supabase.rpc(
          'check_and_increment_usage',
          { p_user_id: userId, p_action: 'hooks' }
        );

        if (error) {
          console.error('Error checking usage limits:', error);
          return new Response(
            JSON.stringify({ error: `Error checking usage limits: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (data === false) {
          return new Response(
            JSON.stringify({ error: 'You have reached your daily limit for hook generation.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error('Error checking usage:', error);
      }
    }

    // Construct the prompt for hook generation
    const systemPrompt = `You are a social media expert that specializes in creating viral hooks for short-form videos on platforms like TikTok, Instagram Reels, and YouTube Shorts. Your job is to create compelling, platform-specific hooks that stop viewers from scrolling.`;

    let userPrompt = `Generate ${numHooks} different hooks for a ${platform} video about ${topic || 'my product/service'}`;

    if (category) {
      userPrompt += ` in the ${category} category`;
    }

    if (emotion) {
      userPrompt += `. The hooks should evoke the emotion: ${emotion}`;
    }

    if (prompt && prompt.trim()) {
      userPrompt += `. Additional context: ${prompt}`;
    }

    userPrompt += `\n\nEach hook should be short (1-2 sentences), attention-grabbing, and designed specifically for ${platform}.
    
    FORMAT YOUR RESPONSE AS A JSON ARRAY of objects with "hook" and "explanation" properties like this:
    [
      {
        "hook": "The actual hook text that would start the video",
        "explanation": "Why this hook works and when to use it"
      },
      {
        ...more hooks
      }
    ]
    
    DO NOT include any text outside of the JSON format. Your entire response should be valid JSON.
    
    Different types of effective hooks to consider:
    - Shocking statistics or facts
    - Controversial opinions
    - Curiosity gaps ("The one thing most people get wrong about...")
    - Direct questions to the viewer
    - "POV" or relatable scenarios
    - Bold claims with promise of proof
    - Before/after teases
    
    Make each hook unique with a different approach. Avoid generic or cliché phrases.`;

    // Call the OpenAI API
    console.log('Calling OpenAI API for hook generation...');
    console.log('Using model: gpt-4o-mini');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
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

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from OpenAI:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from OpenAI API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the response content
    const content = data.choices[0].message.content;
    console.log('Raw response content:', content);

    // Parse hooks from the response
    let hooks = [];
    try {
      // Find JSON in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        hooks = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in the response');
      }
    } catch (error) {
      console.error('Error parsing hooks JSON:', error);
      
      // Attempt recovery by extracting hooks manually
      console.log('Attempting manual extraction...');
      try {
        // Try to extract hook objects with regex
        const hookPattern = /"hook"\s*:\s*"([^"]*)"\s*,\s*"explanation"\s*:\s*"([^"]*)"/g;
        let match;
        const manuallyExtractedHooks = [];
        
        while ((match = hookPattern.exec(content)) !== null) {
          manuallyExtractedHooks.push({
            hook: match[1],
            explanation: match[2]
          });
        }
        
        if (manuallyExtractedHooks.length > 0) {
          hooks = manuallyExtractedHooks;
          console.log('Successfully extracted hooks manually:', hooks);
        } else {
          // If regex fails, extract text between quotes as hooks
          const quotedTextPattern = /"([^"]*)"/g;
          const extractedTexts = [];
          
          while ((match = quotedTextPattern.exec(content)) !== null) {
            if (match[1].length > 10 && !match[1].includes('{') && !match[1].includes('}')) {
              extractedTexts.push(match[1]);
            }
          }
          
          // Pair texts as hooks and explanations
          for (let i = 0; i < extractedTexts.length - 1; i += 2) {
            hooks.push({
              hook: extractedTexts[i],
              explanation: extractedTexts[i+1] || 'This hook is designed to grab attention quickly.'
            });
          }
          
          console.log('Extracted hooks from quoted text:', hooks);
        }
      } catch (recoveryError) {
        console.error('Recovery attempt failed:', recoveryError);
        // If all parsing attempts fail, create a default format
        hooks = content.split('\n')
          .filter(line => line.trim().length > 0)
          .slice(0, numHooks)
          .map(line => ({
            hook: line.replace(/^\d+\.\s*/, '').trim(),
            explanation: 'This hook is designed to grab attention quickly.'
          }));
      }
    }

    // Ensure we return the requested number of hooks
    hooks = hooks.slice(0, numHooks);
    
    console.log('Final processed hooks:', hooks);

    // Return the hooks
    return new Response(
      JSON.stringify({ hooks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-hooks function:', error);
    return new Response(
      JSON.stringify({ error: `Error generating hooks: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
