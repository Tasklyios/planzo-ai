
// supabase/functions/generate-ideas/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { type } = body;

    console.log(`Processing ${type} request`);

    let response;
    if (type === 'script') {
      response = await generateScript(body, OPENAI_API_KEY, supabase);
    } else if (type === 'script_coach') {
      response = await generateScriptCoachResponse(body, OPENAI_API_KEY);
    } else {
      // Default to idea generation
      response = await generateIdeas(body, OPENAI_API_KEY);
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error in generate-ideas function:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateIdeas(body, apiKey) {
  const { 
    niche, audience, videoType, platform, customIdeas,
    contentStyle, contentPersonality, previousIdeas
  } = body;

  console.log(`Generating ideas for niche: ${niche}, audience: ${audience}, videoType: ${videoType}`);

  let prompt = `Generate 3 engaging ${platform} video ideas for a ${videoType}.`;
  
  if (niche) {
    prompt += ` The content niche is: ${niche}.`;
  }
  
  if (audience) {
    prompt += ` The target audience is: ${audience}.`;
  }

  if (contentStyle) {
    prompt += ` The content style is: ${contentStyle}.`;
  }

  if (contentPersonality) {
    prompt += ` The content personality is: ${contentPersonality}.`;
  }

  if (customIdeas) {
    prompt += ` Consider the following custom requests: ${customIdeas}.`;
  }

  // Add context about previous ideas to avoid repetition
  if (previousIdeas && previousIdeas.count > 0) {
    prompt += ` Please avoid generating ideas similar to these previous titles: ${previousIdeas.titles.join(", ")}.`;
  }

  prompt += ` For each idea, provide: 
1. An engaging title (max 60 chars)
2. A concise description explaining the content (2-3 sentences)
3. A category (e.g., Tutorial, Entertainment, Educational)
4. 3-5 relevant hashtags

Format the response as a JSON array of objects with title, description, category, and tags fields.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a content idea generator specialized in social media content. Provide creative and specific ideas that will engage the target audience. Always format your response as valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response from OpenAI:', data);
      throw new Error('Failed to generate ideas: Invalid API response');
    }

    const content = data.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```|(\[[\s\S]*\])/;
      const match = content.match(jsonRegex);
      
      let jsonContent = match ? (match[1] || match[2]) : content;
      const ideas = JSON.parse(jsonContent);
      
      console.log(`Successfully generated ${ideas.length} ideas`);
      return { ideas };
    } catch (jsonError) {
      console.error('Error parsing AI response as JSON:', jsonError);
      console.log('Raw response:', content);
      
      // Return the raw response in case frontend wants to handle it
      return { 
        error: 'Failed to parse AI response as JSON', 
        rawResponse: content 
      };
    }
  } catch (error) {
    console.error('Error generating ideas:', error);
    throw new Error(`Failed to generate ideas: ${error.message}`);
  }
}

async function generateScript(body, apiKey, supabase) {
  const { 
    title, description, category, toneOfVoice, duration, 
    additionalNotes, hook, structure, niche, audience, videoType, platform
  } = body;

  console.log(`Generating script for: ${title}, duration: ${duration}s, tone: ${toneOfVoice}`);
  
  // First, get the user's active style profile if available
  let styleInfo = '';
  let stylePrompt = '';
  
  if (niche) {
    stylePrompt += `The content niche is: ${niche}. `;
  }
  
  if (audience) {
    stylePrompt += `The target audience is: ${audience}. `;
  }
  
  if (videoType) {
    stylePrompt += `The video type is: ${videoType}. `;
  }
  
  if (platform) {
    stylePrompt += `The platform is: ${platform}. `;
  }

  // Prepare the full prompt
  let prompt = `Generate a script for a ${duration}-second video titled "${title}".`;

  if (description) {
    prompt += ` The video is about: ${description}.`;
  }

  if (category) {
    prompt += ` It's in the ${category} category.`;
  }

  prompt += ` Use a ${toneOfVoice} tone of voice.`;
  prompt += ` ${stylePrompt}`;

  if (hook) {
    prompt += ` Use this hook to start the video: "${hook}"`;
  }

  if (structure) {
    prompt += ` Follow this structure for the video: ${structure}`;
  }

  if (additionalNotes) {
    prompt += ` Additional notes: ${additionalNotes}.`;
  }

  prompt += ` Include visual guide markers [VISUAL_GUIDE]descriptive text about what to show visually here[/VISUAL_GUIDE] throughout the script to help with filming.`;
  
  prompt += ` The script should have an engaging hook, clear explanation of the content, and end with a call to action.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional scriptwriter for social media content. Create engaging scripts that match the requested tone and style. Include visual elements with [VISUAL_GUIDE] markers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response from OpenAI:', data);
      throw new Error('Failed to generate script: Invalid API response');
    }

    const script = data.choices[0].message.content;
    console.log(`Successfully generated script of ${script.length} characters`);
    
    return { script };
  } catch (error) {
    console.error('Error generating script:', error);
    throw new Error(`Failed to generate script: ${error.message}`);
  }
}

async function generateScriptCoachResponse(body, apiKey) {
  const { message, script, conversation } = body;
  
  console.log(`Script coach responding to: ${message.substring(0, 50)}...`);
  
  // Prepare conversation history
  const messages = [
    {
      role: "system",
      content: `You are an expert script coach for social media content. 
      Help users improve their scripts by providing specific, actionable feedback and suggestions. 
      When appropriate, offer direct script improvements or alternatives.
      If asked to rewrite or improve the script, provide a complete updated version that maintains the original style but incorporates your improvements.`
    }
  ];
  
  // Add conversation history (limited to last 10 messages to avoid token limits)
  const recentConversation = conversation.slice(-10);
  messages.push(...recentConversation);
  
  // Add the current script for context
  messages.push({
    role: "user",
    content: `Here is the current script I'm working with:\n\n${script}\n\nMy question is: ${message}`
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response from OpenAI:', data);
      throw new Error('Failed to generate coach response: Invalid API response');
    }

    const content = data.choices[0].message.content;
    
    // Check if the response contains a complete updated script
    // by looking for patterns that suggest a full script rewrite
    const containsFullScript = 
      (content.includes("[VISUAL_GUIDE]") && content.includes("[/VISUAL_GUIDE]")) ||
      (content.length > script.length * 0.7) ||
      (content.includes("Here's the improved script:") || content.includes("Here is the updated script:"));
    
    // If it looks like a full script rewrite, provide it as updatedScript as well
    const result = {
      response: content
    };
    
    if (containsFullScript) {
      result.updatedScript = content;
    }
    
    console.log(`Generated coach response (${content.length} chars)${containsFullScript ? ' with script update' : ''}`);
    return result;
  } catch (error) {
    console.error('Error generating coach response:', error);
    throw new Error(`Failed to generate coach response: ${error.message}`);
  }
}
