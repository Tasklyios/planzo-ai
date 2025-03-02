
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

serve(async (req) => {
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

    // First check usage limits
    const { data: usageCheckData, error: usageCheckError } = await supabase.functions.invoke('check-usage-limits', {
      body: { action: 'scripts' }
    });

    if (usageCheckError) {
      console.error("Error checking usage limits:", usageCheckError);
      return new Response(
        JSON.stringify({ error: `Error checking usage limits: ${usageCheckError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!usageCheckData.canProceed) {
      console.log("User has reached script generation limit:", usageCheckData.message);
      return new Response(
        JSON.stringify({ 
          error: "Usage limit reached", 
          message: usageCheckData.message || "You've reached your daily limit for generating scripts."
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request
    const requestData = await req.json();
    console.log("Received request data:", JSON.stringify(requestData));
    
    const { 
      title, 
      description, 
      contentStyle = "",
      hook = "",
      userId
    } = requestData;

    if (!title) {
      console.error("Missing title in request");
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating script for title: ${title}`);

    // Create prompt for script generation
    let prompt = `
      Generate a complete video script for the following title and description:
      
      TITLE: ${title}
      DESCRIPTION: ${description || "N/A"}
      
      ${hook ? `HOOK: ${hook}` : ""}
      
      ${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ""}
      
      The script should be well-structured, engaging, and tailored for video content.
      Format the script with clear sections and keep it concise but comprehensive.
      Include natural speaking cues, transitions, and elements that will engage the audience.
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional video script writer who creates engaging scripts." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const scriptContent = completion.choices[0]?.message?.content || "";

    if (!scriptContent) {
      return new Response(
        JSON.stringify({ error: "Failed to generate script content" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Save the script to the database - only if we have a saved idea
    if (requestData.savedIdea && requestData.savedIdea.id) {
      try {
        const { error: saveError } = await supabase
          .from("scripts")
          .insert({
            content: scriptContent,
            idea_id: requestData.savedIdea.id,
            user_id: userId || user.id
          });

        if (saveError) {
          console.error("Error saving script:", saveError);
          // We'll continue even if saving fails, just log the error
        }
      } catch (saveError) {
        console.error("Error during script save:", saveError);
        // Continue with script generation even if saving fails
      }
    }

    // Return the generated script
    return new Response(
      JSON.stringify({ 
        script: scriptContent
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating script:", error);

    return new Response(
      JSON.stringify({ error: `Error generating script: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
