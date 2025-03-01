
// Import necessary Deno modules
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client using environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const openAIApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log("Received request to generate-ideas function");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));

    // Extract parameters from request
    const {
      niche,
      audience,
      videoType,
      platform,
      customIdeas,
      previousIdeas,
      type // "ideas" (default) or "script"
    } = requestData;

    // Script generation logic
    if (type === 'script') {
      return await generateScript(requestData);
    }
    
    // Regular idea generation
    return await generateIdeas(niche, audience, videoType, platform, customIdeas, previousIdeas);
  } catch (error) {
    console.error("Error in generate-ideas function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateIdeas(niche, audience, videoType, platform, customIdeas, previousIdeas) {
  console.log("Sending request to OpenAI API");

  try {
    // Format the context about previous ideas if available
    let previousIdeasContext = '';
    if (previousIdeas && previousIdeas.count > 0) {
      previousIdeasContext = `
Previously generated ${previousIdeas.count} ideas with these titles:
${previousIdeas.titles.join(', ')}

And these categories:
${previousIdeas.categories.join(', ')}

IMPORTANT: Generate completely different ideas than these. Avoid similar topics, formats, or approaches.`;
    }

    // Custom ideas context
    let customIdeasContext = '';
    if (customIdeas && customIdeas.trim()) {
      customIdeasContext = `
The user has provided some specific ideas or constraints:
"${customIdeas}"

Try to incorporate these ideas or constraints into your suggestions.`;
    }

    const platformSpecificNotes = getPlatformGuidance(platform);

    // Create the prompt for GPT
    const prompt = `
Generate 5 creative and engaging content ideas for ${videoType} videos in the ${niche} niche, targeting ${audience} on ${platform}.

${platformSpecificNotes}

${previousIdeasContext}

${customIdeasContext}

IMPORTANT INSTRUCTIONS:
1. Each idea must include a catchy title, a brief description (50-100 words), a relevant category, and 3-5 relevant hashtags.
2. Make each idea distinct from the others to provide variety.
3. Format your response as valid JSON with this structure:
{
  "ideas": [
    {
      "title": "Title of the video idea",
      "description": "Brief description of what the video will contain...",
      "category": "Category like tutorial, how-to, review, etc",
      "tags": ["hashtag1", "hashtag2", "hashtag3"]
    },
    // 4 more ideas...
  ]
}
4. Make sure your response is ONLY the JSON - no additional text before or after.
`;

    // Call the OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a creative content strategist who specializes in generating viral video ideas.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    console.log("Received response from OpenAI");

    // Extract the content from GPT's response
    const content = data.choices[0].message.content;
    
    // Parse the JSON response (handling possible JSON in markdown code blocks)
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;
    
    try {
      const parsedContent = JSON.parse(jsonContent.trim());
      return new Response(
        JSON.stringify(parsedContent),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (jsonError) {
      console.error("Failed to parse JSON from OpenAI response:", jsonError);
      console.log("Raw response:", content);
      
      // Return the raw response for debugging
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse response format", 
          rawResponse: content 
        }),
        { 
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error("Error generating ideas:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate ideas" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function generateScript(requestData) {
  console.log("Generating script with data:", JSON.stringify(requestData));
  
  try {
    const {
      title,
      description,
      toneOfVoice = 'conversational',
      duration = 60,
      additionalNotes = '',
      category = '',
      tags = [],
      hook = '',
      structure = ''
    } = requestData;

    // Determine the appropriate word count based on duration
    const targetWordCount = Math.round(duration * 2.5); // Approx 150 words per minute

    let hookContext = '';
    if (hook) {
      hookContext = `
USE THIS EXACT HOOK AT THE BEGINNING OF THE SCRIPT:
${hook}`;
    }

    let structureContext = '';
    if (structure) {
      structureContext = `
FOLLOW THIS EXACT STRUCTURE FOR THE SCRIPT:
${structure}`;
    }

    // Create the prompt
    const prompt = `
Create a ${duration}-second video script for a ${platform || 'social media'} video with the title "${title}".

VIDEO DESCRIPTION:
${description}

TECHNICAL SPECIFICATIONS:
- Tone: ${toneOfVoice}
- Target duration: ${duration} seconds (approximately ${targetWordCount} words)
- Category: ${category}
${tags && tags.length > 0 ? `- Relevant hashtags: ${tags.join(', ')}` : ''}
${additionalNotes ? `- Additional notes: ${additionalNotes}` : ''}

${hookContext}

${structureContext}

FORMAT THE SCRIPT WITH:
1. Clear [TIMESTAMP] markers indicating approximate points in the video (e.g., [0:05], [0:15])
2. [VISUAL_GUIDE] markers for visual instructions and scene descriptions
3. Mark the hook section with [HOOK]
4. Mark the call-to-action with [CTA]

The script should be engaging, well-paced, and optimized for social media audience retention.
`;

    // Call the OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert video scriptwriter who creates engaging scripts optimized for social media.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    const scriptContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ script: scriptContent }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error generating script:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate script"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

function getPlatformGuidance(platform) {
  const platformGuides = {
    'TikTok': 'Focus on trends, challenges, and hooks that grab attention in the first 3 seconds. Videos should be vertical, fast-paced, and 15-60 seconds long.',
    'Instagram': 'For Reels, focus on visually appealing, trend-based content that's 15-60 seconds. For Feed posts, create content that encourages saves and shares, with strong visuals.',
    'YouTube': 'Focus on searchable content with strong educational or entertainment value. Shorts should be 60 seconds or less with strong hooks, while longer videos need clear structure.',
    'LinkedIn': 'Focus on professional development, industry insights, and business tips. Content should be informative, data-driven, and maintain a professional tone.',
    'Facebook': 'Content should encourage engagement and discussion. Videos do well when they're entertaining, informative, or emotionally resonant.',
  };

  return platformGuides[platform] || 
    'Create content that is platform-appropriate, with strong hooks and clear value for the target audience.';
}
