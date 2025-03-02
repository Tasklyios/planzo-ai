
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
      auth: { persistSession: false }
    });

    // Check usage limits first
    const usageResponse = await fetch(`${supabaseUrl}/functions/v1/check-usage-limits`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization')!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'scripts' }),
    });

    const usageData = await usageResponse.json();
    if (!usageData.canProceed) {
      return new Response(
        JSON.stringify({ error: usageData.message || "You've reached your daily limit for script generation" }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the request data
    const { 
      title, 
      hook, 
      structure, 
      length, 
      style, 
      audience, 
      platform, 
      callToAction,
      keypoints
    } = await req.json();

    console.log("Generating script for:", title);

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the prompt
    let systemPrompt = "You are an expert video script writer who creates engaging and conversion-optimized scripts.";
    
    let userPrompt = `Write a script for a ${platform || "social media"} video titled "${title}".`;
    
    if (hook) {
      userPrompt += `\n\nStart with this hook: "${hook}"`;
    }
    
    if (structure) {
      userPrompt += `\n\nFollow this structure: ${structure}`;
    }
    
    if (length) {
      userPrompt += `\n\nThe script should be approximately ${length} in length.`;
    }
    
    if (style) {
      userPrompt += `\n\nUse a ${style} style.`;
    }
    
    if (audience) {
      userPrompt += `\n\nTarget audience: ${audience}`;
    }
    
    if (keypoints && keypoints.length > 0) {
      userPrompt += `\n\nInclude these key points:\n`;
      keypoints.forEach((point: string, index: number) => {
        userPrompt += `${index + 1}. ${point}\n`;
      });
    }
    
    if (callToAction) {
      userPrompt += `\n\nEnd with this call to action: "${callToAction}"`;
    }
    
    userPrompt += `\n\nFormat the script using markdown, with clear sections for HOOK, INTRO, MAIN CONTENT, and OUTRO/CTA.
    Add [VISUAL: description] for visual cues where appropriate.`;

    // Call OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate script with AI" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openAIData = await openAIResponse.json();
    const scriptContent = openAIData.choices[0].message.content;

    // Return the script
    return new Response(
      JSON.stringify({ script: scriptContent }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in generate-script function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
