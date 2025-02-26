
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Received request data:", requestData);

    const { type, title, description, category, tags, toneOfVoice, duration, additionalNotes } = requestData;
    console.log("Processing request with params:", { type, title, description, category, tags, toneOfVoice, duration, additionalNotes });

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt;
    if (type === 'script') {
      prompt = `Write a natural, conversational ${duration}-second script for a ${toneOfVoice} video about: ${title}

Topic: ${description}
Style: ${category}
Keywords: ${tags?.join(', ') || 'none'}
Notes: ${additionalNotes || 'none'}

Important:
- Write like you're talking to a friend
- No corporate or cliché phrases
- Be authentic and relatable
- Keep it simple and direct

Include these markers in the script:
[HOOK] for the opening hook
[TIMESTAMP] for timing cues
[VISUAL_GUIDE] for filming suggestions
[CTA] for the natural close

Remember: Write how people actually talk - keep it real and engaging.`;
    } else {
      prompt = `Generate 5 viral video ideas for ${duration} second videos.
Create ideas based on these proven formats:
1. How-to and tutorials that solve specific problems
2. Behind-the-scenes insights and real experiences
3. Data-driven content with specific numbers/results
4. Myth-busting and truth-revealing content
5. Personal journey and transformation stories

Format response as JSON with this structure:
{
  "ideas": [
    {
      "title": "string (attention-grabbing hook)",
      "description": "string (specific value proposition)",
      "category": "string (content type)",
      "tags": ["string"] (3-5 relevant keywords)
    }
  ]
}`;
    }

    console.log("Sending request to OpenAI with prompt:", prompt);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: type === 'script' 
              ? 'You are a friendly content creator who writes authentic, conversational scripts. Write like you\'re talking to a friend - avoid corporate language, buzzwords, and clichés.'
              : 'You are an expert content strategist who creates viral ideas based on proven formulas. Output must be valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8, // Slightly increased for more natural language
      }),
    });

    const data = await response.json();
    console.log("Raw OpenAI response:", data);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid response format from OpenAI');
    }

    if (type === 'script') {
      return new Response(
        JSON.stringify({ script: content }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      if (!parsedContent.ideas || !Array.isArray(parsedContent.ideas)) {
        throw new Error('Invalid ideas format from OpenAI');
      }

      return new Response(
        JSON.stringify(parsedContent),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error generating content',
        message: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
