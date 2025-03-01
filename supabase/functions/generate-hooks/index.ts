
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

interface RequestBody {
  topic: string;
  audience: string;
  details?: string;
}

interface Hook {
  hook_text: string;
  category: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create a Supabase client
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse request body
    const { topic, audience, details } = await req.json() as RequestBody;

    if (!topic || !audience) {
      return new Response(
        JSON.stringify({ error: "Topic and audience are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Define hook categories
    const hookCategories = ["question", "statistic", "story", "challenge"];
    
    // Create prompt for OpenAI
    const prompt = `
      Generate 8 engaging hooks for content about "${topic}" targeting "${audience}". ${details ? `Additional details: ${details}` : ""}
      
      For each hook, create 2 hooks of each of these types:
      - Question hooks: Engage the audience with thought-provoking questions
      - Statistic hooks: Grab attention with surprising facts and numbers
      - Story hooks: Begin with a compelling narrative or anecdote
      - Challenge hooks: Address common misconceptions or beliefs
      
      Format the response as an array of JSON objects, each with:
      - hook_text: The actual hook text
      - category: The hook category (question, statistic, story, or challenge)
      
      Keep each hook under 280 characters.
    `;

    // Call OpenAI
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a creative content hook generator that helps content creators grab their audience's attention."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(error.error?.message || "Failed to generate hooks");
    }

    const openaiData = await openaiResponse.json();
    let hooksData: Hook[] = [];

    try {
      // Parse the hooks from the response
      const responseText = openaiData.choices[0].message.content;
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        hooksData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to extract hooks from response");
      }
    } catch (error) {
      console.error("Error parsing hooks:", error);
      throw new Error("Failed to parse generated hooks");
    }

    return new Response(
      JSON.stringify({ hooks: hooksData }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating hooks:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
