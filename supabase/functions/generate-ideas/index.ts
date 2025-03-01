import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
      },
    });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Missing OPENAI_API_KEY",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({
        error: "Missing Supabase configuration",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  const configuration = new Configuration({ apiKey });
  const openai = new OpenAIApi(configuration);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the request body
    const requestData = await req.json();
    const { type } = requestData;

    // Check API usage limits
    const { data: authData } = await supabase.auth.getUser(
      req.headers.get("Authorization")?.split("Bearer ")[1] || ""
    );

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Call check_and_increment_usage function
    const { data: usageData, error: usageError } = await supabase.rpc(
      "check_and_increment_usage",
      {
        feature_name: type === "script" ? "script_generation" : "idea_generation",
      }
    );

    if (usageError) {
      return new Response(
        JSON.stringify({
          error: usageError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!usageData.allowed) {
      return new Response(
        JSON.stringify({
          error: "Usage limit exceeded",
          message: usageData.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Handle different types of requests
    if (type === "ideas") {
      // Handle idea generation
      const {
        count = 5,
        niche,
        audience,
        videoType,
        platform,
        isAd = false,
      } = requestData;

      if (!niche || !audience || !videoType || !platform) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Generate ideas
      const systemPrompt = getIdeasSystemPrompt();
      const userPrompt = getIdeasUserPrompt({
        niche,
        audience,
        videoType,
        platform,
        count,
        isAd,
      });

      // Generate completions from OpenAI
      const response = await openai.createChatCompletion({
        model: "gpt-4-0613",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      if (
        !response.data.choices ||
        !response.data.choices[0] ||
        !response.data.choices[0].message
      ) {
        throw new Error("Failed to generate ideas");
      }

      let ideas = [];
      try {
        ideas = JSON.parse(response.data.choices[0].message.content);
      } catch (error) {
        console.log(
          "Error parsing ideas:",
          response.data.choices[0].message.content
        );
        return new Response(
          JSON.stringify({
            error: "Failed to parse generated ideas",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      return new Response(JSON.stringify({ ideas }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (type === "script") {
      // Handle script generation
      const {
        title,
        description,
        category,
        tags,
        toneOfVoice,
        duration,
        additionalNotes,
        hook,
        structure,
        niche,
        audience,
        videoType,
        platform,
      } = requestData;

      // Basic validation - require these fields
      if (!title || !description || !toneOfVoice || !duration) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields in script request",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Require niche, audience, and videoType
      if (!niche || !audience || !videoType) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: niche, audience, or videoType",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Generate script
      const systemPrompt = getScriptSystemPrompt();
      const userPrompt = getScriptUserPrompt({
        title,
        description,
        category,
        tags,
        toneOfVoice,
        duration,
        additionalNotes,
        hook,
        structure,
        niche,
        audience,
        videoType,
        platform,
      });

      console.log("Generating script with prompt:", userPrompt);

      // Generate completions from OpenAI
      const response = await openai.createChatCompletion({
        model: "gpt-4-0613",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      if (
        !response.data.choices ||
        !response.data.choices[0] ||
        !response.data.choices[0].message
      ) {
        throw new Error("Failed to generate script");
      }

      const script = response.data.choices[0].message.content;

      return new Response(JSON.stringify({ script }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(
        JSON.stringify({
          error: "Invalid request type",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-ideas function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal Server Error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Helper functions for system prompts
function getIdeasSystemPrompt() {
  return `You are an expert content strategist for social media, specializing in generating engaging video content ideas. 
  Your task is to create unique, creative, and engaging video ideas that are tailored to specific niches and audiences.
  
  Always provide responses in a consistent JSON format that can be parsed by the application.
  
  Format each idea as:
  {
    "title": "Attention-grabbing video title",
    "description": "Detailed description of the video concept",
    "category": "Category like Tutorial, Lifestyle, Entertainment, etc.",
    "tags": ["relevant", "hashtags", "for", "this", "content"]
  }
  
  Create ideas that:
  1. Are specific and actionable
  2. Have viral potential
  3. Incorporate trends relevant to the platform
  4. Consider the target audience's interests
  5. Are appropriately formatted for the platform
  
  Your output will be directly used by content creators, so ensure ideas are practical to execute.`;
}

function getIdeasUserPrompt({
  niche,
  audience,
  videoType,
  platform,
  count,
  isAd,
}) {
  let prompt = `Please generate ${count} unique video ${
    isAd ? "ad" : "content"
  } ideas with the following parameters:
  
  Content Niche: ${niche}
  Target Audience: ${audience}
  Content Type: ${videoType}
  Platform: ${platform}
  
  ${
    isAd
      ? "These should be compelling ad ideas that promote products or services while providing value to viewers."
      : "These should be engaging content ideas that provide value to viewers and encourage engagement."
  }

  ${
    isAd
      ? "Each ad should have a clear value proposition and call to action."
      : ""
  }
  
  Return the ideas as a JSON array of objects with the format specified in your instructions.`;

  return prompt;
}

function getScriptSystemPrompt() {
  return `You are an expert script writer for social media video content. Your task is to create engaging, well-structured scripts that are tailored to specific platforms and audiences.

  When writing scripts:
  
  1. Create attention-grabbing hooks
  2. Maintain a conversational, authentic tone
  3. Incorporate visual direction using [VISUAL_GUIDE] tags
  4. Keep sentences short and impactful
  5. Include timestamps where appropriate using [TIMESTAMP] tags
  6. End with clear calls-to-action
  7. Optimize for the target platform
  8. Ensure the content provides value to the audience
  
  Structure scripts with visual guidance for filming/editing, using [VISUAL_GUIDE] tags for scenes/shots/transitions and [TIMESTAMP] for key moments.
  
  Your scripts should be ready to use for recording without further editing.`;
}

function getScriptUserPrompt({
  title,
  description,
  category,
  tags,
  toneOfVoice,
  duration,
  additionalNotes,
  hook,
  structure,
  niche,
  audience,
  videoType,
  platform,
}) {
  let prompt = `Please write a complete script for a ${duration}-second video with the following details:
  
  Title: ${title}
  Description: ${description}
  Category: ${category || videoType}
  Tags: ${tags ? tags.join(", ") : ""}
  Tone of Voice: ${toneOfVoice}
  Content Niche: ${niche}
  Target Audience: ${audience}
  Platform: ${platform}
  
  ${additionalNotes ? `Additional Notes: ${additionalNotes}` : ""}
  ${hook ? `Use this hook: ${hook}` : ""}
  ${structure ? `Follow this structure: ${structure}` : ""}
  
  Include [VISUAL_GUIDE] tags for visual directions and [TIMESTAMP] tags for key timing points.
  
  The script should have a strong hook at the beginning, provide value through the middle sections, and end with an effective call-to-action.
  
  Make the content engaging and optimized for the ${platform} platform, maintaining a ${toneOfVoice} tone throughout.`;

  return prompt;
}
