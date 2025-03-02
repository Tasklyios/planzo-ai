
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
      body: JSON.stringify({ action: 'hooks' }),
    });

    const usageData = await usageResponse.json();
    if (!usageData.canProceed) {
      return new Response(
        JSON.stringify({ error: usageData.message || "You've reached your daily limit for hook generation" }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract request body
    const { topic, audience, details } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create prompt for OpenAI
    const prompt = `
    Create a set of engaging hooks for a video about ${topic}. 
    Target audience: ${audience || "General viewers"}
    Additional details: ${details || ""}
    
    Please create 3 hooks for each of the following categories:
    1. Question Hooks (hooks that pose an interesting question)
    2. Statistic Hooks (hooks that use a surprising statistic or fact)
    3. Story Hooks (hooks that start with a compelling narrative)
    4. Challenge Hooks (hooks that challenge common beliefs)
    
    Format your response as a JSON array with each hook having 'category' and 'hook_text' fields.
    `;

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
            content: "You are an expert content creator assistant that specializes in creating engaging hooks for videos."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate hooks with AI" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openAIData = await openAIResponse.json();
    const aiResponse = openAIData.choices[0].message.content;
    console.log("AI Response:", aiResponse);

    // Parse JSON from AI response
    let hooks;
    try {
      // Find JSON in the response (in case AI adds explanatory text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        hooks = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in AI response");
      }
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.log("Raw AI response:", aiResponse);
      
      // Attempt to extract hooks through regex if JSON parsing fails
      const hookRegex = /"?(category|hook_text)"?\s*:\s*"([^"]+)"/g;
      let match;
      const extractedHooks = [];
      let currentHook = {};
      
      while ((match = hookRegex.exec(aiResponse)) !== null) {
        const [_, key, value] = match;
        currentHook[key] = value;
        
        if (Object.keys(currentHook).length === 2) {
          extractedHooks.push({...currentHook});
          currentHook = {};
        }
      }
      
      if (extractedHooks.length > 0) {
        hooks = extractedHooks;
      } else {
        return new Response(
          JSON.stringify({ 
            error: "Failed to parse AI response into hooks format",
            rawResponse: aiResponse
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Return the hooks
    return new Response(
      JSON.stringify({ hooks }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in generate-hooks function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
