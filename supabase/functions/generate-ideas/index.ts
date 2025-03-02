
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

    // Parse the request
    const { 
      niche, 
      audience, 
      videoType,
      platform = "TikTok",
      customIdeas = "",
      contentStyle = "",
      contentPersonality = "",
      previousIdeas = { count: 0, titles: [], categories: [], descriptions: [] },
      isAdRequest = false
    } = await req.json();

    if (!niche || !audience || !videoType) {
      return new Response(
        JSON.stringify({ error: "Niche, audience, and video type are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating ideas for niche: ${niche}, audience: ${audience}, video type: ${videoType}`);

    // Usage check already happened in the frontend
    // Using check-usage-limits happens before we reach this function

    // Get the user's subscription tier for context
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();

    const tier = subscription?.tier || "free";
    
    // Determine how many ideas to generate based on the subscription tier
    const idealCount = tier === "free" ? 5 : 
                     tier === "pro" ? 8 : 
                     tier === "plus" ? 10 : 
                     12; // business tier

    // Create previous ideas context if available
    let previousIdeasContext = "";
    if (previousIdeas && previousIdeas.count > 0) {
      previousIdeasContext = `
        Here are ${previousIdeas.count} ideas I've already generated for this user:
        ${previousIdeas.titles.map((title, i) => 
          `- ${title} (${previousIdeas.categories[i] || 'General'}): ${previousIdeas.descriptions[i] || 'No description'}`
        ).join('\n')}
        
        Avoid creating ideas that are too similar to these.
      `;
    }

    // Create prompt for idea generation
    const contentTypePrompt = isAdRequest ? 
      "advertisement or promotional content" : 
      "social media video content";

    const prompt = `
      Generate ${idealCount} unique and creative ideas for ${contentTypePrompt} in the ${niche} niche.
      The target audience is ${audience}.
      The video format is ${videoType}.
      The platform is ${platform}.
      
      ${contentStyle ? `Content style preference: ${contentStyle}` : ""}
      ${contentPersonality ? `Content personality preference: ${contentPersonality}` : ""}
      ${customIdeas ? `The user has provided these custom ideas or requirements: ${customIdeas}` : ""}
      
      ${previousIdeasContext}
      
      Format the response as a JSON object with an "ideas" array. Each idea in the array should be an object with these fields:
      - title: A catchy, specific title for the video
      - description: A detailed explanation of what the video will cover (2-3 sentences)
      - category: A category label for the idea
      - tags: An array of 3-5 relevant hashtags (without the # symbol)
      
      Make the ideas specific, actionable, and tailored to the platform's format.
      Make each idea distinct from the others.
      Focus on high-engagement potential ideas that would perform well on ${platform}.
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a creative content strategist who specializes in generating viral content ideas." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
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

    // Verify ideas exist in response
    if (!parsedResponse.ideas || !Array.isArray(parsedResponse.ideas)) {
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

    // Return the ideas
    return new Response(
      JSON.stringify({ ideas: parsedResponse.ideas }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating ideas:", error);

    return new Response(
      JSON.stringify({ error: `Error generating ideas: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
