
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if request is POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check usage limits
    const { data: usageData, error: usageError } = await supabaseClient.rpc(
      "check_and_increment_usage",
      { feature_name: "ideas" }
    );

    if (usageError) {
      console.error("Usage check error:", usageError);
      return new Response(
        JSON.stringify({ error: `Error checking usage limits: ${usageError.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!usageData) {
      return new Response(
        JSON.stringify({ error: "You've reached your daily limit for idea generation" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { niche, audience, videoType, platform, customIdeas, contentStyle, contentPersonality, previousIdeas } = await req.json();

    // Prepare system message
    let systemMessage = `You are a creative content strategist who helps creators generate engaging video ideas for ${platform}.`;
    
    if (contentStyle || contentPersonality) {
      systemMessage += ` The creator's preferred content style is ${contentStyle || "not specified"} and their content personality is ${contentPersonality || "not specified"}.`;
    }

    // Add context about previous ideas if available
    let previousIdeasContext = "";
    if (previousIdeas && previousIdeas.count > 0) {
      previousIdeasContext = `\nThe creator has previously generated ${previousIdeas.count} ideas.`;
      
      if (previousIdeas.titles && previousIdeas.titles.length > 0) {
        previousIdeasContext += `\nRecent idea titles include: ${previousIdeas.titles.slice(0, 5).join(", ")}`;
      }
      
      if (previousIdeas.categories && previousIdeas.categories.length > 0) {
        const categoryFrequency = {};
        previousIdeas.categories.forEach(cat => {
          categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
        });
        
        // Get the top 3 most frequent categories
        const topCategories = Object.entries(categoryFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(entry => entry[0]);
          
        previousIdeasContext += `\nTop categories used: ${topCategories.join(", ")}`;
      }
    }

    // Prepare user prompt
    let prompt = `Generate 5 unique, creative, and engaging ${videoType} video ideas for ${platform} in the ${niche} niche targeting ${audience}.`;
    
    if (customIdeas) {
      prompt += `\nIncorporate these specific ideas or themes if possible: ${customIdeas}`;
    }
    
    prompt += `\nFor each idea, include:\n1. A catchy title\n2. A brief description (2-3 sentences)\n3. A relevant category\n4. 3-5 hashtags/tags`;
    
    // Start tracking time for the OpenAI call
    const startTime = Date.now();
    
    console.log("Calling OpenAI with prompt:", prompt);
    
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Changed from gpt-4-turbo to gpt-4o-mini
        messages: [
          {
            role: "system",
            content: systemMessage + previousIdeasContext,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
      }),
    });

    // Calculate time taken for OpenAI API call
    const timeTaken = Date.now() - startTime;
    console.log(`OpenAI API call took ${timeTaken}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const rawResponse = data.choices[0].message.content;
    console.log("Raw OpenAI response:", rawResponse);

    // Parse the response to extract the ideas
    try {
      const ideas = parseIdeasFromResponse(rawResponse);
      
      return new Response(
        JSON.stringify({ ideas, rawResponse }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return new Response(
        JSON.stringify({ error: `Failed to parse AI response: ${parseError.message}`, rawResponse }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseIdeasFromResponse(text) {
  // Try to split by numbered items first (1., 2., etc.)
  const ideas = [];
  const lines = text.split('\n').filter(line => line.trim() !== '');

  let currentIdea = null;
  let inHashtags = false;

  // First try to identify numbered ideas (1., 2., etc.)
  const ideaStartRegex = /^(\d+)[\.\)]\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line starts a new idea
    const ideaMatch = line.match(ideaStartRegex);
    
    if (ideaMatch) {
      // If we already have a current idea, push it to our array
      if (currentIdea) {
        ideas.push(currentIdea);
      }
      
      // Start a new idea
      currentIdea = {
        title: ideaMatch[2],
        description: '',
        category: '',
        tags: []
      };
      
      inHashtags = false;
    } else if (currentIdea) {
      // We're in the middle of an idea
      
      // Check for description
      if (line.toLowerCase().includes("description") || (line.toLowerCase().includes("desc") && line.includes(":"))) {
        const descriptionParts = line.split(":");
        if (descriptionParts.length > 1) {
          currentIdea.description = descriptionParts[1].trim();
        }
        continue;
      }
      
      // Check for category
      if (line.toLowerCase().includes("category") || (line.toLowerCase().includes("cat") && line.includes(":"))) {
        const categoryParts = line.split(":");
        if (categoryParts.length > 1) {
          currentIdea.category = categoryParts[1].trim();
        }
        continue;
      }
      
      // Check for tags/hashtags
      if (line.toLowerCase().includes("tag") || 
          line.toLowerCase().includes("hashtag") || 
          inHashtags || 
          line.startsWith("#")) {
        inHashtags = true;
        
        // Extract hashtags
        const hashtagMatch = line.match(/#[\w\d]+/g);
        if (hashtagMatch) {
          currentIdea.tags = currentIdea.tags.concat(
            hashtagMatch.map(tag => tag.substring(1)) // Remove the # symbol
          );
          continue;
        }
        
        // If line contains "Tags:" or "Hashtags:", extract the content after the colon
        if (line.includes(":")) {
          const tagsParts = line.split(":");
          if (tagsParts.length > 1) {
            const tagsText = tagsParts[1].trim();
            // Split by commas or spaces if they look like hashtags
            const tags = tagsText.startsWith("#") 
              ? tagsText.split(/\s+/).map(tag => tag.startsWith("#") ? tag.substring(1) : tag)
              : tagsText.split(",").map(tag => tag.trim());
            
            currentIdea.tags = currentIdea.tags.concat(tags);
          }
          continue;
        }
      }
      
      // If the line doesn't match any of the above patterns, add it to the description
      if (!currentIdea.description) {
        currentIdea.description = line;
      } else if (line && !line.includes(":") && !inHashtags) {
        currentIdea.description += " " + line;
      }
    }
  }
  
  // Don't forget to add the last idea
  if (currentIdea) {
    ideas.push(currentIdea);
  }
  
  // If we couldn't parse ideas with the above method, try an alternative approach
  if (ideas.length === 0) {
    // Look for ideas with titles in quotes or bold markdown
    const titleRegex = /[""]([^""]+)[""]|(?:\*\*)(.*?)(?:\*\*)/g;
    let match;
    let lastIndex = 0;
    
    while ((match = titleRegex.exec(text)) !== null) {
      const title = match[1] || match[2];
      const startIdx = match.index;
      const endIdx = text.indexOf("\n\n", startIdx);
      
      const ideaText = text.substring(startIdx, endIdx > startIdx ? endIdx : undefined);
      
      // Extract category if present
      let category = '';
      const categoryMatch = ideaText.match(/category:?\s*([^,\n]+)/i);
      if (categoryMatch) {
        category = categoryMatch[1].trim();
      }
      
      // Extract description - everything between title and category/tags
      let description = ideaText.substring(match[0].length).trim();
      if (categoryMatch) {
        description = description.substring(0, description.toLowerCase().indexOf('category')).trim();
      }
      
      // Extract tags
      const tags = [];
      const hashtagMatch = ideaText.match(/#[\w\d]+/g);
      if (hashtagMatch) {
        hashtagMatch.forEach(tag => tags.push(tag.substring(1)));
      }
      
      ideas.push({
        title,
        description,
        category,
        tags
      });
      
      lastIndex = endIdx;
    }
  }
  
  // Final checks and cleanup
  for (const idea of ideas) {
    // Default values for any missing properties
    if (!idea.title) idea.title = "Untitled Idea";
    if (!idea.description) idea.description = "No description provided.";
    if (!idea.category) idea.category = "Miscellaneous";
    if (!idea.tags || idea.tags.length === 0) idea.tags = ["content"];
    
    // Cleanup tags (remove duplicates, empty tags, etc.)
    idea.tags = [...new Set(idea.tags.filter(tag => tag && tag.trim() !== ''))];
    
    // Clean up description (remove "Description:" prefix if present)
    if (idea.description.toLowerCase().startsWith("description:")) {
      idea.description = idea.description.substring("description:".length).trim();
    }
  }
  
  return ideas;
}
