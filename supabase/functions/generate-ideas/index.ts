
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request data
    const {
      niche,
      audience,
      videoType,
      platform,
      customIdeas,
      contentStyle,
      contentPersonality,
      previousIdeas,
      ideaId, // For script generation
      scriptType, // For script generation
    } = await req.json();

    // Determine if this is a script generation request
    const isScriptRequest = Boolean(ideaId && scriptType);

    // Check if OpenAI API key is available
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    let prompt = "";
    let systemMessage = "";

    // Build prompt based on request type
    if (isScriptRequest) {
      // Script generation
      systemMessage = "You are a professional video script writer who specializes in creating engaging content for social media platforms.";
      
      prompt = `Create a detailed script for a ${platform} video with the following details:
      
      ${scriptType === "standard" ? "Standard format" : "Hook-driven format"}
      
      Please format the script with clear sections, including:
      - Hook/Intro
      - Main points
      - Call to action
      
      Make the script casual, engaging, and optimized for ${platform}.
      
      If you include any facts or statistics, make sure they sound realistic but don't make up specific numbers if you're not certain.`;
      
      if (contentStyle) {
        prompt += `\n\nContent style: ${contentStyle}`;
      }
      
      if (contentPersonality) {
        prompt += `\n\nContent personality: ${contentPersonality}`;
      }
    } else {
      // Idea generation
      systemMessage = "You are a social media content strategist who helps creators make viral content.";
      
      prompt = `Generate 5 viral video ideas for ${platform} with the following criteria:
      - Niche: ${niche}
      - Target Audience: ${audience}
      - Video Type: ${videoType}
      
      For each idea, provide:
      - A catchy title
      - A brief description (2-3 sentences)
      - Category
      - 3 relevant hashtags (without the # symbol)
      
      ${customIdeas ? `Also consider these specific ideas: ${customIdeas}` : ""}`;
      
      if (contentStyle) {
        prompt += `\n\nContent style should be: ${contentStyle}`;
      }
      
      if (contentPersonality) {
        prompt += `\n\nContent personality should be: ${contentPersonality}`;
      }
      
      // Add context from previous ideas to avoid repetition
      if (previousIdeas && previousIdeas.titles && previousIdeas.titles.length > 0) {
        prompt += `\n\nIMPORTANT: Avoid generating ideas similar to these previous titles:
        ${previousIdeas.titles.join(", ")}`;
      }
      
      prompt += `\n\nFormat the response as JSON with this structure:
      {
        "ideas": [
          {
            "title": "string",
            "description": "string",
            "category": "string",
            "tags": ["string"]
          }
        ]
      }`;
    }

    console.log("Using prompt:", prompt);

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API Error:", errorData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status} ${response.statusText}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();
    console.log("OpenAI response:", data);

    if (!data.choices || data.choices.length === 0) {
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const content = data.choices[0].message.content;

    // Process the response based on request type
    if (isScriptRequest) {
      // For script generation, return the raw script content
      return new Response(
        JSON.stringify({ script: content }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      // For idea generation, parse the JSON response
      try {
        // Attempt to parse the JSON response
        const parsedIdeas = JSON.parse(content);
        
        return new Response(
          JSON.stringify(parsedIdeas),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        console.log("Raw response:", content);
        
        // Return the raw response for debugging
        return new Response(
          JSON.stringify({ 
            error: "Failed to parse AI response as JSON",
            rawResponse: content 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }
  } catch (error) {
    console.error("Error in generate-ideas function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
