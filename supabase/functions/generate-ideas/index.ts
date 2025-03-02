
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
      body: JSON.stringify({ action: 'ideas' }),
    });

    const usageData = await usageResponse.json();
    if (!usageData.canProceed) {
      return new Response(
        JSON.stringify({ error: usageData.message || "You've reached your daily limit for idea generation" }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract data from request
    const { 
      niche, 
      audience, 
      videoType, 
      platform, 
      customIdeas,
      contentStyle,
      contentPersonality,
      previousIdeas
    } = await req.json();

    // Validate required fields
    if (!niche || !audience || !videoType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: niche, audience, and videoType are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user's subscription info for context
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create the prompt based on inputs
    let systemPrompt = `You are an expert content strategist who specializes in creating viral video ideas for ${platform || 'social media'}.`;
    
    if (contentStyle) {
      systemPrompt += ` Your content has the following style: ${contentStyle}.`;
    }
    
    if (contentPersonality) {
      systemPrompt += ` Your content personality is: ${contentPersonality}.`;
    }

    let userPrompt = `Create 5 original and viral video ideas for ${videoType} videos about ${niche} targeting ${audience}.`;
    
    // Add custom ideas as context if provided
    if (customIdeas) {
      userPrompt += ` Here are some ideas I already have that you can build upon: ${customIdeas}.`;
    }
    
    // Add previous ideas context if available
    if (previousIdeas && previousIdeas.count > 0) {
      userPrompt += ` I've already generated ${previousIdeas.count} ideas before. Here are some examples: ${previousIdeas.titles.slice(0, 3).join(', ')}. Please make sure new ideas are different from these.`;
    }
    
    userPrompt += `\n\nEach idea should have a catchy title, a brief description, a list of relevant tags (hashtags), and a category (Educational, Entertainment, Tutorial, etc.).
    Format the response as a JSON array, with each idea containing 'title', 'description', 'tags', and 'category' fields.`;

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
        JSON.stringify({ error: "Failed to generate ideas with AI" }),
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
    let ideas;
    try {
      // Find JSON in the response (in case AI adds explanatory text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in AI response");
      }
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.log("Raw AI response:", aiResponse);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response into ideas format",
          rawResponse: aiResponse
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the ideas
    return new Response(
      JSON.stringify({ ideas }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in generate-ideas function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
