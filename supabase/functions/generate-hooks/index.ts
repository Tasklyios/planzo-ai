
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.0.0";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the user's JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get request body
    const { topic, audience, details } = await req.json();

    if (!topic || !audience) {
      return new Response(
        JSON.stringify({ error: "Topic and audience are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating hooks for topic: ${topic}, audience: ${audience}`);

    // Create prompt for hook generation
    const prompt = `
      Generate 10 engaging and attention-grabbing hooks for a video about ${topic}.
      The target audience is ${audience}.
      ${details ? `Additional context: ${details}` : ""}
      
      Each hook should be succinct and effective at capturing attention.
      
      Format the response as a JSON array of objects, where each object has:
      - hook_text: The actual hook text (limited to 1-2 sentences)
      - category: A category label (e.g., "Question", "Statistic", "Controversial", "Story", "Fact", "Problem-Solution", "Challenge", "Benefit")
      
      Remember to keep each hook under 20 words when possible, and make them highly relevant to the topic and audience.
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a professional hook writer who creates attention-grabbing hooks for videos." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const responseContent = completion.choices[0]?.message?.content || "{}";
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response", 
          rawResponse: responseContent 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify hooks exist in response
    if (!parsedResponse.hooks || !Array.isArray(parsedResponse.hooks)) {
      console.error("Invalid response format from AI:", parsedResponse);
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid response format from AI", 
          rawResponse: parsedResponse 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return the hooks
    return new Response(
      JSON.stringify({ hooks: parsedResponse.hooks }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating hooks:", error);

    return new Response(
      JSON.stringify({ error: `Error generating hooks: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
