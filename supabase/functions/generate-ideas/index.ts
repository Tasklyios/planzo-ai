
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VIRAL_VIDEO_EXAMPLES = [
  {
    title: "A Month-Long Study of the Two-Minute Productivity Method",
    description: "An evidence-based analysis of the '2-minute rule' productivity technique, examining its impact on task completion and workflow efficiency.",
    category: "Productivity",
    tags: ["productivity", "workflow", "research"]
  },
  {
    title: "The Science Behind Successful Morning Routines",
    description: "A data-driven exploration of five research-backed morning habits, analyzing their effects on productivity and well-being.",
    category: "Lifestyle",
    tags: ["productivity", "wellness", "research"]
  },
  {
    title: "30-Day Hydration Study: Measuring the Effects of Increased Water Intake",
    description: "A methodical analysis of physiological and cognitive changes observed during a controlled hydration experiment.",
    category: "Health",
    tags: ["health", "research", "wellness"]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData = await req.json();
    console.log("Received request data:", requestData);

    if (requestData.type === 'script') {
      const { title, description, category, tags, toneOfVoice, duration, additionalNotes } = requestData;

      const scriptPrompt = `Create a professional video script based on the following parameters:

Title: ${title}
Description: ${description}
Category: ${category}
Tags: ${tags?.join(', ')}
Tone of Voice: ${toneOfVoice}
Duration: ${duration} seconds
Additional Notes: ${additionalNotes || 'None'}

Format Requirements:
- For each section of the script, provide the script text first
- After each relevant section, add visual directions using this exact format:
  [VISUAL_GUIDE]This is what should be shown[/VISUAL_GUIDE]
- Use the visual guide tags to wrap ALL visual directions
- Keep visual directions brief and specific

Style Guidelines:
- Maintain a professional, authoritative tone
- Focus on data, research, and concrete examples
- Avoid clickbait phrases or manufactured suspense
- Present information clearly and directly
- Use precise language and specific terminology

Structure:
1. Open with a clear thesis or problem statement
2. Present key points in a logical sequence
3. Support claims with evidence
4. Conclude with actionable insights

Example format:
Here's the script text for the opening.
[VISUAL_GUIDE]Medium shot of speaker with key statistic on screen[/VISUAL_GUIDE]
Next part of the script text.
[VISUAL_GUIDE]Show diagram illustrating the concept[/VISUAL_GUIDE]

Pacing: Structure the content to fit naturally within ${duration} seconds.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional content strategist who creates sophisticated, research-backed video scripts. Format all visual directions with [VISUAL_GUIDE] tags.'
            },
            { role: 'user', content: scriptPrompt }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      console.log("OpenAI script response received");

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI');
      }

      return new Response(
        JSON.stringify({ script: data.choices[0].message.content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle idea generation
    const { niche, audience, videoType, platform, customIdeas } = requestData;
    console.log("Generating ideas with params:", { niche, audience, videoType, platform, customIdeas });

    const prompt = `Generate 5 viral video ideas for ${platform} targeting ${audience} in the ${niche} niche. These should be ${videoType} style videos.

Your response must be valid JSON matching this structure exactly:
{
  "ideas": [
    {
      "title": "string",
      "description": "string",
      "category": "string",
      "tags": ["string"]
    }
  ]
}

Use these high-performing video formats as inspiration:
${JSON.stringify(VIRAL_VIDEO_EXAMPLES, null, 2)}

${customIdeas ? `\nAlso consider these custom ideas as inspiration:\n${customIdeas}` : ''}

Key elements each idea must include:
- Title: Use curiosity gaps, numbers, or emotional triggers
- Description: Clear value proposition and hook
- Category: Specific content type
- Tags: Relevant, trending hashtags (without # symbol)

Focus on: 
- Problem-solution format
- Relatable situations
- Data-driven insights
- Transformation stories
- Behind-the-scenes reveals
- Testing viral trends/hacks`;

    console.log("Sending prompt to OpenAI:", prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a viral content strategist who creates trending social media ideas. Always output valid JSON matching the example structure exactly.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("OpenAI response received:", data);

    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid OpenAI response:", data);
      throw new Error('Invalid response from OpenAI');
    }

    try {
      const parsedContent = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed OpenAI response:", parsedContent);
      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
