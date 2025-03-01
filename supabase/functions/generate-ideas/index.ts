
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CreateCompletionRequest } from "https://esm.sh/openai@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define the correct CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Get the user from the JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }

    // Check the user's usage limits
    const checkUsageResponse = await fetch(`${supabaseUrl}/functions/v1/check-usage-limits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authHeader.replace("Bearer ", "")}`,
      },
      body: JSON.stringify({
        user_id: user.id,
        action: "ideas"
      }),
    });

    if (!checkUsageResponse.ok) {
      const errorData = await checkUsageResponse.json();
      throw new Error(`Usage limit check failed: ${errorData.error || "Unknown error"}`);
    }

    const usageData = await checkUsageResponse.json();
    if (!usageData.canProceed) {
      return new Response(
        JSON.stringify({
          error: "You have reached your daily limit for generating ideas. Please upgrade your plan for more.",
          usage: usageData.usage
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get the request parameters
    const requestData = await req.json();
    const { 
      type, 
      niche, 
      audience, 
      videoType, 
      platform, 
      customIdeas,
      contentStyle,
      contentPersonality,
      // Script generation specific fields
      title,
      description,
      category,
      tags,
      toneOfVoice,
      duration,
      additionalNotes,
      hook,
      structure,
      previousIdeasContext
    } = requestData;

    // Determine if we're generating ideas or a script
    if (type === "script") {
      // Generate script logic
      // Create prompt for script generation
      const prompt = `
      Create a ${duration}-second script for a ${platform} video with the following details:
      
      Title: ${title}
      Description: ${description}
      Category: ${category || "N/A"}
      Tags: ${tags ? tags.join(", ") : "N/A"}
      
      Tone of Voice: ${toneOfVoice || "conversational"}
      
      ${additionalNotes ? `Additional Notes: ${additionalNotes}` : ""}
      
      ${hook ? `Use this hook style: ${hook}` : ""}
      ${structure ? `Follow this structure: ${structure}` : ""}
      
      The script should include timing markers, visual direction in [VISUAL_GUIDE] tags, and clear hooks and CTAs.
      `;

      // Call OpenAI for script generation
      const scriptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert video script writer who specializes in creating engaging, high-converting scripts for short-form video content."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000
        })
      });

      if (!scriptResponse.ok) {
        const errorData = await scriptResponse.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const scriptData = await scriptResponse.json();
      const generatedScript = scriptData.choices[0].message.content;

      return new Response(
        JSON.stringify({ script: generatedScript }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Generate ideas logic
      // Create the prompt for idea generation
      const promptParts = [
        `Generate 10 viral video ideas for ${platform}.`,
        `The content creator focuses on ${niche || "general content"}.`,
        `The target audience is ${audience || "general audience"}.`,
        `The video type preference is ${videoType || "any type"}.`,
        customIdeas ? `The creator has these specific ideas in mind: ${customIdeas}` : "",
        contentStyle ? `Content style: ${contentStyle}` : "",
        contentPersonality ? `Content personality: ${contentPersonality}` : "",
      ];
      
      // Filter out empty strings
      const filteredPromptParts = promptParts.filter(part => part.trim() !== "");
      
      // Join with newlines
      const prompt = filteredPromptParts.join("\n");

      // Avoid repetition by providing context of previous ideas
      let contextPart = "";
      if (previousIdeasContext && previousIdeasContext.count > 0) {
        contextPart = `
        Previously generated video titles: ${previousIdeasContext.titles.join(", ")}
        Previously generated categories: ${previousIdeasContext.categories.join(", ")}
        Please avoid generating similar ideas to these.
        `;
      }

      // Call OpenAI for idea generation
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a viral video idea generator for content creators. Generate unique, trending, and engaging ideas that have high potential for virality on ${platform}. Each idea should include a catchy title, category (like Tutorial, Entertainment, Educational, etc.), a description (2-3 sentences), and 3-5 relevant hashtags. Format the response as a valid JSON array.`
            },
            {
              role: "user",
              content: prompt + contextPart
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const openaiData = await openaiResponse.json();
      const ideasText = openaiData.choices[0].message.content;
      
      // Parse the JSON response
      const ideasObject = JSON.parse(ideasText);
      const ideas = ideasObject.ideas || [];

      // Store ideas in the database
      const ideaPromises = ideas.map(async (idea) => {
        const { data, error } = await supabase
          .from("video_ideas")
          .insert({
            user_id: user.id,
            title: idea.title,
            description: idea.description,
            category: idea.category,
            tags: idea.hashtags || [],
            platform: platform,
            color: ["blue", "green", "red", "yellow", "purple", "pink", "orange", "indigo"][
              Math.floor(Math.random() * 8)
            ],
            is_saved: false
          })
          .select();

        if (error) {
          console.error("Error storing idea:", error);
          return null;
        }

        return data[0];
      });

      // Wait for all database operations to complete
      const storedIdeas = await Promise.all(ideaPromises);
      const validIdeas = storedIdeas.filter(idea => idea !== null);

      return new Response(
        JSON.stringify({ ideas: validIdeas }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in generate-ideas function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
