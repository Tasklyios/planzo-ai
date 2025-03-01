import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-3.5-turbo';

interface VideoIdea {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

interface GenerateIdeasRequest {
  niche: string;
  audience: string;
  videoType: string;
  platform: string;
  contentStyle?: string;
  contentPersonality?: string;
  customIdeas?: string;
  isAdRequest?: boolean;
  previousIdeas?: {
    count: number;
    titles: string[];
    categories: string[];
    descriptions: string[];
  };
}

interface GenerateScriptRequest {
  type: 'script';
  title: string;
  description: string;
  category: string;
  tags: string[];
  toneOfVoice: string;
  duration: number;
  additionalNotes?: string;
  hook?: string;
  structure?: string;
  niche: string;
  audience: string;
  videoType: string;
  platform: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Add CORS headers to all responses
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers, status: 500 }
      );
    }

    // Create Supabase and OpenAI clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const openaiConfig = new Configuration({ apiKey: OPENAI_API_KEY });
    const openai = new OpenAIApi(openaiConfig);

    // Get user ID from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { headers, status: 401 }
      );
    }

    // Parse request body
    const requestData = await req.json();
    
    // Handle script generation
    if (requestData.type === 'script') {
      console.log('Received script generation request');
      return await handleScriptGeneration(requestData, openai, supabaseClient, user.id, headers);
    } 
    // Otherwise handle video idea generation
    else {
      console.log('Received idea generation request');
      return await handleIdeaGeneration(requestData, openai, supabaseClient, user.id, headers);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers, status: 500 }
    );
  }
});

async function handleIdeaGeneration(
  requestData: GenerateIdeasRequest,
  openai: OpenAIApi,
  supabaseClient: any,
  userId: string,
  headers: Record<string, string>
) {
  // Verify that we have the required fields
  if (!requestData.niche || !requestData.audience || !requestData.videoType) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: niche, audience, or videoType' }),
      { headers, status: 400 }
    );
  }

  // Check if user has remaining usage limits
  const { data: usageCheckResult, error: usageCheckError } = await supabaseClient
    .rpc('check_and_increment_usage', { feature_name: 'ideas' });

  if (usageCheckError) {
    console.error('Error checking usage limits:', usageCheckError);
    return new Response(
      JSON.stringify({ error: `Error checking usage limits: ${usageCheckError.message}` }),
      { headers, status: 500 }
    );
  }

  if (usageCheckResult !== true) {
    return new Response(
      JSON.stringify({ error: 'Usage limit reached for today' }),
      { headers, status: 403 }
    );
  }

  const isAdRequest = requestData.isAdRequest || 
                      requestData.videoType.toLowerCase().includes('ad') || 
                      requestData.videoType.toLowerCase().includes('advertisement') ||
                      requestData.videoType.toLowerCase().includes('promotional');

  // Prepare additional context from style preferences if available
  let styleContext = '';
  if (requestData.contentStyle) {
    styleContext += `\nContent Style: ${requestData.contentStyle}`;
  }
  if (requestData.contentPersonality) {
    styleContext += `\nContent Personality: ${requestData.contentPersonality}`;
  }

  // Prepare previous ideas context if available
  let previousIdeasContext = '';
  if (requestData.previousIdeas && requestData.previousIdeas.count > 0) {
    previousIdeasContext = `\nYou have previously generated ${requestData.previousIdeas.count} ideas. To avoid repetition, here are some examples:`;
    
    // Add a few examples of previous titles and categories
    const exampleCount = Math.min(5, requestData.previousIdeas.titles.length);
    for (let i = 0; i < exampleCount; i++) {
      previousIdeasContext += `\n- "${requestData.previousIdeas.titles[i]}" (${requestData.previousIdeas.categories[i]})`;
    }
    
    previousIdeasContext += '\nPlease generate ideas that are DIFFERENT from these.';
  }

  // Construct the prompt
  const prompt = `Generate 5 unique, creative, and engaging video ideas for ${requestData.platform} that are related to ${requestData.niche} and targeted at ${requestData.audience}. Focus on ${requestData.videoType} style videos.${styleContext}${previousIdeasContext}

${requestData.customIdeas ? `Consider these custom ideas as inspiration: ${requestData.customIdeas}` : ''}

${isAdRequest ? 'These should be promotional/advertisement videos that effectively market a product or service while keeping the audience engaged.' : ''}

Each idea should include:
1. An attention-grabbing title (with emojis for social media appeal where appropriate)
2. A detailed description (2-3 sentences) explaining the concept
3. A category label (Tutorial, Entertainment, Educational, etc.)
4. 3-5 relevant hashtags (without the # symbol)

Format your response as valid JSON with this structure:
{
  "ideas": [
    {
      "title": "Example Title",
      "description": "Example description explaining the concept in detail.",
      "category": "Tutorial",
      "tags": ["tag1", "tag2", "tag3"]
    },
    ...more ideas
  ]
}

Do not include any text outside of this JSON structure. Ensure the JSON is valid.`;

  console.log('Sending prompt to OpenAI:', prompt);

  try {
    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const generatedText = response.data.choices[0]?.message?.content || '';
    console.log('Raw AI response:', generatedText);

    // Try to parse the response as JSON
    try {
      // Sometimes the API returns the JSON with backticks, try to clean those
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsedResponse = JSON.parse(cleanedText);
      return new Response(JSON.stringify(parsedResponse), { headers });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response as JSON',
          rawResponse: generatedText 
        }),
        { headers, status: 500 }
      );
    }
  } catch (openaiError: any) {
    console.error('OpenAI API error:', openaiError);
    return new Response(
      JSON.stringify({ error: `OpenAI API error: ${openaiError.message || 'Unknown error'}` }),
      { headers, status: 500 }
    );
  }
}

async function handleScriptGeneration(
  requestData: GenerateScriptRequest,
  openai: OpenAIApi,
  supabaseClient: any,
  userId: string,
  headers: Record<string, string>
) {
  // Verify that we have the required fields
  if (!requestData.title || !requestData.description) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: title or description' }),
      { headers, status: 400 }
    );
  }

  // Check if user has remaining usage limits for script generation
  const { data: usageCheckResult, error: usageCheckError } = await supabaseClient
    .rpc('check_and_increment_usage', { feature_name: 'scripts' });

  if (usageCheckError) {
    console.error('Error checking script usage limits:', usageCheckError);
    return new Response(
      JSON.stringify({ error: `Error checking usage limits: ${usageCheckError.message}` }),
      { headers, status: 500 }
    );
  }

  if (usageCheckResult !== true) {
    return new Response(
      JSON.stringify({ error: 'Script generation usage limit reached for today' }),
      { headers, status: 403 }
    );
  }

  // Construct a personalized hook section if provided
  let hookSection = '';
  if (requestData.hook) {
    hookSection = `Use this specific hook at the beginning of the script: "${requestData.hook}"`;
  }

  // Include structure if provided
  let structureSection = '';
  if (requestData.structure) {
    structureSection = `Follow this structure for the script:
${requestData.structure}`;
  } else {
    // Default structure if none provided
    structureSection = `Follow a clear structure with:
- Hook/Intro (capture attention immediately)
- Main content (organized as appropriate for the topic)
- Call to action at the end`;
  }

  // Include additional context about the video
  const contextSection = `
Additional information about the video:
- Topic: ${requestData.title}
- Description: ${requestData.description}
- Category: ${requestData.category || 'General'}
- Target Audience: ${requestData.audience || 'General viewers'}
- Platform: ${requestData.platform || 'Social media'}
- Niche: ${requestData.niche || 'Content creation'}
${requestData.additionalNotes ? `- Additional Notes: ${requestData.additionalNotes}` : ''}`;

  // Construct the prompt
  const prompt = `Write a complete, ready-to-record video script for a ${requestData.platform} video about "${requestData.title}". The script should be approximately ${requestData.duration} seconds when read aloud at a natural pace.

${contextSection}

${hookSection}

${structureSection}

Use a ${requestData.toneOfVoice} tone throughout the script. Make it engaging and tailored for ${requestData.platform} format. 

Include [VISUAL_GUIDE] sections with suggestions for what should be shown on screen during specific parts. Format these as:
[VISUAL_GUIDE]Suggestions for visuals, graphics, or actions to show here[/VISUAL_GUIDE]

Mark any important timestamps or segments with [TIMESTAMP] tags.

The script should feel authentic, conversational, and optimized for audience engagement.`;

  console.log('Sending script generation prompt to OpenAI:', prompt);

  try {
    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedScript = response.data.choices[0]?.message?.content || '';
    
    // No need to parse JSON for scripts
    return new Response(
      JSON.stringify({ script: generatedScript }),
      { headers }
    );
  } catch (openaiError: any) {
    console.error('OpenAI API error during script generation:', openaiError);
    return new Response(
      JSON.stringify({ error: `OpenAI API error: ${openaiError.message || 'Unknown error'}` }),
      { headers, status: 500 }
    );
  }
}
